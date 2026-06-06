/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Setup detail page for the Mattermost channel plugin.
 * Mirrors IrcSetup/MatrixSetup: loads live plugin status, subscribes to
 * status-change events, and delegates credential input to MattermostConfigForm.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import MattermostConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/collab/MattermostConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const MattermostSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'mattermost') ?? null);
      }
    } catch (error) {
      console.error('[MattermostSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'mattermost') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='mattermost'
      displayName='Mattermost'
      pluginId='mattermost_default'
      helpText={t(
        'settings.channels.mattermost.help',
        'Connect to a Mattermost server with a personal access token. The bot listens via WebSocket and posts via REST.',
      )}
    >
      <MattermostConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default MattermostSetup;
