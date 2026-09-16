/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #774: a transient mid-run error killed the turn outright. The agent halted,
 * the prompt was dropped on the floor, and the task sat dead until a human typed
 * "retry" — at which point it resumed fine, proving recovery was always possible.
 * PromptExecutor now retries the turn itself.
 *
 * Retrying a turn is only safe under narrow conditions, so every guard gets its
 * own test: delete any check in `canRetryPrompt` or in the post-backoff re-check
 * and something below must go red.
 *
 * Backoff is injected as 0ms and the clock is REAL. No fake timers — the guards
 * under test are precisely about what changes across a genuine await, and a fake
 * clock interleaved with real macrotasks is how you hang a sharded runner.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptExecutor, type PromptHost } from '@process/acp/session/PromptExecutor';
import { AcpError } from '@process/acp/errors/AcpError';
import { RequestError } from '@agentclientprotocol/sdk';
import type { PromptContent } from '@process/acp/types';

const FAST_RETRY = { attempts: 3, backoff: { initialMs: 0, maxMs: 0, factor: 1, jitter: 0 } };

const CONTENT = [{ type: 'text', text: 'do the thing' }] as unknown as PromptContent;

/** The agent was alive and answered: -32603, where bridges dump the provider's error. */
function providerBlip(msg = 'Failed to generate content: Connection error') {
  return new AcpError('AGENT_INTERNAL_ERROR', msg, { retryable: true });
}

function createHost() {
  const prompt = vi.fn().mockResolvedValue({ stopReason: 'end_turn' });
  const client = { prompt, cancel: vi.fn().mockResolvedValue(undefined) };

  const host = {
    status: 'active',
    lifecycle: {
      client,
      sessionId: 'sess-1',
      reassertConfig: vi.fn().mockResolvedValue(undefined),
      setAuthPendingForPrompt: vi.fn(),
      teardown: vi.fn().mockResolvedValue(undefined),
    },
    messageTranslator: { onTurnStart: vi.fn(), onTurnEnd: vi.fn() },
    authNegotiator: { buildAuthRequiredData: vi.fn().mockReturnValue({}) },
    callbacks: { onSignal: vi.fn(), onContextUsage: vi.fn() },
    metrics: { recordError: vi.fn() },
    agentConfig: { agentBackend: 'test' },
    setStatus: vi.fn((s: string) => {
      host.status = s;
    }),
    enterError: vi.fn(),
  } as unknown as PromptHost & {
    status: string;
    lifecycle: { client: unknown; sessionId: string | null; setAuthPendingForPrompt: ReturnType<typeof vi.fn> };
  };

  return { host, prompt };
}

