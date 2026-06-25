/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

import StatusFooter from '@/renderer/components/chat/StatusFooter';

describe('StatusFooter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders only a spacer when not processing', () => {
    render(<StatusFooter isProcessing={false} />);
    expect(screen.queryByTestId('status-footer')).toBeNull();
  });

  it('shows the live footer with a dot-pulse while processing', () => {
    render(<StatusFooter isProcessing={true} />);
    expect(screen.getByTestId('status-footer')).toBeTruthy();
    // First phrase from the rotation is visible.
    expect(screen.getByText('Thinking it through...')).toBeTruthy();
  });

  it('shows elapsed seconds after 2s', () => {
    render(<StatusFooter isProcessing={true} />);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByText('2s')).toBeTruthy();
  });

  it('rotates the phrase every 3 seconds', () => {
    render(<StatusFooter isProcessing={true} />);
    expect(screen.getByText('Thinking it through...')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Working the problem...')).toBeTruthy();
  });

  it('fades then hides when processing stops', () => {
    const { rerender } = render(<StatusFooter isProcessing={true} />);
    expect(screen.getByTestId('status-footer')).toBeTruthy();
    rerender(<StatusFooter isProcessing={false} />);
    // During fade it is still mounted with data-fading=true.
    expect(screen.getByTestId('status-footer').getAttribute('data-fading')).toBe('true');
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByTestId('status-footer')).toBeNull();
  });
});
