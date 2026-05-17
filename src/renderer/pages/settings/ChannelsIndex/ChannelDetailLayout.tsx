import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import DangerZone from '@renderer/components/settings/shared/dialogs/DangerZone';
import HelpBlock from '@renderer/components/settings/shared/forms/HelpBlock';
import { channel } from '@/common/adapter/ipcBridge';
import { Message } from '@arco-design/web-react';

type ChannelDetailLayoutProps = {
  channelId: string;
  displayName: string;
  helpText?: string;
  children: React.ReactNode;
  /** Pass false to hide the disconnect danger zone (e.g. channels with no persistent creds) */
  showDisconnect?: boolean;
  pluginId?: string;
};

const ChannelDetailLayout: React.FC<ChannelDetailLayoutProps> = ({
  channelId,
  displayName,
  helpText,
  children,
  showDisconnect = true,
  pluginId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    const id = pluginId ?? `${channelId}_default`;
    try {
      const result = await channel.disablePlugin.invoke({ pluginId: id });
      if (result.success) {
        Message.success(t('settings.channelDetail.disconnected', 'Channel disconnected'));
        navigate('/settings/channels');
      } else {
        Message.error(result.msg ?? t('settings.channelDetail.disconnectFailed', 'Failed to disconnect'));
      }
    } catch (error) {
      Message.error(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <SettingsPageShell
      title={displayName}
      subtitle={helpText}
      breadcrumb={[
        {
          label: t('settings.channelsIndex.title', 'Channels'),
          onClick: () => navigate('/settings/channels'),
        },
        { label: displayName },
      ]}
    >
      {children}

      {showDisconnect && (
        <DangerZone
          title={t('settings.channelDetail.disconnectTitle', 'Disconnect {{channel}}', { channel: displayName })}
          description={t(
            'settings.channelDetail.disconnectDesc',
            'Stops the channel and wipes stored credentials. Authorized users will need to re-pair.'
          )}
          actionLabel={t('settings.channelDetail.disconnectAction', 'Disconnect')}
          confirmTitle={t('settings.channelDetail.disconnectConfirmTitle', 'Disconnect {{channel}}?', {
            channel: displayName,
          })}
          confirmBody={t(
            'settings.channelDetail.disconnectConfirmBody',
            'This will stop the {{channel}} channel and delete all stored credentials and authorized users.',
            { channel: displayName }
          )}
          onConfirm={() => void handleDisconnect()}
        />
      )}
    </SettingsPageShell>
  );
};

export default ChannelDetailLayout;
