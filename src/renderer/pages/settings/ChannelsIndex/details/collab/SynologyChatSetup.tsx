/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Setup page for the Synology Chat channel plugin.
 * Mirrors MatrixSetup / MattermostSetup: load + subscribe to plugin status,
 * render ConfigForm inside ChannelDetailLayout.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import SynologyChatConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/collab/SynologyChatConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const SynologyChatSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'synology-chat') ?? null);
      }
    } catch (error) {
      console.error('[SynologyChatSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'synology-chat') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='synology-chat'
      displayName='Synology Chat'
      pluginId='synology-chat_default'
      helpText={t(
        'settings.channels.synologyChat.help',
        'NAS-hosted team chat via Synology DSM. Configure an outgoing webhook in Synology Chat to receive messages, and provide the incoming webhook URL to send replies.',
      )}
    >
      <SynologyChatConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default SynologyChatSetup;
