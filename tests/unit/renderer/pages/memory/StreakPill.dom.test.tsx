/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for StreakPill.
 */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback ?? key,
  }),
}));

import { vi } from 'vitest';
import StreakPill from '@renderer/pages/memory/components/StreakPill';

afterEach(() => {
  cleanup();
});

describe('StreakPill', () => {
  it('renders nothing when sessions === 0', () => {
    const { container } = render(<StreakPill sessions={0} longestDays={5} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders pill when sessions > 0', () => {
    render(<StreakPill sessions={30} longestDays={12} />);
    const pill = screen.getByTestId('streak-pill');
    expect(pill).toBeTruthy();
  });

  it('displays session count', () => {
    render(<StreakPill sessions={30} longestDays={12} />);
    const pill = screen.getByTestId('streak-pill');
    expect(pill.textContent).toContain('30');
  });

  it('displays longest days', () => {
    render(<StreakPill sessions={30} longestDays={12} />);
    const pill = screen.getByTestId('streak-pill');
    expect(pill.textContent).toContain('12');
  });

  it('renders nothing with longestDays=0 and sessions=0', () => {
    const { container } = render(<StreakPill sessions={0} longestDays={0} />);
    expect(container.firstChild).toBeNull();
  });
});
