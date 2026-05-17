import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WeixinConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/chat/WeixinConfigForm';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const WeChatSetup: React.FC = () => {
  const { t } = useTranslation();
  const modelSelection = useChannelModelSelection('assistant.weixin.defaultModel');
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'weixin') ?? null);
      }
    } catch (error) {
      console.error('[WeChatSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'weixin') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='wechat'
      displayName='WeChat'
      helpText={t(
        'settings.channels.wechat.help',
        'Connect Wayland to a WeChat personal account by scanning a QR code from your phone.'
      )}
      showDisconnect={!!pluginStatus?.enabled}
    >
      <WeixinConfigForm
        pluginStatus={pluginStatus}
        modelSelection={modelSelection}
        onStatusChange={setPluginStatus}
      />
    </ChannelDetailLayout>
  );
};

export default WeChatSetup;
