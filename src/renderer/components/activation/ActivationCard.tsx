/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Key, Lightning, Right, Terminal } from '@icon-park/react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ActivationCard.module.css';

/** Which activation path the user chose - used for telemetry / analytics. */
export type ActivationPath = 'flux' | 'own-key' | 'claude-code';

/** Which truth the card's headline states - see {@link ActivationCardProps.variant}. */
export type ActivationVariant = 'connect' | 'repair';

const HEADLINE_KEYS: Record<ActivationVariant, { title: string; subtitle: string }> = {
  connect: { title: 'conversation.activation.title', subtitle: 'conversation.activation.subtitle' },
  repair: { title: 'conversation.activation.unusableTitle', subtitle: 'conversation.activation.unusableSubtitle' },
};

export type ActivationCardProps = {
  /**
   * Which headline the card tells. `'connect'` (the default) is the only
   * variant allowed to say a provider must be connected - it renders when no
   * provider is configured at all. `'repair'` renders when providers ARE
   * connected but none can currently take a task, so the copy points at the
   * ones already there instead of claiming there are none.
   */
  variant?: ActivationVariant;
  /**
   * Wake the engine by connecting Flux Router (the free, card-free path with a
   * starter credit). The full PKCE/OAuth main-side flow is wired by the caller.
   */
  onConnectFlux: () => void;
  /** Open the existing Browse / connect flow so the user adds their own key. */
  onUseOwnKey: () => void;
  /** Select Claude Code as the backend. */
  onUseClaudeCode: () => void;
  /**
   * Optional telemetry hook - fired with the chosen path before its action
   * runs. No dedicated telemetry util exists in the renderer yet, so the card
   * surfaces the event as a callback for the caller to forward.
   */
  onPathSelected?: (path: ActivationPath) => void;
};

type PathConfig = {
  path: ActivationPath;
  icon: React.ReactNode;
  labelKey: string;
  subLabelKey: string;
  actionKey: string;
  /** The Flux path is the recommended primary path - rendered first + tinted. */
  primary: boolean;
  onSelect: () => void;
};

/**
 * In-thread activation card offering three ranked paths to wake the engine.
 * Which headline it tells is decided by `activationPromptFor` - it claims "no
 * provider" only when the registry actually holds none (see
 * `useProviderReadiness`).
 *
 * Presentational only - every action is a callback prop; the card owns no IPC,
 * no registry state, and no navigation. The Flux row is the recommended primary
 * path (free key, +$1 starter credit, card-free).
 */
const ActivationCard: React.FC<ActivationCardProps> = ({
  variant = 'connect',
  onConnectFlux,
  onUseOwnKey,
  onUseClaudeCode,
  onPathSelected,
}) => {
  const { t } = useTranslation();

  const select = useCallback(
    (path: ActivationPath, action: () => void) => {
      onPathSelected?.(path);
      action();
    },
    [onPathSelected]
  );

  const paths: PathConfig[] = [
    {
      path: 'flux',
      icon: <Lightning theme='filled' />,
      labelKey: 'conversation.activation.flux.label',
      subLabelKey: 'conversation.activation.flux.sublabel',
      actionKey: 'conversation.activation.flux.action',
      primary: true,
      onSelect: () => select('flux', onConnectFlux),
    },
    {
      path: 'own-key',
      icon: <Key />,
      labelKey: 'conversation.activation.ownKey.label',
      subLabelKey: 'conversation.activation.ownKey.sublabel',
      actionKey: 'conversation.activation.ownKey.action',
      primary: false,
      onSelect: () => select('own-key', onUseOwnKey),
    },
    {
      path: 'claude-code',
      icon: <Terminal />,
      labelKey: 'conversation.activation.claudeCode.label',
      subLabelKey: 'conversation.activation.claudeCode.sublabel',
      actionKey: 'conversation.activation.claudeCode.action',
      primary: false,
      onSelect: () => select('claude-code', onUseClaudeCode),
    },
  ];

  const titleId = 'activation-card-title';
  const headline = HEADLINE_KEYS[variant];

  return (
    <section
      className={`${styles.card} flex flex-col gap-12px rd-16px p-16px`}
      role='region'
      aria-labelledby={titleId}
      data-testid='activation-card'
      data-variant={variant}
    >
      <div className='flex flex-col gap-4px'>
        <div id={titleId} className='text-14px text-t-primary font-600'>
          {t(headline.title)}
        </div>
        <div className='text-12px text-t-secondary'>{t(headline.subtitle)}</div>
      </div>

      <ul className='flex flex-col gap-8px' role='list'>
        {paths.map((p) => (
          <li
            key={p.path}
            role='listitem'
            data-testid={`activation-path-${p.path}`}
            className={`${styles.row} ${p.primary ? styles.rowPrimary : ''} flex items-center gap-12px rd-12px p-12px`}
          >
            <span className={`${styles.icon} ${p.primary ? styles.iconPrimary : ''} flex items-center text-20px`}>
              {p.icon}
            </span>
            <div className='flex flex-1 flex-col gap-2px min-w-0'>
              <span className='text-13px text-t-primary font-500'>{t(p.labelKey)}</span>
              <span className='text-12px text-t-secondary'>{t(p.subLabelKey)}</span>
            </div>
            <Button
              type={p.primary ? 'primary' : 'secondary'}
              size='small'
              icon={<Right />}
              aria-label={t(p.actionKey)}
              onClick={p.onSelect}
            >
              {t(p.actionKey)}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ActivationCard;
