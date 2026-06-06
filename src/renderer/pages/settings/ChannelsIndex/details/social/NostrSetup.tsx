/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Setup detail page for the Nostr channel plugin.
 * Mirrors IrcSetup: loads live plugin status, subscribes to status-change
 * events, and delegates credential input to NostrConfigForm.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import NostrConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/social/NostrConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const NostrSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'nostr') ?? null);
      }
    } catch (error) {
      console.error('[NostrSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'nostr') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='nostr'
      displayName='Nostr'
      pluginId='nostr_default'
      helpText={t(
        'settings.channels.nostr.help',
        'Decentralized encrypted DMs via Nostr relays. Bring your own private key (nsec or hex) and connect to any wss:// relay.',
      )}
    >
      <NostrConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default NostrSetup;
