/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for MemoryList.
 *
 * Covers:
 *   - Renders N rows for N entries.
 *   - Empty entries → empty state rendered, "Clear filters" button calls
 *     both onSearchChange('') and onTypeFilterChange([]).
 *   - Footer shows correct "Showing N of total" text.
 *
 * Note: search input and "/" keyboard handler were moved to FullPanelShell (Fix 6).
 * Those behaviours are no longer tested here.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// react-virtuoso: in jsdom there is no layout engine so Virtuoso renders
// nothing by default. Replace with a simple flat list for tests.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    totalCount,
    itemContent,
  }: {
    totalCount: number;
    itemContent: (index: number) => React.ReactNode;
  }) => (
    <div data-testid='virtuoso-root'>
      {Array.from({ length: totalCount }, (_, i) => (
        <div key={i}>{itemContent(i)}</div>
      ))}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: `entry-${Math.random().toString(36).slice(2)}`,
  type: 'decision',
  project: 'wayland-app',
  projectPath: '/dev/wayland-app',
  summary: 'A memory',
  bodyPreview: 'Body text here.',
  tags: [],
  storedAt: Date.now() - 60_000,
  sourcePath: '/dev/wayland-app/README.md',
  sourceLine: 1,
  referencedBy: 0,
  promotionScore: 50,
  ...overrides,
});

const ALL_TYPES: MemoryType[] = [
  'decision',
  'pattern',
  'session',
  'wiki',
  'observation',
  'preference',
];

const makeTypeCounts = (): Record<MemoryType, number> =>
  Object.fromEntries(ALL_TYPES.map((t, i) => [t, (i + 1) * 10])) as Record<MemoryType, number>;

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import MemoryList from '@renderer/pages/memory/components/MemoryList';

// ---------------------------------------------------------------------------
// Default props helper
// ---------------------------------------------------------------------------

type ListProps = React.ComponentProps<typeof MemoryList>;

const makeDefaultProps = (overrides: Partial<ListProps> = {}): ListProps => ({
  entries: [],
  total: 0,
  selectedId: undefined,
  onSelect: vi.fn(),
  search: '',
  onSearchChange: vi.fn(),
  typeFilter: [],
  onTypeFilterChange: vi.fn(),
  typeCounts: makeTypeCounts(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MemoryList', () => {
  it('renders N rows for N entries', () => {
    const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' }), makeEntry({ id: 'c' })];
    render(<MemoryList {...makeDefaultProps({ entries, total: 3 })} />);
    expect(screen.getByTestId('memory-row-a')).toBeTruthy();
    expect(screen.getByTestId('memory-row-b')).toBeTruthy();
    expect(screen.getByTestId('memory-row-c')).toBeTruthy();
  });

  it('renders the empty state when entries is empty', () => {
    render(<MemoryList {...makeDefaultProps()} />);
    expect(screen.getByTestId('memory-list-empty')).toBeTruthy();
  });

  it('"Clear filters" button calls onTypeFilterChange([]) and onSearchChange("")', () => {
    const onTypeFilterChange = vi.fn();
    const onSearchChange = vi.fn();
    render(
      <MemoryList
        {...makeDefaultProps({ onTypeFilterChange, onSearchChange, search: 'foo', typeFilter: ['decision'] })}
      />,
    );
    fireEvent.click(screen.getByTestId('memory-list-clear-btn'));
    expect(onTypeFilterChange).toHaveBeenCalledWith([]);
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('does not render the empty state when entries is non-empty', () => {
    const entries = [makeEntry()];
    render(<MemoryList {...makeDefaultProps({ entries, total: 1 })} />);
    expect(screen.queryByTestId('memory-list-empty')).toBeNull();
  });

  it('shows the footer with correct "Showing N of total" text', () => {
    const entries = [makeEntry(), makeEntry()];
    render(<MemoryList {...makeDefaultProps({ entries, total: 100 })} />);
    const footer = screen.getByTestId('memory-list-footer');
    expect(footer.textContent).toContain('2');
    expect(footer.textContent).toContain('100');
  });

  it('does not render a search input (search is owned by FullPanelShell)', () => {
    // Fix 6: search input was moved to FullPanelShell; MemoryList has no search input.
    render(<MemoryList {...makeDefaultProps()} />);
    expect(screen.queryByTestId('memory-list-search')).toBeNull();
  });

});
