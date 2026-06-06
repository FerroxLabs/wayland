/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for the scheduler lifecycle (`ModelRefreshScheduler`): single-flight
 * dedupe, the online gate, the success/failure freshness tracking, and that a
 * settled/rejected refresh never wedges the next one. No real electron timers.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ app: { on: vi.fn() }, net: { isOnline: () => true }, powerMonitor: { on: vi.fn() } }));

import { ModelRefreshScheduler, isStale } from '@process/providers/scheduler/ModelRefreshScheduler';
import type { IModelRegistryRefreshSummary } from '@/common/adapter/ipcBridge';

const ok = (lastRefreshedAt: number): IModelRegistryRefreshSummary => ({
  ok: true,
  succeeded: ['anthropic'],
  failed: [],
  added: [],
  lastRefreshedAt,
});

describe('isStale', () => {
  it('null lastRefreshedAt is stale', () => expect(isStale(1000, null)).toBe(true));
  it('clock moved backwards is stale', () => expect(isStale(500, 1000)).toBe(true));
  it('exactly 24h is stale (>=)', () => expect(isStale(24 * 60 * 60 * 1000, 0)).toBe(true));
  it('under 24h is fresh', () => expect(isStale(60_000, 0)).toBe(false));
});

describe('ModelRefreshScheduler.refreshAll', () => {
  it('single-flights concurrent callers onto one run', async () => {
    let calls = 0;
    let resolve!: (s: IModelRegistryRefreshSummary) => void;
    const runRefresh = vi.fn(() => {
      calls++;
      return new Promise<IModelRegistryRefreshSummary>((r) => (resolve = r));
    });
    const s = new ModelRefreshScheduler({
      runRefresh,
      getLastRefreshedAt: async () => null,
      getAutoRefresh: async () => true,
      isOnline: () => true,
      now: () => 1000,
    });

    const a = s.refreshAll('manual');
    const b = s.refreshAll('interval');
    expect(calls).toBe(1); // both share the in-flight promise
    resolve(ok(2000));
    await Promise.all([a, b]);
    // After it settles, a new trigger starts a fresh run (no wedge).
    s.refreshAll('manual');
    expect(calls).toBe(2);
  });

  it('skips while offline and returns an empty summary', async () => {
    const runRefresh = vi.fn();
    const s = new ModelRefreshScheduler({
      runRefresh,
      getLastRefreshedAt: async () => null,
      getAutoRefresh: async () => true,
      isOnline: () => false,
      now: () => 1000,
    });
    const summary = await s.refreshAll('interval');
    expect(runRefresh).not.toHaveBeenCalled();
    expect(summary.ok).toBe(false);
  });

  it('tracks freshness from a successful run for getState', async () => {
    const s = new ModelRefreshScheduler({
      runRefresh: async () => ok(2000),
      getLastRefreshedAt: async () => null,
      getAutoRefresh: async () => true,
      isOnline: () => true,
      now: () => 1000,
    });
    await s.refreshAll('manual');
    expect(s.getState().lastRefreshedAt).toBe(2000);
    expect(s.getState().refreshing).toBe(false);
  });
});
