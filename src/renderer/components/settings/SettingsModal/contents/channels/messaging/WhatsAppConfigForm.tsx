/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WhatsAppConfigForm - three-backend WhatsApp configuration surface.
 *
 * - Baileys / whatsapp-web.js: no form-time credentials. The plugin spawns
 *   the bridge, the bridge emits a `qr.update` event, and we render the
 *   pairing QR for the operator to scan in their phone's WhatsApp app.
 * - Meta Business Cloud API: requires accessToken + phoneNumberId at form
 *   time (the bridge's connect handler verifies them via Graph API). We
 *   also display the inbound webhook URL with copy/rotate, mirroring the
 *   SmsTwilioConfigForm pattern, so the operator can paste it into Meta's
 *   webhook configuration page.
 */

import { Alert, Button, Input, Message, Radio } from '@arco-design/web-react';
import { Copy, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';

type WhatsAppBackend = 'baileys' | 'whatsapp-web' | 'meta-business';

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

export interface WhatsAppConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
}

const WhatsAppConfigForm: React.FC<WhatsAppConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [backend, setBackend] = useState<WhatsAppBackend>('baileys');
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  // W-2: Meta uses TWO secrets - `verifyToken` is operator-chosen and used
  // only on the GET subscription handshake; `appSecret` is the Facebook App
  // Secret used as HMAC key for the POST X-Hub-Signature-256 verification.
  // Both must be collected separately.
  const [verifyToken, setVerifyToken] = useState('');
  const [appSecret, setAppSecret] = useState('');

  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const pluginInstanceId = pluginStatus?.id ?? 'whatsapp_default';
  const hasExistingBot = !!pluginStatus?.hasToken;
  const qrCode = pluginStatus?.qrCode ?? null;

  // Audit fix v0.4.2: same pattern as webhook channel. Until the tunnel layer
  // resolves to a real hostname, do NOT compose a URL containing the
  // placeholder - Meta will reject it on validation and the operator gets a
  // confusing error after pasting `(configure tunnel in Phase 4)` into the
  // Meta dashboard.
  const TUNNEL_PLACEHOLDER = '(configure tunnel in Phase 4)';
  const rawTunnelHost = t(
    'settings.channels.whatsapp.webhookUrl.tunnelPlaceholder',
    TUNNEL_PLACEHOLDER,
  );
  const tunnelConfigured =
    rawTunnelHost !== TUNNEL_PLACEHOLDER && !rawTunnelHost.startsWith('(');

  const webhookUrl = useMemo(() => {
    if (!tunnelConfigured) return '';
    const tokenSegment =
      webhookToken ?? t('settings.channels.whatsapp.webhookUrl.notMinted', '<not-minted>');
    return `https://${rawTunnelHost}/webhooks/whatsapp/${tokenSegment}`;
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
        platform: 'whatsapp',
        pluginInstanceId,
        agentId: 'default',
      });
      if (result.success && result.data) {
        setWebhookToken(result.data.token);
        Message.success(
          t('settings.channels.whatsapp.webhookUrl.rotateSuccess', 'Webhook URL rotated'),
        );
      } else {
        Message.error(
          result.msg ?? t('settings.channels.whatsapp.webhookUrl.rotateFailed', 'Rotation failed'),
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setRotating(false);
    }
  }, [pluginInstanceId, t]);

  const handleTestAndEnable = useCallback(async () => {
    if (backend === 'meta-business') {
      if (!accessToken.trim() || !phoneNumberId.trim()) {
        Message.warning(
          t(
            'settings.channels.whatsapp.credentials.accessToken.required',
            'Access Token and Phone Number ID are required for Meta backend',
          ),
        );
        return;
      }
    }
    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'whatsapp_default',
        token: JSON.stringify({
          backend,
          accessToken: accessToken.trim(),
          phoneNumberId: phoneNumberId.trim(),
        }),
      });
      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.whatsapp.connectionFailed', 'Connection failed'),
        );
        return;
      }
      Message.success(
        t(
          'settings.channels.whatsapp.connectionSuccess',
          `Connected (${testResult.data.botUsername ?? backend})`,
        ),
      );

      const credentials: Record<string, string> = { backend };
      if (backend === 'meta-business') {
        credentials.accessToken = accessToken.trim();
        credentials.phoneNumberId = phoneNumberId.trim();
        if (businessAccountId.trim()) credentials.businessAccountId = businessAccountId.trim();
        if (verifyToken.trim()) credentials.verifyToken = verifyToken.trim();
        if (appSecret.trim()) credentials.appSecret = appSecret.trim();
      }
      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'whatsapp_default',
        config: credentials,
      });
      if (enableResult.success) {
        Message.success(
          t('settings.channels.whatsapp.pluginEnabled', 'WhatsApp plugin enabled'),
        );
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange?.(statusResult.data.find((p) => p.type === 'whatsapp') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.whatsapp.enableFailed', 'Failed to enable plugin'),
        );
      }
    } catch (error) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTestLoading(false);
    }
  }, [backend, accessToken, phoneNumberId, businessAccountId, verifyToken, appSecret, t, onStatusChange]);

  const showMetaFields = backend === 'meta-business';
  const showQrSection = backend !== 'meta-business';

  return (
    <div className='flex flex-col gap-24px'>
      {hasExistingBot && (
        <Alert
          type='warning'
          content={t(
            'settings.channels.whatsapp.accountLockWarning',
            'Connecting a new WhatsApp account will replace your existing one. Existing QR pairing or webhook URL becomes invalid.',
          )}
        />
      )}

      <PreferenceRow
        label={t('settings.channels.whatsapp.credentials.backend.label', 'Backend')}
        description={t(
          'settings.channels.whatsapp.credentials.backend.help',
          'Baileys is recommended for personal accounts. Meta Business is required for verified business accounts and templated messaging. Changing the backend after the channel is enabled requires disabling and re-enabling the plugin to take effect.',
        )}
        required
      >
        <Radio.Group
          type='button'
          value={backend}
          onChange={(value: WhatsAppBackend) => setBackend(value)}
        >
          <Radio value='baileys'>
            {t('settings.channels.whatsapp.credentials.backend.baileys', 'Baileys')}
          </Radio>
          <Radio value='whatsapp-web'>
            {t('settings.channels.whatsapp.credentials.backend.whatsappWeb', 'WhatsApp Web.js')}
          </Radio>
          <Radio value='meta-business'>
            {t('settings.channels.whatsapp.credentials.backend.metaBusiness', 'Meta Business')}
          </Radio>
        </Radio.Group>
      </PreferenceRow>

      {showMetaFields && (
        <>
          <PreferenceRow
            label={t('settings.channels.whatsapp.credentials.accessToken.label', 'Access Token')}
            description={t(
              'settings.channels.whatsapp.credentials.accessToken.help',
              'Meta system-user or temporary access token. Generated in Meta Business Suite → System Users.',
            )}
            required
          >
            <Input.Password
              value={accessToken}
              onChange={setAccessToken}
              placeholder={t(
                'settings.channels.whatsapp.credentials.accessToken.placeholder',
                'EAAG...your-token...',
              )}
              visibilityToggle
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t(
              'settings.channels.whatsapp.credentials.phoneNumberId.label',
              'Phone Number ID',
            )}
            description={t(
              'settings.channels.whatsapp.credentials.phoneNumberId.help',
              'Numeric ID from Meta Business → WhatsApp → Phone Numbers. Not the phone number itself.',
            )}
            required
          >
            <Input
              value={phoneNumberId}
              onChange={setPhoneNumberId}
              placeholder={t(
                'settings.channels.whatsapp.credentials.phoneNumberId.placeholder',
                '123456789012345',
              )}
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t(
              'settings.channels.whatsapp.credentials.businessAccountId.label',
              'Business Account ID',
            )}
            description={t(
              'settings.channels.whatsapp.credentials.businessAccountId.help',
              'Optional. Enables richer metadata in inbound message events.',
            )}
          >
            <Input
              value={businessAccountId}
              onChange={setBusinessAccountId}
              placeholder={t(
                'settings.channels.whatsapp.credentials.businessAccountId.placeholder',
                '987654321098765',
              )}
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.whatsapp.credentials.verifyToken.label', 'Verify Token')}
            description={t(
              'settings.channels.whatsapp.credentials.verifyToken.help',
              'Operator-chosen string Meta echoes during the GET /webhook handshake. Must match what you paste into the Meta dashboard - Meta will 403 the subscription if blank or wrong.',
            )}
            required
          >
            <Input.Password
              value={verifyToken}
              onChange={setVerifyToken}
              placeholder={t(
                'settings.channels.whatsapp.credentials.verifyToken.placeholder',
                'a long random string',
              )}
              visibilityToggle
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.whatsapp.credentials.appSecret.label', 'App Secret')}
            description={t(
              'settings.channels.whatsapp.credentials.appSecret.help',
              'Meta App Secret (Meta App Dashboard → Settings → Basic → App Secret). Used to HMAC-verify the X-Hub-Signature-256 header on incoming webhook deliveries. Different from the Verify Token above.',
            )}
            required
          >
            <Input.Password
              value={appSecret}
              onChange={setAppSecret}
              placeholder={t(
                'settings.channels.whatsapp.credentials.appSecret.placeholder',
                '32-character hex string',
              )}
              visibilityToggle
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.whatsapp.webhookUrl.label', 'Inbound Webhook URL')}
            description={t(
              'settings.channels.whatsapp.webhookUrl.help',
              'Paste this URL into Meta Business → WhatsApp → Configuration → Webhook callback URL.',
            )}
          >
            <div className='flex items-center gap-8px'>
              <Input.Password
                value={webhookUrl}
                readOnly
                visibilityToggle
                style={{ width: 360 }}
              />
              <Button
                type='outline'
                icon={<Copy size={14} />}
                onClick={handleCopyWebhookUrl}
                disabled={webhookToken === null}
              >
                {t('settings.channels.whatsapp.webhookUrl.copyButton', 'Copy')}
              </Button>
              <Button
                type='outline'
                icon={<RefreshCw size={14} />}
                loading={rotating}
                onClick={() => void handleRotateWebhookUrl()}
              >
                {t('settings.channels.whatsapp.webhookUrl.rotateButton', 'Rotate')}
              </Button>
            </div>
          </PreferenceRow>
        </>
      )}

      {showQrSection && (
        <div className='flex flex-col gap-12px p-16px rd-8px bg-fill-1 border border-line'>
          <span className='text-14px text-t-primary font-medium'>
            {t('settings.channels.whatsapp.qrPairing.title', 'QR Pairing')}
          </span>
          <span className='text-12px text-t-tertiary'>
            {t(
              'settings.channels.whatsapp.qrPairing.help',
              'Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan the code below. The code rotates every minute until paired.',
            )}
          </span>
          <div className='flex justify-center pt-8px'>
            {qrCode ? (
              <QRCodeSVG value={qrCode} size={200} includeMargin />
            ) : (
              <span className='text-12px text-t-tertiary'>
                {t(
                  'settings.channels.whatsapp.qrPairing.refreshing',
                  'Waiting for pairing code from bridge…',
                )}
              </span>
            )}
          </div>
        </div>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.whatsapp.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppConfigForm;
