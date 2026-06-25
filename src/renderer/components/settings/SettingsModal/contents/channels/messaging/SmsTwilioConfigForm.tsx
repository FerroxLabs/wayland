/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Copy, RefreshCw } from 'lucide-react';
import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelAgentModelSelector from '@/renderer/components/settings/shared/forms/ChannelAgentModelSelector';
import type { GeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import { channel } from '@/common/adapter/ipcBridge';
import { Alert, Button, Input, Message, Tooltip } from '@arco-design/web-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PLUGIN_ID = 'sms-twilio';

/**
 * Preference row layout - mirrors the shape used by TelegramConfigForm so the
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

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

interface SmsTwilioConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  modelSelection: GeminiModelSelection;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
}

const SmsTwilioConfigForm: React.FC<SmsTwilioConfigFormProps> = ({ pluginStatus, modelSelection, onStatusChange: _onStatusChange }) => {
  const { t } = useTranslation();

  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [messagingServiceSid, setMessagingServiceSid] = useState('');

  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [testing, setTesting] = useState(false);

  const pluginInstanceId = pluginStatus?.id ?? `${PLUGIN_ID}_default`;

  // Audit fix v0.4.2: same pattern as webhook channel. Until the tunnel layer
  // resolves to a real hostname, do NOT compose a URL containing the
  // placeholder - Twilio Console rejects the URL on save and the operator
  // gets a confusing error after pasting `(configure tunnel in Phase 4)`.
  const TUNNEL_PLACEHOLDER = '(configure tunnel in Phase 4)';
  const rawTunnelHost = t(
    'settings.channels.smsTwilio.webhookUrl.tunnelPlaceholder',
    TUNNEL_PLACEHOLDER
  );
  const tunnelConfigured = rawTunnelHost !== TUNNEL_PLACEHOLDER && !rawTunnelHost.startsWith('(');

  const webhookUrl = useMemo(() => {
    if (!tunnelConfigured) return '';
    const tokenSegment = webhookToken ?? t('settings.channels.smsTwilio.webhookUrl.notMinted', '<not-minted>');
    return `https://${rawTunnelHost}/webhooks/sms-twilio/${tokenSegment}`;
  }, [webhookToken, tunnelConfigured, rawTunnelHost, t]);

  const fromNumberInvalid = fromNumber.length > 0 && !E164_REGEX.test(fromNumber);

  const handleCopyWebhookUrl = useCallback(() => {
    void navigator.clipboard
      .writeText(webhookUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  }, [webhookUrl, t]);

  const handleRotateWebhookUrl = useCallback(async () => {
    setRotating(true);
    try {
      // Mirror the agent assignment used by the rest of the channels stack -
      // operators wire SMS to the same default agent until per-platform agent
      // overrides land.
      const result = await channel.rotateWebhookToken.invoke({
        platform: 'sms-twilio',
        pluginInstanceId,
        agentId: 'default',
      });
      if (result.success && result.data) {
        setWebhookToken(result.data.token);
        Message.success(t('settings.channels.smsTwilio.webhookUrl.rotateSuccess', 'Webhook URL rotated'));
      } else {
        Message.error(result.msg ?? t('settings.channels.smsTwilio.webhookUrl.rotateFailed', 'Rotation failed'));
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setRotating(false);
    }
  }, [pluginInstanceId, t]);

  const handleTestAndEnable = useCallback(async () => {
    if (!accountSid.trim()) {
      Message.error(
        t('settings.channels.smsTwilio.credentials.accountSid.required', 'Account SID is required')
      );
      return;
    }
    if (!authToken.trim()) {
      Message.error(
        t('settings.channels.smsTwilio.credentials.authToken.required', 'Auth Token is required')
      );
      return;
    }
    if (!fromNumber.trim() && !messagingServiceSid.trim()) {
      Message.error(
        t(
          'settings.channels.smsTwilio.fromOrServiceRequired',
          'A From Number or Messaging Service SID is required'
        )
      );
      return;
    }
    if (fromNumber.trim() && !E164_REGEX.test(fromNumber.trim())) {
      Message.error(
        t(
          'settings.channels.smsTwilio.credentials.fromNumber.invalid',
          'Must be E.164 format, e.g. +14155550123'
        )
      );
      return;
    }
    setTesting(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: PLUGIN_ID,
        token: authToken.trim(),
      });
      if (!testResult.success) {
        Message.error(
          testResult.msg ??
            t('settings.channels.smsTwilio.connectionFailed', 'Twilio connection test failed')
        );
        return;
      }

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: PLUGIN_ID,
        config: {
          accountSid: accountSid.trim(),
          authToken: authToken.trim(),
          ...(fromNumber.trim() ? { fromNumber: fromNumber.trim() } : {}),
          ...(messagingServiceSid.trim()
            ? { messagingServiceSid: messagingServiceSid.trim() }
            : {}),
        },
      });
      if (enableResult.success) {
        Message.success(
          t('settings.channels.smsTwilio.pluginEnabled', 'SMS (Twilio) channel enabled')
        );
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.smsTwilio.enableFailed', 'Failed to enable Twilio SMS plugin')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTesting(false);
    }
  }, [accountSid, authToken, fromNumber, messagingServiceSid, t]);

  return (
    <div className='flex flex-col gap-24px'>
      <Alert
        type='warning'
        content={t(
          'settings.channels.smsTwilio.accountLockWarning',
          'Connecting a new SMS account will replace your existing one. Existing webhook URL becomes invalid.'
        )}
      />

      <PreferenceRow
        label={t('settings.channels.smsTwilio.credentials.accountSid.label', 'Account SID')}
        description={t(
          'settings.channels.smsTwilio.credentials.accountSid.help',
          'Find your Account SID in the Twilio Console dashboard. Starts with "AC".'
        )}
        required
      >
        <Input
          value={accountSid}
          onChange={(value) => setAccountSid(value)}
          placeholder={t('settings.channels.smsTwilio.credentials.accountSid.placeholder', 'ACxxxxxxxxxxxxxxxx')}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.smsTwilio.credentials.authToken.label', 'Auth Token')}
        description={t(
          'settings.channels.smsTwilio.credentials.authToken.help',
          'Treat the auth token like a password - Twilio signs every webhook with it.'
        )}
        required
      >
        <Input.Password
          value={authToken}
          onChange={(value) => setAuthToken(value)}
          placeholder={t('settings.channels.smsTwilio.credentials.authToken.placeholder', 'auth token')}
          visibilityToggle
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.smsTwilio.credentials.fromNumber.label', 'From Number')}
        description={t(
          'settings.channels.smsTwilio.credentials.fromNumber.help',
          'E.164 format, e.g. +14155550123. Provide either a From Number or a Messaging Service SID.'
        )}
      >
        <Tooltip
          content={
            fromNumberInvalid
              ? t(
                  'settings.channels.smsTwilio.credentials.fromNumber.invalid',
                  'Must be E.164 format, e.g. +14155550123'
                )
              : ''
          }
          disabled={!fromNumberInvalid}
        >
          <span>
            <Input
              value={fromNumber}
              onChange={(value) => setFromNumber(value)}
              placeholder={t('settings.channels.smsTwilio.credentials.fromNumber.placeholder', '+14155550123')}
              status={fromNumberInvalid ? 'error' : undefined}
              style={{ width: 280 }}
            />
          </span>
        </Tooltip>
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.smsTwilio.credentials.messagingServiceSid.label', 'Messaging Service SID')}
        description={t(
          'settings.channels.smsTwilio.credentials.messagingServiceSid.help',
          'Optional alternative to From Number. Use a Messaging Service to enable number pooling or sender ID rotation.'
        )}
      >
        <Input
          value={messagingServiceSid}
          onChange={(value) => setMessagingServiceSid(value)}
          placeholder={t(
            'settings.channels.smsTwilio.credentials.messagingServiceSid.placeholder',
            'MGxxxxxxxxxxxxxxxx'
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.smsTwilio.webhookUrl.label', 'Inbound Webhook URL')}
        description={t(
          'settings.channels.smsTwilio.webhookUrl.help',
          'Paste this URL into the Twilio number "A Message Comes In" webhook field (POST).'
        )}
      >
        <div className='flex items-center gap-8px'>
          <Input
            value={webhookUrl}
            readOnly
            style={{ width: 360 }}
            // Read-only display; Arco Input does not have an explicit disabled style for read-only,
            // so we rely on default theming.
          />
          <Button
            type='outline'
            icon={<Copy size={14} />}
            onClick={handleCopyWebhookUrl}
            disabled={webhookToken === null}
          >
            {t('settings.channels.smsTwilio.webhookUrl.copyButton', 'Copy')}
          </Button>
          <Button
            type='outline'
            icon={<RefreshCw size={14} />}
            loading={rotating}
            onClick={() => void handleRotateWebhookUrl()}
          >
            {t('settings.channels.smsTwilio.webhookUrl.rotateButton', 'Rotate')}
          </Button>
        </div>
      </PreferenceRow>

      <Alert
        type='info'
        content={t(
          'settings.channels.smsTwilio.a2pNotice',
          'US deployments require A2P 10DLC brand and campaign registration. Toll-free numbers require separate verification. Both processes can take several days.'
        )}
      />

      <div className='flex justify-end'>
        <Button type='primary' loading={testing} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.smsTwilio.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
      <ChannelAgentModelSelector platform='sms-twilio' modelSelection={modelSelection} />

    </div>
  );
};

export default SmsTwilioConfigForm;
