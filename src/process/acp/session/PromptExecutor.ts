import type { AcpError, AcpErrorCode } from '@process/acp/errors/AcpError';
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
const PROMPT_RETRY_BACKOFF: BackoffPolicy = { initialMs: 1000, maxMs: 4000, factor: 2, jitter: 0.2 };

/**
 * Replay is allowed for exactly ONE failure shape: the agent was ALIVE, answered
 * our prompt, and the answer was an internal failure (-32603 — where every ACP
 * bridge dumps the provider's error, including the "Failed to generate content:
 * Connection error" of #774).
 *
 * Deliberately NOT here, though `AcpError.retryable` marks them retryable:
 *
 *  - PROCESS_CRASHED / a dead stream. The agent died mid-turn, so we cannot know
 *    what it already DID — a `tool_call` notification it wrote can be lost with
 *    the pipe, which would make `turnRanTool` lie and let us re-run a tool. It is
 *    also already owned: `AcpSession.onDisconnect` → `resumeFromDisconnect()`
 *    respawns and re-flushes the pending prompt. Two recovery mechanisms racing
 *    over one session is worse than either alone.
 *  - CONNECTION_FAILED (an errno on OUR transport) — same reasoning.
 *  - AUTH_REQUIRED — needs the user, and `handlePromptError` already re-queues
 *    the prompt to replay once they have authenticated.
 *  - ACP_PARSE_ERROR — the agent could not parse the bytes; identical bytes fail
 *    identically.
 */
const REPLAYABLE_PROMPT_CODES: ReadonlySet<AcpErrorCode> = new Set(['AGENT_INTERNAL_ERROR']);

/**
 * -32603 is a catch-all, so the code alone cannot tell a blip from a verdict.
 * These never improve by sending the identical prompt again: a rate limit only
 * gets angrier, and a bad request / oversized context / refusal is deterministic.
 * (#774's own 400 `missing field 'tool_call_id'` is caught here.)
 *
 * Matched against `acpErr.message`, into which `withErrorDetail` JSON-stringifies
 * the provider's `data` — so what we actually see is usually the machine-readable
 * code (`rate_limit_error`, `insufficient_quota`, `context_length_exceeded`), NOT
 * prose. Hence no trailing `\b`: `_` is a word character, so `rate.?limit\b` does
 * not match `rate_limit_error` and every snake_case code sailed through.
 */
const NON_TRANSIENT_DETAIL =
  /\b4\d\d\b|rate.?limit|quota|resource.?exhausted|context.?length|too\s+many\s+(tokens|requests)|maximum\s+context|bad.?request|invalid.?request|safety|content.?policy/i;

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
  /** Aborts the backoff sleep, so Stop takes effect immediately rather than seconds late. */
  private turnAbort: AbortController | undefined;
  private readonly timer: PromptTimer;

  private readonly maxAttempts: number;
  private readonly retryBackoff: BackoffPolicy;

  constructor(
    private readonly host: PromptHost,
    private readonly timeoutMs: number,
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
    // execute() rejects on a terminal turn error; the error is already surfaced
    // via onSignal/enterError, so swallow it here rather than leaving an
    // unhandled rejection in the Electron main process.
    void this.execute(content)
      .catch(() => {})
      .finally(() => {
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
    this.turnAbort = new AbortController();

    // Bind the retry to THIS turn's client, not to `lifecycle.client` — that is a
    // live getter, and a crash mid-turn makes `onDisconnect` → `resumeFromDisconnect`
    // SYNCHRONOUSLY spawn a replacement before its first await. A "is there still a
    // client?" check would happily pass against that new, still-initializing client
    // and fire this prompt into a session it has never loaded.
    const turnClient = lifecycle.client;
    const turnSessionId = lifecycle.sessionId;

    // No new retry may START past this. It is NOT a hard turn duration: PromptTimer
    // is an IDLE timer (reset by every sessionUpdate), so an attempt already in
    // flight and actively streaming is bounded by idleness, not by wall clock —
    // exactly as on main. This only stops the attempt COUNT from multiplying the
    // budget, which is what the retry loop newly made possible.
    const retryDeadline = Date.now() + this.timeoutMs;

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
        const result = await turnClient.prompt(turnSessionId, content);
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
        const backoffMs = computeBackoff(this.retryBackoff, attempt);

        if (!this.canRetryPrompt(acpErr, attempt) || Date.now() + backoffMs >= retryDeadline) {
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

        try {
          await sleepWithAbort(backoffMs, this.turnAbort.signal);
        } catch {
          /* aborted by cancel() - fall through to the guard below */
        }

        // Re-check EVERYTHING after the wait. The session can be cancelled, torn
        // down, crashed-and-respawned, or driven to another state while we sleep;
        // none of those may be steamrolled by the next attempt.
        if (
          this.turnCancelled ||
          this.host.status !== 'prompting' ||
          lifecycle.client !== turnClient ||
          lifecycle.sessionId !== turnSessionId
        ) {
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
    if (this.turnCancelled) return false;
    if (this.turnRanTool) return false;
    // NOT `acpErr.retryable`: that flag was tuned for session start/resume, a
    // different decision. Replaying a PROMPT is its own judgement call.
    if (!REPLAYABLE_PROMPT_CODES.has(acpErr.code)) return false;
    if (NON_TRANSIENT_DETAIL.test(acpErr.message)) return false;
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

    // If the session already LEFT 'prompting', someone else is driving recovery and
    // owns the pending queue — on a crash that is onDisconnect → resumeFromDisconnect,
    // which respawns the agent and re-flushes the queue itself. Touching status or
    // flushing here races it: 'resuming' → 'active' is a legal transition, so we would
    // yank the session out of its respawn and fire the user's queued prompt into a
    // client that has not finished initialize() — dropping it. That is the #774 symptom
    // reintroduced by its own fix, so bail before either branch (enterError() in the
    // else would clearPending() and drop the follow-up just as dead).
    if (this.host.status !== 'prompting') throw acpErr;

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
    this.turnAbort?.abort();
    lifecycle.client.cancel(lifecycle.sessionId).catch(() => {});
  }

  cancelAll(): void {
    this.pendingPrompts = [];
    this.turnCancelled = true;
    this.turnAbort?.abort();
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
