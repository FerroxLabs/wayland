/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelAgentModelSelector from '@/renderer/components/settings/shared/forms/ChannelAgentModelSelector';
import type { GeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import { channel } from '@/common/adapter/ipcBridge';
import { Alert, Button, Input, InputNumber, Message, Switch } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { detectEmailProvider, type EmailProviderPreset } from '@/common/channels/emailProviderPresets';
import { useTranslation } from 'react-i18next';

/**
 * Strip every whitespace character from an app password. Gmail/Outlook display
 * app passwords in 4-char groups separated by spaces (e.g. "yahr vkqu tevs
 * rjvy"); the spaces are cosmetic and never part of the secret. Stripping on
 * input means a verbatim paste authenticates regardless of provider quirks.
 */
const stripAppPassword = (value: string): string => value.replace(/\s+/g, '');

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
  modelSelection: GeminiModelSelection;
  onStatusChange?: (status: IChannelPluginStatus | null) => void;
};

const EmailImapConfigForm: React.FC<EmailImapConfigFormProps> = ({
  pluginStatus,
  modelSelection,
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

  // Smart defaults: when the user types their email address, detect the provider
  // (Gmail/Outlook/iCloud/Proton/...) and auto-fill the IMAP/SMTP host+port+TLS.
  // appliedHostRef remembers the last auto-filled host so re-typing a different
  // provider re-fills, but a host the user edited by hand is never clobbered.
  const [detectedProvider, setDetectedProvider] = useState<EmailProviderPreset | null>(null);
  const appliedHostRef = useRef<string | null>(null);

  // Whether the saved channel already has an app password stored. The secret is
  // never sent to the renderer (#548) - we only learn it EXISTS, show a
  // "leave blank to keep" hint, and let the backend reuse it on re-test/re-save.
  const [hasSavedImapPassword, setHasSavedImapPassword] = useState(false);
  const [hasSavedSmtpPassword, setHasSavedSmtpPassword] = useState(false);

  // Rehydrate the form from the saved config on open (#548). The form used to
  // always mount blank, so a configured inbox looked unconfigured and users
  // re-entered everything. We restore every non-secret field; the saved host is
  // left as a hand-edited value (appliedHostRef stays null) so provider
  // auto-detect never clobbers a user's custom host on reopen.
  useEffect(() => {
    let mounted = true;
    void channel.getPluginConfig
      .invoke({ pluginId: 'email-imap' })
      .then((res) => {
        if (!mounted || !res.success || !res.data) return;
        const c = res.data.config;
        if (typeof c.imapHost === 'string') setImapHost(c.imapHost);
        if (typeof c.imapPort === 'number') setImapPort(c.imapPort);
        if (typeof c.imapUser === 'string') setImapUser(c.imapUser);
        if (typeof c.imapTls === 'boolean') setImapTls(c.imapTls);
        if (typeof c.useSameAuth === 'boolean') setUseSameAuth(c.useSameAuth);
        if (typeof c.smtpHost === 'string') setSmtpHost(c.smtpHost);
        if (typeof c.smtpPort === 'number') setSmtpPort(c.smtpPort);
        if (typeof c.smtpTls === 'boolean') setSmtpTls(c.smtpTls);
        if (typeof c.smtpUser === 'string') setSmtpUser(c.smtpUser);
        setHasSavedImapPassword(res.data.secretPresence.imapPassword === true);
        setHasSavedSmtpPassword(res.data.secretPresence.smtpPassword === true);
      })
      .catch(() => {
        /* best-effort rehydrate; a blank form is the pre-existing fallback */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleImapUserChange = (value: string): void => {
    setImapUser(value);
    const preset = detectEmailProvider(value);
    setDetectedProvider(preset);
    if (!preset) return;
    const hostIsAutofillable = imapHost === '' || imapHost === appliedHostRef.current;
    if (!hostIsAutofillable) return;
    appliedHostRef.current = preset.imapHost;
    setImapHost(preset.imapHost);
    setImapPort(preset.imapPort);
    setImapTls(preset.imapTls);
    setSmtpHost(preset.smtpHost);
    setSmtpPort(preset.smtpPort);
    setSmtpTls(preset.smtpTls);
  };

  const handleTestAndEnable = useCallback(async () => {
    if (!imapHost.trim()) {
      Message.error(t('settings.channels.emailImap.credentials.imapHost.required', 'IMAP host is required'));
      return;
    }
    if (!imapUser.trim()) {
      Message.error(t('settings.channels.emailImap.credentials.imapUser.required', 'IMAP user is required'));
      return;
    }
    // A blank password is allowed when one is already saved - the backend
    // reuses the stored secret on both test and enable (#548). Only require it
    // for a first-time setup (nothing saved yet).
    if (!imapPassword && !hasSavedImapPassword) {
      Message.error(t('settings.channels.emailImap.credentials.imapPassword.required', 'IMAP password is required'));
      return;
    }
    if (!useSameAuth) {
      if (!smtpUser.trim()) {
        Message.error(t('settings.channels.emailImap.credentials.smtpUser.required', 'SMTP user is required'));
        return;
      }
      if (!smtpPassword && !hasSavedSmtpPassword) {
        Message.error(t('settings.channels.emailImap.credentials.smtpPassword.required', 'SMTP password is required'));
        return;
      }
    }

    // Omit blank password fields entirely (rather than sending '') so the
    // backend's "keep the stored secret" fallback engages - sending an empty
    // string would overwrite the saved app password.
    const credentials = {
      imapHost: imapHost.trim(),
      imapPort,
      imapUser: imapUser.trim(),
      imapTls,
      useSameAuth,
      smtpHost: smtpHost.trim() || imapHost.trim(),
      smtpPort,
      smtpTls,
      ...(imapPassword ? { imapPassword: stripAppPassword(imapPassword) } : {}),
      ...(useSameAuth
        ? {}
        : {
            smtpUser: smtpUser.trim(),
            ...(smtpPassword ? { smtpPassword: stripAppPassword(smtpPassword) } : {}),
          }),
    };

    setTesting(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'email-imap_default',
        token: JSON.stringify(credentials),
      });
      // testPlugin returns an IBridgeResponse envelope: `success` is the IPC
      // transport status (true unless the bridge threw), while the actual
      // connection result lives in `data.success`. A failed IMAP login still
      // arrives with envelope success=true, so we MUST inspect data.success -
      // otherwise a rejected password is treated as a pass and we proceed to
      // enable, where the user sees an opaque START-time auth error instead.
      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
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
        Message.error(enableResult.msg ?? t('settings.channels.emailImap.enableFailed', 'Failed to enable plugin'));
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
    hasSavedImapPassword,
    hasSavedSmtpPassword,
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
          placeholder={t('settings.channels.emailImap.credentials.imapHost.placeholder', 'imap.gmail.com')}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapPort.label', 'IMAP Port')}
        description={t('settings.channels.emailImap.credentials.imapPort.help', 'Default 993 for IMAPS.')}
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
        description={t('settings.channels.emailImap.credentials.imapUser.help', 'Usually your full email address.')}
        required
      >
        <div style={{ position: 'relative', width: 280 }}>
          <Input
            value={imapUser}
            onChange={handleImapUserChange}
            placeholder={t('settings.channels.emailImap.credentials.imapUser.placeholder', 'agent@example.com')}
            style={{ width: 280 }}
          />
          {detectedProvider && (
            // Absolutely positioned so showing/hiding the hint never reflows the
            // input (no "box jump" as the user types and the provider is detected).
            <span
              className='text-12px text-[var(--success,#22c55e)]'
              style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, maxWidth: 520, lineHeight: '15px' }}
            >
              {t('settings.channels.emailImap.detected', {
                defaultValue: 'Detected {{provider}} - host and ports filled in.',
                provider: detectedProvider.label,
              })}
              {detectedProvider.note ? ` ${detectedProvider.note}` : ''}
            </span>
          )}
        </div>
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapPassword.label', 'IMAP App Password')}
        description={t(
          'settings.channels.emailImap.credentials.imapPassword.help',
          'Must be an app password, not your account login. Gmail / Outlook show it in 4-char groups - paste it as-is, spaces are stripped automatically.'
        )}
        required
      >
        <Input.Password
          value={imapPassword}
          onChange={(value) => setImapPassword(stripAppPassword(value))}
          placeholder={
            hasSavedImapPassword
              ? t(
                  'settings.channels.emailImap.credentials.imapPassword.savedPlaceholder',
                  'Saved - leave blank to keep'
                )
              : undefined
          }
          visibilityToggle
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.emailImap.credentials.imapTls.label', 'IMAP TLS')}
        description={t('settings.channels.emailImap.credentials.imapTls.help', 'Use TLS (recommended).')}
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
        description={t('settings.channels.emailImap.credentials.smtpHost.help', 'Leave blank to reuse the IMAP host.')}
      >
        <Input
          value={smtpHost}
          onChange={(value) => setSmtpHost(value)}
          placeholder={t('settings.channels.emailImap.credentials.smtpHost.placeholder', 'smtp.gmail.com')}
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
          <PreferenceRow label={t('settings.channels.emailImap.credentials.smtpUser.label', 'SMTP User')} required>
            <Input value={smtpUser} onChange={(value) => setSmtpUser(value)} style={{ width: 280 }} />
          </PreferenceRow>

          <PreferenceRow
            label={t('settings.channels.emailImap.credentials.smtpPassword.label', 'SMTP Password')}
            required
          >
            <Input.Password
              value={smtpPassword}
              onChange={(value) => setSmtpPassword(stripAppPassword(value))}
              placeholder={
                hasSavedSmtpPassword
                  ? t(
                      'settings.channels.emailImap.credentials.smtpPassword.savedPlaceholder',
                      'Saved - leave blank to keep'
                    )
                  : undefined
              }
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
      {pluginStatus?.enabled && pluginStatus?.connected && (
        <span className='text-12px text-t-tertiary'>
          {t(
            'settings.channels.emailImap.howToTalk',
            'Check your own inbox. Wayland just emailed you; reply to that email any time.'
          )}
        </span>
      )}
      <ChannelAgentModelSelector platform='email-imap' modelSelection={modelSelection} />
    </div>
  );
};

export default EmailImapConfigForm;
