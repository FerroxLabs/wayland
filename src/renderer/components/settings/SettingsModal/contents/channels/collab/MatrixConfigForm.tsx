/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Message } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';

/**
 * Section row - kept inline so this form is self-contained, mirroring the
 * inline shape sibling tier-1 forms use (DiscordConfigForm).
 */
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

export interface MatrixConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const MatrixConfigForm: React.FC<MatrixConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [homeserverUrl, setHomeserverUrl] = useState('https://matrix.org');
  const [userId, setUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!homeserverUrl.trim()) {
      Message.warning(
        t(
          'settings.channels.matrix.credentials.homeserverUrl.required',
          'Please enter a homeserver URL',
        ),
      );
      return;
    }
    if (!userId.trim()) {
      Message.warning(
        t(
          'settings.channels.matrix.credentials.userId.required',
          'Please enter a Matrix user ID (mxid)',
        ),
      );
      return;
    }
    if (!accessToken.trim()) {
      Message.warning(
        t(
          'settings.channels.matrix.credentials.accessToken.required',
          'Please enter an access token',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'matrix_default',
        // testPlugin's contract takes a single token string. Matrix needs the
        // homeserver URL too for whoami(), so JSON-encode both - mirrors
        // WhatsAppConfigForm + matches MatrixPlugin.testConnection's parser.
        token: JSON.stringify({
          homeserverUrl: homeserverUrl.trim(),
          accessToken: accessToken.trim(),
        }),
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.matrix.connectionFailed', 'Matrix connection failed'),
        );
        return;
      }

      Message.success(t('settings.channels.matrix.connectionSuccess', 'Matrix connected'));

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'matrix_default',
        config: {
          homeserverUrl: homeserverUrl.trim(),
          userId: userId.trim(),
          accessToken: accessToken.trim(),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.matrix.pluginEnabled', 'Matrix plugin enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'matrix') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.matrix.enableFailed', 'Failed to enable plugin'),
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
              'settings.channels.matrix.replaceWarning',
              'Connecting a new Matrix account will replace your existing one.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t(
          'settings.channels.matrix.credentials.homeserverUrl.label',
          'Homeserver URL',
        )}
        description={t(
          'settings.channels.matrix.credentials.homeserverUrl.help',
          'HTTPS base URL of your Matrix homeserver. Use https://matrix.org for the public flagship server.',
        )}
      >
        <Input
          value={homeserverUrl}
          onChange={setHomeserverUrl}
          placeholder={t(
            'settings.channels.matrix.credentials.homeserverUrl.placeholder',
            'https://matrix.org',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.matrix.credentials.userId.label', 'User ID (mxid)')}
        description={t(
          'settings.channels.matrix.credentials.userId.help',
          'Full Matrix ID including the server suffix, e.g. @bot:matrix.org.',
        )}
      >
        <Input
          value={userId}
          onChange={setUserId}
          placeholder={t(
            'settings.channels.matrix.credentials.userId.placeholder',
            '@bot:matrix.org',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.matrix.credentials.accessToken.label', 'Access Token')}
        description={t(
          'settings.channels.matrix.credentials.accessToken.help',
          'Long-lived access token. Element: All settings → Help & About → Access Token. Or use a dedicated bot account.',
        )}
      >
        <Input.Password
          value={accessToken}
          onChange={setAccessToken}
          placeholder={
            hasExisting
              ? '••••••••••••••••'
              : t(
                  'settings.channels.matrix.credentials.accessToken.placeholder',
                  'syt_...your-matrix-access-token...',
                )
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.matrix.accessTokenHowTo',
          'How to get an access token: see https://t2bot.io/docs/access_tokens/ or your homeserver settings.',
        )}
      </div>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.matrix.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default MatrixConfigForm;
