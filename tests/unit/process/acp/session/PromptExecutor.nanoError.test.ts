/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * C7: nano-typed prompt errors carry the engine's own closed classification
 * (`error.data.nanoError.retryable`). PromptExecutor consults the typed flag
 * DIRECTLY for nano-tagged errors — the TRANSIENT_DETAIL message regex is a
 * third-party heuristic and must neither widen a terminal nano error into a
 * retry nor narrow a retryable one into a halt.
 *
 * Errors in this suite pass through normalizeError exactly as the wire path
 * builds them (plain JSON-RPC payload objects), so the unknown-kind-terminal
 * rule is exercised end to end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptExecutor, type PromptHost } from '@process/acp/session/PromptExecutor';
import { AcpError } from '@process/acp/errors/AcpError';
import { normalizeError } from '@process/acp/errors/errorNormalize';
import type { PromptContent } from '@process/acp/types';

const FAST_RETRY = { attempts: 3, backoff: { initialMs: 0, maxMs: 0, factor: 1, jitter: 0 } };

const CONTENT = [{ type: 'text', text: 'do the thing' }] as unknown as PromptContent;

/** Build the error the way the wire path does: raw payload → normalizeError. */
function nanoError(kind: string, retryable: boolean, message = kind): AcpError {
  return normalizeError({ code: -32603, message, data: { nanoError: { kind, retryable } } });
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

describe('PromptExecutor — nano-typed retry classification (C7)', () => {
  let host: ReturnType<typeof createHost>['host'];
  let prompt: ReturnType<typeof vi.fn>;
  let executor: PromptExecutor;

  beforeEach(() => {
    ({ host, prompt } = createHost());
    executor = new PromptExecutor(host, 60_000, FAST_RETRY);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('retries a typed retryable error whose message the regex would NOT match', async () => {
    // "Rate limited" matches nothing in TRANSIENT_DETAIL; the typed flag decides.
    prompt
      .mockRejectedValueOnce(nanoError('model_rate_limited', true, 'Rate limited'))
      .mockResolvedValueOnce({ stopReason: 'end_turn' });

    await expect(executor.execute(CONTENT)).resolves.toBeUndefined();
    expect(prompt).toHaveBeenCalledTimes(2);
    expect(host.callbacks.onSignal).toHaveBeenCalledWith({ type: 'turn_finished' });
  });

  it('does NOT retry a typed terminal error whose message WOULD match the regex', async () => {
    // "connection error" matches TRANSIENT_DETAIL; the typed terminal flag wins.
    prompt.mockRejectedValue(nanoError('model_auth', false, 'connection error'));

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('never retries a kind from the future, even when it claims retryable', async () => {
    prompt.mockRejectedValue(nanoError('kind_from_the_future', true, 'connection error'));

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('journal_unavailable does not auto-retry despite the -32603 default', async () => {
    prompt.mockRejectedValue(nanoError('journal_unavailable', false, 'Session storage unavailable'));

    await expect(executor.execute(CONTENT)).rejects.toBeInstanceOf(AcpError);
    expect(prompt).toHaveBeenCalledTimes(1);
  });
});
