/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TypeDropdown - "All types ▾" multi-select filter dropdown.
 *
 * Checkboxes per type with 8px colored square dot + label + count from stats.typeCounts.
 * onFilterChange fires with updated MemoryType array.
 */

import React, { useCallback } from 'react';
import { Dropdown } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { MemoryType } from '@/common/types/memory';
import styles from './TypeDropdown.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TypeDropdownProps = {
  typeCounts: Record<MemoryType, number>;
  selected: MemoryType[];
  onFilterChange: (types: MemoryType[]) => void;
};

type TypeDef = {
  type: MemoryType;
  label: string;
  color: string;
  glyph: string;
  labelKey: string;
};

const TYPE_DEFS: TypeDef[] = [
  { type: 'decision', label: 'Decision', labelKey: 'archive.type.decision', color: '#FF7A45', glyph: '◆' },
  { type: 'pattern', label: 'Pattern', labelKey: 'archive.type.pattern', color: '#5EEAD4', glyph: '▲' },
  { type: 'session', label: 'Session', labelKey: 'archive.type.session', color: '#7DD3FC', glyph: '⏱' },
  { type: 'observation', label: 'Observation', labelKey: 'archive.type.observation', color: '#94A3B8', glyph: '◯' },
  { type: 'wiki', label: 'Wiki', labelKey: 'archive.type.wiki', color: '#C084FC', glyph: '📚' },
  { type: 'preference', label: 'Preference', labelKey: 'archive.type.preference', color: '#FCD34D', glyph: '⚙' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TypeDropdown: React.FC<TypeDropdownProps> = ({ typeCounts, selected, onFilterChange }) => {
  const { t } = useTranslation('memory');

  const toggleType = useCallback(
    (type: MemoryType) => {
      const next = selected.includes(type)
        ? selected.filter((s) => s !== type)
        : [...selected, type];
      onFilterChange(next);
    },
    [selected, onFilterChange],
  );

  const selectedLabel =
    selected.length === 0
      ? t('archive.filter.allTypes', 'All types')
      : selected.length === 1
        ? (TYPE_DEFS.find((d) => d.type === selected[0])?.label ?? selected[0])
        : `${selected.length} ${t('archive.filter.typesSelected', 'types')}`;

  const dropdownContent = (
    <div className={styles.panel} data-testid='type-dropdown-panel'>
      {TYPE_DEFS.map((def) => {
        const isChecked = selected.includes(def.type);
        const count = typeCounts[def.type] ?? 0;

        return (
          <button
            key={def.type}
            type='button'
            className={`${styles.row}${isChecked ? ` ${styles.rowChecked}` : ''}`}
            onClick={() => toggleType(def.type)}
            data-testid={`type-option-${def.type}`}
          >
            <span
              className={styles.dot}
              style={{ background: def.color }}
              aria-hidden
            />
            <span className={styles.typeLabel}>{t(def.labelKey, def.label)}</span>
            <span className={styles.typeCount}>{count.toLocaleString()}</span>
            <span className={styles.check} aria-hidden>{isChecked ? '✓' : ''}</span>
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type='button'
          className={styles.clearBtn}
          onClick={() => onFilterChange([])}
          data-testid='type-clear-btn'
        >
          {t('archive.filter.clearAll', 'Clear all')}
        </button>
      )}
    </div>
  );

  return (
    <Dropdown
      droplist={dropdownContent}
      trigger='click'
      position='bl'
    >
      <button
        type='button'
        className={`${styles.trigger}${selected.length > 0 ? ` ${styles.triggerActive}` : ''}`}
        data-testid='type-dropdown-btn'
      >
        {selectedLabel}
        <span className={styles.arrow} aria-hidden>▾</span>
      </button>
    </Dropdown>
  );
};

export default TypeDropdown;
