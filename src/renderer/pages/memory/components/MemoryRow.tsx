/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MemoryRow - single memory entry row for the Memory Archive list pane.
 *
 * Pure presentational. Receives a MemoryEntry and fires onClick(id) on
 * click or Enter/Space keypress. Selected state adds an orange left-rail
 * accent. Always-visible chevron (K2: no hidden-on-hover affordance).
 * S4 dereference pill shown when referencedBy > 0.
 */

import React, { useCallback } from 'react';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Diamond,
  RefreshCw,
  Settings,
  Triangle,
  Eye,
} from 'lucide-react';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';
import styles from './MemoryRow.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryRowProps = {
  entry: MemoryEntry;
  selected?: boolean;
  onClick?: (id: string) => void;
};

// ---------------------------------------------------------------------------
// Icon + colour map
// ---------------------------------------------------------------------------

type IconDef = {
  icon: React.ReactElement;
  colorVar: string;
};

const TYPE_ICONS: Record<MemoryType, IconDef> = {
  decision: {
    icon: <Diamond size={18} />,
    colorVar: 'var(--color-primary-6, var(--color-primary))',
  },
  pattern: {
    icon: <Triangle size={18} />,
    colorVar: 'var(--color-warning-6, #d97706)',
  },
  observation: {
    icon: <Eye size={18} />,
    colorVar: 'var(--color-text-3)',
  },
  session: {
    icon: <Clock size={18} />,
    colorVar: 'var(--color-info-6, #3b82f6)',
  },
  wiki: {
    icon: <BookOpen size={18} />,
    colorVar: '#a78bfa',
  },
  preference: {
    icon: <Settings size={18} />,
    colorVar: 'var(--color-text-2)',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const relativeDate = (ts: number): string => {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  const diffMo = Math.floor(diffD / 30);
  return `${diffMo}mo ago`;
};

const projectBasename = (projectPath: string): string => {
  const parts = projectPath.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] ?? projectPath;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MemoryRow: React.FC<MemoryRowProps> = ({ entry, selected = false, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(entry.id);
  }, [onClick, entry.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(entry.id);
      }
    },
    [onClick, entry.id],
  );

  const typeDef = TYPE_ICONS[entry.type];
  const dateLabel = relativeDate(entry.storedAt);
  const project = projectBasename(entry.projectPath);

  return (
    <div
      className={`${styles.row}${selected ? ` ${styles.selected}` : ''}`}
      role='button'
      tabIndex={0}
      aria-selected={selected}
      data-testid={`memory-row-${entry.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Type icon */}
      <div
        className={styles.typeIcon}
        style={{ color: typeDef.colorVar }}
        aria-label={entry.type}
        data-testid={`memory-row-type-icon-${entry.type}`}
      >
        {typeDef.icon}
      </div>

      {/* Title + snippet */}
      <div className={styles.titleBlock}>
        <div className={styles.title} data-testid='memory-row-title'>
          {entry.summary}
        </div>
        <div className={styles.snippet} data-testid='memory-row-snippet'>
          {entry.bodyPreview}
        </div>
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        <span className={styles.metaDate} data-testid='memory-row-date'>
          {dateLabel}
        </span>
        <span className={styles.metaProject} data-testid='memory-row-project'>
          {project}
        </span>
        {entry.tags.length > 0 && (
          <span className={styles.tagBadge} data-testid='memory-row-tag-count'>
            {entry.tags.length}
          </span>
        )}
        {entry.referencedBy > 0 && (
          <span className={styles.refPill} data-testid='memory-row-ref-pill'>
            <RefreshCw size={10} />
            {`Used ${entry.referencedBy}× this week`}
          </span>
        )}
      </div>

      {/* Chevron */}
      <div
        className={`${styles.chevron}${selected ? ` ${styles.chevronSelected}` : ''}`}
        aria-hidden='true'
        data-testid='memory-row-chevron'
      >
        <ChevronRight size={16} />
      </div>
    </div>
  );
};

export default MemoryRow;
