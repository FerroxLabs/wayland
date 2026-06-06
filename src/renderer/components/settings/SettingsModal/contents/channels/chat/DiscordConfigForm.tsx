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
 * Section row - kept inline rather than imported from shared/forms so this
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
  const [testLoading, setTestLoading] = useState(false);

  // F-3: Application ID and Public Key were collected but never wired to
  // anything - the verifier reads its secret from the webhook subsystem and
  // there is no slash-command registration (see F-6 in REVIEW-discord.md).
  // Dropping the dead inputs avoids primed expectations and removes a
  // maintenance hazard. When the HTTP interactions endpoint is wired, add
  // these fields back alongside the registration code that consumes them.

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
          // F-2: previous placeholder ('MTI...your-bot-token...') misled
          // users into believing tokens always start with `MTI`. The prefix
          // depends on the application's snowflake epoch (MT, OD, Mj, Nz...).
          // Use a neutral placeholder.
          placeholder={
            hasExistingBot
              ? '••••••••••••••••'
              : t(
                  'settings.channels.discord.credentials.botToken.placeholder',
                  'Paste your bot token from the Developer Portal',
                )
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      {/* F-1: surface the privileged-intent toggle requirement up-front so
        * first-time users don't see "Connection failed" with no actionable
        * next step. The Test & Enable button uses an intent set matching the
        * production client (see DiscordPlugin.testConnection), so a missing
        * toggle returns a translated, actionable message rather than the raw
        * discord.js error. */}
      <div className='flex items-start gap-8px p-12px rd-8px bg-warning-1 text-warning border border-warning'>
        <AlertTriangle size={16} className='mt-2px flex-shrink-0' />
        <span className='text-12px'>
          {t(
            'settings.channels.discord.privilegedIntentsHint',
            'Before testing: in the Developer Portal → your app → Bot → Privileged Gateway Intents, enable "Message Content Intent" AND "Server Members Intent". Both are required for Wayland to read messages and resolve members. Without them, Test & Enable will fail.',
          )}
        </span>
      </div>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.discord.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default DiscordConfigForm;
