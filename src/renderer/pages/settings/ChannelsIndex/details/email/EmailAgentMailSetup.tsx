import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import EmptyState from '@renderer/components/settings/shared/feedback/EmptyState';
import ChannelDetailLayout from '../../ChannelDetailLayout';

// Placeholder. AgentMail-backed two-way email lands in Phase 2.
const EmailAgentMailSetup: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ChannelDetailLayout channelId='email-agentmail' displayName='Email (AgentMail)' showDisconnect={false}>
      <EmptyState
        icon={Mail}
        title={t('settings.channels.emailAgentmail.comingSoonTitle')}
        body={t('settings.channels.emailAgentmail.comingSoonBody', {
          phase: t('settings.channelsIndex.phase2Label'),
        })}
      />
    </ChannelDetailLayout>
  );
};

export default EmailAgentMailSetup;
