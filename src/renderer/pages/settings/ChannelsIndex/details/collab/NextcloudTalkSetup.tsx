/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nextcloud Talk channel setup page.
 * Renders the credential form, lifecycle controls, status pill, and last-error
 * display via ChannelDetailLayout - mirrors MatrixSetup.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import NextcloudTalkConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/collab/NextcloudTalkConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const NextcloudTalkSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'nextcloud-talk') ?? null);
      }
    } catch (error) {
      console.error('[NextcloudTalkSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'nextcloud-talk') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='nextcloud-talk'
      displayName='Nextcloud Talk'
      pluginId='nextcloud-talk_default'
      helpText={t(
        'settings.channels.nextcloudTalk.help',
        'Self-hosted Nextcloud Talk via app-password Basic auth. Provide your server URL, Nextcloud username, and an app password generated under Personal → Security → Devices & sessions.',
      )}
    >
      <NextcloudTalkConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default NextcloudTalkSetup;
