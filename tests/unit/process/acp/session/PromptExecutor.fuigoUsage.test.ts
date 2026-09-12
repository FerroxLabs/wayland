/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo never emits `usage_update` and does not fill the unstable top-level
 * `PromptResponse.usage`; per-prompt usage rides `_meta.usage` with cost in
 * USD ticks. Before this path existed the Fuigo cost ledger never moved.
 *
 * The recorder wants a cumulative session gauge, so the executor sums prompt
 * costs itself and names its own meter, which is what keeps a re-spawn on the
 * same ACP session from clamping under the previous high-water mark.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptExecutor, type PromptHost } from '@process/acp/session/PromptExecutor';
import type { PromptContent } from '@process/acp/types';

const RETRY = { attempts: 1, backoff: { initialMs: 0, maxMs: 0, factor: 1, jitter: 0 } };
const CONTENT = [{ type: 'text', text: 'hi' }] as unknown as PromptContent;

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

const fuigoResponse = (ticks: number | undefined, totalTokens: number, extra: Record<string, unknown> = {}) => ({
  stopReason: 'end_turn',
  _meta: { usage: { totalTokens, inputTokens: totalTokens - 10, outputTokens: 10, costUsdTicks: ticks, ...extra } },
});

describe('PromptExecutor - Fuigo _meta.usage', () => {
  let host: ReturnType<typeof createHost>['host'];
  let prompt: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('accumulates per-prompt cost into one named meter across turns', async () => {
    ({ host, prompt } = createHost('fuigo'));
    const executor = new PromptExecutor(host, 60_000, RETRY);
    prompt.mockResolvedValueOnce(fuigoResponse(10_000_000_000, 500)); // $1.00
    prompt.mockResolvedValueOnce(fuigoResponse(5_000_000_000, 900)); // +$0.50

    await executor.execute(CONTENT);
    await executor.execute(CONTENT);

    const calls = (host.callbacks.onContextUsage as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ used: 500, cost: { amount: 1, currency: 'USD' } });
    expect(calls[1]).toMatchObject({ used: 900, cost: { amount: 1.5, currency: 'USD' } });
    expect(calls[0].meterId).toMatch(/^fuigo:/);
    expect(calls[1].meterId).toBe(calls[0].meterId);
  });

  it('starts a fresh meter per executor so a re-spawn never clamps under the old gauge', async () => {
    const a = createHost('fuigo');
    const b = createHost('fuigo');
    a.prompt.mockResolvedValue(fuigoResponse(1, 1));
    b.prompt.mockResolvedValue(fuigoResponse(1, 1));
    await new PromptExecutor(a.host, 60_000, RETRY).execute(CONTENT);
    await new PromptExecutor(b.host, 60_000, RETRY).execute(CONTENT);
    const ma = (a.host.callbacks.onContextUsage as ReturnType<typeof vi.fn>).mock.calls[0][0].meterId;
    const mb = (b.host.callbacks.onContextUsage as ReturnType<typeof vi.fn>).mock.calls[0][0].meterId;
    expect(ma).not.toBe(mb);
  });

  it('reports tokens but no cost when Fuigo scrubbed or partial-billed the prompt', async () => {
    ({ host, prompt } = createHost('fuigo'));
    const executor = new PromptExecutor(host, 60_000, RETRY);
    prompt.mockResolvedValueOnce(fuigoResponse(undefined, 300));
    prompt.mockResolvedValueOnce(fuigoResponse(7, 300, { costIsPartial: true }));
    await executor.execute(CONTENT);
    await executor.execute(CONTENT);
    for (const [usage] of (host.callbacks.onContextUsage as ReturnType<typeof vi.fn>).mock.calls) {
      expect(usage).toEqual({ used: 300, total: 0, percentage: 0 });
    }
  });

  it('does not read _meta for other backends', async () => {
    ({ host, prompt } = createHost('qwen'));
    prompt.mockResolvedValueOnce(fuigoResponse(10, 5));
    await new PromptExecutor(host, 60_000, RETRY).execute(CONTENT);
    expect(host.callbacks.onContextUsage).not.toHaveBeenCalled();
  });
});
