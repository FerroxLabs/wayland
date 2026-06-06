/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LINE Messaging API bot configuration form.
 *
 * Credentials required:
 *   - channelAccessToken: long-lived token from LINE Developers Console
 *   - channelSecret: used for HMAC-SHA256 webhook signature verification
 *
 * Test connection calls /v2/bot/info via the main-process testPlugin IPC and
 * displays the bot's displayName on success.
 */

import { Alert, Button, Input, Message } from '@arco-design/web-react';
import { Copy } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
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

export type LineConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const LineConfigForm: React.FC<LineConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [channelAccessToken, setChannelAccessToken] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [webhookToken, setWebhookToken] = useState<string | null>(null);

  const hasExistingBot = !!pluginStatus?.hasToken;
  const pluginInstanceId = pluginStatus?.id ?? 'line_default';

  const inboundUrl = useMemo(() => {
    const tokenSegment = webhookToken ?? t('settings.channels.line.webhookUrl.notMinted', '<not-minted>');
    return `{base-url}/webhooks/line/${tokenSegment}`;
  }, [webhookToken, t]);

  const handleCopyInboundUrl = useCallback(() => {
    if (!webhookToken) return;
    void navigator.clipboard
      .writeText(inboundUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  }, [inboundUrl, webhookToken, t]);

  const handleTestAndEnable = useCallback(async () => {
    if (!channelAccessToken.trim() || !channelSecret.trim()) {
      Message.warning(
        t(
          'settings.channels.line.credentials.bothRequired',
          'Channel Access Token and Channel Secret are required',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const tokenJson = JSON.stringify({
        channelAccessToken: channelAccessToken.trim(),
        channelSecret: channelSecret.trim(),
      });

      const testResult = await channel.testPlugin.invoke({
        pluginId: 'line_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.line.connectionFailed', 'Connection failed'),
        );
        return;
      }

      Message.success(
        t(
          'settings.channels.line.connectionSuccess',
          `Connected as ${testResult.data.botUsername ?? 'LINE Bot'}`,
        ),
      );

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'line_default',
        config: {
          channelAccessToken: channelAccessToken.trim(),
          channelSecret: channelSecret.trim(),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.line.pluginEnabled', 'LINE plugin enabled'));
        // Mint inbound webhook URL - secret for LINE is the channelSecret
        const rotateResult = await channel.rotateWebhookToken.invoke({
          platform: 'line',
          pluginInstanceId,
          agentId: 'default',
          secret: channelSecret.trim(),
        });
        if (rotateResult.success && rotateResult.data) {
          setWebhookToken(rotateResult.data.token);
        }
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange?.(statusResult.data.find((p) => p.type === 'line') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.line.enableFailed', 'Failed to enable plugin'),
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  }, [channelAccessToken, channelSecret, pluginInstanceId, t, onStatusChange]);

  return (
    <div className='flex flex-col gap-24px'>
      {hasExistingBot && (
        <Alert
          type='warning'
          content={t(
            'settings.channels.line.accountLockWarning',
            'Saving new credentials will replace the existing LINE bot connection.',
          )}
        />
      )}

      <PreferenceRow
        label={t('settings.channels.line.credentials.channelAccessToken.label', 'Channel Access Token')}
        description={t(
          'settings.channels.line.credentials.channelAccessToken.help',
          'Long-lived token from LINE Developers Console → Messaging API → Channel access token.',
        )}
        required
      >
        <Input.Password
          value={channelAccessToken}
          onChange={setChannelAccessToken}
          placeholder={t(
            'settings.channels.line.credentials.channelAccessToken.placeholder',
            'Paste your channel access token',
          )}
          visibilityToggle
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.line.credentials.channelSecret.label', 'Channel Secret')}
        description={t(
          'settings.channels.line.credentials.channelSecret.help',
          'Channel secret from LINE Developers Console → Basic settings. Used to verify webhook signatures.',
        )}
        required
      >
        <Input.Password
          value={channelSecret}
          onChange={setChannelSecret}
          placeholder={t(
            'settings.channels.line.credentials.channelSecret.placeholder',
            'Paste your channel secret',
          )}
          visibilityToggle
          style={{ width: 320 }}
        />
      </PreferenceRow>

      {webhookToken !== null && (
        <PreferenceRow
          label={t('settings.channels.line.webhookUrl.label', 'Inbound Webhook URL')}
          description={t(
            'settings.channels.line.webhookUrl.help',
            'Paste this URL into LINE Developers Console → Messaging API → Webhook URL.',
          )}
        >
          <div className='flex items-center gap-8px'>
            <Input value={inboundUrl} readOnly style={{ width: 360 }} />
            <Button
              type='outline'
              icon={<Copy size={14} />}
              onClick={handleCopyInboundUrl}
            >
              {t('settings.channels.line.webhookUrl.copyButton', 'Copy')}
            </Button>
          </div>
        </PreferenceRow>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.line.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default LineConfigForm;
