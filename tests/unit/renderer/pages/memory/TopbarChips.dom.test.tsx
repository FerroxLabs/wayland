/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for TopbarChips.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemoryType } from '@/common/types/memory';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, _opts?: Record<string, unknown>) => fallback ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import TopbarChips from '@renderer/pages/memory/components/TopbarChips';

const MOCK_TYPE_COUNTS: Record<MemoryType, number> = {
  decision: 10,
  pattern: 3,
  session: 8,
  observation: 2,
  wiki: 5,
  preference: 1,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TopbarChips', () => {
  it('renders three chips', () => {
    render(
      <TopbarChips
        typeCounts={MOCK_TYPE_COUNTS}
        activeType={null}
        onFilterChange={vi.fn()}
      />,
    );
    const container = screen.getByTestId('topbar-chips');
    expect(container).toBeTruthy();
    // Memories, Decisions, Wiki
    expect(screen.getByTestId('topbar-chip-memories')).toBeTruthy();
    expect(screen.getByTestId('topbar-chip-decisions')).toBeTruthy();
    expect(screen.getByTestId('topbar-chip-wiki')).toBeTruthy();
  });

  it('shows total count on Memories chip', () => {
    render(
      <TopbarChips
        typeCounts={MOCK_TYPE_COUNTS}
        activeType={null}
        onFilterChange={vi.fn()}
      />,
    );
    const memoriesChip = screen.getByTestId('topbar-chip-memories');
    const total = Object.values(MOCK_TYPE_COUNTS).reduce((a, b) => a + b, 0);
    expect(memoriesChip.textContent).toContain(total.toString());
  });

  it('shows decision count on Decisions chip', () => {
    render(
      <TopbarChips
        typeCounts={MOCK_TYPE_COUNTS}
        activeType={null}
        onFilterChange={vi.fn()}
      />,
    );
    const decisionsChip = screen.getByTestId('topbar-chip-decisions');
    expect(decisionsChip.textContent).toContain('10');
  });

  it('calls onFilterChange with "decision" when Decisions chip clicked', () => {
    const onFilterChange = vi.fn();
    render(
      <TopbarChips
        typeCounts={MOCK_TYPE_COUNTS}
        activeType={null}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('topbar-chip-decisions'));
    expect(onFilterChange).toHaveBeenCalledWith('decision');
  });

  it('calls onFilterChange with null when active chip is clicked (deactivate)', () => {
    const onFilterChange = vi.fn();
    render(
      <TopbarChips
        typeCounts={MOCK_TYPE_COUNTS}
        activeType='decision'
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('topbar-chip-decisions'));
    expect(onFilterChange).toHaveBeenCalledWith(null);
  });

  it('applies active class to chip matching activeType', () => {
    render(
      <TopbarChips
        typeCounts={MOCK_TYPE_COUNTS}
        activeType='wiki'
        onFilterChange={vi.fn()}
      />,
    );
    const wikiChip = screen.getByTestId('topbar-chip-wiki');
    // The active chip should have chipActive class applied
    expect(wikiChip.className).toMatch(/chipActive/);
  });
});
