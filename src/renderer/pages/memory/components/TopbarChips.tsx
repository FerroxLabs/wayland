/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TopbarChips - 3 inline stat chips showing Memories / Decisions / Wiki counts.
 *
 * Counts come from stats.typeCounts (no-deferment #1).
 * Active chip shows orange-tint bg + orange border.
 * Click chip → onFilterChange(type | null).
 * Arco Popover on hover showing count + delta + sparkline stub.
 */

import React, { useMemo } from 'react';
import { Popover } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { MemoryType } from '@/common/types/memory';
import styles from './TopbarChips.module.css';

// ---------------------------------------------------------------------------
// Stable deterministic sparkline heights based on chip key string hash.
// Avoids Math.random() which causes re-render flicker on every popover open.
// ---------------------------------------------------------------------------

function stableSparkHeights(seed: string): number[] {
  const heights: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < 8; i++) {
    h = ((h << 5) - h + i * 31) | 0;
    heights.push(20 + Math.abs(h % 21));
  }
  return heights;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TopbarChipsProps = {
  typeCounts: Record<MemoryType, number>;
  /** Delta counts for the past week - used in hover popover. */
  weekDeltas?: Partial<Record<MemoryType, number>>;
  /** Active type filter - matches chip type or null for "all". */
  activeType: MemoryType | null;
  onFilterChange: (type: MemoryType | null) => void;
};

type ChipDef = {
  type: MemoryType;
  label: string;
  glyph: string;
  color: string;
};

const CHIPS: ChipDef[] = [
  { type: 'decision', label: 'Memories', glyph: '◆', color: 'var(--color-primary-6, #FF7A45)' },
  { type: 'decision', label: 'Decisions', glyph: '◆', color: 'var(--color-primary-6, #FF7A45)' },
  { type: 'wiki', label: 'Wiki', glyph: '📚', color: '#C084FC' },
];

// Deduplicated chip set: Memories (all), Decisions, Wiki
type ChipEntry = {
  key: string;
  label: string;
  glyph: string;
  color: string;
  type: MemoryType | null;
  count: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TopbarChips: React.FC<TopbarChipsProps> = ({
  typeCounts,
  weekDeltas = {},
  activeType,
  onFilterChange,
}) => {
  const { t } = useTranslation('memory');

  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  // Pre-compute stable sparkline heights per chip key (deterministic, not random).
  const sparkHeights = useMemo<Record<string, number[]>>(
    () => ({
      memories: stableSparkHeights('memories'),
      decisions: stableSparkHeights('decisions'),
      wiki: stableSparkHeights('wiki'),
    }),
    [],
  );

  const chips: ChipEntry[] = [
    {
      key: 'memories',
      label: t('archive.chip.memories', 'Memories'),
      glyph: '◆',
      color: 'var(--color-primary-6, #FF7A45)',
      type: null,
      count: totalCount,
    },
    {
      key: 'decisions',
      label: t('archive.chip.decisions', 'Decisions'),
      glyph: '◆',
      color: 'var(--color-primary-6, #FF7A45)',
      type: 'decision',
      count: typeCounts.decision ?? 0,
    },
    {
      key: 'wiki',
      label: t('archive.chip.wiki', 'Wiki'),
      glyph: '📚',
      color: '#C084FC',
      type: 'wiki',
      count: typeCounts.wiki ?? 0,
    },
  ];

  return (
    <div className={styles.chips} data-testid='topbar-chips'>
      {chips.map((chip) => {
        const isActive = chip.type === activeType;
        const delta = chip.type !== null ? (weekDeltas[chip.type] ?? 0) : 0;

        const popoverContent = (
          <div className={styles.popoverContent} data-testid={`chip-popover-${chip.key}`}>
            <div className={styles.popoverStat}>{chip.count.toLocaleString()}</div>
            {delta > 0 && (
              <div className={styles.popoverDelta}>+{delta} {t('archive.chip.thisWeek', 'this week')}</div>
            )}
            <div className={styles.popoverSparkline}>
              {/* 8-bar sparkline - stable placeholder until real weekDeltas are wired */}
              {(sparkHeights[chip.key] ?? stableSparkHeights(chip.key)).map((ht, i) => (
                <div key={i} className={styles.sparkBar} style={{ height: `${ht}%` }} />
              ))}
            </div>
            <button
              type='button'
              className={styles.popoverLink}
              onClick={() => onFilterChange(chip.type)}
            >
              {t('archive.chip.viewAsFilter', 'View as filter')}
            </button>
          </div>
        );

        return (
          <Popover
            key={chip.key}
            content={popoverContent}
            position='bottom'
            trigger='hover'
          >
            <button
              type='button'
              className={`${styles.chip}${isActive ? ` ${styles.chipActive}` : ''}`}
              onClick={() => onFilterChange(isActive ? null : chip.type)}
              data-testid={`topbar-chip-${chip.key}`}
            >
              <span className={styles.chipGlyph} style={{ color: chip.color }} aria-hidden>
                {chip.glyph}
              </span>
              <span className={styles.chipCount}>{chip.count.toLocaleString()}</span>
              <span className={styles.chipLabel}>{chip.label}</span>
            </button>
          </Popover>
        );
      })}
    </div>
  );
};

export default TopbarChips;
// Re-export CHIPS for use in tests
export { CHIPS };
