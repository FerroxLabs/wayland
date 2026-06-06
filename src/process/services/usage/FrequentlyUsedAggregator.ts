/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IUsageEventRepository } from './types';

export type FrequentlyUsedModel = {
  modelId: string;
  useCount: number;
  lastUsedMs: number;
};

export type FrequentlyUsedQueryOptions = {
  /** Lookback in ms from the reference time. Defaults to 7 days. */
  windowMs?: number;
  /** Maximum models to return. Defaults to 5. */
  limit?: number;
  /** Reference time for the lookback window. Defaults to `Date.now()`. */
  nowMs?: number;
};

const DEFAULT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 5;

/**
 * Aggregator for the model-selector "Frequently used" zone.
 *
 * Reads `guid.model_selected` events from the usage_events table, groups by
 * the `modelId` stored on each event's `metadata_json`, and returns the
 * top-N models within a lookback window. The aggregator is pure - it depends
 * only on the repository handed to it. The reference time defaults to
 * `Date.now()` for production but the caller can override `nowMs` for
 * deterministic tests.
 *
 * Events with no `metadata.modelId` (e.g. corrupt rows, or older events from
 * before this field was wired) are silently skipped - telemetry must never
 * break the picker.
 */
export class FrequentlyUsedAggregator {
  constructor(private readonly repo: IUsageEventRepository) {}

  async queryFrequentlyUsedModels(options: FrequentlyUsedQueryOptions = {}): Promise<FrequentlyUsedModel[]> {
    const models = await this.aggregate(options);
    return models
      .toSorted((a, b) => {
        // Higher count first; ties broken by most-recent use so a tied model
        // the user just picked surfaces above one they picked days ago.
        if (b.useCount !== a.useCount) return b.useCount - a.useCount;
        return b.lastUsedMs - a.lastUsedMs;
      })
      .slice(0, options.limit ?? DEFAULT_LIMIT);
  }

  /**
   * Same aggregation as {@link queryFrequentlyUsedModels} but ordered by
   * most-recent use first (ties broken by use count). Backs the "Recently
   * used" zone of the model selector and the smart boot-default resolver
   * (recent → frequent → safe) in `useGuidModelSelection`.
   */
  async queryRecentlyUsedModels(options: FrequentlyUsedQueryOptions = {}): Promise<FrequentlyUsedModel[]> {
    const models = await this.aggregate(options);
    return models
      .toSorted((a, b) => {
        if (b.lastUsedMs !== a.lastUsedMs) return b.lastUsedMs - a.lastUsedMs;
        return b.useCount - a.useCount;
      })
      .slice(0, options.limit ?? DEFAULT_LIMIT);
  }

  /** Group `guid.model_selected` events within the lookback window by modelId. */
  private async aggregate(options: FrequentlyUsedQueryOptions): Promise<FrequentlyUsedModel[]> {
    const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    const nowMs = options.nowMs ?? Date.now();
    const sinceMs = nowMs - windowMs;

    const events = await this.repo.findByType('guid.model_selected', sinceMs);

    type Bucket = { useCount: number; lastUsedMs: number };
    const buckets = new Map<string, Bucket>();
    for (const event of events) {
      const raw = event.metadata?.modelId;
      if (typeof raw !== 'string' || raw.length === 0) continue;
      const bucket = buckets.get(raw);
      if (bucket) {
        bucket.useCount += 1;
        if (event.timestampMs > bucket.lastUsedMs) bucket.lastUsedMs = event.timestampMs;
      } else {
        buckets.set(raw, { useCount: 1, lastUsedMs: event.timestampMs });
      }
    }

    return Array.from(buckets.entries()).map(([modelId, { useCount, lastUsedMs }]) => ({
      modelId,
      useCount,
      lastUsedMs,
    }));
  }
}
