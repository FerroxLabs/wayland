/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for TypeDropdown.
 * Click → menu opens → check option → callback fires with correct args.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MemoryType } from '@/common/types/memory';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    // Render Dropdown children inline + droplist directly so panel is always in DOM for tests
    Dropdown: ({
      children,
      droplist,
    }: {
      children: React.ReactNode;
      droplist: React.ReactNode;
    }) => (
      <div>
        {children}
        {droplist}
      </div>
    ),
  };
});

import TypeDropdown from '@renderer/pages/memory/components/TypeDropdown';

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

describe('TypeDropdown', () => {
  it('renders the trigger button', () => {
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={[]}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('type-dropdown-btn')).toBeTruthy();
  });

  it('shows "All types" label when nothing selected', () => {
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={[]}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('type-dropdown-btn').textContent).toContain('All types');
  });

  it('panel renders options when dropdown mock renders droplist', () => {
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={[]}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('type-option-decision')).toBeTruthy();
    expect(screen.getByTestId('type-option-wiki')).toBeTruthy();
  });

  it('clicking a type option calls onFilterChange with that type', () => {
    const onFilterChange = vi.fn();
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={[]}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('type-option-decision'));
    expect(onFilterChange).toHaveBeenCalledWith(['decision']);
  });

  it('clicking a selected type removes it from selection', () => {
    const onFilterChange = vi.fn();
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={['decision']}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('type-option-decision'));
    expect(onFilterChange).toHaveBeenCalledWith([]);
  });

  it('shows clear button when types are selected', () => {
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={['decision']}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('type-clear-btn')).toBeTruthy();
  });

  it('clear button calls onFilterChange with empty array', () => {
    const onFilterChange = vi.fn();
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={['decision', 'wiki']}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('type-clear-btn'));
    expect(onFilterChange).toHaveBeenCalledWith([]);
  });

  it('shows count per type from typeCounts', () => {
    render(
      <TypeDropdown
        typeCounts={MOCK_TYPE_COUNTS}
        selected={[]}
        onFilterChange={vi.fn()}
      />,
    );
    const decisionOption = screen.getByTestId('type-option-decision');
    expect(decisionOption.textContent).toContain('10');
  });
});
