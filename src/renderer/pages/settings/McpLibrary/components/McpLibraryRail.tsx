/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LibraryFilterRail from '@renderer/components/layout/library/LibraryFilterRail';
import LibraryFilterRow from '@renderer/components/layout/library/LibraryFilterRow';
import { CATEGORY_GROUPS, type CategoryGroupId } from '../categories';
import styles from './McpLibraryRail.module.css';

export type McpRailSelection =
  | { kind: 'all' }
  | { kind: 'status'; value: 'installed' | 'attention' }
  | { kind: 'category'; value: CategoryGroupId };

export type McpLibraryRailProps = {
  search: string;
  onSearch: (next: string) => void;
  counts: {
    all: number;
    installed: number;
    attention: number;
    byGroup: Partial<Record<CategoryGroupId, number>>;
  };
  active: McpRailSelection;
  onSelect: (sel: McpRailSelection) => void;
};

const McpLibraryRail: React.FC<McpLibraryRailProps> = ({
  search,
  onSearch,
  counts,
  active,
  onSelect,
}) => {
  const { t } = useTranslation();

  const showAttention = counts.attention > 0 || (active.kind === 'status' && active.value === 'attention');

  return (
    <LibraryFilterRail
      searchValue={search}
      onSearchChange={onSearch}
      searchPlaceholder={t('mcpLibrary.rail.searchPlaceholder', 'Search connectors…')}
      ariaLabel={t('mcpLibrary.rail.ariaLabel', 'MCP filters')}
      testId='mcp-library-rail'
    >
      <div className={styles.group}>
        <LibraryFilterRow
          label={t('mcpLibrary.rail.all', 'All')}
          count={counts.all}
          leadingDot='neutral'
          accent
          active={active.kind === 'all'}
          onClick={() => onSelect({ kind: 'all' })}
          testId='mcp-rail-all'
        />
        <LibraryFilterRow
          label={t('mcpLibrary.rail.installed', 'Installed')}
          count={counts.installed}
          leadingDot='ok'
          accent
          active={active.kind === 'status' && active.value === 'installed'}
          onClick={() => onSelect({ kind: 'status', value: 'installed' })}
          testId='mcp-rail-installed'
        />
        {showAttention ? (
          <LibraryFilterRow
            label={t('mcpLibrary.rail.attention', 'Action needed')}
            count={counts.attention}
            leadingDot='warn'
            accent
            active={active.kind === 'status' && active.value === 'attention'}
            onClick={() => onSelect({ kind: 'status', value: 'attention' })}
            testId='mcp-rail-attention'
          />
        ) : null}
      </div>

      <div className={styles.divider} />
      <div className={styles.groupLabel}>{t('mcpLibrary.rail.categories', 'Categories')}</div>

      <div className={styles.group}>
        {CATEGORY_GROUPS.map((group) => {
          const count = counts.byGroup[group.id] ?? 0;
          if (count <= 0) return null;
          const Icon = group.icon;
          return (
            <LibraryFilterRow
              key={group.id}
              label={t('mcpLibrary.category.' + group.id, group.label)}
              count={count}
              icon={<Icon size={14} />}
              accent
              active={active.kind === 'category' && active.value === group.id}
              onClick={() => onSelect({ kind: 'category', value: group.id })}
              testId={'mcp-rail-category-' + group.id}
            />
          );
        })}
      </div>
    </LibraryFilterRail>
  );
};

export default McpLibraryRail;
