/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Checkbox, Typography } from '@arco-design/web-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SkillIndexEntry, SkillSource, SkillVerdict } from '@/common/types/skillTypes';
import { SOURCE_LABEL, STATUS_LABEL } from './SkillRow';

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

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const e of entries) {
      if (e.metadata.category) seen.add(e.metadata.category);
    }
    return Array.from(seen).sort();
  }, [entries]);

  const toggle = <T extends string>(set: Set<T>, value: T, setter: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  return (
    <div
      className='flex flex-col gap-20px py-16px px-14px shrink-0'
      style={{ width: 168, borderRight: '1px solid var(--border-1)' }}
    >
      {/* Sources */}
      <div>
        <Typography.Text
          className='block mb-8px text-11px uppercase font-semibold'
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
        >
          {t('sections.sources', 'Sources')}
        </Typography.Text>
        <div className='flex flex-col gap-6px'>
          {ALL_SOURCES.map((src) => (
            <Checkbox
              key={src}
              checked={selectedSources.has(src)}
              onChange={() => toggle(selectedSources, src, onSourcesChange)}
            >
              <span className='text-12px' style={{ color: 'var(--text-primary)' }}>
                {SOURCE_LABEL[src]}
              </span>
            </Checkbox>
          ))}
        </div>
      </div>

      {/* Verdicts */}
      <div>
        <Typography.Text
          className='block mb-8px text-11px uppercase font-semibold'
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
        >
          {t('sections.status', 'Status')}
        </Typography.Text>
        <div className='flex flex-col gap-6px'>
          {ALL_VERDICTS.map((v) => (
            <Checkbox
              key={v}
              checked={selectedVerdicts.has(v)}
              onChange={() => toggle(selectedVerdicts, v, onVerdictsChange)}
            >
              <span className='text-12px' style={{ color: 'var(--text-primary)' }}>
                {STATUS_LABEL[v]}
              </span>
            </Checkbox>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <Typography.Text
            className='block mb-8px text-11px uppercase font-semibold'
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
          >
            {t('sections.categories', 'Categories')}
          </Typography.Text>
          <div className='flex flex-col gap-6px'>
            {categories.map((cat) => (
              <Checkbox
                key={cat}
                checked={selectedCategories.has(cat)}
                onChange={() => toggle(selectedCategories, cat, onCategoriesChange)}
              >
                <span className='text-12px' style={{ color: 'var(--text-primary)' }}>
                  {cat}
                </span>
              </Checkbox>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterRail;
