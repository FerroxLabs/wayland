/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RelatedConcepts } from '@renderer/pages/wiki/components/RelatedConcepts';

afterEach(() => {
  cleanup();
});

describe('RelatedConcepts', () => {
  const concepts = ['TurnElement enum', 'File-per-backend pattern', 'wcore Crate System'];

  it('renders all concept chips', () => {
    render(<RelatedConcepts concepts={concepts} />);
    const chips = screen.getAllByTestId('related-chip');
    expect(chips).toHaveLength(3);
  });

  it('renders correct concept names', () => {
    render(<RelatedConcepts concepts={concepts} />);
    expect(screen.getByText('TurnElement enum')).toBeTruthy();
    expect(screen.getByText('File-per-backend pattern')).toBeTruthy();
    expect(screen.getByText('wcore Crate System')).toBeTruthy();
  });

  it('fires onNavigate with concept name when chip is clicked', () => {
    const onNavigate = vi.fn();
    render(<RelatedConcepts concepts={concepts} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('TurnElement enum'));
    expect(onNavigate).toHaveBeenCalledWith('TurnElement enum');
  });

  it('renders empty state gracefully with no concepts', () => {
    const { container } = render(<RelatedConcepts concepts={[]} />);
    expect(container.querySelector('[data-testid="related-concepts"]')).toBeTruthy();
    expect(screen.queryAllByTestId('related-chip')).toHaveLength(0);
  });
});
