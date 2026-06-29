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
  PINNED_BAR_IDS,
  ensurePinned,
  useLaunchpadBar,
} from '@/renderer/hooks/launchpad/useLaunchpadBar';

const CONCIERGE = 'builtin-concierge';

describe('ensurePinned', () => {
  it('injects Concierge at slot 1 (#2 card) when absent', () => {
    expect(ensurePinned(['builtin-cowork', 'ext-copy'])).toEqual(['builtin-cowork', CONCIERGE, 'ext-copy']);
  });

  it('injects Concierge even into a deliberately empty bar', () => {
    expect(ensurePinned([])).toEqual([CONCIERGE]);
  });

  it('leaves an order that already contains Concierge untouched (same ref)', () => {
    const order = ['builtin-cowork', CONCIERGE, 'ext-copy'];
    expect(ensurePinned(order)).toBe(order);
  });

  it('respects the cap: dropping a trailing non-pinned card to make room', () => {
    const full = Array.from({ length: LAUNCHPAD_MAX_ENTRIES }, (_, i) => `card-${i}`);
    const out = ensurePinned(full);
    expect(out).toHaveLength(LAUNCHPAD_MAX_ENTRIES);
    expect(out).toContain(CONCIERGE);
    expect(out[1]).toBe(CONCIERGE);
    expect(out).not.toContain(`card-${LAUNCHPAD_MAX_ENTRIES - 1}`); // trailing card dropped
  });
});

describe('useLaunchpadBar', () => {
  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
    setMock.mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('DEFAULT_BAR_ORDER leads with Cowork (#1) then Concierge (#2)', () => {
    expect(DEFAULT_BAR_ORDER[0]).toBe('builtin-cowork');
    expect(DEFAULT_BAR_ORDER[1]).toBe(CONCIERGE);
  });

  it('seeds with DEFAULT_BAR_ORDER when ConfigStorage has no value', async () => {
    getMock.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toEqual(DEFAULT_BAR_ORDER);
    // Default seed should NOT be written through - that would mask future default-set bumps.
    expect(setMock).not.toHaveBeenCalled();
  });

  it('injects pinned Concierge even into a deliberately empty stored bar', async () => {
    getMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    // Always-available: an empty stored bar still surfaces Concierge.
    expect(result.current.barOrder).toEqual([CONCIERGE]);
  });

  it('loads a customised order and injects Concierge at slot 1', async () => {
    getMock.mockResolvedValueOnce(['ext-quiet-money', 'builtin-cowork']);
    const { result } = renderHook(() => useLaunchpadBar());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toEqual(['ext-quiet-money', CONCIERGE, 'builtin-cowork']);
    // In-memory injection only - the user's stored config is not silently rewritten on load.
    expect(setMock).not.toHaveBeenCalled();
  });

  it('setBarOrder replaces the order, re-asserts the pinned card, and persists', async () => {
    getMock.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.setBarOrder(['ext-copy', 'builtin-cowork']);
    });

    expect(result.current.barOrder).toEqual(['ext-copy', CONCIERGE, 'builtin-cowork']);
    expect(setMock).toHaveBeenCalledWith('launchpad.barOrder', ['ext-copy', CONCIERGE, 'builtin-cowork']);
  });

  it('addToBar appends an unknown id and is a no-op for duplicates', async () => {
    getMock.mockResolvedValueOnce(['builtin-cowork']);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    // Concierge injected on load.
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE]);

    act(() => {
      result.current.addToBar('ext-copy');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE, 'ext-copy']);
    expect(setMock).toHaveBeenLastCalledWith('launchpad.barOrder', ['builtin-cowork', CONCIERGE, 'ext-copy']);

    setMock.mockClear();
    act(() => {
      result.current.addToBar('ext-copy');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE, 'ext-copy']);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('removeFromBar drops a non-pinned id and is a no-op for unknown ids', async () => {
    getMock.mockResolvedValueOnce(['builtin-cowork', 'ext-copy']);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE, 'ext-copy']);

    act(() => {
      result.current.removeFromBar('ext-copy');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE]);
    expect(setMock).toHaveBeenLastCalledWith('launchpad.barOrder', ['builtin-cowork', CONCIERGE]);

    setMock.mockClear();
    act(() => {
      result.current.removeFromBar('does-not-exist');
    });
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE]);
    expect(setMock).not.toHaveBeenCalled();
  });

  it('removeFromBar refuses to remove a pinned card (Concierge stays)', async () => {
    getMock.mockResolvedValueOnce(['builtin-cowork', CONCIERGE, 'ext-copy']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    setMock.mockClear();
    act(() => {
      result.current.removeFromBar(CONCIERGE);
    });

    expect(result.current.barOrder).toContain(CONCIERGE);
    expect(result.current.barOrder).toEqual(['builtin-cowork', CONCIERGE, 'ext-copy']);
    expect(setMock).not.toHaveBeenCalled();
    expect(PINNED_BAR_IDS).toContain(CONCIERGE);
    warn.mockRestore();
  });

  it('resetToDefaults overwrites with the default set (Concierge present)', async () => {
    getMock.mockResolvedValueOnce(['ext-quiet-money']);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.resetToDefaults();
    });
    expect(result.current.barOrder).toEqual(DEFAULT_BAR_ORDER);
    expect(result.current.barOrder).toContain(CONCIERGE);
    expect(setMock).toHaveBeenCalledWith('launchpad.barOrder', DEFAULT_BAR_ORDER);
  });

  it('keeps the bar at the cap when a pinned card is injected into a full bar', async () => {
    const full = Array.from({ length: LAUNCHPAD_MAX_ENTRIES }, (_, i) => `card-${i}`);
    getMock.mockResolvedValueOnce(full);
    const { result } = renderHook(() => useLaunchpadBar());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.barOrder).toHaveLength(LAUNCHPAD_MAX_ENTRIES);
    expect(result.current.barOrder).toContain(CONCIERGE);
    expect(result.current.barOrder).not.toContain(`card-${LAUNCHPAD_MAX_ENTRIES - 1}`);
  });

  it('addToBar refuses to grow the bar beyond LAUNCHPAD_MAX_ENTRIES', async () => {
    const full = Array.from({ length: LAUNCHPAD_MAX_ENTRIES }, (_, i) => `card-${i}`);
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
