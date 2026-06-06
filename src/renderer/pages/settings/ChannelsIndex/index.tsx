import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@arco-design/web-react';
import {
  ArrowRight,
  Bird,
  Briefcase,
  Building2,
  Cloud,
  Hash,
  Key,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareDot,
  Network,
  QrCode,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Tv,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';

type ChannelStatus = 'idle' | 'connected' | 'soon';
type ChannelTier = 1 | 2 | 3;

type ChannelMeta = {
  id: string;
  displayName: string;
  taglineKey: string;
  icon: LucideIcon;
  status: ChannelStatus;
  tier: ChannelTier;
};

const CHANNELS: ChannelMeta[] = [
  // ---------- Tier 1 - mass-market ----------
  { id: 'telegram', displayName: 'Telegram', taglineKey: 'settings.channelsIndex.telegramTagline', icon: Send, status: 'idle', tier: 1 },
  { id: 'slack', displayName: 'Slack', taglineKey: 'settings.channelsIndex.slackTagline', icon: Hash, status: 'idle', tier: 1 },
  { id: 'discord', displayName: 'Discord', taglineKey: 'settings.channelsIndex.discordTagline', icon: MessageCircle, status: 'idle', tier: 1 },
  { id: 'whatsapp', displayName: 'WhatsApp', taglineKey: 'settings.channelsIndex.whatsappTagline', icon: MessageCircle, status: 'idle', tier: 1 },
  { id: 'sms-twilio', displayName: 'SMS (Twilio)', taglineKey: 'settings.channelsIndex.smsTwilioTagline', icon: MessageSquare, status: 'idle', tier: 1 },
  { id: 'webhook', displayName: 'Webhook', taglineKey: 'settings.channelsIndex.webhookTagline', icon: Webhook, status: 'idle', tier: 1 },
  { id: 'signal', displayName: 'Signal', taglineKey: 'settings.channelsIndex.signalTagline', icon: ShieldCheck, status: 'idle', tier: 1 },
  { id: 'email-agentmail', displayName: 'Email (AgentMail)', taglineKey: 'settings.channelsIndex.emailAgentMailTagline', icon: Mail, status: 'idle', tier: 1 },
  { id: 'email-imap', displayName: 'Email (IMAP/SMTP)', taglineKey: 'settings.channelsIndex.emailImapTagline', icon: Mail, status: 'idle', tier: 1 },

  // ---------- Tier 2 - pro & regional ----------
  { id: 'matrix', displayName: 'Matrix', taglineKey: 'settings.channelsIndex.matrixTagline', icon: Network, status: 'idle', tier: 2 },
  { id: 'ms-teams', displayName: 'MS Teams', taglineKey: 'settings.channelsIndex.msteamsTagline', icon: Users, status: 'idle', tier: 2 },
  { id: 'line', displayName: 'LINE', taglineKey: 'settings.channelsIndex.lineTagline', icon: Send, status: 'idle', tier: 2 },
  { id: 'imessage', displayName: 'iMessage', taglineKey: 'settings.channelsIndex.imessageTagline', icon: MessageSquareDot, status: 'idle', tier: 2 },
  { id: 'lark', displayName: 'Lark / Feishu', taglineKey: 'settings.channelsIndex.larkTagline', icon: Bird, status: 'idle', tier: 2 },
  { id: 'dingtalk', displayName: 'DingTalk', taglineKey: 'settings.channelsIndex.dingtalkTagline', icon: Building2, status: 'idle', tier: 2 },
  { id: 'wechat', displayName: 'WeChat', taglineKey: 'settings.channelsIndex.wechatTagline', icon: QrCode, status: 'idle', tier: 2 },
  { id: 'wecom', displayName: 'WeCom', taglineKey: 'settings.channelsIndex.wecomTagline', icon: Briefcase, status: 'idle', tier: 2 },

  // ---------- Tier 3 - long tail ----------
  { id: 'mattermost', displayName: 'Mattermost', taglineKey: 'settings.channelsIndex.mattermostTagline', icon: Hash, status: 'idle', tier: 3 },
  { id: 'google-chat', displayName: 'Google Chat', taglineKey: 'settings.channelsIndex.googleChatTagline', icon: MessageCircle, status: 'idle', tier: 3 },
  { id: 'nextcloud-talk', displayName: 'Nextcloud Talk', taglineKey: 'settings.channelsIndex.nextcloudTalkTagline', icon: Cloud, status: 'idle', tier: 3 },
  { id: 'irc', displayName: 'IRC', taglineKey: 'settings.channelsIndex.ircTagline', icon: Hash, status: 'idle', tier: 3 },
  { id: 'nostr', displayName: 'Nostr', taglineKey: 'settings.channelsIndex.nostrTagline', icon: Key, status: 'idle', tier: 3 },
  { id: 'twitch', displayName: 'Twitch', taglineKey: 'settings.channelsIndex.twitchTagline', icon: Tv, status: 'idle', tier: 3 },
  { id: 'synology-chat', displayName: 'Synology Chat', taglineKey: 'settings.channelsIndex.synologyChatTagline', icon: Server, status: 'idle', tier: 3 },
  { id: 'bluebubbles', displayName: 'BlueBubbles', taglineKey: 'settings.channelsIndex.bluebubblesTagline', icon: Smartphone, status: 'idle', tier: 3 },
];

const STATUS_STYLES: Record<ChannelStatus, string> = {
  idle: 'bg-[var(--color-bg-4)] text-[var(--color-text-3)]',
  connected: 'bg-[var(--success-soft-bg,rgba(34,197,94,0.12))] text-[var(--success,#22c55e)]',
  soon: 'bg-[var(--warning-soft-bg,rgba(245,158,11,0.12))] text-[var(--warning,#f59e0b)]',
};

const ChannelsIndex: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('1');

  const statusLabel = (status: ChannelStatus): string => {
    if (status === 'connected') return t('settings.channelsIndex.connected');
    if (status === 'soon') return t('settings.channelsIndex.comingSoon');
    return t('settings.channelsIndex.notConnected');
  };

  const ctaLabel = (status: ChannelStatus): string =>
    status === 'connected' ? t('settings.channelsIndex.configure') : t('settings.channelsIndex.setUp');

  const renderTier = (tier: ChannelTier) => (
    // overflow-hidden on the wrapper + min-w-0 on each card defends against
    // the first-paint case where Electron's renderer briefly measures the
    // content area wider than its eventual parent, causing the 3rd column
    // to clip off the right edge. UnoCSS's grid-cols-3 maps to
    // repeat(3, minmax(0, 1fr)) - min-w-0 on the children lets that minmax
    // actually shrink past content min-width instead of pushing the grid
    // wider.
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14px pt-12px overflow-hidden'>
      {CHANNELS.filter((c) => c.tier === tier).map((channel) => {
        const Icon = channel.icon;
        const clickable = true;
        return (
          <article
            key={channel.id}
            // Card recipe matches AssistantCard / TeamCard / WorkflowCard: 1px
            // border, 12px radius, --color-bg-2 surface, 12/14/10 padding,
            // primary-6 hover border + soft ring. Channels needs slightly more
            // vertical room than 104px because of the status pill + CTA row.
            className={`group flex flex-col gap-8px rounded-12px bg-[var(--color-bg-2)] border border-solid border-[var(--color-border-2)] min-h-[124px] min-w-0 cursor-pointer transition-[border-color,background,box-shadow,transform] duration-160 hover:border-[rgb(var(--primary-6))] hover:bg-[var(--color-fill-1)] hover:shadow-[0_0_0_1px_rgb(var(--primary-6)/0.4)] active:scale-[0.99]`}
            style={{ padding: '12px 14px 10px' }}
            onClick={clickable ? () => navigate(`/settings/channels/${channel.id}`) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/settings/channels/${channel.id}`);
                    }
                  }
                : undefined
            }
          >
            <div className='flex items-center gap-10px'>
              <span className='w-32px h-32px rounded-8px bg-[var(--color-fill-2)] flex items-center justify-center shrink-0 text-[var(--color-text-1)] overflow-hidden'>
                <Icon size={18} />
              </span>
              <div className='text-14px font-semibold text-[var(--color-text-1)] min-w-0 truncate leading-20px'>
                {channel.displayName}
              </div>
            </div>
            <p className='text-[12.5px] text-[var(--color-text-3)] m-0 leading-[18px]'>{t(channel.taglineKey)}</p>
            <div className='flex items-center justify-between gap-8px mt-auto'>
              <span
                className={`inline-flex items-center whitespace-nowrap px-8px py-2px rounded-full text-11px font-medium ${STATUS_STYLES[channel.status]}`}
              >
                {statusLabel(channel.status)}
              </span>
              <span className='inline-flex items-center gap-4px text-[12.5px] font-semibold text-[var(--brand)] whitespace-nowrap'>
                {ctaLabel(channel.status)} <ArrowRight size={13} />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <SettingsPageShell
      title={t('settings.channelsIndex.title')}
      subtitle={t('settings.channelsIndex.subtitle')}
      contentClassName='md:max-w-[1600px]'
    >
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane key='1' title={t('settings.channelsIndex.tier1Tab')}>
          {renderTier(1)}
        </Tabs.TabPane>
        <Tabs.TabPane key='2' title={t('settings.channelsIndex.tier2Tab')}>
          {renderTier(2)}
        </Tabs.TabPane>
        <Tabs.TabPane key='3' title={t('settings.channelsIndex.tier3Tab')}>
          {renderTier(3)}
        </Tabs.TabPane>
      </Tabs>
      <div className='mt-24px text-12px text-[var(--color-text-3)] text-center'>
        {t('settings.channelsIndex.footerText')}{' '}
        <span className='text-[var(--brand)] cursor-pointer'>{t('settings.channelsIndex.browseExtensions')}</span>
      </div>
    </SettingsPageShell>
  );
};

export default ChannelsIndex;
