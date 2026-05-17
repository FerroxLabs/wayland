/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Message } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';

/**
 * Section row — kept inline rather than imported from shared/forms so this
 * component is self-contained and matches the inline shape used by sibling
 * tier-1 forms (SlackConfigForm). Same Arco + UnoCSS semantic-token surface.
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

export interface DiscordConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const DiscordConfigForm: React.FC<DiscordConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [botToken, setBotToken] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExistingBot = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!botToken.trim()) {
      Message.warning(
        t('settings.channels.discord.credentials.botToken.required', 'Please enter a bot token'),
      );
      return;
    }

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'discord_default',
        token: botToken.trim(),
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(testResult.data?.error ?? t('settings.channels.discord.connectionFailed', 'Connection failed'));
        return;
      }

      Message.success(
        t(
          'settings.channels.discord.connectionSuccess',
          `Connected! Bot: @${testResult.data.botUsername ?? 'unknown'}`,
        ),
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'discord_default',
        config: {
          botToken: botToken.trim(),
          ...(applicationId.trim() ? { applicationId: applicationId.trim() } : {}),
          ...(publicKey.trim() ? { publicKey: publicKey.trim() } : {}),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.discord.pluginEnabled', 'Discord bot enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'discord') ?? null);
        }
      } else {
        Message.error(enableResult.msg ?? t('settings.channels.discord.enableFailed', 'Failed to enable plugin'));
      }
    } catch (error) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-12px'>
      {hasExistingBot && (
        <div className='flex items-start gap-8px p-12px rd-8px bg-warning-1 text-warning border border-warning'>
          <AlertTriangle size={16} className='mt-2px flex-shrink-0' />
          <span className='text-12px'>
            {t(
              'settings.channels.discord.replaceWarning',
              'Connecting a new Discord bot will replace your existing one.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.discord.credentials.botToken.label', 'Bot Token')}
        description={t(
          'settings.channels.discord.credentials.botToken.help',
          'Find this in the Discord Developer Portal under your application → Bot → Reset Token.',
        )}
      >
        <Input.Password
          value={botToken}
          onChange={setBotToken}
          placeholder={
            hasExistingBot
              ? '••••••••••••••••'
              : t(
                  'settings.channels.discord.credentials.botToken.placeholder',
                  'MTI...your-bot-token...',
                )
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.discord.credentials.applicationId.label', 'Application ID')}
        description={t(
          'settings.channels.discord.credentials.applicationId.help',
          'Optional. Required only when you register slash commands for this bot.',
        )}
      >
        <Input
          value={applicationId}
          onChange={setApplicationId}
          placeholder={t(
            'settings.channels.discord.credentials.applicationId.placeholder',
            '1234567890123456789',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.discord.credentials.publicKey.label', 'Public Key')}
        description={t(
          'settings.channels.discord.credentials.publicKey.help',
          'Optional. Required only if you later switch to the HTTP interaction endpoint instead of the Gateway.',
        )}
      >
        <Input
          value={publicKey}
          onChange={setPublicKey}
          placeholder={t(
            'settings.channels.discord.credentials.publicKey.placeholder',
            'ed25519 public key in hex',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.discord.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default DiscordConfigForm;
