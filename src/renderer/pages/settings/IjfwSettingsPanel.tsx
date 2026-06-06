/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IjfwSettingsPanel - Wave 6 / Decision 3b.
 *
 * The single Skip toggle in the entire app. Reads current opt-out state from
 * `ipcBridge.ijfw.getStatus` (status === 'not_installed' && reason === 'opt_out')
 * and writes via `ipcBridge.ijfw.skipSetup.invoke({ enabled })`.
 *
 * Mounted at `/settings/ijfw` and reachable from the Settings sidebar entry
 * "IJFW Memory".
 */

import { Button, Message, Switch, Typography } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import SettingsPageWrapper from './components/SettingsPageWrapper';

const IJFW_GITHUB_URL = 'https://github.com/FerroxLabs/ijfw';

const IjfwSettingsPanel: React.FC = () => {
  const { t } = useTranslation();
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Read initial opt-out state from the lifecycle snapshot. Wave 2 sets
  // `status: 'not_installed', reason: 'opt_out'` whenever the Skip flag is on.
  useEffect(() => {
    let disposed = false;
    void ipcBridge.ijfw.getStatus
      .invoke()
      .then((payload) => {
        if (disposed || !payload) return;
        setSkipEnabled(payload.status === 'not_installed' && payload.reason === 'opt_out');
      })
      .catch((err) => {
        console.error('[IjfwSettingsPanel] getStatus failed:', err);
      });
    return () => {
      disposed = true;
    };
  }, []);

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
              defaultValue: 'To install manually: run `npx -y @ijfw/install@latest` in a terminal',
            })}
          </Typography.Text>
          <code
            data-testid='ijfw-settings-manual-install-code'
            className='inline-block self-start px-8px py-4px rd-6px bg-fill-2 text-12px text-t-primary font-mono'
          >
            npx -y @ijfw/install@latest
          </code>
        </div>

        <div
          className='flex flex-col gap-6px p-16px rd-12px bg-aou-1'
          data-testid='ijfw-settings-about'
        >
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
