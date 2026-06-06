/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import WhatsAppConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/WhatsAppConfigForm';

import ChannelDetailLayout from '../../ChannelDetailLayout';

const WhatsAppSetup: React.FC = () => {
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'whatsapp') ?? null);
      }
    } catch (error) {
      console.error('[WhatsAppSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'whatsapp') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='whatsapp'
      displayName='WhatsApp'
      pluginId={pluginStatus?.id ?? 'whatsapp_default'}
    >
      <WhatsAppConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default WhatsAppSetup;
