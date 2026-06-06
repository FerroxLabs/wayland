/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Credential form for the Nostr channel plugin. Mirrors IrcConfigForm: JSON-encode
 * creds into a single token string for testPlugin IPC, then enablePlugin with
 * the raw credential fields.
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

export interface NostrConfigFormProps {
  pluginStatus: IChannelPluginStatus | null;
  onStatusChange: (status: IChannelPluginStatus | null) => void;
}

const NostrConfigForm: React.FC<NostrConfigFormProps> = ({ pluginStatus, onStatusChange }) => {
  const { t } = useTranslation();

  const [privateKey, setPrivateKey] = useState('');
  const [relays, setRelays] = useState('wss://relay.damus.io,wss://nos.lol');
  const [allowedSenders, setAllowedSenders] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const hasExisting = !!pluginStatus?.hasToken;

  const handleTestAndEnable = async () => {
    if (!privateKey.trim()) {
      Message.warning(
        t('settings.channels.nostr.credentials.privateKey.required', 'Please enter your nsec or hex private key'),
      );
      return;
    }

    const relayList = relays
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.startsWith('wss://'));

    if (relayList.length === 0) {
      Message.warning(
        t('settings.channels.nostr.credentials.relays.required', 'Please enter at least one wss:// relay URL'),
      );
      return;
    }

    const tokenJson = JSON.stringify({
      privateKey: privateKey.trim(),
      relays: relayList,
    });

    setTestLoading(true);
    try {
      const testResult = await channel.testPlugin.invoke({
        pluginId: 'nostr_default',
        token: tokenJson,
      });

      if (!testResult.success || !testResult.data?.success) {
        Message.error(
          testResult.data?.error ??
            t('settings.channels.nostr.connectionFailed', 'Nostr relay connection failed'),
        );
        return;
      }

      Message.success(t('settings.channels.nostr.connectionSuccess', 'Nostr relay connected'));

      const allowedList = allowedSenders
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const enableResult = await channel.enablePlugin.invoke({
        pluginId: 'nostr_default',
        config: {
          privateKey: privateKey.trim(),
          relays: relayList,
          allowedSenders: allowedList,
        },
      });

      if (enableResult.success) {
        Message.success(t('settings.channels.nostr.pluginEnabled', 'Nostr plugin enabled'));
        const statusResult = await channel.getPluginStatus.invoke();
        if (statusResult.success && statusResult.data) {
          onStatusChange(statusResult.data.find((p) => p.type === 'nostr') ?? null);
        }
      } else {
        Message.error(
          enableResult.msg ?? t('settings.channels.nostr.enableFailed', 'Failed to enable Nostr plugin'),
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
              'settings.channels.nostr.replaceWarning',
              'Connecting a new Nostr identity will replace your existing one.',
            )}
          </span>
        </div>
      )}

      <PreferenceRow
        label={t('settings.channels.nostr.credentials.privateKey.label', 'Private Key')}
        description={t(
          'settings.channels.nostr.credentials.privateKey.help',
          'Your bot identity key in nsec bech32 or 64-char hex format. Never share this.',
        )}
      >
        <Input.Password
          value={privateKey}
          onChange={setPrivateKey}
          placeholder={
            hasExisting
              ? '••••••••••••••••'
              : t(
                  'settings.channels.nostr.credentials.privateKey.placeholder',
                  'nsec1... or 64-char hex',
                )
          }
          style={{ width: 320 }}
          visibilityToggle
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.nostr.credentials.relays.label', 'Relays')}
        description={t(
          'settings.channels.nostr.credentials.relays.help',
          'Comma-separated wss:// relay URLs. Defaults: relay.damus.io, nos.lol.',
        )}
      >
        <Input
          value={relays}
          onChange={setRelays}
          placeholder='wss://relay.damus.io,wss://nos.lol'
          style={{ width: 320 }}
        />
      </PreferenceRow>

      <PreferenceRow
        label={t('settings.channels.nostr.credentials.allowedSenders.label', 'Allowed Senders')}
        description={t(
          'settings.channels.nostr.credentials.allowedSenders.help',
          'Comma-separated list of npub or hex pubkeys allowed to message this bot. Leave empty for open mode (NOT recommended for public npubs).',
        )}
      >
        <Input.TextArea
          value={allowedSenders}
          onChange={setAllowedSenders}
          placeholder='npub1..., npub1..., or 64-char hex'
          style={{ width: 320 }}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </PreferenceRow>

      <div className='text-12px text-t-tertiary'>
        {t(
          'settings.channels.nostr.keyHowTo',
          'Generate a key pair with any Nostr client (Damus, Amethyst, Snort) or via nostr-tools keygen. Use a dedicated bot key, not your personal nsec.',
        )}
      </div>

      <div className='flex justify-end pt-8px'>
        <Button type='primary' loading={testLoading} onClick={() => void handleTestAndEnable()}>
          {t('settings.channels.nostr.testAndEnable', 'Test & Enable')}
        </Button>
      </div>
    </div>
  );
};

export default NostrConfigForm;
