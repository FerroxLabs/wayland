/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import SmsTwilioConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/SmsTwilioConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const SmsSetup: React.FC = () => {
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'sms-twilio') ?? null);
      }
    } catch (error) {
      console.error('[SmsSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'sms-twilio') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // F9 doc note: webhook rotate currently pins agentId='default'. Per-channel
  // agent assignment is a separate roadmap item; multi-agent operators will
  // see a single agent route until that ships.
  return (
    <ChannelDetailLayout
      channelId='sms-twilio'
      displayName='SMS (Twilio)'
      pluginId={pluginStatus?.id ?? 'sms-twilio_default'}
    >
      <SmsTwilioConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default SmsSetup;
