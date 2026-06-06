/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * W2d - useTeamCostMeter hook tests. Covers:
 *   - Invokes ipcBridge.team.listEvents with the correct args
 *     (teamId + sliding-window `since` + eventType: 'token_usage' filter)
 *   - Aggregates prompt + completion tokens AND cost_estimate_usd
 *   - Re-polls on interval; subsequent calls advance `since` past the
 *     last-seen createdAt so each event is counted exactly once
 *   - Clears the interval on unmount (no leaked timers)
 *
 * Timer strategy: short pollIntervalMs + real timers, to mirror
 * TeamActivityTab's test approach. Fake timers + waitFor compose poorly
 * for hooks that fire async work inside a mount effect.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeamEvent } from '@process/team/types';

const listEventsInvoke = vi.hoisted(() => vi.fn());
vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      listEvents: { invoke: listEventsInvoke },
    },
  },
}));

import { useTeamCostMeter } from '@renderer/hooks/team/useTeamCostMeter';

const makeTokenEvent = (over: Partial<TeamEvent> & { payload?: Record<string, unknown> } = {}): TeamEvent => ({
  id: 'evt-1',
  teamId: 'team-1',
  eventType: 'token_usage',
  createdAt: Date.now(),
  payload: { prompt_tokens: 100, completion_tokens: 50, cost_estimate_usd: 0.01 },
  ...over,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useTeamCostMeter', () => {
  beforeEach(() => {
    listEventsInvoke.mockReset();
  });

  it('calls listEvents with teamId, since (7d window), and token_usage filter', async () => {
    listEventsInvoke.mockResolvedValue([]);

    const before = Date.now();
    renderHook(() => useTeamCostMeter('team-abc', { pollIntervalMs: 10_000 }));

    await waitFor(() => {
      expect(listEventsInvoke).toHaveBeenCalledTimes(1);
    });

    const call = listEventsInvoke.mock.calls[0][0];
    expect(call.teamId).toBe('team-abc');
    expect(call.eventType).toBe('token_usage');
    expect(call.limit).toBe(1000);
    // since should be ~7d ago (within a few hundred ms of the call)
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(call.since).toBeGreaterThanOrEqual(before - sevenDays - 500);
    expect(call.since).toBeLessThanOrEqual(before - sevenDays + 500);
  });

  it('aggregates prompt + completion tokens AND cost_estimate_usd across events', async () => {
    const events: TeamEvent[] = [
      makeTokenEvent({
        id: 'a',
        createdAt: 1000,
        payload: { prompt_tokens: 100, completion_tokens: 50, cost_estimate_usd: 0.012 },
      }),
      makeTokenEvent({
        id: 'b',
        createdAt: 2000,
        payload: { prompt_tokens: 200, completion_tokens: 75, cost_estimate_usd: 0.034 },
      }),
      makeTokenEvent({
        id: 'c',
        createdAt: 3000,
        payload: { prompt_tokens: 50, completion_tokens: 25, cost_estimate_usd: 0.005 },
      }),
    ];
    listEventsInvoke.mockResolvedValue(events);

    const { result } = renderHook(() => useTeamCostMeter('team-1', { pollIntervalMs: 10_000 }));

    await waitFor(() => {
      expect(result.current.totalTokens).toBe(100 + 50 + 200 + 75 + 50 + 25); // 500
    });
    expect(result.current.totalUsd).toBeCloseTo(0.012 + 0.034 + 0.005, 5);
    expect(result.current.isLoading).toBe(false);
  });

  it('treats missing prompt_tokens / completion_tokens / cost_estimate_usd as 0', async () => {
    listEventsInvoke.mockResolvedValue([
      makeTokenEvent({ id: 'a', payload: { prompt_tokens: 100 } }), // no completion, no cost
      makeTokenEvent({ id: 'b', payload: { completion_tokens: 50 } }), // no prompt, no cost
      makeTokenEvent({ id: 'c', payload: {} }), // empty payload
    ]);

    const { result } = renderHook(() => useTeamCostMeter('team-1', { pollIntervalMs: 10_000 }));

    await waitFor(() => {
      expect(result.current.totalTokens).toBe(150);
    });
    expect(result.current.totalUsd).toBe(0);
  });

  it('re-polls on the interval and only counts new events (advances cursor past seen createdAt)', async () => {
    // Use realistic createdAt values inside the sliding window so the
    // initial since-cursor (now - windowMs) actually selects them as
    // "newer" and advances on each poll.
    const now = Date.now();
    const tA = now - 60_000; // 1m ago
    const tB = now - 30_000; // 30s ago
    listEventsInvoke
      .mockResolvedValueOnce([
        makeTokenEvent({
          id: 'a',
          createdAt: tA,
          payload: { prompt_tokens: 100, completion_tokens: 0, cost_estimate_usd: 0.01 },
        }),
      ])
      .mockResolvedValueOnce([
        makeTokenEvent({
          id: 'b',
          createdAt: tB,
          payload: { prompt_tokens: 50, completion_tokens: 50, cost_estimate_usd: 0.02 },
        }),
      ])
      .mockResolvedValue([]);

    const { result } = renderHook(() => useTeamCostMeter('team-1', { pollIntervalMs: 20 }));

    // Wait for both polls to land. We don't gate on the intermediate 100
    // state - at a 20ms interval the second poll can fire faster than
    // waitFor's first tick, which would race the assertion.
    await waitFor(
      () => {
        expect(result.current.totalTokens).toBe(200);
      },
      { timeout: 1500 }
    );
    expect(result.current.totalUsd).toBeCloseTo(0.03, 5);

    // The second invoke's `since` must be the max createdAt seen on the
    // first poll (tA) so event `a` is not double-counted.
    expect(listEventsInvoke.mock.calls.length).toBeGreaterThanOrEqual(2);
    const secondCall = listEventsInvoke.mock.calls[1][0];
    expect(secondCall.since).toBe(tA);
  });

  it('clears the polling interval on unmount (no leaked timer)', async () => {
    listEventsInvoke.mockResolvedValue([]);

    const { unmount } = renderHook(() => useTeamCostMeter('team-1', { pollIntervalMs: 20 }));

    await waitFor(() => {
      expect(listEventsInvoke).toHaveBeenCalled();
    });

    unmount();
    listEventsInvoke.mockClear();

    await sleep(150);
    expect(listEventsInvoke).not.toHaveBeenCalled();
  });

  it('resets totals + cursor when teamId changes', async () => {
    listEventsInvoke.mockResolvedValue([
      makeTokenEvent({ payload: { prompt_tokens: 1000, completion_tokens: 0, cost_estimate_usd: 0.5 } }),
    ]);

    const { result, rerender } = renderHook(({ id }: { id: string }) => useTeamCostMeter(id, { pollIntervalMs: 10_000 }), {
      initialProps: { id: 'team-A' },
    });

    await waitFor(() => {
      expect(result.current.totalTokens).toBe(1000);
    });

    // Switch teams - totals should reset before the next fetch lands.
    act(() => {
      rerender({ id: 'team-B' });
    });
    expect(result.current.totalTokens).toBe(0);
    expect(result.current.totalUsd).toBe(0);

    // And the new fetch should target team-B
    await waitFor(() => {
      const lastCall = listEventsInvoke.mock.calls.at(-1);
      expect(lastCall?.[0]?.teamId).toBe('team-B');
    });
  });
});
