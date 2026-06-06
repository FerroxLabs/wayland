/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import styles from './AssistantCard.module.css';

export type BuildMyOwnCardProps = {
  onClick: () => void;
};

const BuildMyOwnCard: React.FC<BuildMyOwnCardProps> = ({ onClick }) => {
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
      className={classNames(styles.card, styles.dashedCard)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-testid='assistant-card-build-my-own'
      aria-label={t('assistants.buildMyOwn.label', { defaultValue: 'Build my own' })}
    >
      <div className={styles.dashedIcon}>
        <Plus size={18} />
      </div>
      <div className={styles.dashedLabel}>
        {t('assistants.buildMyOwn.label', { defaultValue: 'Build my own' })}
      </div>
      <div className={styles.dashedHint}>
        {t('assistants.buildMyOwn.hint', { defaultValue: 'Start from a blank assistant' })}
      </div>
    </div>
  );
};

export default BuildMyOwnCard;
