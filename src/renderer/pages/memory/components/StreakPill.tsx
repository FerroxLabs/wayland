/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * StreakPill - "N sessions · M-day streak" pill in the topbar.
 * Renders nothing when stats.streak.sessions === 0.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './StreakPill.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreakPillProps = {
  sessions: number;
  longestDays: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StreakPill: React.FC<StreakPillProps> = ({ sessions, longestDays }) => {
  const { t } = useTranslation('memory');

  if (sessions === 0) return null;

  return (
    <div className={styles.pill} data-testid='streak-pill' title={t('archive.streak.tooltip', 'Streak across all projects')}>
      <span className={styles.fire} aria-hidden>
        🔥
      </span>
      <span className={styles.text}>
        {sessions} {t('archive.streak.sessions', 'sessions')}
        {' · '}
        {longestDays}
        {t('archive.streak.dayStreak', '-day streak')}
      </span>
    </div>
  );
};

export default StreakPill;
