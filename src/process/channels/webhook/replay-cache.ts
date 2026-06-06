/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Replay cache for webhook delivery.
 *
 * Returns `true` when an event should be dropped:
 *   - the event ID was seen recently, OR
 *   - the event's wall-clock timestamp is more than 5 minutes off - treating
 *     stale deliveries as suspect (defense against captured-replay attacks
 *     when the platform provides a signed timestamp).
 *
 * Uses an insertion-order Map for an O(1) LRU on capacity.
 */
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 10_000;

export class ReplayCache {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly entries: Map<string, number> = new Map();

  constructor(maxEntries: number = DEFAULT_MAX_ENTRIES, ttlMs: number = DEFAULT_TTL_MS) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * @returns `true` if this event should be DROPPED (already-seen OR stale).
   * On first non-stale visit, records the event ID so future calls return true.
   */
  seen(eventId: string, timestamp?: number, nowMs: number = Date.now()): boolean {
    // Stale timestamp → drop without recording. We never want to extend the
    // replay window by remembering stale IDs.
    if (timestamp !== undefined && Math.abs(nowMs - timestamp) > this.ttlMs) {
      return true;
    }

    this.expire(nowMs);

    if (this.entries.has(eventId)) {
      return true;
    }

    this.entries.set(eventId, nowMs);

    // LRU bound: evict oldest until under cap. Map iteration order is
    // insertion order, so the first key is the oldest.
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }

    return false;
  }

  /**
   * Drop entries older than the TTL. Called inline so the cache self-trims
   * without a background timer.
   */
  private expire(nowMs: number): void {
    const cutoff = nowMs - this.ttlMs;
    for (const [id, ts] of this.entries) {
      if (ts <= cutoff) {
        this.entries.delete(id);
      } else {
        // Map iteration order = insertion order, so once we hit a fresh entry
        // every later entry is also fresh.
        return;
      }
    }
  }

  /** Test seam: returns the current number of tracked IDs. */
  size(): number {
    return this.entries.size;
  }
}
