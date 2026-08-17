/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Close } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import EngineConfigRecoveryPanel from '@renderer/components/activation/EngineConfigRecoveryPanel';
import cardStyles from '@renderer/components/activation/AcpAuthFailureCard.module.css';

export type WCoreEngineConfigCardProps = {
  /** The main process's explanation, kept accessible in an expandable detail. */
  rawError?: string;
  /** Hide the card. */
  onDismiss: () => void;
};

/**
 * In-thread remedy card shown when a Wayland Core turn cannot start because the
 * engine's `config.toml` is not valid TOML (#1024).
 *
 * Replaces a dead end. The old behaviour was a single sentence telling a
 * non-technical user to hand-edit TOML - the reporter spent about two hours in a
 * terminal. This card names the file, gives the line and column, and hands over
 * the three actions in `EngineConfigRecoveryPanel`.
 *
 * Nothing here loosens the refusal that produced the failure:
 * `spliceDesktopMcpProfile` still declines to touch an unparseable config, and it
 * is right to - that file holds the user's providers, credentials and
 * memory/skills settings. Every action behind this card takes a verified backup
 * before it writes.
 */
const WCoreEngineConfigCard: React.FC<WCoreEngineConfigCardProps> = ({ rawError, onDismiss }) => {
  const { t } = useTranslation();
  const titleId = 'wcore-engine-config-invalid-title';

  return (
    <section
      className={`${cardStyles.card} flex flex-col gap-12px rd-16px p-16px`}
      role='region'
      aria-labelledby={titleId}
      data-testid='wcore-engine-config-card'
    >
      <div className='flex items-start gap-8px'>
        <div className='flex flex-1 flex-col gap-4px min-w-0'>
          <div id={titleId} className='text-14px text-t-primary font-600'>
            {t('conversation.engineConfigInvalid.title')}
          </div>
          <div className='text-12px text-t-secondary'>{t('conversation.engineConfigInvalid.explainer')}</div>
        </div>
        <Button
          type='text'
          size='mini'
          icon={<Close />}
          aria-label={t('conversation.engineConfigInvalid.dismiss')}
          onClick={onDismiss}
        />
      </div>

      <EngineConfigRecoveryPanel />

      {rawError && (
        <details className='text-12px text-t-secondary'>
          <summary className='cursor-pointer select-none'>{t('conversation.engineConfigInvalid.details')}</summary>
          <div className='mt-8px whitespace-pre-wrap break-words'>{rawError}</div>
        </details>
      )}
    </section>
  );
};

export default WCoreEngineConfigCard;
