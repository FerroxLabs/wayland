/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SourcesBlock - surface card with a list of source memories backing a wiki concept.
 * Shows first 3 by default; "Show all N ↓" expands.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SourcesBlock.module.css';

export type SourceEntry = {
  memoryId: string;
  type: 'Decision' | 'Memory' | 'Plan' | 'Feedback';
  project: string;
  date: string;
  title: string;
  quote: string;
};

export type SourcesBlockProps = {
  sources: SourceEntry[];
  onOpenMemory?: (memoryId: string) => void;
};

const TYPE_BADGE_CLASSES: Record<SourceEntry['type'], string> = {
  Decision: styles.badgeDecision,
  Memory: styles.badgeMemory,
  Plan: styles.badgePlan,
  Feedback: styles.badgeFeedback,
};

const INITIAL_SHOW = 3;

export function SourcesBlock({ sources, onOpenMemory }: SourcesBlockProps): React.ReactElement {
  const { t } = useTranslation('memory');
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? sources : sources.slice(0, INITIAL_SHOW);
  const hiddenCount = sources.length - INITIAL_SHOW;

  return (
    <div className={styles.block} data-testid='sources-block'>
      {visible.map((src) => (
        <div key={src.memoryId} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={`${styles.typeBadge} ${TYPE_BADGE_CLASSES[src.type]}`}>
              ◆ {src.type}
            </span>
            <span className={styles.date}>{src.date}</span>
            <span className={styles.project}>{src.project}</span>
          </div>
          <div className={styles.title}>{src.title}</div>
          {src.quote && <div className={styles.quote}>{src.quote}</div>}
          <a
            className={styles.openLink}
            href='#'
            onClick={(e) => {
              e.preventDefault();
              onOpenMemory?.(src.memoryId);
            }}
          >
            {t('wiki.detail.openMemory', 'Open memory →')}
          </a>
        </div>
      ))}

      {!expanded && hiddenCount > 0 && (
        <div className={styles.moreRow}>
          <span>
            {hiddenCount === 1
              ? t('wiki.detail.hiddenSourcesOne', '{{count}} more source memory', { count: hiddenCount })
              : t('wiki.detail.hiddenSourcesOther', '{{count}} more source memories', { count: hiddenCount })}
          </span>
          <button
            className={styles.showMoreBtn}
            onClick={() => setExpanded(true)}
            data-testid='show-all-sources-btn'
          >
            {t('wiki.detail.showAll', 'Show all {{count}} ↓', { count: sources.length })}
          </button>
        </div>
      )}
    </div>
  );
}
