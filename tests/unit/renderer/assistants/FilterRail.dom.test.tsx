/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

import FilterRail from '../../../../src/renderer/pages/assistants/components/FilterRail';

const defaultProps = {
  query: '',
  onQueryChange: vi.fn(),
  selectedType: 'all' as const,
  onTypeChange: vi.fn(),
  selectedDomain: 'all' as const,
  onDomainChange: vi.fn(),
  typeCounts: { all: 64, team: 8, specialist: 35, builtin: 21 } as Record<
    'all' | 'team' | 'specialist' | 'builtin',
    number
  >,
  domainCounts: {
    all: 64,
    sell: 4,
    write: 6,
    research: 5,
    build: 9,
    run: 7,
    office: 8,
    general: 25,
  },
  onReset: vi.fn(),
  hasActiveFilters: false,
};

describe('FilterRail', () => {
  it('renders type + domain options with counts (team option removed by W2a)', () => {
    render(<FilterRail {...defaultProps} onQueryChange={vi.fn()} />);

    // Type rows - Teams moved to /teams in W2a so the rail no longer offers
    // a 'team' filter on /assistants.
    expect(screen.getByTestId('assistants-filter-type-all')).toBeTruthy();
    expect(screen.queryByTestId('assistants-filter-type-team')).toBeNull();
    expect(screen.getByTestId('assistants-filter-type-specialist')).toBeTruthy();
    expect(screen.getByTestId('assistants-filter-type-builtin')).toBeTruthy();
    // Domain rows: all + 7 categories
    expect(screen.getByTestId('assistants-filter-domain-all')).toBeTruthy();
    expect(screen.getByTestId('assistants-filter-domain-sell')).toBeTruthy();
    expect(screen.getByTestId('assistants-filter-domain-general')).toBeTruthy();
  });

  it('invokes onTypeChange when a type row is clicked', () => {
    const onTypeChange = vi.fn();
    render(<FilterRail {...defaultProps} onTypeChange={onTypeChange} />);

    fireEvent.click(screen.getByTestId('assistants-filter-type-specialist'));
    expect(onTypeChange).toHaveBeenCalledWith('specialist');
  });

  it('invokes onDomainChange when a domain row is clicked', () => {
    const onDomainChange = vi.fn();
    render(<FilterRail {...defaultProps} onDomainChange={onDomainChange} />);

    fireEvent.click(screen.getByTestId('assistants-filter-domain-build'));
    expect(onDomainChange).toHaveBeenCalledWith('build');
  });

  it('invokes onReset only when hasActiveFilters is true', () => {
    const onReset = vi.fn();
    const { rerender } = render(<FilterRail {...defaultProps} onReset={onReset} hasActiveFilters={false} />);

    fireEvent.click(screen.getByTestId('assistants-filter-reset'));
    expect(onReset).not.toHaveBeenCalled();

    rerender(<FilterRail {...defaultProps} onReset={onReset} hasActiveFilters />);
    fireEvent.click(screen.getByTestId('assistants-filter-reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
