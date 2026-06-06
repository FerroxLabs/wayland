/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import LineConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/LineConfigForm';

import ChannelDetailLayout from '../../ChannelDetailLayout';

const LineSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'line') ?? null);
      }
    } catch (error) {
      console.error('[LineSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'line') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='line'
      displayName='LINE'
      pluginId={pluginStatus?.id ?? 'line_default'}
      helpText={t(
        'settings.channels.line.help',
        'LINE Messaging API. In LINE Developers Console → your channel → Messaging API: set Use webhook = ON, Auto-reply messages = OFF, and Greeting messages = OFF. Then paste the webhook URL shown after Test & Enable into the Webhook URL field.',
      )}
    >
      <LineConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default LineSetup;
