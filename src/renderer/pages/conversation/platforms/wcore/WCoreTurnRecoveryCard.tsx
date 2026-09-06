/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spin } from '@arco-design/web-react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WCoreTurnRecoveryView } from '@process/agent/wcore/protocol';
import cardStyles from '@renderer/components/activation/AcpAuthFailureCard.module.css';

export type WCoreTurnRecoveryCardProps = {
  recovery: WCoreTurnRecoveryView | null;
  loading: boolean;
  actionPending: boolean;
  error?: string;
  onAbandon: () => void;
  onRetry: () => void;
};

const WCoreTurnRecoveryCard: React.FC<WCoreTurnRecoveryCardProps> = ({
  recovery,
  loading,
  actionPending,
  error,
  onAbandon,
  onRetry,
}) => {
  const { t } = useTranslation();
  const titleId = 'wcore-turn-recovery-title';
  const interrupted = recovery?.state === 'interrupted';

  return (
    <section
      className={`${cardStyles.card} flex flex-col gap-12px rd-16px p-16px`}
      role='region'
      aria-labelledby={titleId}
      data-testid='wcore-turn-recovery-card'
    >
      <div className='flex items-start gap-12px'>
        <span className={`${cardStyles.icon} flex items-center text-20px`} aria-hidden='true'>
          {loading ? <Spin size={18} /> : <TriangleAlert size={18} />}
        </span>
        <div className='flex flex-1 flex-col gap-4px min-w-0'>
          <div id={titleId} className='text-14px text-t-primary font-600'>
            {loading ? t('conversation.turnRecovery.checkingTitle') : t('conversation.turnRecovery.title')}
          </div>
          <div className='text-12px text-t-secondary'>
            {loading
              ? t('conversation.turnRecovery.checking')
              : interrupted && recovery.canAbandon
                ? t('conversation.turnRecovery.interrupted')
                : t('conversation.turnRecovery.unavailable')}
          </div>
          {error && <div className='text-12px text-danger'>{error}</div>}
        </div>
      </div>

      {!loading && (
        <div className='flex justify-end gap-8px'>
          <Button size='small' icon={<RefreshCw size={14} />} disabled={actionPending} onClick={onRetry}>
            {t('conversation.turnRecovery.checkAgain')}
          </Button>
          {interrupted && recovery.canAbandon && (
            <Button type='primary' status='danger' size='small' loading={actionPending} onClick={onAbandon}>
              {t('conversation.turnRecovery.endAction')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
};

export default WCoreTurnRecoveryCard;
