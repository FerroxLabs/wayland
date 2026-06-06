/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import EmailImapConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/email/EmailImapConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const EmailImapSetup: React.FC = () => {
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'email-imap') ?? null);
      }
    } catch (error) {
      console.error('[EmailImapSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'email-imap') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='email-imap'
      displayName='Email (IMAP / SMTP)'
      pluginId={pluginStatus?.id ?? 'email-imap_default'}
    >
      <EmailImapConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default EmailImapSetup;
