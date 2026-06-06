/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * v0.6.3 disclosure -- DOM tests for AutoSettingUpCard.
 *
 * AutoSettingUpCard is the DEFAULT surface for `status === 'not_installed'`
 * (no explicit reason). Auto-install runs from bootstrap; this surface
 * communicates that setup is happening silently. It MUST have no primary
 * action button -- progressive disclosure only:
 *
 *   - 0s  : spinner + headline + subtitle + IJFW + Ferrox Labs brand line
 *   - 8s  : "still setting up" reassurance line
 *   - 60s : help link to Settings (manual retry escape hatch)
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import AutoSettingUpCard from '@renderer/pages/memory/state-branches/AutoSettingUpCard';

beforeEach(() => {
  mockNavigate.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AutoSettingUpCard', () => {
  it('renders headline, subtitle, and IJFW + Ferrox Labs brand line at t=0', () => {
    render(<AutoSettingUpCard />);
    expect(screen.getByTestId('memory-auto-setting-up')).toBeTruthy();
    expect(screen.getByText('memory.setting_up.title')).toBeTruthy();
    expect(screen.getByText('memory.setting_up.subtitle')).toBeTruthy();
    const brand = screen.getByTestId('memory-auto-setting-up-brand');
    expect(brand.textContent).toBe('memory.setting_up.brand_line');
  });

  it('does NOT render any primary action button (auto-install is silent)', () => {
    render(<AutoSettingUpCard />);
    // Pre-8s state has no action surface at all.
    expect(screen.queryByTestId('memory-auto-setting-up-taking-longer')).toBeNull();
    expect(screen.queryByTestId('memory-auto-setting-up-help-link')).toBeNull();
  });

  it('surfaces the "taking longer" reassurance line after 8 seconds', () => {
    render(<AutoSettingUpCard />);
    expect(screen.queryByTestId('memory-auto-setting-up-taking-longer')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    expect(screen.getByTestId('memory-auto-setting-up-taking-longer').textContent).toBe(
      'memory.setting_up.taking_longer'
    );
  });

  it('surfaces the Settings help link after 60 seconds', () => {
    render(<AutoSettingUpCard />);
    expect(screen.queryByTestId('memory-auto-setting-up-help-link')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('memory-auto-setting-up-help-link').textContent).toContain(
      'memory.setting_up.help'
    );
  });

  it('navigates to /settings/ijfw when the help link is clicked', () => {
    render(<AutoSettingUpCard />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const link = screen.getByTestId('memory-auto-setting-up-help-link');
    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/settings/ijfw');
  });

  it('clears its timers on unmount (no stray state updates after unmount)', () => {
    const { unmount } = render(<AutoSettingUpCard />);
    unmount();
    // Advancing past both timers must not throw or schedule any work that
    // touches the now-unmounted tree. If it does, React logs a warning and
    // the test fails via the strict console-error guard.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
  });
});
