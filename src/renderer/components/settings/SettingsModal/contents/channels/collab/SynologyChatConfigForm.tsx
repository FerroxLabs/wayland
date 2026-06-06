/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credential form for the Synology Chat channel plugin.
 * Mirrors MattermostConfigForm: JSON-encode creds for testPlugin IPC,
 * then enablePlugin with the raw credential fields.
 */

import { Button, Input, Message, Switch } from '@arco-design/web-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy } from 'lucide-react';

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

export interface SynologyChatConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const SynologyChatConfigForm: React.FC<SynologyChatConfigFormProps> = ({
  pluginStatus,
  onStatusChange,
}) => {
  const { t } = useTranslation();

  const [incomingUrl, setIncomingUrl] = useState('');
  const [incomingToken, setIncomingToken] = useState('');
  const [allowInsecureSsl, setAllowInsecureSsl] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [webhookToken, setWebhookToken] = useState<string | null>(null);

  const hasExisting = !!pluginStatus?.hasToken;
  const pluginInstanceId = pluginStatus?.id ?? 'synology-chat_default';

  const inboundUrl = useMemo(() => {
    const tokenSegment = webhookToken ?? t('settings.channels.synologyChat.webhookUrl.notMinted', '<not-minted>');
    return `{base-url}/webhooks/synology-chat/${tokenSegment}`;
  }, [webhookToken, t]);

  const handleCopyInboundUrl = () => {
    if (!webhookToken) return;
    void navigator.clipboard
      .writeText(inboundUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  };

  const handleTestAndEnable = async () => {
    if (!incomingUrl.trim()) {
      Message.warning(
        t(
          'settings.channels.synologyChat.credentials.incomingUrl.required',
          'Please enter the Synology Chat incoming webhook URL',
        ),
      );
      return;
    }
    if (!incomingToken.trim()) {
      Message.warning(
        t(
          'settings.channels.synologyChat.credentials.incomingToken.required',
          'Please enter the webhook token',
        ),
      );
      return;
    }

    const tokenJson = JSON.stringify({
      incomingUrl: incomingUrl.trim(),
      incomingToken: incomingToken.trim(),
      allowInsecureSsl,
    });

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'synology-chat_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t(
              'settings.channels.synologyChat.connectionFailed',
              'Synology Chat connection failed',
            ),
        );
        return;
      }

      Message.success(
        t('settings.channels.synologyChat.connectionSuccess', 'Synology Chat connected'),
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'synology-chat_default',
        config: {
          incomingUrl: incomingUrl.trim(),
          incomingToken: incomingToken.trim(),
          allowInsecureSsl,
        },
      });

      if (enableResult.success) {
        Message.success(
          t('settings.channels.synologyChat.pluginEnabled', 'Synology Chat plugin enabled'),
        );
        // Mint inbound webhook URL - secret for Synology Chat is the incomingToken
        const rotateResult = await channel.rotateWebhookToken.invoke({
          platform: 'synology-chat',
          pluginInstanceId,
          agentId: 'default',
          secret: incomingToken.trim(),
        });
        if (rotateResult.success && rotateResult.data) {
          setWebhookToken(rotateResult.data.token);
        }
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(
            statusResult.data.find((p) => p.type === 'synology-chat') ?? null,
          );
        }
      } else {
        Message.error(
          enableResult.msg ??
            t(
              'settings.channels.synologyChat.enableFailed',
              'Failed to enable Synology Chat plugin',
            ),
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
              'settings.channels.synologyChat.replaceWarning',
              'Connecting a new Synology Chat account will replace your existing one.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t(
          'settings.channels.synologyChat.credentials.incomingUrl.label',
          'Incoming Webhook URL',
        )}
        description={t(
          'settings.channels.synologyChat.credentials.incomingUrl.help',
          'The webhook URL from Synology Chat: Chat app → user-profile menu → Integration → Incoming Webhooks. We POST replies here.',
        )}
      >
        <Input
          value={incomingUrl}
          onChange={setIncomingUrl}
          placeholder={t(
            'settings.channels.synologyChat.credentials.incomingUrl.placeholder',
            'https://your-nas/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&...',
          )}
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.synologyChat.credentials.incomingToken.label',
          'Webhook Token',
        )}
        description={t(
          'settings.channels.synologyChat.credentials.incomingToken.help',
          'The token Synology Chat sends with each outgoing webhook request (Outgoing Webhooks → Token). Used to verify inbound deliveries.',
        )}
      >
        <Input.Password
          value={incomingToken}
          onChange={setIncomingToken}
          placeholder={
            hasExisting
              ? '••••••••••••••••'
              : t(
                  'settings.channels.synologyChat.credentials.incomingToken.placeholder',
                  'your-synology-webhook-token',
                )
          }
          style={{ width: 320 }}
          visibilityToggle
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.synologyChat.credentials.allowInsecureSsl.label',
          'Allow self-signed certificate (LAN Synology NAS)',
        )}
        description={t(
          'settings.channels.synologyChat.credentials.allowInsecureSsl.help',
          'Only enable for local-network Synology with a self-signed cert. Never enable for public Synology hosts.',
        )}
      >
        <Switch checked={allowInsecureSsl} onChange={setAllowInsecureSsl} />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.synologyChat.howTo',
          'Setup guide: Synology Chat → Administration → Integrations → Incoming/Outgoing Webhooks.',
        )}
      </div>

      {webhookToken !== null && (
        <div className='flex items-center justify-between gap-24px py-12px'>
          <div className='flex-1'>
            <span className='text-14px text-t-primary'>
              {t('settings.channels.synologyChat.webhookUrl.label', 'Inbound Webhook URL')}
            </span>
            <div className='text-12px text-t-tertiary mt-2px'>
              {t(
                'settings.channels.synologyChat.webhookUrl.help',
                'Paste this URL into Synology Chat → Outgoing Webhooks → Outgoing URL.',
              )}
            </div>
          </div>
          <div className='flex items-center gap-8px'>
            <Input value={inboundUrl} readOnly style={{ width: 360 }} />
            <Button
              type='outline'
              icon={<Copy size={14} />}
              onClick={handleCopyInboundUrl}
            >
              {t('settings.channels.synologyChat.webhookUrl.copyButton', 'Copy')}
            </Button>
          </div>
        </div>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.synologyChat.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default SynologyChatConfigForm;
