/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const suggestManyMock = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    kickoff: {
      suggestMany: { invoke: (...a: unknown[]) => suggestManyMock(...a) },
    },
  },
}));

import { useKickoffGrid } from '@/renderer/hooks/kickoff/useKickoffGrid';

beforeEach(() => {
  suggestManyMock.mockReset();
});

describe('useKickoffGrid', () => {
  it('fetches the grid on mount, forwarding assistantId + locale', async () => {
    suggestManyMock.mockResolvedValue({
      items: [{ kickoffId: 'k1', text: 'A', prefill: 'a', source: 'kickoff' }],
    });
    const { result } = renderHook(() => useKickoffGrid('cowork', 'zh-CN'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.items).toHaveLength(1);
    expect(suggestManyMock).toHaveBeenCalledWith({ assistantId: 'cowork', locale: 'zh-CN' });
  });

  it('does not call IPC and stays empty when assistantId is undefined', async () => {
    const { result } = renderHook(() => useKickoffGrid(undefined, 'en-US'));
    expect(suggestManyMock).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
    expect(result.current.items).toEqual([]);
  });

  it('treats a notRendered result as an empty (hidden) grid', async () => {
    suggestManyMock.mockResolvedValue({ notRendered: 'no-kickoffs-defined' });
    const { result } = renderHook(() => useKickoffGrid('ghost', 'en-US'));
    await waitFor(() => expect(suggestManyMock).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
    expect(result.current.items).toEqual([]);
  });

  it('swallows an IPC rejection and stays empty (no throw to the view)', async () => {
    suggestManyMock.mockRejectedValue(new Error('ipc down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useKickoffGrid('helm', 'en-US'));
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
    expect(result.current.items).toEqual([]);
    warn.mockRestore();
  });

  it('re-fetches when the assistantId changes', async () => {
    suggestManyMock.mockResolvedValue({ items: [{ text: 'A', prefill: 'a', source: 'prompts' }] });
    const { rerender } = renderHook(({ id }) => useKickoffGrid(id, 'en-US'), {
      initialProps: { id: 'a1' },
    });
    await waitFor(() => expect(suggestManyMock).toHaveBeenCalledWith({ assistantId: 'a1', locale: 'en-US' }));
    rerender({ id: 'a2' });
    await waitFor(() => expect(suggestManyMock).toHaveBeenCalledWith({ assistantId: 'a2', locale: 'en-US' }));
  });
});
