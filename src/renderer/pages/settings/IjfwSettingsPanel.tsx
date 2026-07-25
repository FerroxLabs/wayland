/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IjfwSettingsPanel - Wave 6 / Decision 3b.
 *
 * The single Skip toggle in the entire app. Reads the persisted flag via
 * `ipcBridge.ijfw.getSkipSetup` and writes via
 * `ipcBridge.ijfw.skipSetup.invoke({ enabled })`. Turning it OFF also fires
 * `ijfw.triggerInstall`, because persisting the flag alone recovered nothing.
 *
 * Mounted at `/settings/ijfw` and reachable from the Settings sidebar entry
 * "IJFW Memory".
 */

import { Button, Message, Switch, Typography } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IjfwLifecycleStatus, IjfwStatusPayload } from '@/common/adapter/ipcBridge';
import IjfwSetupStatus from './components/IjfwSetupStatus';
import SettingsPageWrapper from './components/SettingsPageWrapper';

const IJFW_GITHUB_URL = 'https://github.com/FerroxLabs/ijfw';

const IjfwSettingsPanel: React.FC = () => {
  const { t } = useTranslation();
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<IjfwLifecycleStatus | null>(null);
  const [cliCount, setCliCount] = useState(0);

  const applyChecklist = useCallback((payload: IjfwStatusPayload | null | undefined): void => {
    if (!payload) return;
    setStatus(payload.status);
    setCliCount(payload.cliCount ?? 0);
  }, []);

  /**
   * The switch reflects the PERSISTED FLAG, read via `getSkipSetup`. It is
   * deliberately not inferred from the lifecycle status any more.
   *
   * Inferring it conflated a user setting with on-disk state: with an install
   * present the status is `installed_current` whatever the flag says, so the
   * switch could not stay ON. Any fresh status - a late emit from a bootstrap
   * that started before the user re-enabled Skip, or simply navigating away and
   * back - re-derived it to OFF and masked the user's own choice.
   */
  const refreshSkipFlag = useCallback(async (): Promise<void> => {
    try {
      const flag = await ipcBridge.ijfw.getSkipSetup.invoke();
      if (flag) setSkipEnabled(flag.enabled === true);
    } catch (err) {
      console.error('[IjfwSettingsPanel] getSkipSetup failed:', err);
    }
  }, []);

  // Read initial opt-out state from the lifecycle snapshot. Wave 2 sets
  // `status: 'not_installed', reason: 'opt_out'` whenever the Skip flag is on.
  // Also seeds the setup-status checklist (install status + detected-CLI count).
  useEffect(() => {
    let disposed = false;
    void ipcBridge.ijfw.getStatus
      .invoke()
      .then((payload) => {
        if (disposed) return;
        applyChecklist(payload);
      })
      .catch((err) => {
        console.error('[IjfwSettingsPanel] getStatus failed:', err);
      });

    // Stay subscribed. Re-enabling now kicks a real bootstrap, which emits
    // `installing` then `installed_current`; without this the panel kept
    // rendering the pre-toggle snapshot until the whole app was restarted,
    // which is what made the page look permanently broken.
    const unsubscribe = ipcBridge.ijfw.onStatusChanged.on((payload) => {
      if (disposed) return;
      applyChecklist(payload);
    });

    void refreshSkipFlag();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [applyChecklist, refreshSkipFlag]);

  const handleOpenGithub = useCallback(() => {
    void ipcBridge.shell.openExternal.invoke(IJFW_GITHUB_URL).catch((err: unknown) => {
      console.error('[IjfwSettingsPanel] openExternal failed:', err);
    });
  }, []);

  const handleToggle = useCallback(
    async (next: boolean) => {
      if (loading) return;
      const previous = skipEnabled;
      setSkipEnabled(next);
      setLoading(true);
      try {
        const result = await ipcBridge.ijfw.skipSetup.invoke({ enabled: next });
        if (result?.ok) {
          Message.success(
            next
              ? t('memory.settings.skip_label', { defaultValue: 'Skip IJFW automatic setup' })
              : t('memory.pitch.install_cta', { defaultValue: 'Install Memory' })
          );
          // Persisting the flag was ALL this toggle used to do. Bootstrap had
          // already run at boot and short-circuited on `opt_out`, so turning
          // Skip back off changed nothing observable: the checklist kept saying
          // "Not installed yet", the runtime row kept saying "Waiting for
          // install", and Test kept failing because `runtimeMode` was never
          // enabled. Flipping the switch any number of times could not recover
          // it - only restarting the app could. So re-enabling now runs the
          // same bootstrap the Memory page's install button runs.
          //
          // NOTE: triggerInstall resolves ok:true even when bootstrap aborts on
          // a held lock, so the toast above is not proof the install ran. The
          // checklist below reports what actually happened.
          if (!next) {
            const install = await ipcBridge.ijfw.triggerInstall.invoke();
            if (install && install.ok === false) {
              Message.error(
                install.error ?? t('memory.error.unknown', { defaultValue: 'Something went wrong. Try again.' })
              );
            }
          }
        } else {
          setSkipEnabled(previous);
          Message.error(t('memory.error.unknown', { defaultValue: 'Something went wrong. Try again.' }));
        }
      } catch (err) {
        setSkipEnabled(previous);
        Message.error(
          err instanceof Error
            ? err.message
            : t('memory.error.unknown', { defaultValue: 'Something went wrong. Try again.' })
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, skipEnabled, t]
  );

  return (
    <SettingsPageWrapper>
      <div
        className='flex flex-col gap-16px'
        data-testid='ijfw-settings-panel'
        role='region'
        aria-label={t('memory.settings.panel_title', { defaultValue: 'IJFW Memory (Ferrox Labs)' })}
      >
        <Typography.Title heading={5} className='!mb-0'>
          {t('memory.settings.panel_title', { defaultValue: 'IJFW Memory (Ferrox Labs)' })}
        </Typography.Title>

        <IjfwSetupStatus status={status} cliCount={cliCount} />

        <div className='flex flex-col gap-12px p-16px rd-12px bg-aou-1'>
          <div className='flex items-center justify-between gap-16px'>
            <Typography.Text className='text-14px font-medium'>
              {t('memory.settings.skip_label', { defaultValue: 'Skip IJFW automatic setup' })}
            </Typography.Text>
            <Switch
              checked={skipEnabled}
              loading={loading}
              onChange={(value: boolean) => {
                void handleToggle(value);
              }}
              data-testid='ijfw-settings-skip-switch'
            />
          </div>
          <Typography.Text type='secondary' className='text-12px'>
            {t('memory.settings.skip_description', {
              defaultValue:
                'When enabled, Wayland will not install or upgrade IJFW. You can install manually later via the Memory page.',
            })}
          </Typography.Text>
        </div>

        <div className='flex flex-col gap-6px'>
          <Typography.Text type='secondary' className='text-12px'>
            {t('memory.settings.manual_install_hint', {
              defaultValue:
                'To install manually: run `npx -y --package @ijfw/install@latest ijfw-install --yes` in a terminal',
            })}
          </Typography.Text>
          <code
            data-testid='ijfw-settings-manual-install-code'
            className='inline-block self-start px-8px py-4px rd-6px bg-fill-2 text-12px text-t-primary font-mono'
          >
            npx -y --package @ijfw/install@latest ijfw-install --yes
          </code>
        </div>

        <div className='flex flex-col gap-6px p-16px rd-12px bg-aou-1' data-testid='ijfw-settings-about'>
          <Typography.Text className='text-14px font-semibold'>
            {t('memory.settings.about_title', { defaultValue: 'IJFW Memory' })}
          </Typography.Text>
          <Typography.Text type='secondary' className='text-12px'>
            {t('memory.settings.about_body', {
              defaultValue: 'An open-source persistent memory engine by Ferrox Labs.',
            })}
          </Typography.Text>
          <Button
            type='text'
            size='small'
            onClick={handleOpenGithub}
            data-testid='ijfw-settings-github-link'
            className='self-start !p-0'
          >
            {t('memory.brand.github_link', { defaultValue: 'github.com/FerroxLabs/ijfw' })}
          </Button>
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default IjfwSettingsPanel;
