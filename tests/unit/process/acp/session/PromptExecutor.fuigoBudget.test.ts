/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A Fuigo process budget (FUIGO_MAX_MODEL_CALLS / FUIGO_MAX_RUNTIME_SECS, set
 * for unattended runs) ends the prompt with a JSON-RPC error, not a stop
 * reason — captured on the staged 1.0.15 over stdio:
 *   calls: `-32603 Internal error`, data = the execution receipt
 *          `{partial: true, reason: "Execution stopped with bounded capacity …"}`
 *   wall:  `-32602 Invalid params`, data = "execution budget: wall deadline exhausted"
 * Without the mapping the chat shows "Internal error: {receipt json}" and, for
 * -32603, offers a recoverable retry against a process with nothing left.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestError } from '@agentclientprotocol/sdk';
import { PromptExecutor, type PromptHost } from '@process/acp/session/PromptExecutor';
import type { PromptContent } from '@process/acp/types';
import { FUIGO_UNATTENDED_MAX_MODEL_CALLS } from '@process/agent/fuigo/launch';

const RETRY = { attempts: 1, backoff: { initialMs: 0, maxMs: 0, factor: 1, jitter: 0 } };
const CONTENT = [{ type: 'text', text: 'hi' }] as unknown as PromptContent;

const RECEIPT = {
  id: '7fa1c5ff',
  execution_id: 'b93083bf',
  partial: true,
  pending_attempts: [],
  reason:
    'Execution stopped with bounded capacity or unresolved work. Consult persisted conversation and tool results; pending attempts must not be replayed automatically.',
  promptUsage: { modelCalls: 2 },
};

function createHost(backend: string) {
  const prompt = vi.fn();
  const host = {
    status: 'active',
    lifecycle: {
      client: { prompt, cancel: vi.fn().mockResolvedValue(undefined) },
      sessionId: 'sess-1',
      reassertConfig: vi.fn().mockResolvedValue(undefined),
      setAuthPendingForPrompt: vi.fn(),
      teardown: vi.fn().mockResolvedValue(undefined),
    },
    messageTranslator: { onTurnStart: vi.fn(), onTurnEnd: vi.fn() },
    authNegotiator: { buildAuthRequiredData: vi.fn().mockReturnValue({}) },
    callbacks: { onSignal: vi.fn(), onContextUsage: vi.fn() },
    metrics: { recordError: vi.fn() },
    agentConfig: { agentBackend: backend },
    setStatus: vi.fn((s: string) => {
      host.status = s;
    }),
    enterError: vi.fn(),
  } as unknown as PromptHost & { status: string };
  return { host, prompt };
}

describe('PromptExecutor - Fuigo process budget stops', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows a model-call budget stop for the execution receipt, not a retryable internal error', async () => {
    const { host, prompt } = createHost('fuigo');
    prompt.mockRejectedValueOnce(new RequestError(-32603, 'Internal error', RECEIPT));

    await expect(new PromptExecutor(host, 60_000, RETRY).execute(CONTENT)).rejects.toMatchObject({
      retryable: false,
      message: expect.stringContaining(`${FUIGO_UNATTENDED_MAX_MODEL_CALLS} of its model calls`),
    });
    expect(host.enterError).toHaveBeenCalledTimes(1);
    const shown = (host.enterError as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(shown).toMatch(/^Stopped by the run budget/);
    expect(shown).not.toContain('Internal error');
    expect(shown).not.toContain('execution_id');
    // Not the "recoverable, stay active" branch a bare -32603 takes.
    expect(host.callbacks.onSignal).not.toHaveBeenCalledWith(expect.objectContaining({ recoverable: true }));
  });

  it('shows a runtime budget stop for the wall-deadline error', async () => {
    const { host, prompt } = createHost('fuigo');
    prompt.mockRejectedValueOnce(
      new RequestError(-32602, 'Invalid params', 'execution budget: wall deadline exhausted')
    );

    await expect(new PromptExecutor(host, 60_000, RETRY).execute(CONTENT)).rejects.toMatchObject({ retryable: false });
    const shown = (host.enterError as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(shown).toMatch(/^Stopped by the run budget: this run passed its 60-minute limit/);
  });

  it('leaves an unrelated internal error on the generic path', async () => {
    const { host, prompt } = createHost('fuigo');
    prompt.mockRejectedValueOnce(new RequestError(-32603, 'Internal error', 'Execution state unavailable'));

    await expect(new PromptExecutor(host, 60_000, RETRY).execute(CONTENT)).rejects.toMatchObject({ retryable: true });
    expect(host.enterError).not.toHaveBeenCalled();
    expect(host.callbacks.onSignal).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', recoverable: true }));
  });

  it('does not rewrite the same receipt for another backend', async () => {
    const { host, prompt } = createHost('qwen');
    prompt.mockRejectedValueOnce(new RequestError(-32603, 'Internal error', RECEIPT));
    await expect(new PromptExecutor(host, 60_000, RETRY).execute(CONTENT)).rejects.toBeTruthy();
    expect(host.enterError).not.toHaveBeenCalled();
  });
});
