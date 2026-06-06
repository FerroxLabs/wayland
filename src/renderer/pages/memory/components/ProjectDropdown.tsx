/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ProjectDropdown - "All projects ▾" filter dropdown.
 *
 * Panel shows a search input + list of projects with bar-fill count visual.
 * Close on outside click via Arco Dropdown.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Dropdown, Menu, Input } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { ProjectSummary } from '@/common/types/memory';
import styles from './ProjectDropdown.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectDropdownProps = {
  projects: ProjectSummary[];
  selected: string | null;
  onSelect: (projectId: string | null) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProjectDropdown: React.FC<ProjectDropdownProps> = ({ projects, selected, onSelect }) => {
  const { t } = useTranslation('memory');
  const [search, setSearch] = useState('');

  const maxCount = useMemo(
    () => Math.max(...projects.map((p) => p.count), 1),
    [projects],
  );

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.basename.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  const selectedLabel = useMemo(() => {
    if (!selected) return t('archive.filter.allProjects', 'All projects');
    const proj = projects.find((p) => p.path === selected || p.basename === selected);
    return proj?.basename ?? selected;
  }, [selected, projects, t]);

  const handleMenuClick = useCallback(
    (key: string) => {
      onSelect(key === '__all' ? null : key);
    },
    [onSelect],
  );

  const dropdownContent = (
    <div className={styles.panel} data-testid='project-dropdown-panel'>
      <div className={styles.searchWrap}>
        <Input
          size='small'
          placeholder={t('archive.filter.searchProjects', 'Search projects…')}
          value={search}
          onChange={setSearch}
          allowClear
          data-testid='project-dropdown-search'
        />
      </div>
      <Menu
        className={styles.menu}
        onClickMenuItem={handleMenuClick}
        selectedKeys={selected ? [selected] : ['__all']}
      >
        <Menu.Item key='__all' data-testid='project-option-all'>
          <span className={styles.allOption}>{t('archive.filter.allProjects', 'All projects')}</span>
        </Menu.Item>
        {filtered.map((proj) => {
          const barWidth = Math.round((proj.count / maxCount) * 100);
          return (
            <Menu.Item key={proj.path} data-testid={`project-option-${proj.basename}`}>
              <div className={styles.projectRow}>
                <span className={styles.projectName}>{proj.basename}</span>
                <div className={styles.barWrap}>
                  <div className={styles.barFill} style={{ width: `${barWidth}%` }} />
                </div>
                <span className={styles.projectCount}>{proj.count.toLocaleString()}</span>
              </div>
            </Menu.Item>
          );
        })}
        {filtered.length === 0 && (
          <Menu.Item key='__empty' disabled>
            <span className={styles.emptyLabel}>{t('archive.filter.noProjects', 'No projects found')}</span>
          </Menu.Item>
        )}
      </Menu>
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
        className={`${styles.trigger}${selected ? ` ${styles.triggerActive}` : ''}`}
        data-testid='project-dropdown-btn'
      >
        {selectedLabel}
        <span className={styles.arrow} aria-hidden>▾</span>
      </button>
    </Dropdown>
  );
};

export default ProjectDropdown;
