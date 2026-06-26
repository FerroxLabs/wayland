/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 / #26 - Claude-style source block: a compact list of search result
 * cards (favicon + title + domain) rendered below web-search tool steps.
 * Renders nothing when `sources` is empty. Clicking a row opens the URL in
 * the platform-appropriate external browser via `openExternalUrl`.
 */

import type { Source } from '@/common/chat/activity/sources';
import { Globe } from '@icon-park/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openExternalUrl } from '@/renderer/utils/platform';
import styles from './SourceBlock.module.css';

type Props = {
  sources: Source[];
  query?: string;
};

const FaviconImg: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={styles.faviconFallback} aria-hidden='true'>
        <Globe size='14' />
      </span>
    );
  }
  return (
    <img
      className={styles.favicon}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      loading='lazy'
    />
  );
};

const SourceRow: React.FC<{ source: Source }> = ({ source }) => {
  const label = source.title || source.domain || source.url || '';

  const handleClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    if (source.url) void openExternalUrl(source.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === 'Enter' || e.key === ' ') && source.url) {
      e.preventDefault();
      void openExternalUrl(source.url);
    }
  };

  return (
    <div
      className={styles.row}
      role={source.url ? 'link' : undefined}
      tabIndex={source.url ? 0 : undefined}
      onClick={source.url ? handleClick : undefined}
      onKeyDown={source.url ? handleKeyDown : undefined}
      aria-label={label}
    >
      {source.favicon ? (
        <FaviconImg src={source.favicon} alt='' />
      ) : (
        <span className={styles.faviconFallback} aria-hidden='true'>
          <Globe size='14' />
        </span>
      )}
      <span className={styles.title}>{label}</span>
      {source.domain && <span className={styles.domain}>{source.domain}</span>}
    </div>
  );
};

const SourceBlock: React.FC<Props> = ({ sources }) => {
  const { t } = useTranslation();
  if (!sources.length) return null;

  return (
    <div className={styles.container} data-testid='source-block'>
      <div className={styles.header}>
        <span className={styles.headerIcon} aria-hidden='true'>
          <Globe size='13' />
        </span>
        <span>
          {t('conversation.observability.sourcesCount', {
            defaultValue: '{{count}} sources',
            count: sources.length,
          })}
        </span>
      </div>
      <div className={styles.list}>
        {sources.map((s, i) => (
          <SourceRow key={s.url ?? i} source={s} />
        ))}
      </div>
    </div>
  );
};

export default SourceBlock;
