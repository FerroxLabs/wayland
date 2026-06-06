/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * BlueBubbles setup page - wraps BluebubblesConfigForm with the standard
 * ChannelDetailLayout (status pill, enable/disable controls, last-error).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import BluebubblesConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/BluebubblesConfigForm';

import ChannelDetailLayout from '../../ChannelDetailLayout';

const BluebubblesSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'bluebubbles') ?? null);
      }
    } catch (error) {
      console.error('[BluebubblesSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsubscribe = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'bluebubbles') setPluginStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='bluebubbles'
      displayName='BlueBubbles'
      pluginId={pluginStatus?.id ?? 'bluebubbles_default'}
      helpText={t(
        'settings.channels.bluebubbles.help',
        'iMessage bridge via BlueBubbles Server. Requires a Mac running BlueBubbles Server.app to host. For remote access from non-Mac platforms, expose via a tunnel (ngrok, Cloudflare Tunnel, Tailscale).',
      )}
    >
      <BluebubblesConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default BluebubblesSetup;
