/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import DiscordConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/chat/DiscordConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const DiscordSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'discord') ?? null);
      }
    } catch (error) {
      console.error('[DiscordSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'discord') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='discord'
      displayName='Discord'
      pluginId='discord_default'
      helpText={t(
        'settings.channels.discord.help',
        'Native Discord bot integration via the Gateway. Create a Discord application and bot in the Developer Portal, then paste the bot token below.',
      )}
    >
      <DiscordConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default DiscordSetup;
