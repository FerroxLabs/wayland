/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * FullPanelShell -- Wave 4 multi-tab chrome that wraps 7 stub tabs. This is
 * the "IJFW is fully active and has memories" surface. Wave 5 replaces the
 * stub tab contents with the real per-tab UIs.
 *
 * Layout:
 *   - Top header bar with breadcrumb (left) and 3 icon buttons (right):
 *     Drop, History, Add memory.
 *   - Arco Tabs row below with: Home, Search, Wiki, Promotions, Drop,
 *     Conflicts, Cross-project.
 *
 * The header Drop button is a shortcut into the Drop tab. History and
 * Add memory are stub buttons until Wave 5 wires them.
 *
 * The active tab is mirrored to the URL via `?tab=<key>` so direct links
 * and browser back/forward survive a refresh.
 */

import { Button, Message, Tabs } from '@arco-design/web-react';
import { Clock, Plus, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import HomeTab from '../tabs/HomeTab';
import SearchTab from '../tabs/SearchTab';
import WikiTab from '../tabs/WikiTab';
import PromotionsTab from '../tabs/PromotionsTab';
import DropTab from '../tabs/DropTab';
import ConflictsTab from '../tabs/ConflictsTab';
import CrossProjectTab from '../tabs/CrossProjectTab';
import styles from './FullPanelShell.module.css';

type MemoryTabKey = 'home' | 'search' | 'wiki' | 'promotions' | 'drop' | 'conflicts' | 'cross_project';

const TAB_KEYS: readonly MemoryTabKey[] = [
  'home',
  'search',
  'wiki',
  'promotions',
  'drop',
  'conflicts',
  'cross_project',
];

const isMemoryTabKey = (value: string | null): value is MemoryTabKey =>
  value !== null && (TAB_KEYS as readonly string[]).includes(value);

const FullPanelShell: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL synchronously to avoid a flash of the default tab.
  const [activeTab, setActiveTab] = useState<MemoryTabKey>(() => {
    const tabParam = searchParams.get('tab');
    return isMemoryTabKey(tabParam) ? tabParam : 'home';
  });

  // Re-sync if the URL changes externally (browser back/forward). Narrow the
  // dep to the specific `tab` query param so unrelated param mutations (slug
  // changes in WikiTab, etc.) don't refire this effect and cause render churn.
  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (isMemoryTabKey(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = useCallback(
    (key: string) => {
      if (!isMemoryTabKey(key)) return;
      setActiveTab(key);
      const next = new URLSearchParams(searchParams);
      next.set('tab', key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleDropClick = useCallback(() => {
    handleTabChange('drop');
  }, [handleTabChange]);

  const handleHistoryClick = useCallback(() => {
    // Wave 5 wires this to the history pane. Stub for now so the button has
    // a tangible behavior the user can observe (and tests can assert).
    Message.info(t('memory.panel.button_history'));
  }, [t]);

  const handleAddClick = useCallback(() => {
    Message.info(t('memory.panel.button_add'));
  }, [t]);

  return (
    <div className={styles.shell} data-testid='memory-full-panel' role='region' aria-label={t('memory.panel.header_breadcrumb')}>
      <header className={styles.header}>
        <h2 className={styles.breadcrumb} data-testid='memory-full-panel-breadcrumb'>
          {t('memory.panel.header_breadcrumb')}
        </h2>
        <div className={styles.headerActions}>
          <Button
            type='text'
            size='small'
            icon={<Upload size={16} aria-hidden />}
            onClick={handleDropClick}
            data-testid='memory-full-panel-button-drop'
          >
            {t('memory.panel.button_drop')}
          </Button>
          <Button
            type='text'
            size='small'
            icon={<Clock size={16} aria-hidden />}
            onClick={handleHistoryClick}
            data-testid='memory-full-panel-button-history'
          >
            {t('memory.panel.button_history')}
          </Button>
          <Button
            type='text'
            size='small'
            icon={<Plus size={16} aria-hidden />}
            onClick={handleAddClick}
            data-testid='memory-full-panel-button-add'
          >
            {t('memory.panel.button_add')}
          </Button>
        </div>
      </header>
      <div className={styles.tabsHost}>
        <Tabs activeTab={activeTab} onChange={handleTabChange} type='line'>
          <Tabs.TabPane key='home' title={t('memory.panel.tab_home')}>
            <HomeTab />
          </Tabs.TabPane>
          <Tabs.TabPane key='search' title={t('memory.panel.tab_search')}>
            <SearchTab />
          </Tabs.TabPane>
          <Tabs.TabPane key='wiki' title={t('memory.panel.tab_wiki')}>
            <WikiTab />
          </Tabs.TabPane>
          <Tabs.TabPane key='promotions' title={t('memory.panel.tab_promotions')}>
            <PromotionsTab />
          </Tabs.TabPane>
          <Tabs.TabPane key='drop' title={t('memory.panel.tab_drop')}>
            <DropTab />
          </Tabs.TabPane>
          <Tabs.TabPane key='conflicts' title={t('memory.panel.tab_conflicts')}>
            <ConflictsTab />
          </Tabs.TabPane>
          <Tabs.TabPane key='cross_project' title={t('memory.panel.tab_cross_project')}>
            <CrossProjectTab />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default FullPanelShell;
