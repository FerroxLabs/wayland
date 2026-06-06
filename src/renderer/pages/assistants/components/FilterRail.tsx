/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input } from '@arco-design/web-react';
import { Search } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import type { AssistantCategory } from '@/common/config/presets/assistantPresets';
import type { AssistantCardType } from './AssistantCard';
import { ASSISTANT_CATEGORY_VALUES } from '../utils/assistantCategory';
import styles from './FilterRail.module.css';

export type FilterRailProps = {
  query: string;
  onQueryChange: (next: string) => void;
  selectedType: AssistantCardType | 'all';
  onTypeChange: (next: AssistantCardType | 'all') => void;
  selectedDomain: AssistantCategory | 'all';
  onDomainChange: (next: AssistantCategory | 'all') => void;
  typeCounts: Record<AssistantCardType | 'all', number>;
  domainCounts: Record<AssistantCategory | 'all', number>;
  onReset: () => void;
  hasActiveFilters: boolean;
};

// T2a.4 - 'team' removed: team launchers moved to /teams.
const TYPE_OPTIONS: ReadonlyArray<{ value: AssistantCardType | 'all'; i18nKey: string; fallback: string }> = [
  { value: 'all', i18nKey: 'assistants.filterRail.type.all', fallback: 'All' },
  { value: 'specialist', i18nKey: 'assistants.filterRail.type.specialist', fallback: 'Specialists' },
  { value: 'builtin', i18nKey: 'assistants.filterRail.type.builtin', fallback: 'Built-ins' },
];

const DOMAIN_FALLBACKS: Record<AssistantCategory, string> = {
  sell: 'Sell',
  write: 'Write',
  research: 'Research',
  build: 'Build',
  run: 'Run',
  office: 'Office',
  general: 'General',
};

const handleRowKey =
  (handler: () => void): React.KeyboardEventHandler<HTMLDivElement> =>
  (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  };

const FilterRail: React.FC<FilterRailProps> = ({
  query,
  onQueryChange,
  selectedType,
  onTypeChange,
  selectedDomain,
  onDomainChange,
  typeCounts,
  domainCounts,
  onReset,
  hasActiveFilters,
}) => {
  const { t } = useTranslation();

  const handleResetKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasActiveFilters) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onReset();
    }
  };

  return (
    <aside className={styles.rail} data-testid='assistants-filter-rail' aria-label={t('assistants.filterRail.aria', { defaultValue: 'Assistant filters' })}>
      <Input
        className={styles.searchInput}
        prefix={<Search size={14} />}
        allowClear
        value={query}
        onChange={(value: string) => onQueryChange(value)}
        placeholder={t('assistants.filterRail.searchPlaceholder', { defaultValue: 'Search assistants' })}
        data-testid='assistants-filter-search'
      />
      <div className={styles.section}>
        <div className={styles.sectionLabel}>{t('assistants.filterRail.typeLabel', { defaultValue: 'Type' })}</div>
        {TYPE_OPTIONS.map((opt) => {
          const active = selectedType === opt.value;
          const count = typeCounts[opt.value] ?? 0;
          return (
            <div
              key={opt.value}
              role='button'
              tabIndex={0}
              data-testid={`assistants-filter-type-${opt.value}`}
              className={classNames(styles.row, active && styles.rowActive)}
              onClick={() => onTypeChange(opt.value)}
              onKeyDown={handleRowKey(() => onTypeChange(opt.value))}
              aria-pressed={active}
            >
              <span>{t(opt.i18nKey, { defaultValue: opt.fallback })}</span>
              <span className={styles.count}>{count}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>{t('assistants.filterRail.domainLabel', { defaultValue: 'Domain' })}</div>
        <div
          role='button'
          tabIndex={0}
          data-testid='assistants-filter-domain-all'
          className={classNames(styles.row, selectedDomain === 'all' && styles.rowActive)}
          onClick={() => onDomainChange('all')}
          onKeyDown={handleRowKey(() => onDomainChange('all'))}
          aria-pressed={selectedDomain === 'all'}
        >
          <span>{t('assistants.filterRail.domain.all', { defaultValue: 'All' })}</span>
          <span className={styles.count}>{domainCounts.all ?? 0}</span>
        </div>
        {ASSISTANT_CATEGORY_VALUES.map((cat) => {
          const active = selectedDomain === cat;
          const count = domainCounts[cat] ?? 0;
          return (
            <div
              key={cat}
              role='button'
              tabIndex={0}
              data-testid={`assistants-filter-domain-${cat}`}
              className={classNames(styles.row, active && styles.rowActive)}
              onClick={() => onDomainChange(cat)}
              onKeyDown={handleRowKey(() => onDomainChange(cat))}
              aria-pressed={active}
            >
              <span>{t(`assistants.filterRail.domain.${cat}`, { defaultValue: DOMAIN_FALLBACKS[cat] })}</span>
              <span className={styles.count}>{count}</span>
            </div>
          );
        })}
      </div>
      <div
        role='button'
        tabIndex={hasActiveFilters ? 0 : -1}
        aria-disabled={!hasActiveFilters}
        className={styles.resetLink}
        onClick={() => hasActiveFilters && onReset()}
        onKeyDown={handleResetKey}
        data-testid='assistants-filter-reset'
      >
        {t('assistants.filterRail.reset', { defaultValue: 'Reset filters' })}
      </div>
    </aside>
  );
};

export default FilterRail;
