/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory ConfigStorage stand-in so the hook's persistence is observable
// without touching disk/IPC.
const store = new Map<string, unknown>();
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store.get(k)),
    set: vi.fn(async (k: string, v: unknown) => {
      store.set(k, v);
    }),
  },
}));

import { pinKey, usePinnedModels } from '@renderer/hooks/usage/usePinnedModels';

describe('usePinnedModels', () => {
  beforeEach(() => store.clear());

  it('pinKey builds providerId:modelId', () => {
    expect(pinKey('flux-router', 'flux-auto')).toBe('flux-router:flux-auto');
  });

  it('loads existing pins when enabled', async () => {
    store.set('pinnedModels', ['flux-router:flux-auto']);
    const { result } = renderHook(() => usePinnedModels(true));
    await waitFor(() => expect(result.current.pinned.has('flux-router:flux-auto')).toBe(true));
  });

  it('does not load while disabled', async () => {
    store.set('pinnedModels', ['flux-router:flux-auto']);
    const { result } = renderHook(() => usePinnedModels(false));
    // Give any stray effect a tick; should stay empty.
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.pinned.size).toBe(0);
  });

  it('toggle adds then removes a pin and persists', async () => {
    const { result } = renderHook(() => usePinnedModels(true));
    await waitFor(() => expect(result.current.pinned.size).toBe(0));

    act(() => result.current.toggle('flux-router:flux-auto'));
    await waitFor(() => expect(result.current.pinned.has('flux-router:flux-auto')).toBe(true));
    expect(store.get('pinnedModels')).toEqual(['flux-router:flux-auto']);

    act(() => result.current.toggle('flux-router:flux-auto'));
    await waitFor(() => expect(result.current.pinned.has('flux-router:flux-auto')).toBe(false));
    expect(store.get('pinnedModels')).toEqual([]);
  });
});
