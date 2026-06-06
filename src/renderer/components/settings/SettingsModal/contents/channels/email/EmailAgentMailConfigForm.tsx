/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Copy, RefreshCw } from 'lucide-react';
import type { IChannelPluginStatus } from '@process/channels/types';
import { channel } from '@/common/adapter/ipcBridge';
import { Alert, Button, Input, Message } from '@arco-design/web-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Preference row layout - mirrors the shape used by SmsTwilioConfigForm so the
 * Settings page reads consistently across channels.
 */
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

type EmailAgentMailConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const EmailAgentMailConfigForm: React.FC<EmailAgentMailConfigFormProps> = ({
  pluginStatus,
  onStatusChange: _onStatusChange,
}) => {
  const { t } = useTranslation();

  const [apiKey, setApiKey] = useState('');
  const [inboxAddress, setInboxAddress] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [testing, setTesting] = useState(false);

  const pluginInstanceId = pluginStatus?.id ?? 'email-agentmail_default';

  // Audit fix v0.4.2: same pattern as webhook channel. Don't compose a URL
  // with the placeholder literal - AgentMail will reject the webhook config.
  const TUNNEL_PLACEHOLDER = '(configure tunnel in Phase 4)';
  const rawTunnelHost = t(
    'settings.channels.emailAgentMail.webhookUrl.tunnelPlaceholder',
    TUNNEL_PLACEHOLDER
  );
  const tunnelConfigured =
    rawTunnelHost !== TUNNEL_PLACEHOLDER && !rawTunnelHost.startsWith('(');

  const webhookUrl = useMemo(() => {
    if (!tunnelConfigured) return '';
    const tokenSegment =
      webhookToken ?? t('settings.channels.emailAgentMail.webhookUrl.notMinted', '<not-minted>');
    return `https://${rawTunnelHost}/webhooks/email-agentmail/${tokenSegment}`;
  }, [webhookToken, tunnelConfigured, rawTunnelHost, t]);

  const handleCopyWebhookUrl = useCallback(() => {
    void navigator.clipboard
      .writeText(webhookUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  }, [webhookUrl, t]);

  const handleRotateWebhookUrl = useCallback(async () => {
    setRotating(true);
    try {
      const result = await channel.rotateWebhookToken.invoke({
        platform: 'email-agentmail',
        pluginInstanceId,
        agentId: 'default',
      });
      if (result.success && result.data) {
        setWebhookToken(result.data.token);
        Message.success(
          t('settings.channels.emailAgentMail.webhookUrl.rotateSuccess', 'Webhook URL rotated')
        );
      } else {
        Message.error(
          result.msg ??
            t('settings.channels.emailAgentMail.webhookUrl.rotateFailed', 'Rotation failed')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setRotating(false);
    }
  }, [pluginInstanceId, t]);

  const handleTestAndEnable = useCallback(async () => {
    if (!apiKey.trim()) {
      Message.error(
        t('settings.channels.emailAgentMail.credentials.apiKey.required', 'API key is required')
      );
      return;
    }
    setTesting(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'email-agentmail',
        token: apiKey.trim(),
      });
      if (!testResult.success) {
        Message.error(
          testResult.msg ??
            t('settings.channels.emailAgentMail.connectionFailed', 'Connection test failed')
        );
        return;
      }

      // testConnection returns the inbox address as `botUsername` (per
      // ChannelManager normalization). If the user didn't type one in,
      // auto-populate the state field AND use the freshly-resolved value in
      // the enablePlugin payload - React state setters are async, so we can't
      // rely on `inboxAddress` updating in time for the call below.
      const discoveredInbox =
        typeof testResult.data?.botUsername === 'string' ? testResult.data.botUsername : '';
      const resolvedInbox = inboxAddress.trim() || discoveredInbox;
      if (!resolvedInbox) {
        Message.warning(
          t(
            'settings.channels.emailAgentMail.credentials.inboxAddress.required',
            'AgentMail inbox address required'
          )
        );
        return;
      }
      if (!inboxAddress.trim() && discoveredInbox) {
        setInboxAddress(discoveredInbox);
      }

      // Persist credentials + enable the plugin so the runtime picks them up.
      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'email-agentmail',
        config: {
          apiKey: apiKey.trim(),
          inboxAddress: resolvedInbox,
          ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
        },
      });
      if (enableResult.success) {
        Message.success(
          t('settings.channels.emailAgentMail.pluginEnabled', 'AgentMail channel enabled')
        );
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.emailAgentMail.enableFailed', 'Failed to enable plugin')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTesting(false);
    }
  }, [apiKey, inboxAddress, webhookSecret, t]);

  return (
    <div className='flex flex-col gap-24px'>
      <Alert
        type='warning'
        content={t(
          'settings.channels.emailAgentMail.accountLockWarning',
          'Connecting a new AgentMail account will replace your existing one. Existing webhook URL becomes invalid.'
        )}
      />

      <PreferenceRow
        label={t('settings.channels.emailAgentMail.credentials.apiKey.label', 'API Key')}
        description={t(
          'settings.channels.emailAgentMail.credentials.apiKey.help',
          'AgentMail dashboard → API Keys. Treat like a password.'
        )}
        required
      >
        <Input.Password
          value={apiKey}
          onChange={(value) => setApiKey(value)}
          placeholder={t(
            'settings.channels.emailAgentMail.credentials.apiKey.placeholder',
            'am_xxxxxxxxxxxxxxxx'
          )}
          visibilityToggle
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.emailAgentMail.credentials.inboxAddress.label',
          'Inbox Address'
        )}
        description={t(
          'settings.channels.emailAgentMail.credentials.inboxAddress.help',
          'The dedicated inbox AgentMail provisioned for this agent, e.g. agent@workspace.agentmail.to.'
        )}
        required
      >
        <Input
          value={inboxAddress}
          onChange={(value) => setInboxAddress(value)}
          placeholder={t(
            'settings.channels.emailAgentMail.credentials.inboxAddress.placeholder',
            'agent@workspace.agentmail.to'
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.emailAgentMail.credentials.webhookSecret.label',
          'Webhook Secret'
        )}
        description={t(
          'settings.channels.emailAgentMail.credentials.webhookSecret.help',
          'Optional HMAC secret AgentMail uses to sign webhook deliveries. Copy from the AgentMail dashboard.'
        )}
      >
        <Input.Password
          value={webhookSecret}
          onChange={(value) => setWebhookSecret(value)}
          placeholder={t(
            'settings.channels.emailAgentMail.credentials.webhookSecret.placeholder',
            'whsec_xxxxxxxxxxxxxxxx'
          )}
          visibilityToggle
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailAgentMail.webhookUrl.label', 'Inbound Webhook URL')}
        description={t(
          'settings.channels.emailAgentMail.webhookUrl.help',
          'Paste this URL into the AgentMail dashboard "Webhook URL" field.'
        )}
      >
        <div className='flex items-center gap-8px'>
          <Input value={webhookUrl} readOnly style={{ width: 360 }} />
          <Button
            type='outline'
            icon={<Copy size={14} />}
            onClick={handleCopyWebhookUrl}
            disabled={webhookToken === null}
          >
            {t('settings.channels.emailAgentMail.webhookUrl.copyButton', 'Copy')}
          </Button>
          <Button
            type='outline'
            icon={<RefreshCw size={14} />}
            loading={rotating}
            onClick={() => void handleRotateWebhookUrl()}
          >
            {t('settings.channels.emailAgentMail.webhookUrl.rotateButton', 'Rotate')}
          </Button>
        </div>
      </PreferenceRow>

      <div className='flex justify-end'>
        <Button type='primary' loading={testing} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.emailAgentMail.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default EmailAgentMailConfigForm;
