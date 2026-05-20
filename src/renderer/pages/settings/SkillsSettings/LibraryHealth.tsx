/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SkillStats } from '@/common/adapter/ipcBridge';

type Props = {
  stats: SkillStats | null;
};

const LibraryHealth: React.FC<Props> = ({ stats }) => {
  const { t } = useTranslation('skills');

  const total = stats?.total ?? 0;
  const pinned = stats?.pinned ?? 0;
  const flagged = stats?.flagged ?? 0;
  const sourceCount = stats ? Object.keys(stats.bySource).length : 0;

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
      <Card className='text-center' bodyStyle={{ padding: '16px' }}>
        <div className='text-24px font-bold' style={{ color: 'var(--brand)' }}>
          {total}
        </div>
        <div className='text-12px mt-4px' style={{ color: 'var(--text-secondary)' }}>
          {t('filters.allSources', 'All skills')}
        </div>
      </Card>

      <Card className='text-center' bodyStyle={{ padding: '16px' }}>
        <div className='text-24px font-bold' style={{ color: 'var(--brand)' }}>
          {pinned}
        </div>
        <div className='text-12px mt-4px' style={{ color: 'var(--text-secondary)' }}>
          {t('actions.pin', 'Pinned')}
        </div>
      </Card>

      <Card className='text-center' bodyStyle={{ padding: '16px' }}>
        <div
          className='text-24px font-bold'
          style={{ color: flagged > 0 ? 'var(--danger)' : 'var(--success)' }}
        >
          {flagged}
        </div>
        <div className='text-12px mt-4px' style={{ color: 'var(--text-secondary)' }}>
          {t('status.review', 'Flagged')}
        </div>
      </Card>

      <Card className='text-center' bodyStyle={{ padding: '16px' }}>
        <div className='text-24px font-bold' style={{ color: 'var(--brand)' }}>
          {sourceCount}
        </div>
        <div className='text-12px mt-4px' style={{ color: 'var(--text-secondary)' }}>
          {t('filters.allSources', 'Sources')}
        </div>
      </Card>
    </div>
  );
};

export default LibraryHealth;
