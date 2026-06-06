/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SkillIndexEntry, SkillSource, SkillVerdict } from '@/common/types/skillTypes';
import { SOURCE_LABEL } from './SkillRow';
import { toDisplayName } from './displayName';

type Props = {
  entries: SkillIndexEntry[];
  selectedSources: Set<SkillSource>;
  selectedVerdicts: Set<SkillVerdict>;
  selectedCategories: Set<string>;
  onSourcesChange: (next: Set<SkillSource>) => void;
  onVerdictsChange: (next: Set<SkillVerdict>) => void;
  onCategoriesChange: (next: Set<string>) => void;
};

const ALL_SOURCES = Object.keys(SOURCE_LABEL) as SkillSource[];
const ALL_VERDICTS: SkillVerdict[] = ['clean', 'review', 'blocked', 'unscanned'];

// Compact, single-line status labels for the rail. The verbose
// "Scanned - no red flags found" used to wrap onto two lines (visible in
// CDP screenshots) and made the rail unreasonably tall. The fuller copy
// lives on the row's shield tooltip and the detail drawer's Security
// section, so users can still see the explanation.
const VERDICT_RAIL_LABEL: Record<SkillVerdict, string> = {
  clean: 'Clean',
  review: 'Needs review',
  blocked: 'Blocked',
  unscanned: 'Unscanned',
};

const CATEGORIES_VISIBLE = 8;

const FilterRail: React.FC<Props> = ({
  entries,
  selectedSources,
  selectedVerdicts,
  selectedCategories,
  onSourcesChange,
  onVerdictsChange,
  onCategoriesChange,
}) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Counts per source / verdict / category, computed once per entries change.
  const counts = useMemo(() => {
    const sources: Record<string, number> = {};
    const verdicts: Record<string, number> = {};
    const categoriesMap = new Map<string, number>();
    for (const e of entries) {
      sources[e.source] = (sources[e.source] ?? 0) + 1;
      const v = e.security?.verdict ?? 'unscanned';
      verdicts[v] = (verdicts[v] ?? 0) + 1;
      if (e.metadata.category) {
        categoriesMap.set(e.metadata.category, (categoriesMap.get(e.metadata.category) ?? 0) + 1);
      }
    }
    const categories = Array.from(categoriesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count }));
    return { sources, verdicts, categories };
  }, [entries]);

  const toggle = <T extends string>(set: Set<T>, value: T, setter: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const visibleCategories = showAllCategories
    ? counts.categories
    : counts.categories.slice(0, CATEGORIES_VISIBLE);
  const hiddenCount = counts.categories.length - CATEGORIES_VISIBLE;

  return (
    <div
      className='flex flex-col gap-18px py-16px px-14px shrink-0'
      style={{ width: 200, borderRight: '1px solid var(--color-border-1)' }}
    >
      {/* SOURCES */}
      <FilterGroup label={t('sections.sources', 'Sources')}>
        {ALL_SOURCES.map((src) => (
          <FilterItem
            key={src}
            active={selectedSources.has(src)}
            label={SOURCE_LABEL[src]}
            count={counts.sources[src] ?? 0}
            onClick={() => toggle(selectedSources, src, onSourcesChange)}
          />
        ))}
      </FilterGroup>

      {/* STATUS */}
      <FilterGroup label={t('sections.status', 'Status')}>
        {ALL_VERDICTS.map((v) => (
          <FilterItem
            key={v}
            active={selectedVerdicts.has(v)}
            label={VERDICT_RAIL_LABEL[v]}
            count={counts.verdicts[v] ?? 0}
            onClick={() => toggle(selectedVerdicts, v, onVerdictsChange)}
          />
        ))}
      </FilterGroup>

      {/* CATEGORIES */}
      {counts.categories.length > 0 ? (
        <FilterGroup label={t('sections.categories', 'Categories')}>
          {visibleCategories.map(({ cat, count }) => (
            <FilterItem
              key={cat}
              active={selectedCategories.has(cat)}
              label={toDisplayName(cat)}
              count={count}
              onClick={() => toggle(selectedCategories, cat, onCategoriesChange)}
            />
          ))}
          {hiddenCount > 0 && !showAllCategories ? (
            <button
              type='button'
              className='text-11px text-left mt-2px bg-transparent border-none cursor-pointer p-0'
              style={{ color: 'var(--brand)' }}
              onClick={() => setShowAllCategories(true)}
            >
              Show all {counts.categories.length} categories →
            </button>
          ) : null}
        </FilterGroup>
      ) : null}
    </div>
  );
};

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div
      className='text-10px uppercase font-semibold mb-8px'
      style={{ color: 'var(--color-text-3)', letterSpacing: '0.08em' }}
    >
      {label}
    </div>
    <div className='flex flex-col gap-2px'>{children}</div>
  </div>
);

type FilterItemProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

const FilterItem: React.FC<FilterItemProps> = ({ label, count, active, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className='flex items-center justify-between text-12px py-5px px-8px rd-6px transition-colors text-left bg-transparent border-none cursor-pointer'
    style={{
      color: active ? 'var(--brand)' : 'var(--text-secondary)',
      background: active ? 'rgba(255,107,53,0.10)' : 'transparent',
      fontWeight: active ? 550 : 400,
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = 'var(--color-fill-1)';
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >
    <span className='truncate min-w-0' title={label}>
      {label}
    </span>
    <span
      className='shrink-0 ml-6px text-11px tabular-nums'
      style={{ color: active ? 'var(--brand)' : 'var(--color-text-3)' }}
    >
      {count.toLocaleString()}
    </span>
  </button>
);

export default FilterRail;
