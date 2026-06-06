/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Setup detail page for the IRC channel plugin.
 * Mirrors MatrixSetup: loads live plugin status, subscribes to status-change
 * events, and delegates credential input to IrcConfigForm.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import IrcConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/integration/IrcConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const IrcSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'irc') ?? null);
      }
    } catch (error) {
      console.error('[IrcSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'irc') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='irc'
      displayName='IRC'
      pluginId='irc_default'
      helpText={t(
        'settings.channels.irc.help',
        'Connect to any IRC server with optional SASL PLAIN auth. The bot joins configured channels and relays PRIVMSG to Wayland.',
      )}
    >
      <IrcConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default IrcSetup;
