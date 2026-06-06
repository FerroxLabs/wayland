/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credential form for the Twitch channel plugin.
 * JSON-encodes {botUsername, oauthToken, channels[]} into a single token
 * string for testPlugin IPC, then enablePlugin with the raw credential fields.
 * Mirrors NostrConfigForm pattern.
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

export type TwitchConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
};

const TwitchConfigForm: React.FC<TwitchConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [botUsername, setBotUsername] = useState('');
  const [oauthToken, setOauthToken] = useState('');
  const [channels, setChannels] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  // F-1: optional OAuth refresh-token flow.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!botUsername.trim()) {
      Message.warning(
        t('settings.channels.twitch.credentials.botUsername.required', 'Please enter the bot username'),
      );
      return;
    }

    if (!oauthToken.trim()) {
      Message.warning(
        t('settings.channels.twitch.credentials.oauthToken.required', 'Please enter the OAuth token'),
      );
      return;
    }

    const channelList = channels
      .split(',')
      .map((c) => c.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    if (channelList.length === 0) {
      Message.warning(
        t('settings.channels.twitch.credentials.channels.required', 'Please enter at least one channel to join'),
      );
      return;
    }

    // F-1: only include refresh-token fields when all three are set.
    const refreshFields =
      clientId.trim() && clientSecret.trim() && refreshToken.trim()
        ? {
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
            refreshToken: refreshToken.trim(),
          }
        : {};

    const tokenJson = JSON.stringify({
      botUsername: botUsername.trim(),
      oauthToken: oauthToken.trim(),
      channels: channelList,
      ...refreshFields,
    });

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'twitch_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.twitch.connectionFailed', 'Twitch connection failed - check token and username'),
        );
        return;
      }

      Message.success(t('settings.channels.twitch.connectionSuccess', 'Twitch connected successfully'));

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'twitch_default',
        config: {
          botUsername: botUsername.trim(),
          oauthToken: oauthToken.trim(),
          channels: channelList,
          ...refreshFields,
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.twitch.pluginEnabled', 'Twitch plugin enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'twitch') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.twitch.enableFailed', 'Failed to enable Twitch plugin'),
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
              'settings.channels.twitch.replaceWarning',
              'Connecting a new Twitch bot will replace your existing credentials.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.twitch.credentials.botUsername.label', 'Bot Username')}
        description={t(
          'settings.channels.twitch.credentials.botUsername.help',
          'The Twitch login name of your bot account (lowercase).',
        )}
      >
        <Input
          value={botUsername}
          onChange={setBotUsername}
          placeholder={hasExisting ? '••••••••' : 'mybotname'}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.twitch.credentials.oauthToken.label', 'OAuth Token')}
        description={t(
          'settings.channels.twitch.credentials.oauthToken.help',
          'Bot OAuth token with chat:read + chat:edit scopes. Get one at twitchtokengenerator.com.',
        )}
      >
        <Input.Password
          value={oauthToken}
          onChange={setOauthToken}
          placeholder={hasExisting ? '••••••••••••••••' : 'oauth:xxxxxx or bare token'}
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.twitch.credentials.channels.label', 'Channels')}
        description={t(
          'settings.channels.twitch.credentials.channels.help',
          'Comma-separated channel names to join (e.g. mychannel, otherchannel). The # prefix is optional.',
        )}
      >
        <Input
          value={channels}
          onChange={setChannels}
          placeholder='mychannel, otherchannel'
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.twitch.tokenHowTo',
          'Use a dedicated bot account - never use your personal Twitch account. Generate a token at twitchtokengenerator.com and select the chat:read and chat:edit scopes.',
        )}
      </div>

      <div className='pt-8px'>
        <button
          type='button'
          className='text-12px text-t-secondary hover:text-t-primary cursor-pointer bg-transparent border-none p-0'
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced
            ? t('settings.channels.twitch.advanced.hide', '▾ Advanced: token refresh')
            : t('settings.channels.twitch.advanced.show', '▸ Advanced: token refresh')}
        </button>
      </div>

      {showAdvanced && (
        <>
          <div className='text-12px text-t-tertiary'>
            {t(
              'settings.channels.twitch.advanced.help',
              'Optional: provide a Twitch app Client ID + Client Secret + Refresh Token to enable automatic token refresh. When set, the static OAuth Token above is ignored and a fresh access token is minted before each connect.',
            )}
          </div>

          <PreferenceRow
            label={t('settings.channels.twitch.credentials.clientId.label', 'Client ID')}
            description={t(
              'settings.channels.twitch.credentials.clientId.help',
              'Twitch app Client ID (dev.twitch.tv → Console → Apps).',
            )}
          >
            <Input
              value={clientId}
              onChange={setClientId}
              placeholder='abcd1234...'
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.twitch.credentials.clientSecret.label', 'Client Secret')}
            description={t(
              'settings.channels.twitch.credentials.clientSecret.help',
              'Twitch app Client Secret - never share this value.',
            )}
          >
            <Input.Password
              value={clientSecret}
              onChange={setClientSecret}
              placeholder='••••••••••••••••'
              style={{ width: 280 }}
              visibilityToggle
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.twitch.credentials.refreshToken.label', 'Refresh Token')}
            description={t(
              'settings.channels.twitch.credentials.refreshToken.help',
              'Refresh token obtained via the Authorization Code grant flow.',
            )}
          >
            <Input.Password
              value={refreshToken}
              onChange={setRefreshToken}
              placeholder='••••••••••••••••'
              style={{ width: 280 }}
              visibilityToggle
            />
          </PreferenceRow>
        </>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.twitch.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default TwitchConfigForm;
