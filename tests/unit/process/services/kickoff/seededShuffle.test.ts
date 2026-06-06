/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { dateKey, hashSeed, seededShuffle, timeBucketFor } from '@process/services/kickoff/seededShuffle';

describe('hashSeed', () => {
  it('is deterministic across calls with the same input', () => {
    expect(hashSeed('hello')).toBe(hashSeed('hello'));
  });

  it('produces different values for different inputs (no trivial collision)', () => {
    const seeds = new Set(['a', 'b', 'install-A:helm:2026-05-23', 'install-B:helm:2026-05-23'].map(hashSeed));
    expect(seeds.size).toBe(4);
  });
});

describe('seededShuffle', () => {
  it('same seed → same order', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(seededShuffle(items, 42)).toEqual(seededShuffle(items, 42));
  });

  it('different seeds → different orders for non-trivial input', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    const orderA = seededShuffle(items, 1).join(',');
    const orderB = seededShuffle(items, 99).join(',');
    expect(orderA).not.toBe(orderB);
  });

  it('does not mutate the input array', () => {
    const items = ['a', 'b', 'c'];
    const snapshot = items.slice();
    seededShuffle(items, 7);
    expect(items).toEqual(snapshot);
  });

  // v0.4.7.1 (E-L-6) - trivial edge cases.
  it('returns [] for an empty input without throwing', () => {
    expect(seededShuffle([], 42)).toEqual([]);
  });

  it('returns the single element unchanged for a length-1 input', () => {
    expect(seededShuffle(['only'], 42)).toEqual(['only']);
  });
});

describe('dateKey', () => {
  it('rolls over at local midnight', () => {
    const tzOffsetMinutes = 0; // pin to UTC for determinism
    const lastTickOfDay = Date.UTC(2026, 4, 23, 23, 59, 59);
    const firstTickOfNextDay = Date.UTC(2026, 4, 24, 0, 0, 0);
    expect(dateKey(lastTickOfDay, tzOffsetMinutes)).toBe('2026-05-23');
    expect(dateKey(firstTickOfNextDay, tzOffsetMinutes)).toBe('2026-05-24');
  });
});

describe('timeBucketFor', () => {
  const at = (h: number) => new Date(2026, 4, 23, h, 0, 0).getTime();

  it('classifies late-night / morning / afternoon / evening by local hour', () => {
    expect(timeBucketFor(at(2))).toBe('late-night');
    expect(timeBucketFor(at(8))).toBe('morning');
    expect(timeBucketFor(at(13))).toBe('afternoon');
    expect(timeBucketFor(at(20))).toBe('evening');
  });

  // v0.4.7.1 (E-L-3) - boundary samples at the four transitions.
  // late-night → morning at hour 6
  it('hour 5 → late-night, hour 6 → morning (late-night boundary)', () => {
    expect(timeBucketFor(at(5))).toBe('late-night');
    expect(timeBucketFor(at(6))).toBe('morning');
  });

  // morning → afternoon at hour 12
  it('hour 11 → morning, hour 12 → afternoon (noon boundary)', () => {
    expect(timeBucketFor(at(11))).toBe('morning');
    expect(timeBucketFor(at(12))).toBe('afternoon');
  });

  // afternoon → evening at hour 18
  it('hour 17 → afternoon, hour 18 → evening (6pm boundary)', () => {
    expect(timeBucketFor(at(17))).toBe('afternoon');
    expect(timeBucketFor(at(18))).toBe('evening');
  });
});
