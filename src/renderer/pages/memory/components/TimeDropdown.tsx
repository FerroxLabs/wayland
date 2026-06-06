/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TimeDropdown - "All time ▾" filter dropdown.
 *
 * Options: All time / Today / 7 days / 30 days / Custom range.
 * Custom expands to two date pickers via Arco DatePicker.
 */

import React, { useCallback, useState } from 'react';
import { Dropdown, Menu, DatePicker } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import styles from './TimeDropdown.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeWindow =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | { from: Date; to: Date };

export type TimeDropdownProps = {
  selected: TimeWindow;
  onSelect: (window: TimeWindow) => void;
};

type BuiltinOption = {
  key: string;
  value: Exclude<TimeWindow, { from: Date; to: Date }>;
  labelKey: string;
  fallback: string;
};

const BUILTIN_OPTIONS: BuiltinOption[] = [
  { key: 'all', value: 'all', labelKey: 'archive.filter.time.all', fallback: 'All time' },
  { key: 'today', value: 'today', labelKey: 'archive.filter.time.today', fallback: 'Today' },
  { key: '7d', value: '7d', labelKey: 'archive.filter.time.7d', fallback: '7 days' },
  { key: '30d', value: '30d', labelKey: 'archive.filter.time.30d', fallback: '30 days' },
];

const isCustom = (v: TimeWindow): v is { from: Date; to: Date } =>
  typeof v === 'object' && 'from' in v;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimeDropdown: React.FC<TimeDropdownProps> = ({ selected, onSelect }) => {
  const { t } = useTranslation('memory');
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const selectedLabel = isCustom(selected)
    ? `${selected.from.toLocaleDateString()} – ${selected.to.toLocaleDateString()}`
    : BUILTIN_OPTIONS.find((o) => o.value === selected)?.fallback ?? 'All time';

  const handleMenuClick = useCallback(
    (key: string) => {
      if (key === '__custom') {
        setShowCustom((prev) => !prev);
        return;
      }
      setShowCustom(false);
      const opt = BUILTIN_OPTIONS.find((o) => o.key === key);
      if (opt) onSelect(opt.value);
    },
    [onSelect],
  );

  const handleApplyCustom = useCallback(() => {
    if (customFrom && customTo) {
      onSelect({ from: customFrom, to: customTo });
      setShowCustom(false);
    }
  }, [customFrom, customTo, onSelect]);

  const selectedKey = isCustom(selected) ? '__custom' : selected;

  const dropdownContent = (
    <div className={styles.panel} data-testid='time-dropdown-panel'>
      <Menu
        className={styles.menu}
        onClickMenuItem={handleMenuClick}
        selectedKeys={[selectedKey]}
      >
        {BUILTIN_OPTIONS.map((opt) => (
          <Menu.Item key={opt.key} data-testid={`time-option-${opt.key}`}>
            <span className={styles.optLabel}>{t(opt.labelKey, opt.fallback)}</span>
          </Menu.Item>
        ))}
        <Menu.Item key='__custom' data-testid='time-option-custom'>
          <span className={styles.optLabel}>{t('archive.filter.time.custom', 'Custom range…')}</span>
        </Menu.Item>
      </Menu>
      {showCustom && (
        <div className={styles.customWrap} data-testid='time-custom-range'>
          <DatePicker
            size='small'
            placeholder={t('archive.filter.time.from', 'From')}
            onChange={(_, date) => setCustomFrom(date instanceof Date ? date : null)}
            data-testid='time-from-picker'
          />
          <DatePicker
            size='small'
            placeholder={t('archive.filter.time.to', 'To')}
            onChange={(_, date) => setCustomTo(date instanceof Date ? date : null)}
            data-testid='time-to-picker'
          />
          <button
            type='button'
            className={styles.applyBtn}
            onClick={handleApplyCustom}
            disabled={!customFrom || !customTo}
            data-testid='time-apply-btn'
          >
            {t('archive.filter.time.apply', 'Apply')}
          </button>
        </div>
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
        className={`${styles.trigger}${isCustom(selected) || selected !== 'all' ? ` ${styles.triggerActive}` : ''}`}
        data-testid='time-dropdown-btn'
      >
        {selectedLabel}
        <span className={styles.arrow} aria-hidden>▾</span>
      </button>
    </Dropdown>
  );
};

export default TimeDropdown;
