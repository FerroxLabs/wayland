/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// W3b - eligibility predicate tests. Covers the "5 sessions OR 14 days" rule
// + the sessionsRemaining/daysRemaining accountants used by the header CTA.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useStandingEligibility } from '@/renderer/pages/team/hooks/useStandingEligibility';

const NOW = new Date('2026-05-19T00:00:00Z').getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * ONE_DAY_MS;

describe('useStandingEligibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns sensible defaults when team is null', () => {
    const { result } = renderHook(() => useStandingEligibility(null));
    expect(result.current.eligible).toBe(false);
    expect(result.current.sessionsRemaining).toBe(5);
    expect(result.current.daysRemaining).toBe(14);
  });

  it('returns sensible defaults when team is undefined', () => {
    const { result } = renderHook(() => useStandingEligibility(undefined));
    expect(result.current.eligible).toBe(false);
    expect(result.current.sessionsRemaining).toBe(5);
    expect(result.current.daysRemaining).toBe(14);
  });

  it('is eligible when sessionCount >= 5', () => {
    const { result } = renderHook(() =>
      useStandingEligibility({ sessionCount: 5, firstActiveAt: NOW - ONE_DAY_MS })
    );
    expect(result.current.eligible).toBe(true);
    expect(result.current.sessionsRemaining).toBe(0);
  });

  it('is eligible when firstActiveAt is more than 14 days old, regardless of sessionCount', () => {
    const { result } = renderHook(() =>
      useStandingEligibility({ sessionCount: 1, firstActiveAt: NOW - FOURTEEN_DAYS_MS - ONE_DAY_MS })
    );
    expect(result.current.eligible).toBe(true);
    expect(result.current.daysRemaining).toBe(0);
  });

  it('is NOT eligible when both counters are below threshold', () => {
    const { result } = renderHook(() =>
      useStandingEligibility({ sessionCount: 2, firstActiveAt: NOW - 3 * ONE_DAY_MS })
    );
    expect(result.current.eligible).toBe(false);
    expect(result.current.sessionsRemaining).toBe(3);
    // 14 - 3 = 11 days remaining
    expect(result.current.daysRemaining).toBe(11);
  });

  it('computes sessionsRemaining correctly when partially through the count', () => {
    const { result } = renderHook(() =>
      useStandingEligibility({ sessionCount: 4, firstActiveAt: undefined })
    );
    expect(result.current.eligible).toBe(false);
    expect(result.current.sessionsRemaining).toBe(1);
    // firstActiveAt unknown → daysRemaining fall back to 14
    expect(result.current.daysRemaining).toBe(14);
  });

  it('clamps daysRemaining at 0 when firstActiveAt is older than threshold', () => {
    const { result } = renderHook(() =>
      useStandingEligibility({ sessionCount: 0, firstActiveAt: NOW - 100 * ONE_DAY_MS })
    );
    expect(result.current.eligible).toBe(true);
    expect(result.current.daysRemaining).toBe(0);
  });

  it('clamps sessionsRemaining at 0 when sessionCount exceeds threshold', () => {
    const { result } = renderHook(() => useStandingEligibility({ sessionCount: 12, firstActiveAt: undefined }));
    expect(result.current.eligible).toBe(true);
    expect(result.current.sessionsRemaining).toBe(0);
  });
});
