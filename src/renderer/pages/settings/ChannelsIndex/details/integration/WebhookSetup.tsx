/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Setup detail page for the generic Webhook channel plugin.
 * Replaces the "coming soon" stub with a live config form.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import WebhookConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/integration/WebhookConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const WebhookSetup: React.FC = () => {
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'webhook') ?? null);
      }
    } catch (error) {
      console.error('[WebhookSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'webhook') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='webhook'
      displayName='Webhook'
      pluginId={pluginStatus?.id ?? 'webhook_default'}
    >
      <WebhookConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default WebhookSetup;
