/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * `useHiddenAgents` - the shared, reactive view of the agent keys hidden from
 * the Guid-page toolbar strip. Backed by ConfigStorage('agents.hidden') and a
 * single SWR cache key so a toggle on the Agents page revalidates every
 * consumer (including a separately-mounted Guid page) without a reload.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storeRef = vi.hoisted(() => ({ value: undefined as string[] | undefined }));
const get = vi.hoisted(() => vi.fn());
const set = vi.hoisted(() => vi.fn());
get.mockImplementation(async (key: string) => (key === 'agents.hidden' ? storeRef.value : undefined));
set.mockImplementation(async (key: string, value: unknown) => {
  if (key === 'agents.hidden') storeRef.value = value as string[];
});

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get, set },
}));

import { useHiddenAgents } from '@/renderer/hooks/assistant/useHiddenAgents';

// Fresh SWR cache per render so module-global cache does not leak between tests.
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  get.mockImplementation(async (key: string) => (key === 'agents.hidden' ? storeRef.value : undefined));
  set.mockImplementation(async (key: string, value: unknown) => {
    if (key === 'agents.hidden') storeRef.value = value as string[];
  });
  storeRef.value = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useHiddenAgents', () => {
  it('reports an empty hidden set when storage is absent', async () => {
    const { result } = renderHook(() => useHiddenAgents(), { wrapper });
    await waitFor(() => expect(result.current.hidden).toEqual([]));
    expect(result.current.isHidden('codex')).toBe(false);
  });

  it('reads the persisted hidden set', async () => {
    storeRef.value = ['codex', 'copilot'];
    const { result } = renderHook(() => useHiddenAgents(), { wrapper });
    await waitFor(() => expect(result.current.isHidden('codex')).toBe(true));
    expect(result.current.isHidden('copilot')).toBe(true);
    expect(result.current.isHidden('claude')).toBe(false);
  });

  it('persists hiding an agent and reflects it reactively', async () => {
    const { result } = renderHook(() => useHiddenAgents(), { wrapper });
    await waitFor(() => expect(result.current.hidden).toEqual([]));

    await act(async () => {
      await result.current.setAgentHidden('codex', true);
    });

    expect(set).toHaveBeenCalledWith('agents.hidden', ['codex']);
    await waitFor(() => expect(result.current.isHidden('codex')).toBe(true));
  });

  it('does not duplicate a key that is already hidden', async () => {
    storeRef.value = ['codex'];
    const { result } = renderHook(() => useHiddenAgents(), { wrapper });
    await waitFor(() => expect(result.current.isHidden('codex')).toBe(true));

    await act(async () => {
      await result.current.setAgentHidden('codex', true);
    });

    expect(set).toHaveBeenCalledWith('agents.hidden', ['codex']);
  });

  it('removes a key when an agent is shown again', async () => {
    storeRef.value = ['codex', 'copilot'];
    const { result } = renderHook(() => useHiddenAgents(), { wrapper });
    await waitFor(() => expect(result.current.isHidden('codex')).toBe(true));

    await act(async () => {
      await result.current.setAgentHidden('codex', false);
    });

    expect(set).toHaveBeenCalledWith('agents.hidden', ['copilot']);
    await waitFor(() => expect(result.current.isHidden('codex')).toBe(false));
  });
});
