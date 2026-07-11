import type { AcpError } from '@process/acp/errors/AcpError';
import { normalizeError } from '@process/acp/errors/errorNormalize';
import type { AcpMetrics } from '@process/acp/metrics/AcpMetrics';
import type { AuthNegotiator } from '@process/acp/session/AuthNegotiator';
import type { MessageTranslator } from '@process/acp/session/MessageTranslator';
import { PromptTimer } from '@process/acp/session/PromptTimer';
import type { SessionLifecycle } from '@process/acp/session/SessionLifecycle';
import type { AgentConfig, PromptContent, SessionCallbacks, SessionStatus } from '@process/acp/types';
import { type BackoffPolicy, computeBackoff, sleepWithAbort } from '@process/utils/backoff';

/**
 * A transient prompt failure used to kill the turn outright (#774): the agent
 * halted on the first blip and sat there until a human typed "retry". Retry the
 * turn ourselves instead, capped and backed off.
 *
 * 3 attempts = the original + 2 retries, ~1s then ~2s apart.
 */
const MAX_PROMPT_ATTEMPTS = 3;
const PROMPT_RETRY_BACKOFF: BackoffPolicy = { initialMs: 1000, maxMs: 8000, factor: 2, jitter: 0.2 };

/** Overridable so tests can drive the retry path without sleeping for real. */
export type PromptRetryOptions = {
  attempts?: number;
  backoff?: BackoffPolicy;
};

/** Minimal interface that AcpSession exposes so PromptExecutor can drive state transitions. */
export type PromptHost = {
  readonly status: SessionStatus;
  readonly lifecycle: SessionLifecycle;
  readonly messageTranslator: MessageTranslator;
  readonly authNegotiator: AuthNegotiator;
  readonly callbacks: SessionCallbacks;
  readonly metrics: AcpMetrics;
  readonly agentConfig: AgentConfig;

  setStatus(status: SessionStatus): void;
  enterError(message: string): void;
};

export class PromptExecutor {
  private pendingPrompts: PromptContent[] = [];
  private flushing = false;
  /** Has the CURRENT turn executed a tool? If so, replaying it is not side-effect-free. */
  private turnRanTool = false;
  /** Set by cancel(), so a retry sleeping on its backoff does not wake up and fire anyway. */
  private turnCancelled = false;
  private readonly timer: PromptTimer;

  private readonly maxAttempts: number;
  private readonly retryBackoff: BackoffPolicy;

  constructor(
    private readonly host: PromptHost,
    timeoutMs: number,
    retry: PromptRetryOptions = {}
  ) {
    this.timer = new PromptTimer(timeoutMs, () => this.handleTimeout());
    this.maxAttempts = retry.attempts ?? MAX_PROMPT_ATTEMPTS;
    this.retryBackoff = retry.backoff ?? PROMPT_RETRY_BACKOFF;
  }

  // ─── Pending prompt buffer ────────────────────────────────────

  hasPending(): boolean {
    return this.pendingPrompts.length > 0;
  }

  setPending(content: PromptContent): void {
    this.pendingPrompts.push(content);
  }

  clearPending(): void {
    if (this.pendingPrompts.length > 0) {
      console.warn(`[PromptExecutor] discarding ${this.pendingPrompts.length} queued message(s) — session terminated`);
    }
    this.pendingPrompts = [];
  }

  /** Fire the next queued prompt if one exists and the session is active. */
  flush(): void {
    if (this.flushing || this.pendingPrompts.length === 0 || this.host.status !== 'active') return;
    this.flushing = true;
    const content = this.pendingPrompts.shift()!;
    void this.execute(content).finally(() => {
      this.flushing = false;
      // Chain the next queued prompt if one arrived while this turn was running.
      this.flush();
    });
  }

  // ─── Execute ──────────────────────────────────────────────────

  async execute(content: PromptContent): Promise<void> {
    const { lifecycle } = this.host;
    if (!lifecycle.client || !lifecycle.sessionId) return;

    // New user prompt = new logical response. Open a fresh dedup window so an
    // identical consecutive prompt still emits, while keeping the doubling
    // dedup (#184) scoped to this single turn (which may span onTurnEnd + a
    // late real-id full-text restate).
    this.host.messageTranslator.onTurnStart();

    this.turnRanTool = false;
    this.turnCancelled = false;
    this.host.setStatus('prompting');

    try {
      await lifecycle.reassertConfig();
    } catch {
      /* best effort - continue to prompt even if config sync fails */
    }

    // Retry INSIDE the awaited promise, deliberately: AcpAgentManager awaits
    // this turn, and on a rejection it emits the error banner and synthesizes a
    // `finish` that releases the loading state. Retrying out here (rather than
    // after the throw) keeps the turn in flight, so a recovered blip never
    // flashes a spurious "turn failed" at the user.
    for (let attempt = 1; ; attempt++) {
      try {
        this.timer.start();
        const result = await lifecycle.client.prompt(lifecycle.sessionId, content);
        this.timer.stop();

        // Fallback: emit usage from PromptResponse for backends that don't send usage_update
        if (result.usage) {
          this.host.callbacks.onContextUsage({
            used: result.usage.totalTokens,
            total: 0,
            percentage: 0,
          });
        }
        break;
      } catch (err) {
        this.timer.stop();
        const acpErr = normalizeError(err);

        if (!this.canRetryPrompt(acpErr, attempt)) {
          this.host.messageTranslator.onTurnEnd();
          this.handlePromptError(acpErr, content);
          return;
        }

        // Tell the user we are recovering rather than leaving a dead spinner.
        // `recoverable: true` keeps this a banner, not a turn-ending error.
        console.warn(`[PromptExecutor] prompt attempt ${attempt}/${this.maxAttempts} failed (${acpErr.code}); retrying`);
        this.host.metrics.recordError(this.host.agentConfig.agentBackend, acpErr.code);
        this.host.callbacks.onSignal({
          type: 'error',
          message: `${acpErr.message} — retrying (${attempt}/${this.maxAttempts})`,
          recoverable: true,
        });

        await sleepWithAbort(computeBackoff(this.retryBackoff, attempt));

        // Re-check AFTER the wait: cancel() or a crash during the backoff must
        // not be steamrolled by the next attempt.
        if (this.turnCancelled || !lifecycle.client || !lifecycle.sessionId) {
          this.host.messageTranslator.onTurnEnd();
          this.handlePromptError(acpErr, content);
          return;
        }
      }
    }

    this.host.messageTranslator.onTurnEnd();
    this.host.setStatus('active');
    this.host.callbacks.onSignal({ type: 'turn_finished' });
    // Drain any follow-up the user queued mid-turn (sendMessage during
    // 'prompting' calls setPending). flush() is a no-op unless a prompt is
    // pending and the session is active, which it now is.
    this.flush();
  }

