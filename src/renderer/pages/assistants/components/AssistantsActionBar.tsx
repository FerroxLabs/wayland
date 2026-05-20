/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../AssistantsLibraryPage.module.css';

export type AssistantsActionBarProps = {
  totalCount: number;
  onBuildMyOwn: () => void;
};

const AssistantsActionBar: React.FC<AssistantsActionBarProps> = ({ totalCount, onBuildMyOwn }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.actionBar} data-testid='assistants-action-bar'>
      <h1 className={styles.actionBarTitle}>
        {t('assistants.title', { defaultValue: 'Assistants' })}
        <span className={styles.actionBarCount} data-testid='assistants-total-count'>
          {t('assistants.totalCount', { count: totalCount, defaultValue: '{{count}} assistants' })}
        </span>
      </h1>
      <Button
        type='primary'
        icon={<Plus size={14} />}
        onClick={onBuildMyOwn}
        data-testid='assistants-build-my-own-cta'
      >
        {t('assistants.buildMyOwn.cta', { defaultValue: 'Build my own' })}
      </Button>
    </div>
  );
};

export default AssistantsActionBar;
