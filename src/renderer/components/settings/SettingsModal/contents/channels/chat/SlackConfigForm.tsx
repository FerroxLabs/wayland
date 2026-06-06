/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Message, Radio } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';

/**
 * Section row - kept inline so this component is self-contained and matches
 * the inline shape used by sibling tier-1 forms (DiscordConfigForm).
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

type SlackTransport = 'socket' | 'events';

export interface SlackConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const SlackConfigForm: React.FC<SlackConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [transport, setTransport] = useState<SlackTransport>('socket');
  const [botToken, setBotToken] = useState('');
  const [appToken, setAppToken] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExistingBot = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!botToken.trim()) {
      Message.warning(
        t('settings.channels.slack.credentials.botToken.required', 'Please enter a bot token'),
      );
      return;
    }
    if (transport === 'socket' && !appToken.trim()) {
      Message.warning(
        t(
          'settings.channels.slack.credentials.appToken.required',
          'Socket Mode requires an app-level token',
        ),
      );
      return;
    }
    if (transport === 'events' && !signingSecret.trim()) {
      Message.warning(
        t(
          'settings.channels.slack.credentials.signingSecret.required',
          'Events API transport requires a signing secret',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'slack_default',
        token: botToken.trim(),
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ?? t('settings.channels.slack.connectionFailed', 'Connection failed'),
        );
        return;
      }

      Message.success(
        t('settings.channels.slack.connectionSuccess', `Connected! Bot: @${testResult.data.botUsername ?? 'unknown'}`),
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'slack_default',
        config: {
          botToken: botToken.trim(),
          transport,
          ...(transport === 'socket' ? { appToken: appToken.trim() } : {}),
          ...(transport === 'events' ? { signingSecret: signingSecret.trim() } : {}),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.slack.pluginEnabled', 'Slack bot enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'slack') ?? null);
        }
      } else {
        Message.error(enableResult.msg ?? t('settings.channels.slack.enableFailed', 'Failed to enable plugin'));
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
              'settings.channels.slack.replaceWarning',
              'Connecting a new Slack workspace will replace your existing one.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.slack.credentials.transport.label', 'Transport')}
        description={t(
          'settings.channels.slack.credentials.transport.help',
          'Socket Mode opens an outbound WebSocket Slack initiates - no public URL needed. Events API uses an inbound HTTPS webhook verified with a signing secret.',
        )}
      >
        <Radio.Group
          value={transport}
          onChange={(value: SlackTransport) => {
            // LOW finding: clear the secret tied to the opposite transport so a
            // stale credential isn't silently re-submitted after a flip. The
            // bot token stays - both transports need it.
            setTransport(value);
            if (value === 'socket') setSigningSecret('');
            else setAppToken('');
          }}
          type='button'
        >
          <Radio value='socket'>
            {t('settings.channels.slack.credentials.transport.socket', 'Socket Mode')}
          </Radio>
          <Radio value='events'>
            {t('settings.channels.slack.credentials.transport.events', 'Events API')}
          </Radio>
        </Radio.Group>
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.slack.credentials.botToken.label', 'Bot Token')}
        description={t(
          'settings.channels.slack.credentials.botToken.help',
          'OAuth & Permissions → Bot User OAuth Token. Starts with "xoxb-".',
        )}
      >
        <Input.Password
          value={botToken}
          onChange={setBotToken}
          placeholder={
            hasExistingBot
              ? '••••••••••••••••'
              : t(
                  'settings.channels.slack.credentials.botToken.placeholder',
                  'xoxb-...your-bot-token...',
                )
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      {transport === 'socket' && (
        <PreferenceRow
          label={t('settings.channels.slack.credentials.appToken.label', 'App-Level Token')}
          description={t(
            'settings.channels.slack.credentials.appToken.help',
            'Required for Socket Mode. Basic Information → App-Level Tokens → Generate Token and Scopes with connections:write. Starts with "xapp-".',
          )}
        >
          <Input.Password
            value={appToken}
            onChange={setAppToken}
            placeholder={t(
              'settings.channels.slack.credentials.appToken.placeholder',
              'xapp-...your-app-token...',
            )}
            style={{ width: 280 }}
            visibilityToggle
          />
        </PreferenceRow>
      )}

      {transport === 'events' && (
        <PreferenceRow
          label={t('settings.channels.slack.credentials.signingSecret.label', 'Signing Secret')}
          description={t(
            'settings.channels.slack.credentials.signingSecret.help',
            'Required for Events API. Basic Information → App Credentials → Signing Secret. Used to verify the X-Slack-Signature HMAC on every webhook delivery.',
          )}
        >
          <Input.Password
            value={signingSecret}
            onChange={setSigningSecret}
            placeholder={t(
              'settings.channels.slack.credentials.signingSecret.placeholder',
              '32-character hex signing secret',
            )}
            style={{ width: 280 }}
            visibilityToggle
          />
        </PreferenceRow>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.slack.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default SlackConfigForm;