  /**
   * Whether re-sending this exact prompt is both useful and SAFE.
   *
   * The safety half is `turnRanTool`. Replaying a prompt re-asks the model to
   * carry out the request, so it is only side-effect-free while the turn has
   * not executed a tool yet. Once a tool has run — a file written, a command
   * shelled out — a silent replay can run it a second time, and no error banner
   * is worth double-executing a user's `rm`. A human typing "keep going" is
   * making that call with their eyes open; we are not.
   *
   * Resuming a turn that HAS already run tools (rather than restarting it) needs
   * the engine to expose a resume primitive — that is #457 (`needs:core`), not
   * something the desktop can fake safely.
   */
  private canRetryPrompt(acpErr: AcpError, attempt: number): boolean {
    if (attempt >= this.maxAttempts) return false;
    if (!acpErr.retryable) return false;
    // Auth is not a blip: it needs the user, and handlePromptError re-queues the
    // prompt to be replayed once they finish authenticating.
    if (acpErr.code === 'AUTH_REQUIRED') return false;
    if (this.turnRanTool) return false;
    if (this.turnCancelled) return false;
    return true;
  }

  /**
   * The turn has executed a tool, so it is no longer safe to replay (see
   * `canRetryPrompt`). Driven by AcpSession's `tool_call` updates.
   */
  noteToolActivity(): void {
    this.turnRanTool = true;
  }

  private handlePromptError(err: unknown, content: PromptContent): void {
    // Idempotent: an AcpError (which is what execute() hands us) passes straight through.
    const acpErr = normalizeError(err);

    if (acpErr.code === 'AUTH_REQUIRED') {
      // Preserve the failed message at the front of the queue so it is
      // re-delivered after the user completes auth (do NOT overwrite any
      // already-queued follow-ups).
      this.pendingPrompts.unshift(content);
      this.host.lifecycle.setAuthPendingForPrompt();
      void this.host.lifecycle.teardown().then(() => {
        this.host.setStatus('error');
        this.host.callbacks.onSignal({
          type: 'auth_required',
          auth: this.host.authNegotiator.buildAuthRequiredData(undefined),
        });
      });
      return;
    }

    console.error(`[PromptExecutor] prompt failed (${acpErr.code}):`, acpErr.message);
    this.host.metrics.recordError(this.host.agentConfig.agentBackend, acpErr.code);

    if (acpErr.retryable) {
      this.host.setStatus('active');
      this.host.callbacks.onSignal({ type: 'error', message: acpErr.message, recoverable: true });
      // Deliver any queued follow-up now that the session is back to 'active'.
      this.flush();
    } else {
      this.host.enterError(acpErr.message);
    }

    // Re-throw so callers (AcpSession.sendMessage → AcpAgentV2.sendMessage) can
    // return structured error types to AcpAgentManager.
    throw acpErr;
  }

  // ─── Cancel ───────────────────────────────────────────────────

  cancel(): void {
    const { lifecycle } = this.host;
    if (this.host.status !== 'prompting' || !lifecycle.client || !lifecycle.sessionId) return;
    // Stop a retry that is currently sleeping on its backoff. Status is still
    // 'prompting' while we wait, so without this the cancelled turn would wake
    // up and re-prompt anyway.
    this.turnCancelled = true;
    lifecycle.client.cancel(lifecycle.sessionId).catch(() => {});
  }

  cancelAll(): void {
    this.pendingPrompts = [];
    this.turnCancelled = true;
    if (this.host.status === 'prompting') this.cancel();
  }

  // ─── Timer delegation (for permission pause/resume) ───────────

  pauseTimer(): void {
    this.timer.pause();
  }

  resumeTimer(): void {
    this.timer.resume();
  }

  resetTimer(): void {
    this.timer.reset();
  }

  stopTimer(): void {
    this.timer.stop();
  }

  private handleTimeout(): void {
    if (this.host.status !== 'prompting') return;
    this.cancel();
    this.host.callbacks.onSignal({
      type: 'error',
      message: 'Prompt timed out',
      recoverable: true,
    });
  }
}
