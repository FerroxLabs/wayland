/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WS-2 P2 - `wcoreToolKeys` IPC handler logic.
 *
 * Exercises the real handler factory (`createWcoreToolKeyHandlers`) over an
 * in-memory store fake. The load-bearing invariant under test: `list` reports
 * PRESENCE ONLY and never returns the plaintext key to the renderer.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createWcoreToolKeyHandlers } from '@process/agent/wcore/toolKeyIpc';
import type { ToolKeyStoreSlice } from '@process/agent/wcore/toolKeyIpc';
import type { ToolKeyId } from '@process/agent/wcore/toolKeyStore';

/** Minimal in-memory stand-in for `ToolKeyStore`. */
function makeFakeStore(): ToolKeyStoreSlice & { dump: () => Record<string, string> } {
  const keys = new Map<ToolKeyId, string>();
  return {
    setToolKey: (id, key) => void keys.set(id, key),
    getToolKey: (id) => keys.get(id),
    deleteToolKey: (id) => void keys.delete(id),
    dump: () => Object.fromEntries(keys),
  };
}

describe('wcoreToolKeys IPC handlers', () => {
  let store: ReturnType<typeof makeFakeStore>;
  let h: ReturnType<typeof createWcoreToolKeyHandlers>;

  beforeEach(() => {
    store = makeFakeStore();
    h = createWcoreToolKeyHandlers(async () => store);
  });

  it('set stores a key and list then reports hasKey:true without leaking plaintext', async () => {
    const setResult = await h.set({ id: 'brave', key: 'secret-xyz' });
    expect(setResult).toEqual({ ok: true });
    expect(store.dump()).toEqual({ brave: 'secret-xyz' });

    const list = await h.list();
    const brave = list.find((p) => p.id === 'brave');
    expect(brave).toEqual({ id: 'brave', hasKey: true });

    // The presence shape must carry NO key material whatsoever.
    const serialized = JSON.stringify(list);
    expect(serialized).not.toContain('secret-xyz');
    for (const entry of list) {
      expect(Object.keys(entry).toSorted()).toEqual(['hasKey', 'id']);
    }
  });

  it('list reports every supported backend, hasKey:false when unset', async () => {
    const list = await h.list();
    const ids = list.map((p) => p.id).toSorted();
    expect(ids).toEqual(['brave', 'elevenlabs', 'exa', 'fal', 'firecrawl', 'groq', 'huggingface', 'tavily']);
    expect(list.every((p) => p.hasKey === false)).toBe(true);
  });

  it('delete clears a stored key', async () => {
    await h.set({ id: 'tavily', key: 'tav-1' });
    expect((await h.list()).find((p) => p.id === 'tavily')?.hasKey).toBe(true);

    const del = await h.delete({ id: 'tavily' });
    expect(del).toEqual({ ok: true });
    expect((await h.list()).find((p) => p.id === 'tavily')?.hasKey).toBe(false);
  });

  it('set trims whitespace and rejects an empty key', async () => {
    expect(await h.set({ id: 'exa', key: '   ' })).toEqual({ ok: false });
    expect(store.dump()).toEqual({});

    await h.set({ id: 'exa', key: '  k1  ' });
    expect(store.dump()).toEqual({ exa: 'k1' });
  });

  it('rejects an unknown backend id for set and delete', async () => {
    expect(await h.set({ id: 'not-a-backend', key: 'x' })).toEqual({ ok: false });
    expect(await h.delete({ id: 'not-a-backend' })).toEqual({ ok: false });
    expect(store.dump()).toEqual({});
  });
});
