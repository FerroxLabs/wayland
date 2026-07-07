/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import EmailAgentMailConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/email/EmailAgentMailConfigForm';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const EmailAgentMailSetup: React.FC = () => {
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);
  const modelSelection = useChannelModelSelection('assistant.email-agentmail.defaultModel');

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'email-agentmail') ?? null);
      }
    } catch (error) {
      console.error('[EmailAgentMailSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'email-agentmail') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='email-agentmail'
      displayName='Email (AgentMail)'
      pluginId={pluginStatus?.id ?? 'email-agentmail_default'}
    >
      <EmailAgentMailConfigForm
        pluginStatus={pluginStatus}
        modelSelection={modelSelection}
        onStatusChange={setPluginStatus}
      />
    </ChannelDetailLayout>
  );
};

export default EmailAgentMailSetup;
