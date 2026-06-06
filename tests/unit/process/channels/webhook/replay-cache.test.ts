/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ReplayCache } from '@process/channels/webhook/replay-cache';

describe('ReplayCache', () => {
  describe('seen', () => {
    it('returns false on first sight and true on the second', () => {
      const cache = new ReplayCache();
      expect(cache.seen('evt-1')).toBe(false);
      expect(cache.seen('evt-1')).toBe(true);
    });

    it('returns true when the supplied timestamp is older than the TTL', () => {
      const cache = new ReplayCache(100, 1000);
      const now = 10_000;
      const stale = now - 2000; // outside the 1s window
      expect(cache.seen('evt-stale', stale, now)).toBe(true);
      // Stale events are not recorded, so a fresh visit still returns false.
      expect(cache.seen('evt-stale', now, now)).toBe(false);
    });

    it('returns true when the timestamp is from the future beyond TTL', () => {
      const cache = new ReplayCache(100, 1000);
      const now = 10_000;
      const future = now + 2000;
      expect(cache.seen('evt-future', future, now)).toBe(true);
    });

    it('accepts a fresh timestamp inside the TTL window', () => {
      const cache = new ReplayCache(100, 1000);
      const now = 10_000;
      const fresh = now - 500;
      expect(cache.seen('evt-fresh', fresh, now)).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('evicts the oldest entry once capacity is exceeded', () => {
      const cache = new ReplayCache(3, 1_000_000);
      cache.seen('a');
      cache.seen('b');
      cache.seen('c');
      expect(cache.size()).toBe(3);
      cache.seen('d'); // forces eviction of 'a'
      expect(cache.size()).toBe(3);
      // Check survivors BEFORE re-adding 'a' - `seen()` mutates on first
      // sight, so checking 'a' first would record it and evict 'b'.
      expect(cache.seen('b')).toBe(true);
      expect(cache.seen('c')).toBe(true);
      expect(cache.seen('d')).toBe(true);
      // 'a' was evicted, so a fresh visit returns false (and re-records it).
      expect(cache.seen('a')).toBe(false);
    });
  });
});
