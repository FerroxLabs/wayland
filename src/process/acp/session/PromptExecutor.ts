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
 * -32603 is a catch-all, so the code alone cannot tell a blip from a verdict. This
 * says which ones are worth sending again.
 *
 * It is an ALLOWLIST on purpose. The first cut denied the deterministic failures
 * (rate limits, oversized context, refusals) and replayed everything else — but a
 * denylist over a catch-all bucket leaks by construction, and it did: `prompt is
 * too long`, `credit balance is too low`, `model_not_found` and friends all sailed
 * through and got replayed. Every leak costs real money or real tokens, and the
 * list of ways a provider can say "no" is not enumerable. So: name what is
 * genuinely transient, and treat everything unrecognised as final. Unknown fails
 * CLOSED — the worst case is an error the user must retry by hand, which is
 * exactly where they were before #774.
 *
 * Matched against `acpErr.message`, into which `withErrorDetail` JSON-stringifies
 * the provider's `data`, so both prose and machine-readable codes land here.
 */
const TRANSIENT_DETAIL =
  /\b5\d\d\b|connection\s+(error|reset|closed|refused)|econnreset|econnrefused|epipe|etimedout|econnaborted|eai_again|socket\s+hang\s*up|timed?\s*out|timeout|overloaded|temporarily\s+unavailable|service\s+unavailable|\bunavailable\b|try\s+again|upstream\s+(connect\s+)?(error|disconnect)|internal\s+server\s+error|had\s+an\s+error\s+while\s+processing|fetch\s+failed|network\s+error|bad\s+gateway|premature\s+close|other\s+side\s+closed|stream\s+(closed|disconnected)/i;

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
        console.warn(
          `[PromptExecutor] prompt attempt ${attempt}/${this.maxAttempts} failed (${acpErr.code}); retrying`
        );
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
          // A tool_call that lands DURING the backoff. canRetryPrompt only saw the
          // state before the sleep, so without this the no-double-execution
          // guarantee would rest on the SDK dispatching notifications ahead of the
          // response — true as far as I can tell, but not a thing to bet an `rm` on
          // when re-reading the flag makes it hold by construction.
          this.turnRanTool ||
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
    if (!TRANSIENT_DETAIL.test(acpErr.message)) return false;
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

    // If the session already LEFT 'prompting', someone else is driving recovery and
    // OWNS the pending queue — on a crash that is onDisconnect → resumeFromDisconnect,
    // which respawns the agent and re-flushes the queue itself. Every branch below
    // races it: the retryable one flips 'resuming' → 'active' (a legal transition!)
    // and fires the queued prompt into a client that has not finished initialize();
    // enterError() clearPending()s it; and the AUTH branch tears down the very client
    // the respawn is mid-way through spawning. Preserve the prompt and get out of the
    // way — whoever owns recovery will flush it.
    if (this.host.status !== 'prompting') {
      // Hand the prompt back ONLY when replaying it is still side-effect-free.
      //
      // AUTH_REQUIRED is a framed answer from a LIVE agent that refused to run: nothing
      // happened, so the prompt should replay once the user logs in. Anything else here
      // means the turn died MID-FLIGHT, and on a dead stream we cannot know what it had
      // already done — the pipe can swallow the very `tool_call` that would have told us.
      // Re-queueing that hands the respawn's `flushPendingPrompt()` a turn that may have
      // already run `rm`, and flush() → execute() never consults `turnRanTool`, so it
      // would walk straight around the double-execution guard. Same reasoning that keeps
      // PROCESS_CRASHED out of REPLAYABLE_PROMPT_CODES.
      //
      // A QUEUED FOLLOW-UP (never sent, parked by setPending) is untouched by this and is
      // still flushed by the respawn — that is a different prompt, and nothing ran for it.
      if (acpErr.code === 'AUTH_REQUIRED' && !this.turnRanTool) this.pendingPrompts.unshift(content);
      throw acpErr;
    }

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
