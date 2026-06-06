/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalConfigForm - credential form for the Signal Messenger plugin.
 * Mirrors the MatrixConfigForm pattern: JSON-encodes creds, calls testPlugin,
 * then enablePlugin on success.
 */

import { Button, Input, Message } from '@arco-design/web-react';
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

export type SignalConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
};

const SignalConfigForm: React.FC<SignalConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [cliPath, setCliPath] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    const phone = phoneNumber.trim();
    if (!phone) {
      Message.warning(
        t('settings.channels.signal.credentials.phoneNumber.required', 'Please enter your Signal phone number'),
      );
      return;
    }
    if (!/^\+\d{7,}$/.test(phone)) {
      Message.warning(
        t(
          'settings.channels.signal.credentials.phoneNumber.invalid',
          'Phone number must be in E.164 format, e.g. +14155551234',
        ),
      );
      return;
    }

    setTestLoading(true);
    try {
      const tokenJson = JSON.stringify({
        phoneNumber: phone,
        ...(cliPath.trim() ? { cliPath: cliPath.trim() } : {}),
      });

      const testResult = await channel.testPlugin.invoke({
        pluginId: 'signal_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.signal.connectionFailed', 'Signal connection test failed'),
        );
        return;
      }

      Message.success(t('settings.channels.signal.connectionSuccess', 'Signal connected'));

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'signal_default',
        config: {
          phoneNumber: phone,
          ...(cliPath.trim() ? { cliPath: cliPath.trim() } : {}),
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.signal.pluginEnabled', 'Signal plugin enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'signal') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.signal.enableFailed', 'Failed to enable Signal plugin'),
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
              'settings.channels.signal.replaceWarning',
              'Connecting a new Signal account will replace your existing one.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.signal.credentials.phoneNumber.label', 'Phone Number')}
        description={t(
          'settings.channels.signal.credentials.phoneNumber.help',
          'E.164 format - must be registered with Signal. A dedicated number is recommended.',
        )}
      >
        <Input
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder={t(
            'settings.channels.signal.credentials.phoneNumber.placeholder',
            '+14155551234',
          )}
          style={{ width: 220 }}
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.signal.captchaHint',
          'If registration fails with "CaptchaRequired", visit https://signalcaptchas.org/registration/generate.html and pass --captcha <token> to signal-cli register.',
        )}
      </div>

      <PreferenceRow
        label={t('settings.channels.signal.credentials.cliPath.label', 'signal-cli path (optional)')}
        description={t(
          'settings.channels.signal.credentials.cliPath.help',
          'Leave blank to use the bundled runtime or the signal-cli on your PATH.',
        )}
      >
        <Input
          value={cliPath}
          onChange={setCliPath}
          placeholder={t(
            'settings.channels.signal.credentials.cliPath.placeholder',
            '/usr/local/bin/signal-cli',
          )}
          style={{ width: 220 }}
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.signal.installHowTo',
          'signal-cli must be installed separately if the bundled runtime is not present. ' +
            'Install via: brew install signal-cli  |  apt-get install signal-cli. ' +
            'After installing, register your number: signal-cli -a +1… register',
        )}
      </div>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.signal.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default SignalConfigForm;
