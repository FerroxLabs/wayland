/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isStale, REFRESH_INTERVAL_MS } from '@process/providers/scheduler/ModelRefreshScheduler';

describe('isStale', () => {
  const now = 1_000_000_000_000;

  it('treats a never-refreshed catalog (null) as stale', () => {
    expect(isStale(now, null)).toBe(true);
  });

  it('is stale at exactly the 24h threshold (>=)', () => {
    expect(isStale(now, now - REFRESH_INTERVAL_MS)).toBe(true);
    // Just under the threshold is still fresh.
    expect(isStale(now, now - (REFRESH_INTERVAL_MS - 1))).toBe(false);
  });

  it('treats a backwards clock (negative delta) as stale', () => {
    expect(isStale(now, now + 60_000)).toBe(true);
  });

  it('treats a recently-refreshed catalog as fresh', () => {
    expect(isStale(now, now - 60_000)).toBe(false);
    expect(isStale(now, now)).toBe(false);
  });
});
