/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credential form for the generic Webhook channel plugin.
 */

import { Copy, RefreshCw } from 'lucide-react';
import type { IChannelPluginStatus } from '@process/channels/types';
import { channel } from '@/common/adapter/ipcBridge';
import { Alert, Button, Input, Message } from '@arco-design/web-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

type WebhookConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const WebhookConfigForm: React.FC<WebhookConfigFormProps> = ({
  pluginStatus,
  onStatusChange: _onStatusChange,
}) => {
  const { t } = useTranslation();

  const [outboundUrl, setOutboundUrl] = useState('');
  const [outboundSecret, setOutboundSecret] = useState('');
  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [testing, setTesting] = useState(false);

  const pluginInstanceId = pluginStatus?.id ?? 'webhook_default';

  // Tunnel host is supplied by the reverse-proxy / tunnel layer (Phase 4).
  // Until that resolves to a real hostname we MUST NOT compose and display a
  // URL containing the placeholder - operators would copy a malformed URL.
  const TUNNEL_PLACEHOLDER = '(configure tunnel in Phase 4)';
  const rawTunnelHost = t(
    'settings.channels.webhook.webhookUrl.tunnelPlaceholder',
    TUNNEL_PLACEHOLDER
  );
  const tunnelConfigured =
    rawTunnelHost !== TUNNEL_PLACEHOLDER && !rawTunnelHost.startsWith('(');

  const inboundUrl = useMemo(() => {
    if (!tunnelConfigured) return '';
    const tokenSegment =
      webhookToken ?? t('settings.channels.webhook.webhookUrl.notMinted', '<not-minted>');
    return `https://${rawTunnelHost}/webhooks/webhook/${tokenSegment}`;
  }, [webhookToken, tunnelConfigured, rawTunnelHost, t]);

  const handleCopyInboundUrl = useCallback(() => {
    void navigator.clipboard
      .writeText(inboundUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  }, [inboundUrl, t]);

  const handleRotateInboundUrl = useCallback(async () => {
    setRotating(true);
    try {
      const result = await channel.rotateWebhookToken.invoke({
        platform: 'webhook',
        pluginInstanceId,
        agentId: 'default',
      });
      if (result.success && result.data) {
        setWebhookToken(result.data.token);
        Message.success(
          t('settings.channels.webhook.webhookUrl.rotateSuccess', 'Inbound URL rotated')
        );
      } else {
        Message.error(
          result.msg ?? t('settings.channels.webhook.webhookUrl.rotateFailed', 'Rotation failed')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setRotating(false);
    }
  }, [pluginInstanceId, t]);

  const handleTestAndEnable = useCallback(async () => {
    if (!outboundUrl.trim()) {
      Message.error(
        t('settings.channels.webhook.credentials.outboundUrl.required', 'Outbound URL is required')
      );
      return;
    }
    setTesting(true);
    try {
      const tokenJson = JSON.stringify({
        outboundUrl: outboundUrl.trim(),
        ...(outboundSecret.trim() ? { outboundSecret: outboundSecret.trim() } : {}),
      });
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'webhook',
        token: tokenJson,
      });
      if (!testResult.success) {
        Message.error(
          testResult.msg ??
            t('settings.channels.webhook.connectionFailed', 'Connection test failed')
        );
        return;
      }

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'webhook',
        config: {
          outboundUrl: outboundUrl.trim(),
          ...(outboundSecret.trim() ? { outboundSecret: outboundSecret.trim() } : {}),
        },
      });
      if (enableResult.success) {
        Message.success(
          t('settings.channels.webhook.pluginEnabled', 'Webhook channel enabled')
        );
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.webhook.enableFailed', 'Failed to enable plugin')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTesting(false);
    }
  }, [outboundUrl, outboundSecret, t]);

  return (
    <div className='flex flex-col gap-24px'>
      <Alert
        type='info'
        content={t(
          'settings.channels.webhook.info',
          'Generic webhook bridge. Wayland POSTs outbound messages to your URL; your platform POSTs inbound messages to the Wayland inbound URL below.'
        )}
      />

      <PreferenceRow
        label={t('settings.channels.webhook.credentials.outboundUrl.label', 'Outbound URL')}
        description={t(
          'settings.channels.webhook.credentials.outboundUrl.help',
          'Wayland will POST outgoing messages to this URL. Must return 2xx.'
        )}
        required
      >
        <Input
          value={outboundUrl}
          onChange={(value) => setOutboundUrl(value)}
          placeholder={t(
            'settings.channels.webhook.credentials.outboundUrl.placeholder',
            'https://your-service.example.com/webhook'
          )}
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.webhook.credentials.outboundSecret.label',
          'Outbound Signing Secret'
        )}
        description={t(
          'settings.channels.webhook.credentials.outboundSecret.help',
          'Optional. When set, Wayland adds X-Webhook-Signature: sha256=<hmac> to every outbound POST.'
        )}
      >
        <Input.Password
          value={outboundSecret}
          onChange={(value) => setOutboundSecret(value)}
          placeholder={t(
            'settings.channels.webhook.credentials.outboundSecret.placeholder',
            'whsec_xxxxxxxxxxxxxxxx'
          )}
          visibilityToggle
          style={{ width: 280 }}
        />
      </PreferenceRow>

      {tunnelConfigured ? (
        <PreferenceRow
          label={t('settings.channels.webhook.webhookUrl.label', 'Inbound Webhook URL')}
          description={t(
            'settings.channels.webhook.webhookUrl.help',
            'Paste this URL into your platform as the webhook destination. The inbound secret is managed by Wayland.'
          )}
        >
          <div className='flex items-center gap-8px'>
            <Input value={inboundUrl} readOnly style={{ width: 360 }} />
            <Button
              type='outline'
              icon={<Copy size={14} />}
              onClick={handleCopyInboundUrl}
              disabled={webhookToken === null}
            >
              {t('settings.channels.webhook.webhookUrl.copyButton', 'Copy')}
            </Button>
            <Button
              type='outline'
              icon={<RefreshCw size={14} />}
              loading={rotating}
              onClick={() => void handleRotateInboundUrl()}
              disabled={webhookToken === null}
            >
              {t('settings.channels.webhook.webhookUrl.rotateButton', 'Rotate')}
            </Button>
          </div>
        </PreferenceRow>
      ) : (
        <Alert
          type='warning'
          content={t(
            'settings.channels.webhook.webhookUrl.tunnelNotConfigured',
            'Configure your reverse-proxy / tunnel first. Once a public hostname is reachable, the inbound webhook URL will appear here for you to copy.'
          )}
        />
      )}

      <div className='flex justify-end'>
        <Button type='primary' loading={testing} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.webhook.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default WebhookConfigForm;
