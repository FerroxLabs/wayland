/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #684: the knowledge wizard hung forever at "Drafting..." when the desktop
 * IPC transport under `generate()` never settled (a bridge invocation rejected
 * by the remote adapter has no reply in the wire protocol). `withDraftTimeout`
 * is the client-side backstop for the IPC path (the HTTP path carries its own
 * `AbortSignal.timeout` deadline, #682): it passes results through, converts
 * transport rejections into the #682 'bridge' class, and fires a 'timeout'
 * fallback if nothing ever settles.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DRAFT_TIMEOUT_MS, withDraftTimeout } from '@/renderer/services/draftTimeout';
import type { KnowledgeDraftResult } from '@/renderer/services/ProjectDraftService';

describe('withDraftTimeout (#684)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes a settled result through unchanged', async () => {
    const result: KnowledgeDraftResult = { draft: '# Draft' };
    await expect(withDraftTimeout(Promise.resolve(result))).resolves.toBe(result);
  });

  it('passes a structured error result through unchanged', async () => {
    const result: KnowledgeDraftResult = { draft: '', error: 'no-model' };
    await expect(withDraftTimeout(Promise.resolve(result))).resolves.toBe(result);
  });

  it("settles a rejected transport as a 'bridge' failure with the cause (#682 class)", async () => {
    const settled = withDraftTimeout(Promise.reject(new Error('IPC channel closed')));
    await expect(settled).resolves.toEqual({ draft: '', error: 'bridge', detail: 'IPC channel closed' });
  });

  it("settles a rejected transport without a message as 'bridge' with no detail", async () => {
    const settled = withDraftTimeout(Promise.reject('nope'));
    await expect(settled).resolves.toEqual({ draft: '', error: 'bridge', detail: undefined });
  });

  it("fires the 'timeout' fallback when the transport never settles", async () => {
    const never = new Promise<KnowledgeDraftResult>(() => {});
    const settled = withDraftTimeout(never, 5_000);

    await vi.advanceTimersByTimeAsync(4_999);
    let done = false;
    void settled.then(() => {
      done = true;
    });
    await Promise.resolve();
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(settled).resolves.toEqual({ draft: '', error: 'timeout' });
  });

  it('uses the 120s default backstop', async () => {
    const never = new Promise<KnowledgeDraftResult>(() => {});
    const settled = withDraftTimeout(never);

    await vi.advanceTimersByTimeAsync(DRAFT_TIMEOUT_MS);
    await expect(settled).resolves.toEqual({ draft: '', error: 'timeout' });
  });

  it('does not let a late timeout overwrite a real result', async () => {
    const result: KnowledgeDraftResult = { draft: 'late but real' };
    let resolveTransport: (value: KnowledgeDraftResult) => void = () => {};
    const transport = new Promise<KnowledgeDraftResult>((resolve) => {
      resolveTransport = resolve;
    });

    const settled = withDraftTimeout(transport, 5_000);
    resolveTransport(result);
    await expect(settled).resolves.toBe(result);

    // Advancing past the timeout must not change anything (timer was cleared).
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(settled).resolves.toBe(result);
  });
});
