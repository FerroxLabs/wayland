import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LarkConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/chat/LarkConfigForm';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const LarkSetup: React.FC = () => {
  const { t } = useTranslation();
  const modelSelection = useChannelModelSelection('assistant.lark.defaultModel');
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'lark') ?? null);
      }
    } catch (error) {
      console.error('[LarkSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'lark') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='lark'
      displayName='Lark / Feishu'
      helpText={t(
        'settings.channels.lark.help',
        'Connect Wayland to Lark / Feishu. Create a bot in the Feishu Developer Console and paste its credentials below.'
      )}
      showDisconnect={!!pluginStatus?.enabled}
    >
      <LarkConfigForm
        pluginStatus={pluginStatus}
        modelSelection={modelSelection}
        onStatusChange={setPluginStatus}
      />
    </ChannelDetailLayout>
  );
};

export default LarkSetup;
