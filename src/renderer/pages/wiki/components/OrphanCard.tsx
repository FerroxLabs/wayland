/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * OrphanCard - card for "Emerging" column.
 * Shows quoted concept name + ref/project counts + Synthesize button.
 */

import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import styles from './OrphanCard.module.css';

export type OrphanCardProps = {
  suggestedName: string;
  citationCount: number;
  projectCount?: number;
  memoryIds: string[];
  onSynthesize: (memoryIds: string[]) => void;
};

export function OrphanCard({
  suggestedName,
  citationCount,
  projectCount = 1,
  memoryIds,
  onSynthesize,
}: OrphanCardProps): React.ReactElement {
  const { t } = useTranslation('memory');
  return (
    <div className={styles.card} data-testid='orphan-card'>
      <div className={styles.title}>&ldquo;{suggestedName}&rdquo;</div>
      <div className={styles.meta}>
        <span>{t('wiki.orphan.references', '{{count}} references', { count: citationCount })}</span>
        <span>
          {projectCount === 1
            ? t('wiki.orphan.projectsSingular', '{{count}} project', { count: projectCount })
            : t('wiki.orphan.projects', '{{count}} projects', { count: projectCount })}
        </span>
      </div>
      <Button
        className={styles.synthBtn}
        onClick={() => onSynthesize(memoryIds)}
        size='mini'
        type='outline'
        data-testid='synthesize-btn'
      >
        {t('wiki.orphan.synthesize', 'Synthesize page →')}
      </Button>
    </div>
  );
}
