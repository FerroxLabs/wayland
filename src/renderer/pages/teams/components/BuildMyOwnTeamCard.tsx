/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BuildMyOwnTeamCard.module.css';

export type BuildMyOwnTeamCardProps = {
  onClick: () => void;
};

const BuildMyOwnTeamCard: React.FC<BuildMyOwnTeamCardProps> = ({ onClick }) => {
  const { t } = useTranslation();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className={styles.card}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-testid='team-card-build-my-own'
      aria-label={t('teams.buildMyOwn.label', { defaultValue: 'Build my own team' })}
    >
      <div className={styles.icon}>
        <Plus size={18} />
      </div>
      <div className={styles.label}>
        {t('teams.buildMyOwn.label', { defaultValue: 'Build my own team' })}
      </div>
      <div className={styles.hint}>
        {t('teams.buildMyOwn.hint', { defaultValue: 'Start from a blank team' })}
      </div>
    </div>
  );
};

export default BuildMyOwnTeamCard;
