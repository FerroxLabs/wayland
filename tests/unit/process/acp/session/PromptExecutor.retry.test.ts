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
