/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// i18n: return the positional English fallback so assertions read stable copy.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

import React from 'react';
import McpLibraryRail, {
  type McpLibraryRailProps,
  type McpRailSelection,
} from '../../../../../../src/renderer/pages/settings/McpLibrary/components/McpLibraryRail';

const baseCounts: McpLibraryRailProps['counts'] = {
  all: 107,
  installed: 8,
  attention: 2,
  byGroup: { communication: 14, developer: 37 },
};

const renderRail = (overrides: Partial<McpLibraryRailProps> = {}) => {
  const onSelect = vi.fn<(sel: McpRailSelection) => void>();
  const onSearch = vi.fn<(next: string) => void>();
  render(
    <McpLibraryRail
      search=''
      onSearch={onSearch}
      counts={baseCounts}
      active={{ kind: 'all' }}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onSelect, onSearch };
};

describe('McpLibraryRail', () => {
  it('shows the All row with the total count', () => {
    renderRail();
    const allRow = screen.getByTestId('mcp-rail-all');
    expect(allRow).toHaveTextContent('All');
    expect(allRow).toHaveTextContent('107');
  });

  it('renders only category groups with a positive count, in CATEGORY_GROUPS order', () => {
    renderRail();
    // communication (order 1) + developer (order 3) have counts; others do not.
    expect(screen.getByTestId('mcp-rail-category-communication')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-rail-category-developer')).toBeInTheDocument();
    expect(screen.queryByTestId('mcp-rail-category-productivity')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mcp-rail-category-payments')).not.toBeInTheDocument();
  });

  it('emits a category selection when a category row is clicked', () => {
    const { onSelect } = renderRail();
    fireEvent.click(screen.getByTestId('mcp-rail-category-developer'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'category', value: 'developer' });
  });

  it('emits a status selection when Installed is clicked', () => {
    const { onSelect } = renderRail();
    fireEvent.click(screen.getByTestId('mcp-rail-installed'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'status', value: 'installed' });
  });

  it('hides Action needed when attention is 0 and it is not the active selection', () => {
    renderRail({ counts: { ...baseCounts, attention: 0 }, active: { kind: 'all' } });
    expect(screen.queryByTestId('mcp-rail-attention')).not.toBeInTheDocument();
  });

  it('keeps Action needed visible when attention is 0 but it is the active selection', () => {
    renderRail({
      counts: { ...baseCounts, attention: 0 },
      active: { kind: 'status', value: 'attention' },
    });
    expect(screen.getByTestId('mcp-rail-attention')).toBeInTheDocument();
  });
});
