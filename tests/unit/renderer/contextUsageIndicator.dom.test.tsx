/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import ContextUsageIndicator from '@/renderer/components/agent/ContextUsageIndicator';
import { DEFAULT_CONTEXT_LIMIT } from '@/renderer/utils/model/modelContextLimits';

/**
 * Regression for #733 (the context-usage indicator half).
 *
 * The reporter's screenshots showed nonsense denominators - "3M / 200K" for
 * Haiku and "1.2M / 1M" - i.e. a `used` figure that EXCEEDS the window. The
 * ring's stroke-dashoffset is `circumference - (pct/100)*circumference`, so a
 * pct > 100 drove the offset NEGATIVE and painted a corrupt arc; a
 * `contextLimit` of 0 divided by zero and produced Infinity/NaN.
 *
 * The ring is now clamped to [0,100] while the popover TEXT stays unclamped and
 * honest (it still reports the real, >100% figure so the overflow is visible
 * rather than hidden).
 */

/** The progress ring is the 2nd <circle> (the 1st is the background track). */
function progressDashoffset(container: HTMLElement): number {
  const circles = container.querySelectorAll('circle');
  const ring = circles[1];
  return Number(ring.getAttribute('stroke-dashoffset'));
}

function circumferenceFor(container: HTMLElement): number {
  const circles = container.querySelectorAll('circle');
  return Number(circles[1].getAttribute('stroke-dasharray'));
}

describe('ContextUsageIndicator - over-limit + zero-limit guards (#733)', () => {
  it('clamps the ring at 100% when usage EXCEEDS the window (the "3M / 200K" case)', () => {
    const { container } = render(
      <ContextUsageIndicator tokenUsage={{ totalTokens: 3_000_000 }} contextLimit={200_000} />
    );

    // pct would be 1500%. Pre-fix the offset went negative (corrupt arc);
    // clamped it must land exactly on "full ring" = 0, and never below.
    const offset = progressDashoffset(container);
    expect(offset).toBe(0);
    expect(offset).toBeGreaterThanOrEqual(0);
  });

  // NOTE: the popover TEXT (which deliberately reports the real, UNCLAMPED
  // percentage - the clamp is cosmetic, applied to the ring only) is not
  // asserted here on purpose: Arco's Popover mounts its content into a portal
  // on hover, and a hover+portal assertion is precisely the load-flaky
  // renderer-dom pattern that has been failing shard runs. The ring assertions
  // below are deterministic and cover the actual regression.

  it('does not divide by zero when the agent reports usage with NO window', () => {
    const { container } = render(<ContextUsageIndicator tokenUsage={{ totalTokens: 50_000 }} contextLimit={0} />);

    const offset = progressDashoffset(container);
    expect(Number.isFinite(offset)).toBe(true);
    expect(Number.isNaN(offset)).toBe(false);

    // Falls back to the documented default window rather than Infinity%.
    const circumference = circumferenceFor(container);
    const expectedPct = (50_000 / DEFAULT_CONTEXT_LIMIT) * 100;
    expect(offset).toBeCloseTo(circumference - (expectedPct / 100) * circumference, 5);
  });

  it('renders a normal under-limit ring unchanged (no clamp side effects)', () => {
    const { container } = render(<ContextUsageIndicator tokenUsage={{ totalTokens: 50_000 }} contextLimit={200_000} />);

    const circumference = circumferenceFor(container);
    const offset = progressDashoffset(container);
    // 25% used -> offset is 75% of the circumference.
    expect(offset).toBeCloseTo(circumference * 0.75, 5);
  });
});
