/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import MatrixConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/collab/MatrixConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const MatrixSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'matrix') ?? null);
      }
    } catch (error) {
      console.error('[MatrixSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'matrix') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='matrix'
      displayName='Matrix'
      pluginId='matrix_default'
      helpText={t(
        'settings.channels.matrix.help',
        'Federation-aware messaging via matrix-js-sdk. Provide your homeserver URL, full mxid (e.g. @bot:matrix.org), and a long-lived access token.',
      )}
    >
      <MatrixConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default MatrixSetup;
