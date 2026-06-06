/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credential form for the Nextcloud Talk plugin.
 * Three fields: serverUrl, username, appPassword.
 * Test & Enable calls testPlugin with JSON-encoded creds, then enablePlugin.
 */

import { Button, Input, Message } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';

const PreferenceRow: React.FC<{
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className='flex items-center justify-between gap-24px py-12px'>
    <div className='flex-1'>
      <span className='text-14px text-t-primary'>{label}</span>
      {description && <div className='text-12px text-t-tertiary mt-2px'>{description}</div>}
    </div>
    <div className='flex items-center gap-8px'>{children}</div>
  </div>
);

export type NextcloudTalkConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
};

const NextcloudTalkConfigForm: React.FC<NextcloudTalkConfigFormProps> = ({
  pluginStatus,
  onStatusChange,
}) => {
  const { t } = useTranslation();

  const [serverUrl, setServerUrl] = useState('https://cloud.example.com');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!serverUrl.trim()) {
      Message.warning(
        t(
          'settings.channels.nextcloudTalk.credentials.serverUrl.required',
          'Please enter the Nextcloud server URL',
        ),
      );
      return;
    }
    if (!username.trim()) {
      Message.warning(
        t(
          'settings.channels.nextcloudTalk.credentials.username.required',
          'Please enter your Nextcloud username',
        ),
      );
      return;
    }
    if (!appPassword.trim()) {
      Message.warning(
        t(
          'settings.channels.nextcloudTalk.credentials.appPassword.required',
          'Please enter an app password',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'nextcloud-talk_default',
        token: JSON.stringify({
          serverUrl: serverUrl.trim(),
          username: username.trim(),
          appPassword: appPassword.trim(),
        }),
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t(
              'settings.channels.nextcloudTalk.connectionFailed',
              'Nextcloud Talk connection failed',
            ),
        );
        return;
      }

      Message.success(
        t('settings.channels.nextcloudTalk.connectionSuccess', 'Nextcloud Talk connected'),
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'nextcloud-talk_default',
        config: {
          serverUrl: serverUrl.trim(),
          username: username.trim(),
          appPassword: appPassword.trim(),
        },
      });

      if (enableResult.success) {
        Message.success(
          t('settings.channels.nextcloudTalk.pluginEnabled', 'Nextcloud Talk plugin enabled'),
        );
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(
            statusResult.data.find((p) => p.type === 'nextcloud-talk') ?? null,
          );
        }
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.nextcloudTalk.enableFailed', 'Failed to enable plugin'),
        );
      }
    } catch (error) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-12px'>
      {hasExisting && (
        <div className='flex items-start gap-8px p-12px rd-8px bg-warning-1 text-warning border border-warning'>
          <AlertTriangle size={16} className='mt-2px flex-shrink-0' />
          <span className='text-12px'>
            {t(
              'settings.channels.nextcloudTalk.replaceWarning',
              'Connecting a new account will replace your existing Nextcloud Talk connection.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t(
          'settings.channels.nextcloudTalk.credentials.serverUrl.label',
          'Server URL',
        )}
        description={t(
          'settings.channels.nextcloudTalk.credentials.serverUrl.help',
          'Base URL of your Nextcloud instance, e.g. https://cloud.example.com',
        )}
      >
        <Input
          value={serverUrl}
          onChange={setServerUrl}
          placeholder={t(
            'settings.channels.nextcloudTalk.credentials.serverUrl.placeholder',
            'https://cloud.example.com',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.nextcloudTalk.credentials.username.label',
          'Username',
        )}
        description={t(
          'settings.channels.nextcloudTalk.credentials.username.help',
          'Your Nextcloud login name.',
        )}
      >
        <Input
          value={username}
          onChange={setUsername}
          placeholder={t(
            'settings.channels.nextcloudTalk.credentials.username.placeholder',
            'youruser',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.nextcloudTalk.credentials.appPassword.label',
          'App Password',
        )}
        description={t(
          'settings.channels.nextcloudTalk.credentials.appPassword.help',
          'Generate under Personal → Security → Devices & sessions in your Nextcloud settings.',
        )}
      >
        <Input.Password
          value={appPassword}
          onChange={setAppPassword}
          placeholder={
            hasExisting
              ? '••••••••••••••••'
              : t(
                  'settings.channels.nextcloudTalk.credentials.appPassword.placeholder',
                  'xxxx-xxxx-xxxx-xxxx',
                )
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.nextcloudTalk.appPasswordHowTo',
          'How to create an app password: open Nextcloud → top-right avatar → Personal settings → Security → Devices & sessions → Create new app password.',
        )}
      </div>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.nextcloudTalk.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default NextcloudTalkConfigForm;
