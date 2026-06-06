/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Setup detail page for the Twitch channel plugin.
 * Mirrors NostrSetup: loads live plugin status, subscribes to status-change
 * events, and delegates credential input to TwitchConfigForm.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import TwitchConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/social/TwitchConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const TwitchSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'twitch') ?? null);
      }
    } catch (error) {
      console.error('[TwitchSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'twitch') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='twitch'
      displayName='Twitch'
      pluginId='twitch_default'
      helpText={t(
        'settings.channels.twitch.help',
        'Twitch chat via IRC (tmi.js). Connect a bot account with OAuth to read and send messages in one or more channels.',
      )}
    >
      <TwitchConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default TwitchSetup;
