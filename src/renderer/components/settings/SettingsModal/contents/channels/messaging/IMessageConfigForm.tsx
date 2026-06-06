/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IMessageConfigForm - credential/config form for the macOS iMessage plugin.
 *
 * iMessage needs no API credentials - access is determined entirely by macOS
 * Full Disk Access permission and platform. The form collects two optional
 * tuning parameters (poll interval + allowed-handle allowlist) and exposes a
 * "Test & Enable" button that calls testConnection on the main process.
 */

import { Button, Input, InputNumber, Message } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

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

export type IMessageConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
};

const IMessageConfigForm: React.FC<IMessageConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [pollIntervalMs, setPollIntervalMs] = useState<number>(2000);
  const [allowedHandles, setAllowedHandles] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    setTestLoading(true);
    try {
      const tokenJson = JSON.stringify({
        pollIntervalMs,
        allowedHandles: allowedHandles
          .split(/[,\n]+/)
          .map((h) => h.trim())
          .filter(Boolean),
      });

      const testResult = await channel.testPlugin.invoke({
        pluginId: 'imessage_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.imessage.connectionFailed', 'iMessage connection check failed'),
        );
        return;
      }

      Message.success(t('settings.channels.imessage.connectionSuccess', 'iMessage verified'));

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'imessage_default',
        config: {
          pollIntervalMs,
          allowedHandles: allowedHandles
            .split(/[,\n]+/)
            .map((h) => h.trim())
            .filter(Boolean),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.imessage.pluginEnabled', 'iMessage plugin enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'imessage') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.imessage.enableFailed', 'Failed to enable iMessage plugin'),
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
              'settings.channels.imessage.replaceWarning',
              'Saving will overwrite the existing iMessage configuration.',
            )}
          </span>
        </div>
      )}

      <div className='text-12px text-t-tertiary p-12px rd-8px bg-fill-2'>
        {t(
          'settings.channels.imessage.permissionNote',
          'iMessage requires Full Disk Access for this app. Grant it in System Settings → Privacy & Security → Full Disk Access.',
        )}
      </div>

      <div className='flex items-start gap-8px p-12px rd-8px bg-warning-1 text-warning border border-warning'>
        <AlertTriangle size={16} className='mt-2px flex-shrink-0' />
        <span className='text-12px'>
          {t(
            'settings.channels.imessage.fdaRelaunchHelp',
            'IMPORTANT: After granting Full Disk Access for the first time, you MUST fully quit and relaunch the app - macOS only re-reads FDA on app launch, so without a relaunch you will loop on "chat.db not readable" errors.',
          )}
        </span>
      </div>

      <div className='text-12px text-t-tertiary p-12px rd-8px bg-fill-2'>
        {t(
          'settings.channels.imessage.automationNote',
          'iMessage also requires macOS Automation consent for Messages.app. Accept the OS prompt the first time outbound is used, or grant in System Settings → Privacy & Security → Automation → this app → Messages.',
        )}
      </div>

      <div className='text-12px text-t-tertiary p-12px rd-8px bg-fill-2'>
        {t(
          'settings.channels.imessage.attachmentsNote',
          'Text-only - image, video, and audio attachments are dropped silently on inbound and not supported on outbound.',
        )}
      </div>

      <PreferenceRow
        label={t('settings.channels.imessage.pollInterval.label', 'Poll interval (ms)')}
        description={t(
          'settings.channels.imessage.pollInterval.help',
          'How often to check for new messages. Default: 2000 ms. Lower values increase responsiveness but use more CPU.',
        )}
      >
        <InputNumber
          value={pollIntervalMs}
          onChange={(v) => setPollIntervalMs(typeof v === 'number' ? v : 2000)}
          min={500}
          // F3: aligned with the plugin's MAX_POLL_INTERVAL_MS clamp (60 s).
          // Power users who want 30-60 s polling can now actually set it.
          max={60000}
          step={500}
          style={{ width: 120 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.imessage.allowedHandles.label', 'Allowed handles (optional)')}
        description={t(
          'settings.channels.imessage.allowedHandles.help',
          'Comma or newline-separated list of phone numbers or emails to accept messages from. Leave blank to allow all.',
        )}
      >
        <Input.TextArea
          value={allowedHandles}
          onChange={setAllowedHandles}
          placeholder={t(
            'settings.channels.imessage.allowedHandles.placeholder',
            '+15551234567, user@icloud.com',
          )}
          style={{ width: 280 }}
          autoSize={{ minRows: 2, maxRows: 5 }}
        />
      </PreferenceRow>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.imessage.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default IMessageConfigForm;
