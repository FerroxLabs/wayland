/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IMessageSetup - settings detail page for the macOS iMessage channel plugin.
 */

import { Button, Message } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { application, channel, shell } from '@/common/adapter/ipcBridge';
import type { IChannelPluginStatus } from '@process/channels/types';
import IMessageConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/IMessageConfigForm';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const IMessageSetup: React.FC = () => {
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = useState<IChannelPluginStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const result = await channel.getPluginStatus.invoke();
      if (result.success && result.data) {
        setPluginStatus(result.data.find((p) => p.type === 'imessage') ?? null);
      }
    } catch (error) {
      console.error('[IMessageSetup] loadStatus failed:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unsub = channel.pluginStatusChanged.on(({ status }) => {
      if (status.type === 'imessage') setPluginStatus(status);
    });
    return () => unsub();
  }, []);

  // F1: deep-link to macOS Full Disk Access pane. Apple's stable URL scheme
  // for the FDA pane is x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles
  const handleOpenFda = useCallback(() => {
    void shell.openExternal
      .invoke('x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles')
      .catch((err) => {
        Message.error(`Unable to open System Settings: ${err instanceof Error ? err.message : String(err)}`);
      });
  }, []);

  // F1: explicit relaunch CTA. macOS only re-reads Full Disk Access at
  // process launch, so the user MUST relaunch after granting - otherwise
  // setup loops forever with "chat.db not readable".
  const handleRelaunch = useCallback(() => {
    void application.restart.invoke().catch((err) => {
      Message.error(`Unable to relaunch: ${err instanceof Error ? err.message : String(err)}`);
    });
  }, []);

  return (
    <ChannelDetailLayout
      channelId='imessage'
      displayName='iMessage'
      pluginId='imessage_default'
      helpText={
        t(
          'settings.channels.imessage.help',
          'macOS-only. Polls chat.db (requires Full Disk Access) and sends via AppleScript (requires Automation consent for Messages.app - accept the OS prompt when it appears, or grant in System Settings → Privacy & Security → Automation).',
        ) +
        ' ' +
        t(
          'settings.channels.imessage.fdaRelaunchHelp',
          'IMPORTANT: After granting Full Disk Access for the first time, you MUST fully quit and relaunch the app - macOS only re-reads FDA on app launch, so without a relaunch you will loop on "chat.db not readable" errors.',
        ) +
        ' ' +
        t(
          'settings.channels.imessage.attachmentsHelp',
          'Text-only - image, video, and audio attachments are dropped silently on inbound and not supported on outbound.',
        )
      }
    >
      <div className='flex gap-8px mb-12px'>
        <Button size='small' onClick={handleOpenFda}>
          {t('settings.channels.imessage.openFdaPane', 'Open Full Disk Access Settings')}
        </Button>
        <Button size='small' status='warning' onClick={handleRelaunch}>
          {t('settings.channels.imessage.relaunchApp', 'Relaunch app (after granting FDA)')}
        </Button>
      </div>
      <IMessageConfigForm pluginStatus={pluginStatus} onStatusChange={setPluginStatus} />
    </ChannelDetailLayout>
  );
};

export default IMessageSetup;
