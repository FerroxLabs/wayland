/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { FrequentlyUsedAggregator } from '@process/services/usage/FrequentlyUsedAggregator';
import type { IUsageEventRepository, UsageEvent } from '@process/services/usage/types';

const makeRepo = (events: UsageEvent[]): IUsageEventRepository => ({
  append: vi.fn(async () => undefined),
  findSince: vi.fn(async () => events),
  findByType: vi.fn(async (_type, sinceMs: number) =>
    events.filter((e) => e.eventType === 'guid.model_selected' && e.timestampMs >= sinceMs)
  ),
  prune: vi.fn(async () => 0),
});

const ev = (id: string, modelId: string | undefined, timestampMs: number): UsageEvent => ({
  id,
  timestampMs,
  eventType: 'guid.model_selected',
  metadata: modelId === undefined ? undefined : { modelId },
});

describe('FrequentlyUsedAggregator', () => {
  it('groups by modelId and orders by use count descending', async () => {
    const repo = makeRepo([
      ev('1', 'claude-sonnet-4-5', 1_000),
      ev('2', 'claude-sonnet-4-5', 2_000),
      ev('3', 'gpt-5', 3_000),
      ev('4', 'claude-sonnet-4-5', 4_000),
      ev('5', 'gemini-3-pro', 5_000),
    ]);
    const agg = new FrequentlyUsedAggregator(repo);
    const top = await agg.queryFrequentlyUsedModels({ nowMs: 6_000, windowMs: 10_000 });
    // Ties on useCount break by most-recent lastUsedMs (gemini at 5_000 > gpt-5 at 3_000).
    expect(top).toEqual([
      { modelId: 'claude-sonnet-4-5', useCount: 3, lastUsedMs: 4_000 },
      { modelId: 'gemini-3-pro', useCount: 1, lastUsedMs: 5_000 },
      { modelId: 'gpt-5', useCount: 1, lastUsedMs: 3_000 },
    ]);
  });

  it('applies the limit', async () => {
    const repo = makeRepo([
      ev('1', 'a', 1_000),
      ev('2', 'b', 2_000),
      ev('3', 'c', 3_000),
      ev('4', 'd', 4_000),
      ev('5', 'e', 5_000),
      ev('6', 'f', 6_000),
    ]);
    const agg = new FrequentlyUsedAggregator(repo);
    const top = await agg.queryFrequentlyUsedModels({ nowMs: 10_000, windowMs: 100_000, limit: 3 });
    expect(top).toHaveLength(3);
  });

  it('breaks ties by most-recent use', async () => {
    const repo = makeRepo([
      ev('1', 'older', 1_000),
      ev('2', 'older', 2_000),
      ev('3', 'newer', 9_000),
      ev('4', 'newer', 10_000),
    ]);
    const agg = new FrequentlyUsedAggregator(repo);
    const top = await agg.queryFrequentlyUsedModels({ nowMs: 11_000, windowMs: 100_000 });
    expect(top[0].modelId).toBe('newer');
    expect(top[1].modelId).toBe('older');
  });

  it('filters by the lookback window via the repository call', async () => {
    const repo = makeRepo([
      ev('1', 'a', 500), // outside the 1_000 ms window from nowMs=2_000
      ev('2', 'b', 1_500),
    ]);
    const agg = new FrequentlyUsedAggregator(repo);
    const top = await agg.queryFrequentlyUsedModels({ nowMs: 2_000, windowMs: 1_000 });
    expect(top.map((m) => m.modelId)).toEqual(['b']);
    expect(repo.findByType).toHaveBeenCalledWith('guid.model_selected', 1_000);
  });

  it('skips events missing metadata.modelId without throwing', async () => {
    const repo = makeRepo([
      ev('1', undefined, 1_000),
      ev('2', 'real-model', 2_000),
      { id: '3', timestampMs: 3_000, eventType: 'guid.model_selected', metadata: { other: 'field' } },
    ]);
    const agg = new FrequentlyUsedAggregator(repo);
    const top = await agg.queryFrequentlyUsedModels({ nowMs: 4_000, windowMs: 10_000 });
    expect(top).toEqual([{ modelId: 'real-model', useCount: 1, lastUsedMs: 2_000 }]);
  });

  it('returns an empty list when no events are present', async () => {
    const repo = makeRepo([]);
    const agg = new FrequentlyUsedAggregator(repo);
    const top = await agg.queryFrequentlyUsedModels({ nowMs: 100, windowMs: 10 });
    expect(top).toEqual([]);
  });

  it('defaults to a 7-day window and limit of 5', async () => {
    const repo = makeRepo([]);
    const agg = new FrequentlyUsedAggregator(repo);
    const nowMs = 1_700_000_000_000;
    await agg.queryFrequentlyUsedModels({ nowMs });
    expect(repo.findByType).toHaveBeenCalledWith('guid.model_selected', nowMs - 7 * 24 * 60 * 60 * 1000);
  });

  describe('queryRecentlyUsedModels', () => {
    it('orders by most-recent use first, regardless of count', async () => {
      const repo = makeRepo([
        // `frequent` was used 3× but its most recent use is older than the
        // single, more-recent use of `justUsed`.
        ev('1', 'frequent', 1_000),
        ev('2', 'frequent', 2_000),
        ev('3', 'frequent', 3_000),
        ev('4', 'justUsed', 9_000),
      ]);
      const agg = new FrequentlyUsedAggregator(repo);
      const recent = await agg.queryRecentlyUsedModels({ nowMs: 10_000, windowMs: 100_000 });
      expect(recent.map((m) => m.modelId)).toEqual(['justUsed', 'frequent']);
    });

    it('breaks lastUsedMs ties by use count', async () => {
      const repo = makeRepo([ev('1', 'twice', 4_000), ev('2', 'twice', 5_000), ev('3', 'once', 5_000)]);
      const agg = new FrequentlyUsedAggregator(repo);
      const recent = await agg.queryRecentlyUsedModels({ nowMs: 6_000, windowMs: 100_000 });
      expect(recent[0].modelId).toBe('twice');
      expect(recent[1].modelId).toBe('once');
    });

    it('applies the limit', async () => {
      const repo = makeRepo([ev('1', 'a', 1_000), ev('2', 'b', 2_000), ev('3', 'c', 3_000), ev('4', 'd', 4_000)]);
      const agg = new FrequentlyUsedAggregator(repo);
      const recent = await agg.queryRecentlyUsedModels({ nowMs: 10_000, windowMs: 100_000, limit: 2 });
      expect(recent.map((m) => m.modelId)).toEqual(['d', 'c']);
    });
  });
});
