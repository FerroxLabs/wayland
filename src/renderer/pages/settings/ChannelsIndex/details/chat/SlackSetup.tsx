/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import SlackConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/chat/SlackConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const SlackSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'slack') ?? null);
      }
    } catch (error) {
      console.error('[SlackSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'slack') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='slack'
      displayName='Slack'
      pluginId='slack_default'
      helpText={t(
        'settings.channels.slack.help',
        'Native Slack bot integration via @slack/bolt. Choose Socket Mode for the simplest setup (no public webhook URL required) or Events API if you already have a stable HTTPS endpoint.',
      )}
    >
      <SlackConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default SlackSetup;
