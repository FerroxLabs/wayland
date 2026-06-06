import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DingTalkConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/chat/DingTalkConfigForm';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const DingTalkSetup: React.FC = () => {
  const { t } = useTranslation();
  const modelSelection = useChannelModelSelection('assistant.dingtalk.defaultModel');
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'dingtalk') ?? null);
      }
    } catch (error) {
      console.error('[DingTalkSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'dingtalk') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='dingtalk'
      displayName='DingTalk'
      helpText={t(
        'settings.channels.dingtalk.help',
        'Connect Wayland to DingTalk via Stream Mode. On open-dev.dingtalk.com, create an enterprise internal app, copy its AppKey / AppSecret into Client ID / Client Secret below, then enable Event Subscription → Stream Mode and grant the Robot.message.read event scope.'
      )}
      showDisconnect={!!pluginStatus?.enabled}
    >
      <DingTalkConfigForm
        pluginStatus={pluginStatus}
        modelSelection={modelSelection}
        onStatusChange={setPluginStatus}
      />
    </ChannelDetailLayout>
  );
};

export default DingTalkSetup;
