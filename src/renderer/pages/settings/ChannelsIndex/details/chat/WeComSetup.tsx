import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WecomConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/chat/WecomConfigForm';
import { useChannelModelSelection } from '@renderer/hooks/settings/useChannelModelSelection';
import { channel, webui, type IWebUIStatus } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const WeComSetup: React.FC = () => {
  const { t } = useTranslation();
  const modelSelection = useChannelModelSelection('assistant.wecom.defaultModel');
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);
  const [webuiStatus, setWebuiStatus] = useState<IWebUIStatus | null>(null);

  useEffect(() => {
    void webui.getStatus
      .invoke()
      .then((r) => setWebuiStatus(r?.success ? (r.data ?? null) : null))
      .catch(() => {
        // best-effort: WeCom callback URL just won't autofill
      });
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'wecom') ?? null);
      }
    } catch (error) {
      console.error('[WeComSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'wecom') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='wecom'
      displayName='WeCom'
      helpText={t(
        'settings.channels.wecom.help',
        'Connect Wayland to WeCom (Enterprise WeChat). Choose Long Connection (botId + secret, no public URL) or Encrypted Callback (Token + EncodingAESKey + CorpID, requires a reachable HTTPS callback URL).'
      )}
      showDisconnect={!!pluginStatus?.enabled}
    >
      <WecomConfigForm
        pluginStatus={pluginStatus}
        modelSelection={modelSelection}
        onStatusChange={setPluginStatus}
        webuiStatus={webuiStatus}
      />
    </ChannelDetailLayout>
  );
};

export default WeComSetup;
