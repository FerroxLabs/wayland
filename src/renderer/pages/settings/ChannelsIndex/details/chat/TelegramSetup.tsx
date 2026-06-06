/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import TelegramConfigForm from '@/renderer/components/settings/SettingsModal/contents/channels/chat/TelegramConfigForm';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import ChannelDetailLayout from '../../ChannelDetailLayout';

/**
 * TelegramSetup - ChannelsIndex route wrapper around the shared
 * TelegramConfigForm. This file previously duplicated ~370 LOC of
 * TelegramConfigForm logic; drift between the two led to subtle UX
 * differences (missing "Next Steps" guide, divergent token-test flow).
 * Now we share a single source of truth and only own the page chrome here.
 */
const TelegramSetup: React.FC = () => {
  const { t } = useTranslation();
  const modelSelection = useChannelModelSelection('assistant.telegram.defaultModel');
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'telegram') ?? null);
      }
    } catch (error) {
      console.error('[TelegramSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'telegram') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='telegram'
      displayName='Telegram'
      helpText={t(
        'settings.channels.telegram.help',
        'Chat with your Wayland AI assistant via Telegram. Create a bot with @BotFather to get started.'
      )}
    >
      <TelegramConfigForm
        pluginStatus={pluginStatus}
        modelSelection={modelSelection}
        onStatusChange={setPluginStatus}
      />
    </ChannelDetailLayout>
  );
};

export default TelegramSetup;
