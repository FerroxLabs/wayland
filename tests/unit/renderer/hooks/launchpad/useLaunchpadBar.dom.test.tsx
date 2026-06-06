/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.hoisted(() => vi.fn());
const setMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: getMock,
    set: setMock,
  },
}));

import {
  DEFAULT_BAR_ORDER,
  LAUNCHPAD_MAX_ENTRIES,
  useLaunchpadBar,
} from '@/renderer/hooks/launchpad/useLaunchpadBar';

describe('useLaunchpadBar', () => {
  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
    setMock.mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('seeds with DEFAULT_BAR_ORDER when ConfigStorage has no value', async () => {
    getMock.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toEqual(DEFAULT_BAR_ORDER);
    // Default seed should NOT be written through - that would mask future default-set bumps.
    expect(setMock).not.toHaveBeenCalled();
  });

  it('honors a deliberate empty array stored by the user', async () => {
    getMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toEqual([]);
  });

  it('loads a customised order from ConfigStorage', async () => {
    getMock.mockResolvedValueOnce(['ext-quiet-money', 'builtin-cowork']);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toEqual(['ext-quiet-money', 'builtin-cowork']);
  });

  it('setBarOrder replaces the order and persists', async () => {
    getMock.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.setBarOrder(['ext-copy', 'builtin-cowork']);
    });

    expect(result.current.barOrder).toEqual(['ext-copy', 'builtin-cowork']);
    expect(setMock).toHaveBeenCalledWith('launchpad.barOrder', ['ext-copy', 'builtin-cowork']);
  });

  it('addToBar appends an unknown id and is a no-op for duplicates', async () => {
    getMock.mockResolvedValueOnce(['builtin-cowork']);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addToBar('ext-copy');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork', 'ext-copy']);
    expect(setMock).toHaveBeenLastCalledWith('launchpad.barOrder', ['builtin-cowork', 'ext-copy']);

    setMock.mockClear();
    act(() => {
      result.current.addToBar('ext-copy');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork', 'ext-copy']);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('removeFromBar drops an id and is a no-op for unknown ids', async () => {
    getMock.mockResolvedValueOnce(['builtin-cowork', 'ext-copy']);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.removeFromBar('ext-copy');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork']);
    expect(setMock).toHaveBeenLastCalledWith('launchpad.barOrder', ['builtin-cowork']);

    setMock.mockClear();
    act(() => {
      result.current.removeFromBar('does-not-exist');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork']);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('resetToDefaults overwrites with the default set', async () => {
    getMock.mockResolvedValueOnce(['ext-quiet-money']);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.resetToDefaults();
    });
    expect(result.current.barOrder).toEqual(DEFAULT_BAR_ORDER);
    expect(setMock).toHaveBeenCalledWith('launchpad.barOrder', DEFAULT_BAR_ORDER);
  });

  it('addToBar refuses to grow the bar beyond LAUNCHPAD_MAX_ENTRIES', async () => {
    const full = Array.from({ length: LAUNCHPAD_MAX_ENTRIES }, (_, i) => `pinned-${i}`);
    getMock.mockResolvedValueOnce(full);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.barOrder).toHaveLength(LAUNCHPAD_MAX_ENTRIES);

    setMock.mockClear();
    act(() => {
      result.current.addToBar('eleventh-card');
    });

    expect(result.current.barOrder).toHaveLength(LAUNCHPAD_MAX_ENTRIES);
    expect(result.current.barOrder).not.toContain('eleventh-card');
    expect(setMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('falls back to defaults when ConfigStorage.get rejects', async () => {
    getMock.mockRejectedValueOnce(new Error('boom'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toEqual(DEFAULT_BAR_ORDER);
    warn.mockRestore();
  });
});
