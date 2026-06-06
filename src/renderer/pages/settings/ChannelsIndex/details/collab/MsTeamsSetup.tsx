/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * MS Teams setup detail page - lifecycle controls + credential form.
 * Mirrors MatrixSetup pattern: load status on mount, subscribe to live updates.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import MsTeamsConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/collab/MsTeamsConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const MsTeamsSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'ms-teams') ?? null);
      }
    } catch (error) {
      console.error('[MsTeamsSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'ms-teams') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='ms-teams'
      displayName='Microsoft Teams'
      pluginId='ms-teams_default'
      helpText={t(
        'settings.channels.msTeams.help',
        'Bot Framework via Azure Bot Service. Register a bot, set the webhook endpoint, and paste your App ID and client secret below.',
      )}
    >
      <MsTeamsConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default MsTeamsSetup;
