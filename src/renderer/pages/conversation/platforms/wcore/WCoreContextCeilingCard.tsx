/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Close, Refresh, SwitchThemes } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import cardStyles from '@renderer/components/activation/AcpAuthFailureCard.module.css';
import WCoreModelSelector from './WCoreModelSelector';
import type { WCoreModelSelection } from './useWCoreModelSelection';

export type WCoreContextCeilingCardProps = {
  conversationId: string;
  /** Drives the embedded model switcher (same selection the header picker uses). */
  modelSelection: WCoreModelSelection;
  /** Display name of the model whose context window was exceeded. */
  model?: string;
  /** The engine's raw error string, kept accessible in an expandable detail. */
  rawError?: string;
  /** Re-run the turn that hit the ceiling (on the now-selected model). */
  onRetry: () => void;
  /** Hide the card. */
  onDismiss: () => void;
};

/**
 * In-thread remedy card shown when a Wayland Core run is stopped because the
 * request exceeded the model's context-window ceiling and compaction could not
 * shrink it further (issue #615). It leads with the actionable fix — switch to a
 * model with a larger context window (via the same picker the header uses), then
 * retry the failed turn — while keeping the raw engine error accessible below.
 *
 * Presentational only: the model switch runs through the shared modelSelection
 * (which stops the engine and persists the new model); retry/dismiss are callbacks.
 */
const WCoreContextCeilingCard: React.FC<WCoreContextCeilingCardProps> = ({
  conversationId,
  modelSelection,
  model,
  rawError,
  onRetry,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const titleId = 'wcore-context-ceiling-title';

  return (
    <section
      className={`${cardStyles.card} flex flex-col gap-12px rd-16px p-16px`}
      role='region'
      aria-labelledby={titleId}
    >
      <div className='flex items-start gap-8px'>
        <div className='flex flex-1 flex-col gap-4px min-w-0'>
          <div id={titleId} className='text-14px text-t-primary font-600'>
            {model ? t('conversation.contextCeiling.title', { model }) : t('conversation.contextCeiling.titleNoModel')}
          </div>
          <div className='text-12px text-t-secondary'>{t('conversation.contextCeiling.explainer')}</div>
        </div>
        <Button
          type='text'
          size='mini'
          icon={<Close />}
          aria-label={t('conversation.contextCeiling.dismiss')}
          onClick={onDismiss}
        />
      </div>

      <ul className='flex flex-col gap-8px' role='list'>
        <li
          role='listitem'
          data-testid='wcore-context-ceiling-switch'
          className={`${cardStyles.row} flex items-center gap-12px rd-12px p-12px`}
        >
          <span className={`${cardStyles.icon} flex items-center text-20px`}>
            <SwitchThemes />
          </span>
          <div className='flex flex-1 flex-col gap-2px min-w-0'>
            <span className='text-13px text-t-primary font-500'>{t('conversation.contextCeiling.switch.label')}</span>
            <span className='text-12px text-t-secondary'>{t('conversation.contextCeiling.switch.sublabel')}</span>
          </div>
          <WCoreModelSelector selection={modelSelection} conversationId={conversationId} />
        </li>

        <li
          role='listitem'
          data-testid='wcore-context-ceiling-retry'
          className={`${cardStyles.row} ${cardStyles.rowPrimary} flex items-center gap-12px rd-12px p-12px`}
        >
          <span className={`${cardStyles.icon} ${cardStyles.iconPrimary} flex items-center text-20px`}>
            <Refresh />
          </span>
          <div className='flex flex-1 flex-col gap-2px min-w-0'>
            <span className='text-13px text-t-primary font-500'>{t('conversation.contextCeiling.retry.label')}</span>
            <span className='text-12px text-t-secondary'>{t('conversation.contextCeiling.retry.sublabel')}</span>
          </div>
          <Button type='primary' size='small' icon={<Refresh />} onClick={onRetry}>
            {t('conversation.contextCeiling.retry.action')}
          </Button>
        </li>
      </ul>

      {rawError && (
        <details className='text-12px text-t-secondary'>
          <summary className='cursor-pointer select-none'>{t('conversation.contextCeiling.details')}</summary>
          <div className='mt-8px whitespace-pre-wrap break-words'>{rawError}</div>
        </details>
      )}
    </section>
  );
};

export default WCoreContextCeilingCard;
