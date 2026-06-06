/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credential form for the IRC channel plugin. Mirrors the MatrixConfigForm
 * pattern: JSON-encode creds into a single token string for testPlugin IPC,
 * then enablePlugin with the raw credential fields.
 */

import { Button, Input, Message, Radio, Switch } from '@arco-design/web-react';
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

export interface IrcConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const IrcConfigForm: React.FC<IrcConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [server, setServer] = useState('irc.libera.chat');
  const [port, setPort] = useState('6697');
  const [nick, setNick] = useState('');
  const [username, setUsername] = useState('');
  const [realname, setRealname] = useState('');
  const [password, setPassword] = useState('');
  const [channels, setChannels] = useState('#wayland-bots');
  const [tls, setTls] = useState(true);
  const [saslMechanism, setSaslMechanism] = useState<'PLAIN' | 'none'>('PLAIN');
  const [testLoading, setTestLoading] = useState(false);

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!server.trim()) {
      Message.warning(
        t('settings.channels.irc.credentials.server.required', 'Please enter an IRC server hostname'),
      );
      return;
    }
    if (!nick.trim()) {
      Message.warning(
        t('settings.channels.irc.credentials.nick.required', 'Please enter a bot nick'),
      );
      return;
    }

    const channelList = channels
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const effectiveUsername = username.trim() || nick.trim();
    const effectiveRealname = realname.trim() || effectiveUsername;
    const effectiveMechanism: 'PLAIN' | 'none' = password.trim() ? saslMechanism : 'none';

    const tokenJson = JSON.stringify({
      server: server.trim(),
      port: Number(port) || 6697,
      tls,
      nick: nick.trim(),
      username: effectiveUsername,
      realname: effectiveRealname,
      password: password.trim(),
      channels: channelList,
      saslMechanism: effectiveMechanism,
    });

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'irc_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.irc.connectionFailed', 'IRC connection failed'),
        );
        return;
      }

      Message.success(t('settings.channels.irc.connectionSuccess', 'IRC connected'));

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'irc_default',
        config: {
          server: server.trim(),
          port: Number(port) || 6697,
          tls,
          nick: nick.trim(),
          username: effectiveUsername,
          realname: effectiveRealname,
          password: password.trim(),
          channels: channelList,
          saslMechanism: effectiveMechanism,
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.irc.pluginEnabled', 'IRC plugin enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'irc') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.irc.enableFailed', 'Failed to enable IRC plugin'),
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
              'settings.channels.irc.replaceWarning',
              'Connecting a new IRC server will replace your existing configuration.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.irc.credentials.server.label', 'Server')}
        description={t(
          'settings.channels.irc.credentials.server.help',
          'IRC server hostname, e.g. irc.libera.chat or irc.freenode.net.',
        )}
      >
        <Input
          value={server}
          onChange={setServer}
          placeholder='irc.libera.chat'
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.port.label', 'Port')}
        description={t(
          'settings.channels.irc.credentials.port.help',
          '6697 for TLS (default), 6667 for plain.',
        )}
      >
        <Input
          value={port}
          onChange={setPort}
          placeholder='6697'
          style={{ width: 100 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.nick.label', 'Bot Nick')}
        description={t(
          'settings.channels.irc.credentials.nick.help',
          'The IRC nickname for the bot.',
        )}
      >
        <Input
          value={nick}
          onChange={setNick}
          placeholder='wayland-bot'
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.username.label', 'Username (optional)')}
        description={t(
          'settings.channels.irc.credentials.username.help',
          'IRC ident/username. Defaults to the bot nick.',
        )}
      >
        <Input
          value={username}
          onChange={setUsername}
          placeholder={nick || 'wayland-bot'}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.realname.label', 'Real name (optional)')}
        description={t(
          'settings.channels.irc.credentials.realname.help',
          'GECOS / real name shown in WHOIS. Defaults to the username.',
        )}
      >
        <Input
          value={realname}
          onChange={setRealname}
          placeholder={username || nick || 'Wayland IRC bot'}
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.tls.label', 'TLS')}
        description={t(
          'settings.channels.irc.credentials.tls.help',
          'Enable TLS (default). Disable for legacy plain-text servers on port 6667.',
        )}
      >
        <Switch checked={tls} onChange={setTls} />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.sasl.label', 'SASL Mechanism')}
        description={t(
          'settings.channels.irc.credentials.sasl.help',
          'PLAIN authenticates via SASL (recommended). None falls back to server PASS (NickServ-style).',
        )}
      >
        <Radio.Group
          value={saslMechanism}
          onChange={(v: 'PLAIN' | 'none') => setSaslMechanism(v)}
        >
          <Radio value='PLAIN'>PLAIN</Radio>
          <Radio value='none'>None</Radio>
        </Radio.Group>
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.password.label', 'Password (optional)')}
        description={t(
          'settings.channels.irc.credentials.password.help',
          'NickServ / SASL PLAIN password. Leave blank for anonymous connections.',
        )}
      >
        <Input.Password
          value={password}
          onChange={setPassword}
          placeholder={
            hasExisting
              ? '••••••••'
              : t('settings.channels.irc.credentials.password.placeholder', 'NickServ password')
          }
          style={{ width: 280 }}
          visibilityToggle
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.irc.credentials.channels.label', 'Channels')}
        description={t(
          'settings.channels.irc.credentials.channels.help',
          'Comma-separated list of channels to auto-join, e.g. #wayland-bots,#general.',
        )}
      >
        <Input
          value={channels}
          onChange={setChannels}
          placeholder='#wayland-bots'
          style={{ width: 280 }}
        />
      </PreferenceRow>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.irc.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default IrcConfigForm;
