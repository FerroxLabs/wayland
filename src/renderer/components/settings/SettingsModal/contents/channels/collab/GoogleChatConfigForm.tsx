/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google Chat (Workspace) bot configuration form.
 *
 * Credentials required:
 *   - serviceAccountJson: full contents of a Google Cloud service-account keyfile
 *   - audience: JWT audience claim for webhook verification (project number or app URL)
 *
 * Test connection mints a token and calls /v1/spaces?pageSize=1 to confirm the
 * service account has Chat API access.
 */

import { Alert, Button, Input, Message, Select } from '@arco-design/web-react';
import { Copy } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelAgentModelSelector from '@/renderer/components/settings/shared/forms/ChannelAgentModelSelector';
import type { GeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';

const PreferenceRow: React.FC<{
  label: string;
  description?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, description, required, children }) => (
  <div className='flex items-start justify-between gap-24px py-12px'>
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

export type GoogleChatConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  modelSelection: GeminiModelSelection;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const GoogleChatConfigForm: React.FC<GoogleChatConfigFormProps> = ({
  pluginStatus,
  modelSelection,
  onStatusChange,
}) => {
  const { t } = useTranslation();

  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [audience, setAudience] = useState('');
  const [transport, setTransport] = useState<'webhook' | 'pubsub'>('webhook');
  const [subscriptionName, setSubscriptionName] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [webhookToken, setWebhookToken] = useState<string | null>(null);

  const hasExisting = !!pluginStatus?.hasToken;
  const pluginInstanceId = pluginStatus?.id ?? 'google-chat_default';

  const inboundUrl = useMemo(() => {
    const tokenSegment = webhookToken ?? t('settings.channels.googleChat.webhookUrl.notMinted', '<not-minted>');
    return `{base-url}/webhooks/google-chat/${tokenSegment}`;
  }, [webhookToken, t]);

  const handleCopyInboundUrl = useCallback(() => {
    if (!webhookToken) return;
    void navigator.clipboard
      .writeText(inboundUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  }, [inboundUrl, webhookToken, t]);

  const handleTestAndEnable = useCallback(async () => {
    if (!serviceAccountJson.trim()) {
      Message.warning(
        t('settings.channels.googleChat.credentials.serviceAccountRequired', 'Service Account JSON is required')
      );
      return;
    }
    if (transport === 'webhook' && !audience.trim()) {
      Message.warning(
        t(
          'settings.channels.googleChat.credentials.audienceRequired',
          'JWT audience is required for the webhook transport'
        )
      );
      return;
    }
    if (transport === 'pubsub' && !subscriptionName.trim()) {
      Message.warning(
        t(
          'settings.channels.googleChat.credentials.subscriptionRequired',
          'Subscription name is required for the Pub/Sub transport'
        )
      );
      return;
    }

    setTestLoading(true);
    try {
      const tokenJson = JSON.stringify({
        serviceAccountJson: serviceAccountJson.trim(),
        audience: audience.trim(),
        transport,
        subscriptionName: subscriptionName.trim(),
      });

      const testResult = await channel.testPlugin.invoke({
        pluginId: 'google-chat_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ?? t('settings.channels.googleChat.connectionFailed', 'Google Chat connection failed')
        );
        return;
      }

      Message.success(
        t('settings.channels.googleChat.connectionSuccess', {
          email: testResult.data.botUsername ?? 'service account',
          defaultValue: `Connected as ${testResult.data.botUsername ?? 'service account'}`,
        })
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'google-chat_default',
        config: {
          serviceAccountJson: serviceAccountJson.trim(),
          audience: audience.trim(),
          transport,
          subscriptionName: subscriptionName.trim(),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.googleChat.pluginEnabled', 'Google Chat plugin enabled'));
        // Webhook transport needs an inbound URL minted for the WebhookReceiver.
        // The Pub/Sub transport pulls events itself, so no public URL is minted.
        if (transport === 'webhook') {
          // Mint inbound webhook URL - secret for Google Chat is the JWT audience
          const rotateResult = await channel.rotateWebhookToken.invoke({
            platform: 'google-chat',
            pluginInstanceId,
            agentId: 'default',
            secret: audience.trim(),
          });
          if (rotateResult.success && rotateResult.data) {
            setWebhookToken(rotateResult.data.token);
          }
        }
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange?.(statusResult.data.find((p) => p.type === 'google-chat') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.googleChat.enableFailed', 'Failed to enable Google Chat plugin')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  }, [serviceAccountJson, audience, transport, subscriptionName, pluginInstanceId, t, onStatusChange]);

  return (
    <div className='flex flex-col gap-24px'>
      {hasExisting && (
        <Alert
          type='warning'
          content={t(
            'settings.channels.googleChat.replaceWarning',
            'Saving new credentials will replace the existing Google Chat bot connection.'
          )}
        />
      )}

      <PreferenceRow
        label={t('settings.channels.googleChat.credentials.serviceAccountJson.label', 'Service Account JSON')}
        description={t(
          'settings.channels.googleChat.credentials.serviceAccountJson.help',
          'Paste the full contents of your Google Cloud service-account keyfile (JSON). The bot must have the Chat API scope (chat.bot).'
        )}
        required
      >
        <Input.TextArea
          value={serviceAccountJson}
          onChange={setServiceAccountJson}
          placeholder={t(
            'settings.channels.googleChat.credentials.serviceAccountJson.placeholder',
            '{ "type": "service_account", "project_id": "...", ... }'
          )}
          autoSize={{ minRows: 4, maxRows: 8 }}
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.googleChat.transport.label', 'Inbound Transport')}
        description={t(
          'settings.channels.googleChat.transport.help',
          'Webhook needs a public HTTPS URL. Pub/Sub pulls events from a Google Cloud subscription and works with no public URL (recommended for desktop).'
        )}
        required
      >
        <Select
          value={transport}
          onChange={(value) => setTransport(value as 'webhook' | 'pubsub')}
          style={{ width: 320 }}
          options={[
            {
              label: t('settings.channels.googleChat.transport.webhook', 'Webhook (public URL)'),
              value: 'webhook',
            },
            {
              label: t('settings.channels.googleChat.transport.pubsub', 'Pub/Sub pull (no public URL)'),
              value: 'pubsub',
            },
          ]}
        />
      </PreferenceRow>

      {transport === 'webhook' && (
        <PreferenceRow
          label={t('settings.channels.googleChat.credentials.audience.label', 'JWT Audience')}
          description={t(
            'settings.channels.googleChat.credentials.audience.help',
            "The expected `aud` claim in Google Chat's Bearer JWT. Use your Google Cloud project number (e.g. 123456789012) or the registered app URL."
          )}
          required
        >
          <Input
            value={audience}
            onChange={setAudience}
            placeholder={t(
              'settings.channels.googleChat.credentials.audience.placeholder',
              '123456789012 OR https://your-app-url'
            )}
            style={{ width: 320 }}
          />
        </PreferenceRow>
      )}

      {transport === 'pubsub' && (
        <PreferenceRow
          label={t('settings.channels.googleChat.credentials.subscriptionName.label', 'Pub/Sub Subscription')}
          description={t(
            'settings.channels.googleChat.credentials.subscriptionName.help',
            'Full pull-subscription path the Chat app publishes to. Format: projects/<project>/subscriptions/<sub>. The service account needs the Pub/Sub Subscriber role on it.'
          )}
          required
        >
          <Input
            value={subscriptionName}
            onChange={setSubscriptionName}
            placeholder='projects/my-project/subscriptions/wayland-chat-sub'
            style={{ width: 320 }}
          />
        </PreferenceRow>
      )}

      {transport === 'webhook' && webhookToken !== null && (
        <PreferenceRow
          label={t('settings.channels.googleChat.webhookUrl.label', 'Inbound Webhook URL')}
          description={t(
            'settings.channels.googleChat.webhookUrl.help',
            'Paste this URL into Google Cloud Console → Google Chat API → Configuration → App URL.'
          )}
        >
          <div className='flex items-center gap-8px'>
            <Input value={inboundUrl} readOnly style={{ width: 360 }} />
            <Button type='outline' icon={<Copy size={14} />} onClick={handleCopyInboundUrl}>
              {t('settings.channels.googleChat.webhookUrl.copyButton', 'Copy')}
            </Button>
          </div>
        </PreferenceRow>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.googleChat.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
      <ChannelAgentModelSelector platform='google-chat' modelSelection={modelSelection} />
    </div>
  );
};

export default GoogleChatConfigForm;
