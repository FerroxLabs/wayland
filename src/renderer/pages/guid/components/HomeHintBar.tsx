/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatModifierShortcut } from '@/renderer/utils/platform';
import styles from './HomeHintBar.module.css';

const HIDE_AFTER_CHATS = 5;

export type HomeHintBarProps = {
  chatStartedCount: number;
};

const stripKeyToken = (raw: string): string => raw.replace('{{key}}', '').replace(/\s+/g, ' ').trim();

export const HomeHintBar: React.FC<HomeHintBarProps> = ({ chatStartedCount }) => {
  const { t } = useTranslation();
  if (chatStartedCount >= HIDE_AFTER_CHATS) return null;

  const searchLabel = stripKeyToken(t('guid.hint.search', { key: '' }));
  const backendLabel = stripKeyToken(t('guid.hint.backend', { key: '' }));
  const newChatLabel = stripKeyToken(t('guid.hint.newChat', { key: '' }));

  return (
    <div className={styles.bar} data-testid='home-hint-bar'>
      <span className={styles.hint}>
        {searchLabel}
        <kbd className={styles.kbd}>{formatModifierShortcut('K')}</kbd>
      </span>
      <span className={styles.sep}>·</span>
      <span className={styles.hint}>
        <kbd className={styles.kbd}>Tab</kbd>
        {backendLabel}
      </span>
      <span className={styles.sep}>·</span>
      <span className={styles.hint}>
        <kbd className={styles.kbd}>{formatModifierShortcut('N')}</kbd>
        {newChatLabel}
      </span>
    </div>
  );
};

export default HomeHintBar;
