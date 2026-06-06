/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * BluebubblesConfigForm - credential form for the BlueBubbles iMessage relay.
 *
 * Credentials: serverUrl (https://bb.example.com:1234) + password.
 * Test connection calls GET /api/v1/server/info via the main-process
 * testPlugin IPC and displays the server address on success.
 */

import { Alert, Button, Input, Message } from '@arco-design/web-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';

const PreferenceRow: React.FC<{
  label: string;
  description?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, description, required, children }) => (
  <div className='flex items-center justify-between gap-24px py-12px'>
    <div className='flex-1'>
      <div className='flex items-center gap-8px'>
        <span className='text-14px text-t-primary'>
          {label}
          {required && <span className='text-red-500 ml-2px'>*</span>}
        </span>
      </div>
      {description && <div className='text-12px text-t-tertiary mt-2px'>{description}</div>}
    </div>
    <div className='flex items-center'>{children}</div>
  </div>
);

export type BluebubblesConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const BluebubblesConfigForm: React.FC<BluebubblesConfigFormProps> = ({
  pluginStatus,
  onStatusChange,
}) => {
  const { t } = useTranslation();

  const [serverUrl, setServerUrl] = useState('');
  const [password, setPassword] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExistingBot = !!pluginStatus?.hasToken;

  const handleTestAndEnable = useCallback(async () => {
    if (!serverUrl.trim() || !password.trim()) {
      Message.warning(
        t(
          'settings.channels.bluebubbles.credentials.bothRequired',
          'Server URL and password are required',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const tokenJson = JSON.stringify({
        serverUrl: serverUrl.trim(),
        password: password.trim(),
      });

      const testResult = await channel.testPlugin.invoke({
        pluginId: 'bluebubbles_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.bluebubbles.connectionFailed', 'Connection failed'),
        );
        return;
      }

      Message.success(
        t(
          'settings.channels.bluebubbles.connectionSuccess',
          `Connected to ${testResult.data.botUsername ?? 'BlueBubbles server'}`,
        ),
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'bluebubbles_default',
        config: {
          serverUrl: serverUrl.trim(),
          password: password.trim(),
        },
      });

      if (enableResult.success) {
        Message.success(
          t('settings.channels.bluebubbles.pluginEnabled', 'BlueBubbles plugin enabled'),
        );
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange?.(statusResult.data.find((p) => p.type === 'bluebubbles') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.bluebubbles.enableFailed', 'Failed to enable plugin'),
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  }, [serverUrl, password, t, onStatusChange]);

  return (
    <div className='flex flex-col gap-24px'>
      {hasExistingBot && (
        <Alert
          type='warning'
          content={t(
            'settings.channels.bluebubbles.accountLockWarning',
            'Saving new credentials will replace the existing BlueBubbles server connection.',
          )}
        />
      )}

      <PreferenceRow
        label={t('settings.channels.bluebubbles.credentials.serverUrl.label', 'Server URL')}
        description={t(
          'settings.channels.bluebubbles.credentials.serverUrl.help',
          'URL of your BlueBubbles server (the Mac running BlueBubbles Server.app). Find under Connection settings in the BB Server app. For LAN: http://192.168.1.100:1234. For remote access, use a tunnel (ngrok, Cloudflare Tunnel, Tailscale).',
        )}
        required
      >
        <Input
          value={serverUrl}
          onChange={setServerUrl}
          placeholder={t(
            'settings.channels.bluebubbles.credentials.serverUrl.placeholder',
            'http://192.168.1.100:1234',
          )}
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.bluebubbles.credentials.password.label', 'Server Password')}
        description={t(
          'settings.channels.bluebubbles.credentials.password.help',
          'Password set in the BlueBubbles Server app under Settings.',
        )}
        required
      >
        <Input.Password
          value={password}
          onChange={setPassword}
          placeholder={t(
            'settings.channels.bluebubbles.credentials.password.placeholder',
            'Your BlueBubbles server password',
          )}
          visibilityToggle
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.bluebubbles.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default BluebubblesConfigForm;
