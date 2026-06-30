/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Computer-Use macOS permission onboarding card.
 *
 * Shown above the send box only when (a) the agent has the Computer-Use
 * capability and (b) a required macOS grant (Screen Recording / Accessibility)
 * is missing. Detects via the non-prompting bridge and deep-links the exact
 * System Settings pane; the engine (#114) owns the actual OS prompt, so this
 * card never triggers a dialog itself - it just guides + re-checks.
 *
 * Renders null whenever no action is needed (granted, non-macOS, or no CUA),
 * so non-Computer-Use chats stay quiet.
 */

import { Button } from '@arco-design/web-react';
import { Check, Click, Close, Monitor, Refresh, Right } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCuaPermissions, type CuaPrivacyPane } from '@/renderer/hooks/useCuaPermissions';

export type CuaPermissionCardProps = {
  /** True while the current agent advertises the Computer-Use capability. */
  active: boolean;
  /** Optional dismiss handler - hides the card for this session. */
  onDismiss?: () => void;
};

type Row = {
  pane: CuaPrivacyPane;
  icon: React.ReactNode;
  label: string;
  granted: boolean;
};

const CuaPermissionCard: React.FC<CuaPermissionCardProps> = ({ active, onDismiss }) => {
  const { t } = useTranslation();
  const { status, checking, recheck, openSettings, relaunch } = useCuaPermissions(active);

  // Quiet unless the agent has CUA and a grant is actually missing on macOS.
  if (!active || !status || !status.supported || status.allGranted) {
    return null;
  }

  const rows: Row[] = [
    {
      pane: 'screen',
      icon: <Monitor />,
      label: t('conversation.cuaPermission.screenRecording', { defaultValue: 'Screen Recording' }),
      granted: status.screenRecording === 'granted',
    },
    {
      pane: 'accessibility',
      icon: <Click />,
      label: t('conversation.cuaPermission.accessibility', { defaultValue: 'Accessibility' }),
      granted: status.accessibility === 'granted',
    },
  ];

  const titleId = 'cua-permission-card-title';
  // macOS only applies a new Screen Recording grant after a relaunch, so guide
  // the user to relaunch (Re-check alone won't flip Screen Recording green).
  const needsRelaunch = status.screenRecording !== 'granted';

  return (
    <section
      className='bg-2 rd-16px p-16px flex flex-col gap-12px'
      role='region'
      aria-labelledby={titleId}
      data-testid='cua-permission-card'
    >
      <div className='flex items-start gap-8px'>
        <div className='flex flex-1 flex-col gap-4px min-w-0'>
          <div id={titleId} className='text-14px text-t-primary font-600'>
            {t('conversation.cuaPermission.title', { defaultValue: 'Computer-Use needs macOS permissions' })}
          </div>
          <div className='text-12px text-t-secondary'>
            {t('conversation.cuaPermission.subtitle', {
              defaultValue: 'To see your screen and act for you, grant these in System Settings, then re-check.',
            })}
          </div>
        </div>
        {onDismiss && (
          <Button
            type='text'
            size='mini'
            icon={<Close />}
            aria-label={t('conversation.cuaPermission.dismiss', { defaultValue: 'Dismiss' })}
            onClick={onDismiss}
          />
        )}
      </div>

      <ul className='flex flex-col gap-8px' role='list'>
        {rows.map((row) => (
          <li
            key={row.pane}
            role='listitem'
            data-testid={`cua-permission-row-${row.pane}`}
            data-granted={row.granted}
            className='bg-3 rd-12px p-12px flex items-center gap-12px'
          >
            <span className='flex items-center text-20px text-t-secondary'>{row.icon}</span>
            <div className='flex flex-1 flex-col gap-2px min-w-0'>
              <span className='text-13px text-t-primary font-500'>{row.label}</span>
            </div>
            {row.granted ? (
              <span
                className='flex items-center gap-4px text-13px text-success'
                data-testid={`cua-granted-${row.pane}`}
              >
                <Check />
                {t('conversation.cuaPermission.granted', { defaultValue: 'Granted' })}
              </span>
            ) : (
              <Button
                type='primary'
                size='small'
                icon={<Right />}
                onClick={() => openSettings(row.pane)}
                data-testid={`cua-open-${row.pane}`}
              >
                {t('conversation.cuaPermission.openSettings', { defaultValue: 'Open Settings' })}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {needsRelaunch && (
        <div className='text-12px text-t-secondary' data-testid='cua-relaunch-note'>
          {t('conversation.cuaPermission.relaunchNote', {
            defaultValue: 'Screen Recording only takes effect after you relaunch Wayland.',
          })}
        </div>
      )}

      <div className='flex items-center justify-end gap-8px'>
        {needsRelaunch && (
          <Button type='secondary' size='small' onClick={relaunch} data-testid='cua-relaunch'>
            {t('conversation.cuaPermission.relaunch', { defaultValue: 'Relaunch' })}
          </Button>
        )}
        <Button
          type='secondary'
          size='small'
          icon={<Refresh />}
          loading={checking}
          onClick={() => void recheck()}
          data-testid='cua-recheck'
        >
          {t('conversation.cuaPermission.recheck', { defaultValue: 'Re-check' })}
        </Button>
      </div>
    </section>
  );
};

export default CuaPermissionCard;