describe('PromptExecutor - transient turn errors are retried (#774)', () => {
  let host: ReturnType<typeof createHost>['host'];
  let prompt: ReturnType<typeof vi.fn>;
  let executor: PromptExecutor;

  beforeEach(() => {
    ({ host, prompt } = createHost());
    executor = new PromptExecutor(host, 60_000, FAST_RETRY);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('retries a provider blip and completes the turn, without rejecting', async () => {
    prompt.mockRejectedValueOnce(providerBlip()).mockResolvedValueOnce({ stopReason: 'end_turn' });

    await expect(executor.execute(CONTENT)).resolves.toBeUndefined();

    expect(prompt).toHaveBeenCalledTimes(2);
    // The SAME prompt is replayed — not a synthesized "keep going" string.
    expect(prompt.mock.calls[1][1]).toEqual(CONTENT);
    // The manager awaits this turn: a rejection would make it paint a turn-error
    // banner and synthesize a premature finish for a blip we recovered from.
    expect(host.callbacks.onSignal).toHaveBeenCalledWith({ type: 'turn_finished' });
    expect(host.enterError).not.toHaveBeenCalled();
  });

  it('says it is retrying instead of failing silently', async () => {
    prompt.mockRejectedValueOnce(providerBlip()).mockResolvedValueOnce({ stopReason: 'end_turn' });
    await executor.execute(CONTENT);

    const signals = (host.callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    const banner = signals.find((s) => s.type === 'error');
    expect(banner).toMatchObject({ recoverable: true });
    expect(banner.message).toContain('retrying (1/3)');
  });

  it('gives up at the attempt cap rather than retrying forever', async () => {
    prompt.mockRejectedValue(providerBlip());

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(3); // original + 2 retries
  });

  // ─── Guard: only a live agent's own transient answer may be replayed ───────

  it('does NOT replay a crashed agent — resumeFromDisconnect owns that recovery', async () => {
    // The stream died, so we cannot know what the agent already did: a tool_call
    // notification can be lost with the pipe. Replaying could re-run the tool.
    prompt.mockRejectedValue(new AcpError('PROCESS_CRASHED', 'ACP connection closed', { retryable: true }));

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does NOT replay a transport errno (CONNECTION_FAILED)', async () => {
    prompt.mockRejectedValue(new AcpError('CONNECTION_FAILED', 'ECONNRESET', { retryable: true }));

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does NOT replay AUTH_REQUIRED — it needs the user, and is re-queued for after auth', async () => {
    // AUTH_REQUIRED is retryable:true, so only the explicit exclusion stops us
    // firing three prompts at an agent that is asking someone to log in.
    prompt.mockRejectedValue(new AcpError('AUTH_REQUIRED', 'login required', { retryable: true }));

    await executor.execute(CONTENT);

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(host.lifecycle.setAuthPendingForPrompt).toHaveBeenCalled();
    expect(executor.hasPending()).toBe(true); // the prompt is preserved, not dropped
  });

  it('does NOT replay a deterministic failure hiding inside -32603 (the #774 400)', async () => {
    // The reported "400 ... missing field 'tool_call_id'" arrives as an agent
    // internal error, but replaying identical bytes fails identically.
    prompt.mockRejectedValue(
      providerBlip("API Error: 400 BadRequestError - missing field 'tool_call_id' at messages[31]")
    );

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does NOT hammer a provider that just rate-limited us', async () => {
    prompt.mockRejectedValue(providerBlip('429 rate limit exceeded, please slow down'));

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  /**
   * The replay decision is an ALLOWLIST: name what is transient, treat everything
   * else as final. An earlier cut denied the known-deterministic failures and
   * replayed the rest — and leaked, because the ways a provider can say "no" are
   * not enumerable. `prompt is too long` (the commonest deterministic -32603 in a
   * long session) was being replayed 3x, burning 3x the input tokens.
   *
   * Left column = must be replayed. Right = must NOT be, and unknown counts as
   * must-not: failing closed just leaves the user where they were before #774.
   */
  const TRANSIENT = [
    'Failed to generate content: Connection error', // the #774 report
    'Connection reset by peer',
    'socket hang up',
    'upstream connect error',
    'read ECONNRESET',
    '503 Service Unavailable',
    'Overloaded',
    'request timed out',
    'Internal server error', // OpenAI 500 prose
    'fetch failed', // undici's generic network error — very common
    'network error',
    'Bad Gateway',
    'UNAVAILABLE', // bare gRPC/Gemini status
    'EAI_AGAIN', // DNS
    'Premature close',
  ];
  for (const msg of TRANSIENT) {
    it(`replays the transient "${msg}"`, async () => {
      prompt.mockRejectedValueOnce(providerBlip(msg)).mockResolvedValueOnce({ stopReason: 'end_turn' });
      await executor.execute(CONTENT);
      expect(prompt).toHaveBeenCalledTimes(2);
    });
  }

  const FINAL = [
    "API Error: 400 BadRequestError - missing field 'tool_call_id'", // the #774 400
    'rate_limit_error', // Anthropic error.type
    '429 rate limit exceeded',
    'insufficient_quota', // OpenAI
    'context_length_exceeded', // OpenAI
    'prompt is too long: 205000 tokens > 200000 maximum', // Anthropic, very common
    'Input is too long for requested model.',
    'Your credit balance is too low to access the API',
    'billing_hard_limit_reached',
    'model_not_found',
    'permission_error',
    'invalid_request_error',
    'content_policy_violation',
    'Error: Too Many Requests',
    // Wayland Nano marks `model_auth` retryable:false in its own error table,
    // but the frame reaches us as a bare -32603, which ACP_CODE_MAP calls
    // retryable:true. That mismatch was reported as "hard auth failures get
    // auto-retried". They do not - canRetryPrompt deliberately ignores
    // `acpErr.retryable` and requires a TRANSIENT_DETAIL match, which none of
    // these produce. Pinned here because the claim was plausible enough to
    // investigate twice, and replaying a rejected credential costs real calls.
    '{"kind":"model_auth"}',
    'Authentication failed',
    '401 Unauthorized',
    'invalid api key',
    'something nobody has ever seen before', // unknown ⇒ fail closed
  ];
  for (const msg of FINAL) {
    it(`does NOT replay the final/limit "${msg}"`, async () => {
      prompt.mockRejectedValue(providerBlip(msg));
      await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
      expect(prompt).toHaveBeenCalledTimes(1);
    });
  }

  // ─── Guard: never replay a turn that could already have had side effects ───

  it('does NOT replay a turn that already ran a tool — it could run it twice', async () => {
    prompt.mockImplementationOnce(() => {
      executor.noteToolActivity(); // a tool_call streamed, THEN the provider blipped
      return Promise.reject(providerBlip());
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire attempt 2 if a tool landed DURING the backoff sleep', async () => {
    // canRetryPrompt only sees the state BEFORE the sleep. Without re-reading
    // turnRanTool afterwards, the no-double-execution guarantee would rest on the
    // SDK dispatching notifications ahead of the response, rather than holding by
    // construction. A tool that lands in the ~1s gap must still stop the replay.
    const slow = new PromptExecutor(host, 60_000, {
      attempts: 3,
      backoff: { initialMs: 300, maxMs: 300, factor: 1, jitter: 0 },
    });
    prompt.mockImplementationOnce(() => {
      setTimeout(() => slow.noteToolActivity(), 50); // arrives mid-backoff
      return Promise.reject(providerBlip());
    });

    await expect(slow.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('a tool in a PREVIOUS turn does not poison the next one', async () => {
    prompt.mockImplementationOnce(() => {
      executor.noteToolActivity();
      return Promise.resolve({ stopReason: 'end_turn' });
    });
    await executor.execute(CONTENT);

    host.status = 'active';
    prompt.mockRejectedValueOnce(providerBlip()).mockResolvedValueOnce({ stopReason: 'end_turn' });
    await executor.execute(CONTENT);

    expect(prompt).toHaveBeenCalledTimes(3); // turn1, turn2-fail, turn2-retry
  });

  // ─── Guard: the post-backoff re-check ─────────────────────────────────────

  it('does not retry a cancelled turn, and does not claim to be retrying it', async () => {
    // Stop lands as the turn fails. Beyond not re-prompting, it must not announce
    // a retry it will never make — the user pressed Stop; they should not watch a
    // "retrying (1/3)" banner and a backoff play out first.
    prompt.mockImplementationOnce(() => {
      queueMicrotask(() => executor.cancel());
      return Promise.reject(providerBlip());
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    expect(prompt).toHaveBeenCalledTimes(1);
    const signals = (host.callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(signals.some((s) => String(s.message ?? '').includes('retrying'))).toBe(false);
  });

  it('cancel() ABORTS the backoff sleep rather than waiting it out', async () => {
    // A real 5s backoff. cancel() must land while the sleep is in progress — a
    // microtask would land before canRetryPrompt even runs, so the sleep would never
    // be entered and the AbortSignal would go untested.
    const slow = new PromptExecutor(host, 60_000, {
      attempts: 3,
      backoff: { initialMs: 5000, maxMs: 5000, factor: 1, jitter: 0 },
    });
    prompt.mockImplementationOnce(() => {
      setTimeout(() => slow.cancel(), 50);
      return Promise.reject(providerBlip());
    });

    const started = Date.now();
    await expect(slow.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    // Without the signal wired into sleepWithAbort, Stop lands ~5s late.
    expect(Date.now() - started).toBeLessThan(2000);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('AUTH_REQUIRED does not tear down a session that is already being respawned', async () => {
    // The AUTH branch unshifts the prompt and then calls teardown(). If the session
    // has already left 'prompting' (a crashed agent that answers -32000 and exits),
    // that teardown kills the replacement client doResume is mid-way through
    // spawning — and the respawn then fails into enterError → clearPending, dropping
    // the very prompt AUTH just preserved. Ownership check must sit ABOVE the branch.
    prompt.mockImplementationOnce(() => {
      host.status = 'resuming'; // onDisconnect → resumeFromDisconnect is driving
      return Promise.reject(new AcpError('AUTH_REQUIRED', 'login required', { retryable: true }));
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    expect(host.lifecycle.setAuthPendingForPrompt).not.toHaveBeenCalled(); // did not race the respawn
    expect(executor.hasPending()).toBe(true); // prompt preserved for whoever owns recovery
  });

  it('does not re-queue an AUTH_REQUIRED turn that had already run a tool', async () => {
    // The re-queue is what makes AUTH safe to replay: the agent refused to run, so
    // nothing happened. If a tool DID run before the auth demand — and the session has
    // left 'prompting', so the respawn's flush owns the queue — handing the prompt back
    // would replay a tool-bearing turn through flush() → execute(), which never checks
    // turnRanTool. Both conditions must hold, not just the code.
    prompt.mockImplementationOnce(() => {
      executor.noteToolActivity();
      host.status = 'resuming';
      return Promise.reject(new AcpError('AUTH_REQUIRED', 'login required', { retryable: true }));
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(executor.hasPending()).toBe(false); // dropped, not handed to the respawn
  });

  it('cancelAll() also aborts an in-flight backoff', async () => {
    const slow = new PromptExecutor(host, 60_000, {
      attempts: 3,
      backoff: { initialMs: 5000, maxMs: 5000, factor: 1, jitter: 0 },
    });
    prompt.mockImplementationOnce(() => {
      setTimeout(() => slow.cancelAll(), 50);
      return Promise.reject(providerBlip());
    });

    const started = Date.now();
    await expect(slow.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does not fire a retry into a client that was REPLACED during the backoff', async () => {
    // The real crash path: onDisconnect clears the client and resumeFromDisconnect
    // SYNCHRONOUSLY spawns a replacement, so a "is there a client?" check passes
    // against a brand-new, still-initializing one. We bind to the turn's client.
    prompt.mockImplementationOnce(() => {
      host.lifecycle.client = { prompt: vi.fn(), cancel: vi.fn() }; // respawned
      return Promise.reject(providerBlip());
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does not fire a retry after the session left prompting (stop/teardown)', async () => {
    prompt.mockImplementationOnce(() => {
      host.status = 'idle'; // e.g. stop() during the backoff
      return Promise.reject(providerBlip());
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does not retry into a dead session', async () => {
    prompt.mockImplementationOnce(() => {
      host.lifecycle.client = null;
      return Promise.reject(providerBlip());
    });

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does not START a new retry past the deadline, so attempts cannot multiply the budget', async () => {
    // NOT a hard turn duration — PromptTimer is an idle timer, so an attempt already
    // streaming is bounded by idleness, as on main. This pins the attempt COUNT only.
    // A 0ms budget: the first failure is already past the deadline.
    const shortLived = new PromptExecutor(host, 0, {
      attempts: 3,
      backoff: { initialMs: 5, maxMs: 5, factor: 1, jitter: 0 },
    });
    prompt.mockRejectedValue(providerBlip());

    await expect(shortLived.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });
});

/**
 * Fuigo 1.0.18 sends -32603 with object data `{ message, error_kind, http_status? }`. The user now sees
 * `data.message`, so the replay decision can no longer ride on the JSON that used to leak into the message
 * (`"http_status":503` matched `\b5\d\d\b`) — it reads the typed fields and the RAW pre-sanitisation text.
 *
 * The rule, as an allowlist: `idle_timeout` replays; `api` / `http` / `compaction` only report HOW the call
 * failed (the provider's status, the transport, or Fuigo's own summariser call — never the prompt's verdict),
 * so they are decided exactly as the same failure was before this branch (transient prose, or any 5xx);
 * every other kind — `empty_response`, `rate_limited`, `auth`, `cancelled`, `session_unavailable`,
 * `max_tokens_truncation`, `doom_loop_detected`, and anything this client has never heard of — is final.
 * Untyped failures (a bare string, or an object with neither field) keep the prose match they had before.
 */
describe('PromptExecutor - typed engine error data decides replay explicitly', () => {
  let host: ReturnType<typeof createHost>['host'];
  let prompt: ReturnType<typeof vi.fn>;
  let executor: PromptExecutor;

  beforeEach(() => {
    ({ host, prompt } = createHost());
    executor = new PromptExecutor(host, 60_000, FAST_RETRY);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  /** A JSON-RPC -32603 as the SDK hands it to the client. */
  const internal = (data: unknown) => new RequestError(-32603, 'Internal error', data);

  /**
   * Characterisation table. `base` is what this exact shape did BEFORE the typed-data branch
   * (`TRANSIENT_DETAIL` over `Internal error: <JSON or string of data>`), proven by running this same
   * table against `origin/main`. `now` is what it must do on this branch. A row where the two differ has
   * to say why, in `divergence` — so a future edit that quietly changes a decision fails here rather than
   * in someone's chat.
   */
  type ReplayDecision = 'replay' | 'final';
  type Characterisation = {
    name: string;
    data: unknown;
    base: ReplayDecision;
    now: ReplayDecision;
    divergence?: string;
  };

  const CHARACTERISATION: Characterisation[] = [
    // --- Fuigo 1.0.18 typed shapes: transient-capable kinds -------------------------------------
    {
      name: 'api, overloaded (the copy Fuigo sends for 529 / overloaded_error)',
      data: { message: 'Model is temporarily overloaded. Try again in a moment.', error_kind: 'api' },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'api, overloaded, with the 529 status attached',
      data: {
        message: 'Model is temporarily overloaded. Try again in a moment.',
        error_kind: 'api',
        http_status: 529,
      },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'api, a provider stream error',
      data: { message: 'api_error: Internal server error', error_kind: 'api' },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'api, a 5xx the prose does not mention',
      data: { message: 'upstream request failed', error_kind: 'api', http_status: 503 },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'api, a 4xx whose prose is transient',
      data: { message: 'request timed out', error_kind: 'api', http_status: 408 },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'http, a dropped connection with no status',
      data: { message: 'connection closed before message completed', error_kind: 'http' },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'idle_timeout',
      data: { message: 'No response from model for 90s — the model may be stuck', error_kind: 'idle_timeout' },
      base: 'replay',
      now: 'replay',
    },

    // --- Fuigo 1.0.18 typed shapes: final kinds ---------------------------------------------------
    {
      name: 'empty_response (reasoning_only)',
      data: {
        message: 'empty response from model (reasoning_only): model=m, had_reasoning=true, finish_reason=stop',
        error_kind: 'empty_response',
      },
      base: 'final',
      now: 'final',
    },
    {
      name: 'empty_response after a proxy 503 replay storm',
      data: {
        message: 'empty response from model (no_visible_content): model=m, had_reasoning=true, finish_reason=stop',
        error_kind: 'empty_response',
        http_status: 503,
      },
      base: 'replay',
      now: 'final',
      divergence:
        'the defect this branch exists for: an identical resend is served the same cached empty reply, 15 times over',
    },
    {
      name: 'rate_limited',
      data: { message: 'Rate limited', error_kind: 'rate_limited' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'auth',
      data: { message: 'Authentication failed for provider', error_kind: 'auth' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'cancelled',
      data: { message: 'request was cancelled', error_kind: 'cancelled' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'session_unavailable, whose prose reads transient',
      data: { message: 'session temporarily unavailable', error_kind: 'session_unavailable' },
      base: 'replay',
      now: 'final',
      divergence: 'the session actor is gone; the same prompt cannot reach it by being sent again',
    },
    {
      name: 'max_tokens_truncation',
      data: { message: 'response truncated: max output tokens reached', error_kind: 'max_tokens_truncation' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'doom_loop_detected',
      data: { message: 'doom loop detected: the model repeated itself', error_kind: 'doom_loop_detected' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'an unknown kind, even with a 5xx and transient prose',
      data: { message: 'connection reset', error_kind: 'brand_new_kind', http_status: 503 },
      base: 'replay',
      now: 'final',
      divergence: 'the allowlist fails closed: a kind this client has never seen is a verdict until we know better',
    },

    // --- Fuigo 1.0.18 typed shapes: `compaction`, the recovery attempt's own failure -------------
    // Shapes taken from Fuigo's source (`session_compact.rs` COMPACT_FAILED_PREFIX + the sampling
    // error's Display, `acp_error::compaction`). Two compaction frames reach the PROMPT path and they
    // are NOT the same shape:
    //   - a compaction FAILURE is built by `acp_error::compaction()` (`sampler_turn.rs` ->
    //     `run_compact_only` -> the compaction loop's last error) and carries exactly
    //     `{ message, error_kind: 'compaction' }` — no `kind` field;
    //   - a compaction CANCELLED under a running prompt is built by `CompactFailure::cancelled_error()`
    //     (`session_compact.rs`), which goes through `compact_error_data(Cancelled, COMPACT_CANCELLED_MSG)`
    //     and therefore DOES carry `kind: 'compact_cancelled'` next to `error_kind: 'cancelled'`.
    //     `run_compact_only` returns that error unchanged, so the prompt sees the frame as built.
    // `kind` also rides the separate `session/compact` RPC payload, where its values are the same
    // `compact_failed` / `compact_cancelled`; the failure rows below carry no `kind` because the
    // prompt path genuinely never sends one there. The verdict rides on `error_kind` either way.
    // The kind says the SUMMARISER call failed, not what the prompt's verdict is, so — like `api`
    // and `http` — the text decides, exactly as it decided on 1.0.17 when the same failure arrived
    // untyped. A second compaction attempt is a different request, so a resend is a different roll.
    {
      name: 'compaction, a reset socket on the summariser call',
      data: {
        message: 'compact failed: request error: error sending request: connection reset by peer',
        error_kind: 'compaction',
      },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'compaction, a 503 from the summariser',
      data: {
        message: 'compact failed: API error (status 503 Service Unavailable): upstream connect error',
        error_kind: 'compaction',
      },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'compaction, the summariser stream going quiet',
      data: {
        message: 'compact failed: stream idle timeout after 90s (0 chars received)',
        error_kind: 'compaction',
      },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'compaction, an overloaded provider stream event',
      data: {
        message: 'compact failed: stream error (overloaded_error): Overloaded',
        error_kind: 'compaction',
      },
      base: 'replay',
      now: 'replay',
    },
    {
      // The shape whose accidental promotion to REPLAY re-creates the storm this whole change
      // exists to stop: FluxRouter serves the identical resend the same cached empty reply, billed
      // every time. Fuigo emits it as `compact failed: model returned empty response`
      // (`compaction.rs`, `full_replace_compaction.rs`) and, through `classify_sampling_error`
      // (`session_compact.rs`), as `compact failed: empty response from model (<reason>)`. Neither
      // prose matches TRANSIENT_DETAIL today, so this is final on base and final now — the row is
      // here so a later widening with a token like `empty` goes red instead of shipping.
      name: 'compaction whose summariser came back empty — the one shape a widening must never replay',
      data: { message: 'compact failed: model returned empty response', error_kind: 'compaction' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'compaction with nothing to compact — the prose was never transient',
      data: { message: 'compact failed: nothing to compact', error_kind: 'compaction' },
      base: 'final',
      now: 'final',
    },
    {
      name: 'compaction hitting the wall-clock backstop',
      data: {
        message: 'compact failed: exceeded wall-clock budget 300s (runaway generation)',
        error_kind: 'compaction',
      },
      base: 'final',
      now: 'final',
    },
    {
      name: 'compaction cancelled — Fuigo tags the cancel `cancelled`, not `compaction`',
      data: { kind: 'compact_cancelled', message: 'compact cancelled', error_kind: 'cancelled' },
      base: 'final',
      now: 'final',
    },

    // --- Fuigo <= 1.0.17 object shapes: `{ message, http_status }`, no kind ------------------------
    {
      name: 'status-only 502',
      data: { message: 'upstream request failed', http_status: 502 },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'status-only 408 whose prose is transient',
      data: { message: 'Request Timeout', http_status: 408 },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'an untyped object whose status is only in its JSON',
      data: { message: 'provider hiccup', status: 503 },
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'an untyped object whose transient words are only adjacent across a newline',
      data: { message: 'connection\nreset by peer' },
      base: 'final',
      now: 'final',
    },

    // --- Fuigo 1.0.16 string shapes ---------------------------------------------------------------
    {
      name: 'string data, empty response',
      data: 'empty response from model (reasoning_only): model=m, had_reasoning=true, finish_reason=stop',
      base: 'final',
      now: 'final',
    },
    {
      name: 'string data, overloaded',
      data: 'Model is temporarily overloaded. Try again in a moment.',
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'string data, a dropped connection',
      data: 'stream error: connection closed before message completed',
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'string data, an HTTP status in prose',
      data: 'HTTP 503 Service Unavailable',
      base: 'replay',
      now: 'replay',
    },
    {
      name: 'string data, rate limited',
      data: 'Rate limited',
      base: 'final',
      now: 'final',
    },
  ];

  for (const row of CHARACTERISATION) {
    it(`${row.now === 'replay' ? 'replays' : 'does NOT replay'} ${row.name}`, async () => {
      prompt.mockReset();
      prompt.mockRejectedValueOnce(internal(row.data)).mockResolvedValue({ stopReason: 'end_turn' });

      if (row.now === 'replay') {
        await executor.execute(CONTENT);
        expect(prompt).toHaveBeenCalledTimes(2);
      } else {
        await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
        expect(prompt).toHaveBeenCalledTimes(1);
      }
    });
  }

  /**
   * The table is the only thing pinning Wayland's model of Fuigo's compaction wire frames, so the
   * frames themselves are pinned, not just their verdicts. Two shapes exist and they differ:
   * `acp_error::compaction()` (the failure path, `compaction.rs` last error) sends
   * `{ message, error_kind: 'compaction' }` with NO `kind`, while a compact cancelled under a running
   * prompt comes from `CompactFailure::cancelled_error()` (`session_compact.rs`), which builds
   * `compact_error_data(Cancelled, COMPACT_CANCELLED_MSG)` and therefore DOES carry
   * `kind: 'compact_cancelled'` alongside `error_kind: 'cancelled'`. `run_compact_only` returns that
   * error unchanged, so it reaches the prompt exactly as built.
   */
  it("models Fuigo's compaction frames exactly: only the cancelled one carries `kind`", () => {
    const compactionRows = CHARACTERISATION.filter(
      (row) =>
        typeof row.data === 'object' &&
        row.data !== null &&
        'message' in row.data &&
        String((row.data as { message: string }).message).startsWith('compact ')
    );

    const cancelled = compactionRows.find((row) => (row.data as { error_kind?: string }).error_kind === 'cancelled');
    expect(cancelled?.data).toEqual({
      kind: 'compact_cancelled',
      message: 'compact cancelled',
      error_kind: 'cancelled',
    });

    // Every other compaction row is the failure path, which sends no `kind` at all.
    const failureRowsWithKind = compactionRows
      .filter((row) => row !== cancelled && 'kind' in (row.data as object))
      .map((row) => row.name);
    expect(failureRowsWithKind).toEqual([]);
  });

  it('changes no decision it does not explain', () => {
    const undeclared = CHARACTERISATION.filter((row) => row.base !== row.now && !row.divergence);
    expect(undeclared.map((row) => row.name)).toEqual([]);
    // And the ones that do diverge are exactly the deliberate ones.
    expect(CHARACTERISATION.filter((row) => row.divergence).map((row) => row.name)).toEqual([
      'empty_response after a proxy 503 replay storm',
      'session_unavailable, whose prose reads transient',
      'an unknown kind, even with a 5xx and transient prose',
    ]);
  });

  it('matches transient prose on the raw text, not on the sanitized message', async () => {
    // Sanitizing flattened the newline to a space, which would turn a phrase the base read as two
    // unrelated words into `connection reset` and start replaying a failure nobody replayed before.
    prompt.mockRejectedValue(internal({ message: 'connection\nreset by peer' }));

    const rejection = await executor.execute(CONTENT).catch((e: unknown) => e);

    expect(prompt).toHaveBeenCalledTimes(1);
    expect((rejection as AcpError).message).toBe('Internal error: connection reset by peer');
  });

  it('shows data.message in the retry banner and the final error, not raw JSON', async () => {
    prompt.mockRejectedValue(internal({ message: 'upstream request failed', error_kind: 'api', http_status: 503 }));

    const rejection = await executor.execute(CONTENT).catch((e: unknown) => e);

    const signals = (host.callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    const banner = signals.find((s) => s.type === 'error');
    expect(banner.message).toBe('Internal error: upstream request failed — retrying (1/3)');
    expect((rejection as AcpError).message).toBe('Internal error: upstream request failed');
  });
});
