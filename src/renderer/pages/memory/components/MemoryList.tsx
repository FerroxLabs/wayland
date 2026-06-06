/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MemoryList - virtualized list pane for the Memory Archive.
 *
 * Structure (top-to-bottom):
 *   1. Sticky header: search input + type-filter chip strip.
 *   2. Virtuoso list body (react-virtuoso) - renders MemoryRow per entry.
 *   3. Sticky footer: "Showing N of total · scroll for more".
 *
 * K2: Always-visible chevrons are handled by MemoryRow.
 * K4: Virtual scroll via react-virtuoso, no pagination.
 * K6: Empty state with "Clear filters" button.
 * K9: "/" global keydown focuses the search input.
 * S4: referencedBy pill delegated to MemoryRow.
 */

import React, { useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { Virtuoso } from 'react-virtuoso';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';
import MemoryRow from './MemoryRow';
import styles from './MemoryList.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_TYPES: MemoryType[] = [
  'decision',
  'pattern',
  'session',
  'wiki',
  'observation',
  'preference',
];

type ChipDef = {
  type: MemoryType | 'all';
  label: string;
};

const CHIPS: ChipDef[] = [
  { type: 'all', label: 'All' },
  { type: 'decision', label: 'Decisions' },
  { type: 'pattern', label: 'Patterns' },
  { type: 'session', label: 'Sessions' },
  { type: 'wiki', label: 'Wiki' },
  { type: 'observation', label: 'Observations' },
  { type: 'preference', label: 'Preferences' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryListProps = {
  entries: MemoryEntry[];
  total: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
  search: string;
  onSearchChange: (next: string) => void;
  typeFilter: MemoryType[];
  onTypeFilterChange: (next: MemoryType[]) => void;
  typeCounts: Record<MemoryType, number>;
  /** Fired by Virtuoso when user scrolls to the bottom - triggers cursor pagination. */
  onEndReached?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MemoryList: React.FC<MemoryListProps> = ({
  entries,
  total,
  selectedId,
  onSelect,
  search: _search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  typeCounts,
  onEndReached,
}) => {

  const handleChipClick = useCallback(
    (chipType: MemoryType | 'all') => {
      if (chipType === 'all') {
        onTypeFilterChange([]);
        return;
      }
      const next = typeFilter.includes(chipType)
        ? typeFilter.filter((t) => t !== chipType)
        : [...typeFilter, chipType];
      onTypeFilterChange(next);
    },
    [typeFilter, onTypeFilterChange],
  );

  const handleClearFilters = useCallback(() => {
    onTypeFilterChange([]);
    onSearchChange('');
  }, [onTypeFilterChange, onSearchChange]);

  const isAllActive = typeFilter.length === 0;

  const chipLabel = (chip: ChipDef): string => {
    if (chip.type === 'all') {
      const allCount = ALL_TYPES.reduce((sum, t) => sum + (typeCounts[t] ?? 0), 0);
      return `All (${allCount.toLocaleString()})`;
    }
    const count = typeCounts[chip.type] ?? 0;
    return `${chip.label} (${count.toLocaleString()})`;
  };

  const isChipActive = (chip: ChipDef): boolean => {
    if (chip.type === 'all') return isAllActive;
    return typeFilter.includes(chip.type);
  };

  const isEmpty = entries.length === 0;

  return (
    <div className={styles.pane} data-testid='memory-list-pane'>
      {/* Sticky header - search is owned by FullPanelShell filter bar (Fix 6). */}
      <div className={styles.header} data-testid='memory-list-header' />

      {/* List body */}
      <div className={styles.body} data-testid='memory-list-body'>
        {isEmpty ? (
          <div className={styles.emptyState} data-testid='memory-list-empty'>
            <p className={styles.emptyText}>
              No matches. Try removing a filter or clearing the search.
            </p>
            <Button size='mini' onClick={handleClearFilters} data-testid='memory-list-clear-btn'>
              Clear filters
            </Button>
          </div>
        ) : (
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={entries.length}
            endReached={onEndReached}
            itemContent={(index) => {
              const entry = entries[index];
              if (!entry) return null;
              return (
                <MemoryRow
                  key={entry.id}
                  entry={entry}
                  selected={entry.id === selectedId}
                  onClick={onSelect}
                />
              );
            }}
          />
        )}
      </div>

      {/* Sticky footer */}
      <div className={styles.footer} data-testid='memory-list-footer'>
        {isEmpty
          ? 'No results'
          : entries.length < total
            ? `Showing ${entries.length.toLocaleString()} of ${total.toLocaleString()} · scroll for more`
            : `${total.toLocaleString()} entries`}
      </div>
    </div>
  );
};

export default MemoryList;
