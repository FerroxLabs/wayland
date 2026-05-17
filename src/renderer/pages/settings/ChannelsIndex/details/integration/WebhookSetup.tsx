import React from 'react';
import { useTranslation } from 'react-i18next';
import { Webhook } from 'lucide-react';
import EmptyState from '@renderer/components/settings/shared/feedback/EmptyState';
import ChannelDetailLayout from '../../ChannelDetailLayout';

const WebhookSetup: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ChannelDetailLayout channelId='webhook' displayName='Webhook' showDisconnect={false}>
      <EmptyState
        icon={Webhook}
        title={t('settings.channels.webhook.comingSoonTitle', 'Webhook channel coming soon')}
        body={t(
          'settings.channels.webhook.comingSoonBody',
          'Inbound webhook with signing secret, route-to picker, and token regeneration lands in the next release.'
        )}
        actionLabel={t('settings.channels.webhook.learnMore', 'Learn more')}
        onAction={() => window.open('https://github.com/TradeCanyon/Wayland/wiki/Channels', '_blank')}
      />
    </ChannelDetailLayout>
  );
};

export default WebhookSetup;
