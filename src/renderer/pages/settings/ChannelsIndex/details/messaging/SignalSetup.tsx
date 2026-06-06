/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalSetup - Settings detail page for the Signal Messenger plugin.
 * Mirrors MatrixSetup: loads plugin status, subscribes to live updates,
 * and renders SignalConfigForm inside ChannelDetailLayout.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { channel } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import SignalConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/SignalConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const SignalSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'signal') ?? null);
      }
    } catch (error) {
      console.error('[SignalSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'signal') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <ChannelDetailLayout
      channelId='signal'
      displayName='Signal'
      pluginId='signal_default'
      helpText={t(
        'settings.channels.signal.help',
        'End-to-end encrypted messaging via signal-cli subprocess daemon. ' +
          'Requires a dedicated phone number registered with Signal. ' +
          'signal-cli must be installed or available via the bundled runtime. ' +
          'If registration fails with "CaptchaRequired", visit https://signalcaptchas.org/registration/generate.html and pass --captcha <token> to signal-cli register.',
      )}
    >
      <SignalConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default SignalSetup;
