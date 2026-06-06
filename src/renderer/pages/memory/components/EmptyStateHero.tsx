/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EmptyStateHero - full-area hero shown when archive has zero entries on first run.
 *
 * Contains: search input (44px), headline, subline, 4 import CTA cards.
 * Each CTA card fires an ipcBridge.memory.import.* verb on click.
 * Detected counts come from scanDevDir / etc. on mount via try/catch.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '@arco-design/web-react';
import { memory as memoryBridge } from '@/common/adapter/ipcBridge';
import { useTranslation } from 'react-i18next';
import styles from './EmptyStateHero.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmptyStateHeroProps = {
  onImportComplete?: () => void;
  onSearchChange?: (val: string) => void;
};

type CardDef = {
  key: 'claude-mem' | 'obsidian' | 'drop' | 'dev-scan';
  icon: string;
  titleKey: string;
  titleFallback: string;
  defaultSubline: string;
};

const CARDS: CardDef[] = [
  {
    key: 'claude-mem',
    icon: '🧠',
    titleKey: 'archive.import.claudeMem',
    titleFallback: 'Import claude-mem',
    defaultSubline: 'Click to scan ~/.claude-mem/',
  },
  {
    key: 'obsidian',
    icon: '📓',
    titleKey: 'archive.import.obsidian',
    titleFallback: 'Import Obsidian vault',
    defaultSubline: 'Click to detect vaults',
  },
  {
    key: 'drop',
    icon: '📂',
    titleKey: 'archive.import.dropFolder',
    titleFallback: 'Watch drop folder',
    defaultSubline: '~/Documents/Wayland-Memory/',
  },
  {
    key: 'dev-scan',
    icon: '🔍',
    titleKey: 'archive.import.devScan',
    titleFallback: 'Scan ~/dev',
    defaultSubline: 'Click to scan ~/dev/',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EmptyStateHero: React.FC<EmptyStateHeroProps> = ({ onImportComplete, onSearchChange }) => {
  const { t } = useTranslation('memory');
  const [counts, setCounts] = useState<Partial<Record<CardDef['key'], number>>>({});
  const [loading, setLoading] = useState<Partial<Record<CardDef['key'], boolean>>>({});

  // Probe dev scan on mount for detected counts
  useEffect(() => {
    const probe = async (): Promise<void> => {
      try {
        const result = await memoryBridge.import.scanDevDir.invoke();
        if (result.count > 0) {
          setCounts((prev) => ({ ...prev, 'dev-scan': result.count }));
        }
      } catch {
        // Non-fatal
      }
    };
    void probe();
  }, []);

  const handleCardClick = useCallback(
    async (key: CardDef['key']): Promise<void> => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      try {
        switch (key) {
          case 'claude-mem':
            await memoryBridge.import.claudeMem.invoke();
            break;
          case 'obsidian':
            await memoryBridge.import.obsidianVault.invoke({ vaultPath: '~/Documents' });
            break;
          case 'drop':
            await memoryBridge.import.processDropFolder.invoke();
            break;
          case 'dev-scan':
            await memoryBridge.import.scanDevDir.invoke();
            break;
        }
        onImportComplete?.();
      } catch {
        // Non-fatal - user sees no entries, they can try again
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [onImportComplete],
  );

  return (
    <div className={styles.hero} data-testid='empty-state-hero'>
      {/* Search input */}
      <div className={styles.searchWrap}>
        <Input
          className={styles.searchInput}
          placeholder={t('archive.empty.search', 'Search memories… (type:decision tag:design)')}
          allowClear
          onChange={(val) => onSearchChange?.(val)}
          data-testid='empty-hero-search'
        />
      </div>

      {/* Headline */}
      <h2 className={styles.headline} data-testid='empty-hero-headline'>
        {t('archive.empty.headline', 'Your memory is empty. Let\'s fix that.')}
      </h2>
      <p className={styles.subline} data-testid='empty-hero-subline'>
        {t('archive.empty.subline', 'Import from a source below or add your first memory.')}
      </p>

      {/* Import CTA cards */}
      <div className={styles.cards} data-testid='empty-hero-cards'>
        {CARDS.map((card) => {
          const detectedCount = counts[card.key];
          const isLoading = loading[card.key] === true;
          const subline = detectedCount !== undefined
            ? t('archive.import.detectedEntries', '~{{n}} entries detected', { n: detectedCount })
            : card.defaultSubline;

          return (
            <button
              key={card.key}
              type='button'
              className={styles.card}
              onClick={() => void handleCardClick(card.key)}
              disabled={isLoading}
              data-testid={`empty-import-card-${card.key}`}
            >
              <div className={styles.cardIcon} aria-hidden>
                {card.icon}
              </div>
              <div className={styles.cardTitle}>
                {t(card.titleKey, card.titleFallback)}
              </div>
              <div className={styles.cardSubline}>
                {isLoading ? t('archive.import.importing', 'Importing…') : subline}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmptyStateHero;
