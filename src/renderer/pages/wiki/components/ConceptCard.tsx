/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * ConceptCard - card for "Updated this week" column.
 * Flex row: 28×28 icon tile + title + meta + age.
 * Hover: border lightens + 3px orange left edge appears.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WikiConcept } from '@/common/types/memory';
import styles from './ConceptCard.module.css';

const TOPIC_GLYPHS: Record<string, string> = {
  Architecture: '◆',
  Design: '◈',
  Decisions: '◆',
  Process: '◆',
  Patterns: '▲',
  Brand: '◆',
};

function formatAge(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1d';
  return `${days}d`;
}

export type ConceptCardProps = {
  concept: WikiConcept;
  onClick?: (slug: string) => void;
};

export function ConceptCard({ concept, onClick }: ConceptCardProps): React.ReactElement {
  const { t } = useTranslation('memory');
  const glyph = TOPIC_GLYPHS[concept.topicTag] ?? '◆';

  const handleClick = () => onClick?.(concept.slug);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(concept.slug);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      data-testid='concept-card'
      data-slug={concept.slug}
    >
      <div className={`${styles.iconTile} ${styles[`topic${concept.topicTag}`]}`} aria-hidden>
        {glyph}
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{concept.name}</div>
        <div className={styles.meta}>
          {t('wiki.concept.synthesizedFrom', 'Synthesized from {{count}} memories', { count: concept.sourceMemoryIds.length })}
          <span className={styles.topicBadge}>{concept.topicTag}</span>
        </div>
      </div>
      <div className={styles.age}>{formatAge(concept.lastSynthesizedAt)}</div>
    </div>
  );
}
