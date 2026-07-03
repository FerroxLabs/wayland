/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// #554: useAllCronJobs must reconcile with the authoritative SQLite cron store
// on lifecycle boundaries (window focus / tab visible), not only via one-shot
// IPC events which are lost if the page was unmounted or the window blurred
// when a chat-created/updated event fired.

const listJobs = vi.fn();
const noopUnsub = () => {};

vi.mock('@/common', () => ({
  ipcBridge: {
    cron: {
      listJobs: { invoke: (...args: unknown[]) => listJobs(...args) },
      onJobCreated: { on: vi.fn(() => noopUnsub) },
      onJobUpdated: { on: vi.fn(() => noopUnsub) },
      onJobRemoved: { on: vi.fn(() => noopUnsub) },
    },
  },
}));

vi.mock('@/renderer/utils/emitter', () => ({
  emitter: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

import { useAllCronJobs } from '@renderer/pages/cron/useCronJobs';

describe('useAllCronJobs — authoritative re-fetch on lifecycle boundaries (#554)', () => {
  beforeEach(() => {
    listJobs.mockReset();
    listJobs.mockResolvedValue([]);
  });

  it('fetches the store once on mount', async () => {
    renderHook(() => useAllCronJobs());
    await waitFor(() => expect(listJobs).toHaveBeenCalledTimes(1));
  });

  it('re-fetches the store when the window regains focus', async () => {
    renderHook(() => useAllCronJobs());
    await waitFor(() => expect(listJobs).toHaveBeenCalledTimes(1));

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => expect(listJobs).toHaveBeenCalledTimes(2));
  });

  it('re-fetches the store when the document becomes visible', async () => {
    renderHook(() => useAllCronJobs());
    await waitFor(() => expect(listJobs).toHaveBeenCalledTimes(1));

    await act(async () => {
      // jsdom reports visibilityState 'visible' by default.
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(listJobs).toHaveBeenCalledTimes(2));
  });

  it('does not flip loading (no spinner flash) during a background focus re-fetch', async () => {
    const { result } = renderHook(() => useAllCronJobs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Make the focus-triggered re-fetch hang so we can observe loading while
    // it is in flight; a silent refetch must keep loading false.
    let resolveList: ((v: unknown) => void) | undefined;
    listJobs.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveList = res;
        })
    );

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(listJobs).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      resolveList?.([]);
    });
  });

  it('stops re-fetching after unmount (listeners cleaned up)', async () => {
    const { unmount } = renderHook(() => useAllCronJobs());
    await waitFor(() => expect(listJobs).toHaveBeenCalledTimes(1));

    unmount();
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // No further calls once the effect cleanup removed the listeners.
    expect(listJobs).toHaveBeenCalledTimes(1);
  });
});
