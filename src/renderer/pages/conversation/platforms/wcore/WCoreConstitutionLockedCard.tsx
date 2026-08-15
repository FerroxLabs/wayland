/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Close, Lock, Undo } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import cardStyles from '@renderer/components/activation/AcpAuthFailureCard.module.css';

export type WCoreConstitutionLockedCardProps = {
  /** The main process's explanation, kept accessible in an expandable detail. */
  rawError?: string;
  /** Open the existing Constitution recovery flow (Settings > Constitution). */
  onOpenRecovery: () => void;
  /** Hide the card. */
  onDismiss: () => void;
};

/**
 * In-thread remedy card shown when a Wayland Core turn cannot start because the
 * Constitution revision authority stored for this machine cannot be unlocked —
 * its ciphertext was sealed by a different installation of the app, so
 * safeStorage here cannot decrypt it.
 *
 * The only action is to open the Constitution recovery flow that already exists
 * in Settings. Nothing here deletes, resets, or rewrites the encrypted
 * Constitution: it is the user's data, and the card exists to hand them the
 * recovery UI, not to discard what it could not read.
 */
const WCoreConstitutionLockedCard: React.FC<WCoreConstitutionLockedCardProps> = ({
  rawError,
  onOpenRecovery,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const titleId = 'wcore-constitution-locked-title';

  return (
    <section
      className={`${cardStyles.card} flex flex-col gap-12px rd-16px p-16px`}
      role='region'
      aria-labelledby={titleId}
    >
      <div className='flex items-start gap-8px'>
        <div className='flex flex-1 flex-col gap-4px min-w-0'>
          <div id={titleId} className='text-14px text-t-primary font-600'>
            {t('conversation.constitutionLocked.title')}
          </div>
          <div className='text-12px text-t-secondary'>{t('conversation.constitutionLocked.explainer')}</div>
        </div>
        <Button
          type='text'
          size='mini'
          icon={<Close />}
          aria-label={t('conversation.constitutionLocked.dismiss')}
          onClick={onDismiss}
        />
      </div>

      <ul className='flex flex-col gap-8px' role='list'>
        <li
          role='listitem'
          data-testid='wcore-constitution-locked-recover'
          className={`${cardStyles.row} ${cardStyles.rowPrimary} flex items-center gap-12px rd-12px p-12px`}
        >
          <span className={`${cardStyles.icon} ${cardStyles.iconPrimary} flex items-center text-20px`}>
            <Lock />
          </span>
          <div className='flex flex-1 flex-col gap-2px min-w-0'>
            <span className='text-13px text-t-primary font-500'>
              {t('conversation.constitutionLocked.recover.label')}
            </span>
            <span className='text-12px text-t-secondary'>{t('conversation.constitutionLocked.recover.sublabel')}</span>
          </div>
          <Button type='primary' size='small' icon={<Undo />} onClick={onOpenRecovery}>
            {t('conversation.constitutionLocked.recover.action')}
          </Button>
        </li>
      </ul>

      {rawError && (
        <details className='text-12px text-t-secondary'>
          <summary className='cursor-pointer select-none'>{t('conversation.constitutionLocked.details')}</summary>
          <div className='mt-8px whitespace-pre-wrap break-words'>{rawError}</div>
        </details>
      )}
    </section>
  );
};

export default WCoreConstitutionLockedCard;
