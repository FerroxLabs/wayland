import React from 'react';
import { useParams } from 'react-router-dom';
import { Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '@renderer/components/settings/shared/feedback/EmptyState';
import PageHeader from '@renderer/components/settings/shared/forms/PageHeader';

// chat
const TelegramSetup = React.lazy(() => import('./details/chat/TelegramSetup'));
const SlackSetup = React.lazy(() => import('./details/chat/SlackSetup'));
const DiscordSetup = React.lazy(() => import('./details/chat/DiscordSetup'));
const LarkSetup = React.lazy(() => import('./details/chat/LarkSetup'));
const DingTalkSetup = React.lazy(() => import('./details/chat/DingTalkSetup'));
const WeChatSetup = React.lazy(() => import('./details/chat/WeChatSetup'));
const WeComSetup = React.lazy(() => import('./details/chat/WeComSetup'));

// messaging
const WhatsAppSetup = React.lazy(() => import('./details/messaging/WhatsAppSetup'));
const SmsSetup = React.lazy(() => import('./details/messaging/SmsSetup'));
const SignalSetup = React.lazy(() => import('./details/messaging/SignalSetup'));
const LineSetup = React.lazy(() => import('./details/messaging/LineSetup'));
const IMessageSetup = React.lazy(() => import('./details/messaging/IMessageSetup'));
const BluebubblesSetup = React.lazy(() => import('./details/messaging/BluebubblesSetup'));

// social
const TwitchSetup = React.lazy(() => import('./details/social/TwitchSetup'));
const NostrSetup = React.lazy(() => import('./details/social/NostrSetup'));

// collab
const MsTeamsSetup = React.lazy(() => import('./details/collab/MsTeamsSetup'));
const MatrixSetup = React.lazy(() => import('./details/collab/MatrixSetup'));
const MattermostSetup = React.lazy(() => import('./details/collab/MattermostSetup'));
const GoogleChatSetup = React.lazy(() => import('./details/collab/GoogleChatSetup'));
const NextcloudTalkSetup = React.lazy(() => import('./details/collab/NextcloudTalkSetup'));
const SynologyChatSetup = React.lazy(() => import('./details/collab/SynologyChatSetup'));

// email
const EmailAgentMailSetup = React.lazy(() => import('./details/email/EmailAgentMailSetup'));
const EmailImapSetup = React.lazy(() => import('./details/email/EmailImapSetup'));

// integration
const WebhookSetup = React.lazy(() => import('./details/integration/WebhookSetup'));
const IrcSetup = React.lazy(() => import('./details/integration/IrcSetup'));

const CHANNEL_COMPONENTS: Record<string, React.LazyExoticComponent<React.FC>> = {
  // chat
  telegram: TelegramSetup,
  slack: SlackSetup,
  discord: DiscordSetup,
  lark: LarkSetup,
  dingtalk: DingTalkSetup,
  wechat: WeChatSetup,
  wecom: WeComSetup,
  // messaging
  whatsapp: WhatsAppSetup,
  'sms-twilio': SmsSetup,
  signal: SignalSetup,
  line: LineSetup,
  imessage: IMessageSetup,
  bluebubbles: BluebubblesSetup,
  // social
  twitch: TwitchSetup,
  nostr: NostrSetup,
  // collab
  'ms-teams': MsTeamsSetup,
  matrix: MatrixSetup,
  mattermost: MattermostSetup,
  'google-chat': GoogleChatSetup,
  'nextcloud-talk': NextcloudTalkSetup,
  'synology-chat': SynologyChatSetup,
  // email
  email: EmailAgentMailSetup, // legacy alias - earlier index linked /channels/email
  'email-agentmail': EmailAgentMailSetup,
  'email-imap': EmailImapSetup,
  // integration
  webhook: WebhookSetup,
  irc: IrcSetup,
};

const ChannelDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const channelId = id ?? '';

  const Component = CHANNEL_COMPONENTS[channelId];

  if (!Component) {
    return (
      <div>
        <PageHeader
          title={channelId}
          breadcrumb={[{ label: t('settings.channelsIndex.title', 'Channels') }, { label: channelId }]}
        />
        <EmptyState
          icon={Plug}
          title={t('settings.shared.comingSoonTitle', 'Coming soon')}
          body={t('settings.channelsIndex.detailComingSoon', 'Per-channel setup is coming soon.')}
        />
      </div>
    );
  }

  return (
    <React.Suspense fallback={null}>
      <Component />
    </React.Suspense>
  );
};

export default ChannelDetailPage;
