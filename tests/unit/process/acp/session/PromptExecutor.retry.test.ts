/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #774: a transient mid-run error killed the turn outright. The agent halted,
 * the prompt was dropped on the floor, and the task sat dead until a human
 * typed "retry" — at which point it resumed fine, proving recovery was always
 * possible. PromptExecutor now retries the turn itself.
 *
 * The safety rule these tests pin down: a replay re-asks the model to carry out
 * the request, so it is only allowed while the turn has NOT executed a tool.
 * Once a tool has run, replaying could run it twice.
 *
 * Backoff is injected as 0ms — real timers, no fake clock, so there is no
 * fake-clock/real-macrotask interleaving to hang a sharded runner.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptExecutor, type PromptHost } from '@process/acp/session/PromptExecutor';
import { AcpError } from '@process/acp/errors/AcpError';
import type { PromptContent } from '@process/acp/types';

const NO_BACKOFF = { attempts: 3, backoff: { initialMs: 0, maxMs: 0, factor: 1, jitter: 0 } };

const CONTENT = [{ type: 'text', text: 'do the thing' }] as unknown as PromptContent;

function createHost() {
  const prompt = vi.fn().mockResolvedValue({ stopReason: 'end_turn' });
  const statuses: string[] = [];

  const host = {
    status: 'active',
    lifecycle: {
      client: { prompt },
      sessionId: 'sess-1',
      reassertConfig: vi.fn().mockResolvedValue(undefined),
    },
    messageTranslator: { onTurnStart: vi.fn(), onTurnEnd: vi.fn() },
    authNegotiator: { buildAuthRequiredData: vi.fn() },
    callbacks: { onSignal: vi.fn(), onContextUsage: vi.fn() },
    metrics: { recordError: vi.fn() },
    agentConfig: { agentBackend: 'test' },
    setStatus: vi.fn((s: string) => {
      statuses.push(s);
      host.status = s;
    }),
    enterError: vi.fn(),
  } as unknown as PromptHost & { status: string };

  return { host, prompt, statuses };
}

function transient(msg = 'Connection error') {
  return new AcpError('CONNECTION_FAILED', msg, { retryable: true });
}

describe('PromptExecutor - transient turn errors are retried (#774)', () => {
  let host: ReturnType<typeof createHost>['host'];
  let prompt: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ host, prompt } = createHost());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('retries a transient failure and completes the turn, with no error thrown', async () => {
    prompt.mockRejectedValueOnce(transient()).mockResolvedValueOnce({ stopReason: 'end_turn' });

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await expect(executor.execute(CONTENT)).resolves.toBeUndefined();

    expect(prompt).toHaveBeenCalledTimes(2);
    // Same prompt content replayed, not a synthesized "keep going" string.
    expect(prompt.mock.calls[1][1]).toEqual(CONTENT);
    // The turn finished normally: the manager must not see a rejection, or it
    // would emit a turn-error banner and synthesize a premature finish.
    expect(host.callbacks.onSignal).toHaveBeenCalledWith({ type: 'turn_finished' });
    expect(host.enterError).not.toHaveBeenCalled();
  });

  it('surfaces a recoverable "retrying" banner rather than failing silently', async () => {
    prompt.mockRejectedValueOnce(transient('Failed to generate content')).mockResolvedValueOnce({ stopReason: 'end_turn' });

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await executor.execute(CONTENT);

    const signals = (host.callbacks.onSignal as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    const retryBanner = signals.find((s) => s.type === 'error');
    expect(retryBanner).toMatchObject({ recoverable: true });
    expect(retryBanner.message).toContain('retrying (1/3)');
  });

  it('gives up after the attempt cap and reports the failure', async () => {
    prompt.mockRejectedValue(transient());

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    // 3 attempts total = original + 2 retries. It must not retry forever.
    expect(prompt).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry a non-retryable error (a malformed request would just fail again)', async () => {
    prompt.mockRejectedValue(new AcpError('ACP_INVALID_PARAMS', 'missing field tool_call_id', { retryable: false }));

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(host.enterError).toHaveBeenCalled();
  });

  it('does NOT replay a turn that already executed a tool — that could run it twice', async () => {
    // Turn streams a tool_call, THEN the connection drops. Replaying the prompt
    // would re-ask the model to do the work, re-running the tool's side effects.
    prompt.mockImplementationOnce(() => {
      executor.noteToolActivity();
      return Promise.reject(transient());
    });

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('a tool in a PREVIOUS turn does not poison the next turn (flag is per-turn)', async () => {
    // First turn runs a tool and succeeds.
    prompt.mockImplementationOnce(() => {
      executor.noteToolActivity();
      return Promise.resolve({ stopReason: 'end_turn' });
    });
    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await executor.execute(CONTENT);

    // Second turn: transient failure before any tool runs → still retryable.
    prompt.mockRejectedValueOnce(transient()).mockResolvedValueOnce({ stopReason: 'end_turn' });
    host.status = 'active';
    await executor.execute(CONTENT);

    expect(prompt).toHaveBeenCalledTimes(3); // turn1, turn2-fail, turn2-retry
  });

  it('does not resume a retry after the turn is cancelled', async () => {
    prompt.mockImplementationOnce(() => {
      executor.cancel();
      return Promise.reject(transient());
    });

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does not retry into a dead session after the agent process is gone', async () => {
    prompt.mockImplementationOnce(() => {
      // Agent crashed during the turn; onDisconnect cleared the client.
      (host.lifecycle as { client: unknown }).client = null;
      return Promise.reject(transient());
    });

    const executor = new PromptExecutor(host, 60_000, NO_BACKOFF);
    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);

    expect(prompt).toHaveBeenCalledTimes(1);
  });
});
