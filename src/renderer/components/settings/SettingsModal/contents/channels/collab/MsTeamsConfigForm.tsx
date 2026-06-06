/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * MS Teams credential form - appId + appPassword + optional tenantId.
 * Mirrors MatrixConfigForm shape: JSON-encodes creds for testPlugin IPC.
 */

import { Button, Input, Message } from '@arco-design/web-react';
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

export interface MsTeamsConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const MsTeamsConfigForm: React.FC<MsTeamsConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [appId, setAppId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [webhookToken, setWebhookToken] = useState<string | null>(null);

  const hasExisting = !!pluginStatus?.hasToken;
  const pluginInstanceId = pluginStatus?.id ?? 'ms-teams_default';

  const inboundUrl = useMemo(() => {
    const tokenSegment = webhookToken ?? t('settings.channels.msTeams.webhookUrl.notMinted', '<not-minted>');
    return `{base-url}/webhooks/ms-teams/${tokenSegment}`;
  }, [webhookToken, t]);

  const handleCopyInboundUrl = () => {
    if (!webhookToken) return;
    void navigator.clipboard
      .writeText(inboundUrl)
      .then(() => Message.success(t('common.copySuccess', 'Copied')))
      .catch(() => Message.error(t('common.copyFailed', 'Copy failed')));
  };

  const handleTestAndEnable = async () => {
    if (!appId.trim()) {
      Message.warning(
        t('settings.channels.msTeams.credentials.appId.required', 'Please enter an App ID'),
      );
      return;
    }
    if (!appPassword.trim()) {
      Message.warning(
        t(
          'settings.channels.msTeams.credentials.appPassword.required',
          'Please enter an App Password',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const tokenJson = JSON.stringify({
        appId: appId.trim(),
        appPassword: appPassword.trim(),
      });

      const testResult = await channel.testPlugin.invoke({
        pluginId: 'ms-teams_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.msTeams.connectionFailed', 'MS Teams connection failed'),
        );
        return;
      }

      Message.success(t('settings.channels.msTeams.connectionSuccess', 'MS Teams connected'));

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'ms-teams_default',
        config: {
          appId: appId.trim(),
          appPassword: appPassword.trim(),
        },
      });

      if (enableResult.success) {
        Message.success(
          t('settings.channels.msTeams.pluginEnabled', 'MS Teams plugin enabled'),
        );
        // Mint inbound webhook URL - secret for MS Teams is the appId (JWT aud claim)
        const rotateResult = await channel.rotateWebhookToken.invoke({
          platform: 'ms-teams',
          pluginInstanceId,
          agentId: 'default',
          secret: appId.trim(),
        });
        if (rotateResult.success && rotateResult.data) {
          setWebhookToken(rotateResult.data.token);
        }
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'ms-teams') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.msTeams.enableFailed', 'Failed to enable plugin'),
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
              'settings.channels.msTeams.replaceWarning',
              'Saving new credentials will replace the existing MS Teams bot connection.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.msTeams.credentials.appId.label', 'App ID (MicrosoftAppId)')}
        description={t(
          'settings.channels.msTeams.credentials.appId.help',
          'Azure AD app registration client ID - found in Azure Portal → App Registrations → Overview.',
        )}
      >
        <Input
          value={appId}
          onChange={setAppId}
          placeholder={t(
            'settings.channels.msTeams.credentials.appId.placeholder',
            'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t(
          'settings.channels.msTeams.credentials.appPassword.label',
          'App Password (Client Secret)',
        )}
        description={t(
          'settings.channels.msTeams.credentials.appPassword.help',
          'Azure AD client secret - App Registrations → Certificates & secrets → New client secret.',
        )}
      >
        <Input.Password
          value={appPassword}
          onChange={setAppPassword}
          placeholder={
            hasExisting
              ? '••••••••••••••••'
              : t(
                  'settings.channels.msTeams.credentials.appPassword.placeholder',
                  'Paste your client secret value',
                )
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.msTeams.setupHint',
          'Register your bot in the Azure Portal: Azure Bot Service → Create resource → configure Microsoft Teams channel → set messaging endpoint to your Wayland webhook URL → copy App ID and client secret here.',
        )}
      </div>

      {webhookToken !== null && (
        <div className='flex items-center justify-between gap-24px py-12px'>
          <div className='flex-1'>
            <span className='text-14px text-t-primary'>
              {t('settings.channels.msTeams.webhookUrl.label', 'Inbound Webhook URL')}
            </span>
            <div className='text-12px text-t-tertiary mt-2px'>
              {t(
                'settings.channels.msTeams.webhookUrl.help',
                'Set this as the Messaging Endpoint in Azure Bot Service.',
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
              {t('settings.channels.msTeams.webhookUrl.copyButton', 'Copy')}
            </Button>
          </div>
        </div>
      )}

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.msTeams.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default MsTeamsConfigForm;
