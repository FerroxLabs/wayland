/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IChannelPluginStatus } from '@process/channels/types';
import { channel } from '@/common/adapter/ipcBridge';
import { Alert, Button, Input, InputNumber, Message, Switch } from '@arco-design/web-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Preference row layout - mirrors EmailAgentMailConfigForm so the Settings
 * page reads consistently across email channels.
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

type EmailImapConfigFormProps = {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const EmailImapConfigForm: React.FC<EmailImapConfigFormProps> = ({
  pluginStatus: _pluginStatus,
  onStatusChange: _onStatusChange,
}) => {
  const { t } = useTranslation();

  // IMAP fields
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState<number>(993);
  const [imapUser, setImapUser] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [imapTls, setImapTls] = useState(true);

  // SMTP fields
  const [useSameAuth, setUseSameAuth] = useState(true);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpTls, setSmtpTls] = useState(true);

  const [testing, setTesting] = useState(false);

  const handleTestAndEnable = useCallback(async () => {
    if (!imapHost.trim()) {
      Message.error(
        t('settings.channels.emailImap.credentials.imapHost.required', 'IMAP host is required')
      );
      return;
    }
    if (!imapUser.trim()) {
      Message.error(
        t('settings.channels.emailImap.credentials.imapUser.required', 'IMAP user is required')
      );
      return;
    }
    if (!imapPassword) {
      Message.error(
        t(
          'settings.channels.emailImap.credentials.imapPassword.required',
          'IMAP password is required'
        )
      );
      return;
    }
    if (!useSameAuth) {
      if (!smtpUser.trim()) {
        Message.error(
          t('settings.channels.emailImap.credentials.smtpUser.required', 'SMTP user is required')
        );
        return;
      }
      if (!smtpPassword) {
        Message.error(
          t(
            'settings.channels.emailImap.credentials.smtpPassword.required',
            'SMTP password is required'
          )
        );
        return;
      }
    }

    const credentials = {
      imapHost: imapHost.trim(),
      imapPort,
      imapUser: imapUser.trim(),
      imapPassword,
      imapTls,
      useSameAuth,
      smtpHost: smtpHost.trim() || imapHost.trim(),
      smtpPort,
      smtpTls,
      ...(useSameAuth
        ? {}
        : {
            smtpUser: smtpUser.trim(),
            smtpPassword,
          }),
    };

    setTesting(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'email-imap_default',
        token: JSON.stringify(credentials),
      });
      if (!testResult.success) {
        Message.error(
          testResult.msg ??
            t('settings.channels.emailImap.connectionFailed', 'Connection test failed')
        );
        return;
      }

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'email-imap',
        config: credentials,
      });
      if (enableResult.success) {
        Message.success(t('settings.channels.emailImap.pluginEnabled', 'Email (IMAP) enabled'));
      } else {
        Message.error(
          enableResult.msg ??
            t('settings.channels.emailImap.enableFailed', 'Failed to enable plugin')
        );
      }
    } catch (error: unknown) {
      Message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setTesting(false);
    }
  }, [
    imapHost,
    imapPort,
    imapUser,
    imapPassword,
    imapTls,
    useSameAuth,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    smtpTls,
    t,
  ]);

  return (
    <div className='flex flex-col gap-24px'>
      <Alert
        type='info'
        content={t(
          'settings.channels.emailImap.help',
          'Bring your own inbox. IMAP IDLE for inbound when available (polling fallback at 30s), SMTP for outbound. Use an app password for Gmail / Outlook.'
        )}
      />

      <div className='text-13px font-medium text-t-secondary mt-8px'>
        {t('settings.channels.emailImap.sections.imap', 'IMAP (inbound)')}
      </div>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapHost.label', 'IMAP Host')}
        description={t(
          'settings.channels.emailImap.credentials.imapHost.help',
          'Hostname of your IMAP server, e.g. imap.gmail.com.'
        )}
        required
      >
        <Input
          value={imapHost}
          onChange={(value) => setImapHost(value)}
          placeholder={t(
            'settings.channels.emailImap.credentials.imapHost.placeholder',
            'imap.gmail.com'
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapPort.label', 'IMAP Port')}
        description={t(
          'settings.channels.emailImap.credentials.imapPort.help',
          'Default 993 for IMAPS.'
        )}
        required
      >
        <InputNumber
          value={imapPort}
          onChange={(value) => setImapPort(typeof value === 'number' ? value : 993)}
          min={1}
          max={65535}
          style={{ width: 120 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapUser.label', 'IMAP User')}
        description={t(
          'settings.channels.emailImap.credentials.imapUser.help',
          'Usually your full email address.'
        )}
        required
      >
        <Input
          value={imapUser}
          onChange={(value) => setImapUser(value)}
          placeholder={t(
            'settings.channels.emailImap.credentials.imapUser.placeholder',
            'agent@example.com'
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapPassword.label', 'IMAP Password')}
        description={t(
          'settings.channels.emailImap.credentials.imapPassword.help',
          'Use an app password for Gmail / Outlook - your account login will not work.'
        )}
        required
      >
        <Input.Password
          value={imapPassword}
          onChange={(value) => setImapPassword(value)}
          visibilityToggle
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapTls.label', 'IMAP TLS')}
        description={t(
          'settings.channels.emailImap.credentials.imapTls.help',
          'Use TLS (recommended).'
        )}
      >
        <Switch checked={imapTls} onChange={(value) => setImapTls(value)} />
      </PreferenceRow>

      <div className='text-13px font-medium text-t-secondary mt-16px'>
        {t('settings.channels.emailImap.sections.smtp', 'SMTP (outbound)')}
      </div>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.useSameAuth.label', 'Use IMAP credentials for SMTP')}
        description={t(
          'settings.channels.emailImap.credentials.useSameAuth.help',
          'When on, SMTP reuses the IMAP user + password. Turn off to supply a separate SMTP login.'
        )}
      >
        <Switch checked={useSameAuth} onChange={(value) => setUseSameAuth(value)} />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.smtpHost.label', 'SMTP Host')}
        description={t(
          'settings.channels.emailImap.credentials.smtpHost.help',
          'Leave blank to reuse the IMAP host.'
        )}
      >
        <Input
          value={smtpHost}
          onChange={(value) => setSmtpHost(value)}
          placeholder={t(
            'settings.channels.emailImap.credentials.smtpHost.placeholder',
            'smtp.gmail.com'
          )}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.smtpPort.label', 'SMTP Port')}
        description={t(
          'settings.channels.emailImap.credentials.smtpPort.help',
          'Default 587 for STARTTLS. Use 465 for implicit TLS.'
        )}
      >
        <InputNumber
          value={smtpPort}
          onChange={(value) => setSmtpPort(typeof value === 'number' ? value : 587)}
          min={1}
          max={65535}
          style={{ width: 120 }}
        />
      </PreferenceRow>

      {!useSameAuth && (
        <>
          <PreferenceRow
            label={t('settings.channels.emailImap.credentials.smtpUser.label', 'SMTP User')}
            required
          >
            <Input
              value={smtpUser}
              onChange={(value) => setSmtpUser(value)}
              style={{ width: 280 }}
            />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.emailImap.credentials.smtpPassword.label', 'SMTP Password')}
            required
          >
            <Input.Password
              value={smtpPassword}
              onChange={(value) => setSmtpPassword(value)}
              visibilityToggle
              style={{ width: 280 }}
            />
          </PreferenceRow>
        </>
      )}

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.smtpTls.label', 'SMTP TLS')}
        description={t(
          'settings.channels.emailImap.credentials.smtpTls.help',
          'STARTTLS when port = 587, implicit TLS when port = 465.'
        )}
      >
        <Switch checked={smtpTls} onChange={(value) => setSmtpTls(value)} />
      </PreferenceRow>

      <div className='flex justify-end'>
        <Button type='primary' loading={testing} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.emailImap.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default EmailImapConfigForm;
