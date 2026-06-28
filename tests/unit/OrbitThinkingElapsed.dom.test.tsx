/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import React from 'react';

// CSS module + i18n + glyph are irrelevant to the timer behaviour under test.
vi.mock('@/renderer/components/chat/observability/OrbitThinking.module.css', () => ({
  default: {
    container: 'container',
    activeStep: 'activeStep',
    label: 'label',
    labelReal: 'labelReal',
    elapsed: 'elapsed',
  },
}));
vi.mock('@/renderer/components/chat/observability/OrbitGlyph', () => ({ default: () => null }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key }),
}));

import OrbitThinking from '@/renderer/components/chat/observability/OrbitThinking';

const FIXED_NOW = 1_700_000_000_000;

describe('OrbitThinking elapsed timer (#288)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows TOTAL elapsed from the turn start, not from mount', () => {
    // Turn started 65s before this (late) mount - emulates returning to a chat
    // whose task is still running.
    const { container } = render(<OrbitThinking isProcessing startTime={FIXED_NOW - 65_000} />);
    expect(container.textContent).toContain('65s');
  });

  it('does not reset to 0 when the component remounts mid-turn (chat switch)', () => {
    const start = FIXED_NOW - 30_000;
    const first = render(<OrbitThinking isProcessing startTime={start} />);
    expect(first.container.textContent).toContain('30s');
    // Switch away (unmount) and back (fresh mount) at the same wall-clock time.
    first.unmount();
    const second = render(<OrbitThinking isProcessing startTime={start} />);
    // Still 30s after remount - the timer is anchored to the turn start, not the
    // (new) mount time, so it does not restart from 0.
    expect(second.container.textContent).toContain('30s');
  });

  it('ticks forward once per second while processing', () => {
    const { container } = render(<OrbitThinking isProcessing startTime={FIXED_NOW - 10_000} />);
    expect(container.textContent).toContain('10s');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.textContent).toContain('12s');
  });

  it('renders no elapsed timer when idle', () => {
    const { container } = render(<OrbitThinking isProcessing={false} startTime={FIXED_NOW - 99_000} />);
    expect(container.textContent ?? '').not.toMatch(/\d+s/);
  });
});
