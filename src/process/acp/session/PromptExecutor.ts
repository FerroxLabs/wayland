import { normalizeError } from '@process/acp/errors/errorNormalize';
import type { AcpMetrics } from '@process/acp/metrics/AcpMetrics';
import type { AuthNegotiator } from '@process/acp/session/AuthNegotiator';
import type { MessageTranslator } from '@process/acp/session/MessageTranslator';
import { PromptTimer } from '@process/acp/session/PromptTimer';
import type { SessionLifecycle } from '@process/acp/session/SessionLifecycle';
import type { AgentConfig, PromptContent, SessionCallbacks, SessionStatus } from '@process/acp/types';

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
  private readonly timer: PromptTimer;

  constructor(
    private readonly host: PromptHost,
    timeoutMs: number
  ) {
    this.timer = new PromptTimer(timeoutMs, () => this.handleTimeout());
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

    this.host.setStatus('prompting');

    try {
      await lifecycle.reassertConfig();
    } catch {
      /* best effort - continue to prompt even if config sync fails */
    }

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
    } catch (err) {
      this.timer.stop();
      this.host.messageTranslator.onTurnEnd();
      this.handlePromptError(err, content);
      return;
    }

    this.host.messageTranslator.onTurnEnd();
    this.host.setStatus('active');
    this.host.callbacks.onSignal({ type: 'turn_finished' });
    // Drain any follow-up the user queued mid-turn (sendMessage during
    // 'prompting' calls setPending). flush() is a no-op unless a prompt is
    // pending and the session is active, which it now is.
    this.flush();
  }

  private handlePromptError(err: unknown, content: PromptContent): void {
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
    lifecycle.client.cancel(lifecycle.sessionId).catch(() => {});
  }

  cancelAll(): void {
    this.pendingPrompts = [];
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
