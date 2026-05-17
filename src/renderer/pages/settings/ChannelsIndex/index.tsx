import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@arco-design/web-react';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Bird,
  Briefcase,
  Building2,
  Cloud,
  Hash,
  Key,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareDot,
  Network,
  Phone,
  QrCode,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Smile,
  Tv,
  User,
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
  // ---------- Tier 1 — mass-market ----------
  { id: 'telegram', displayName: 'Telegram', taglineKey: 'settings.channelsIndex.telegramTagline', icon: Send, status: 'idle', tier: 1 },
  { id: 'slack', displayName: 'Slack', taglineKey: 'settings.channelsIndex.slackTagline', icon: Hash, status: 'soon', tier: 1 },
  { id: 'discord', displayName: 'Discord', taglineKey: 'settings.channelsIndex.discordTagline', icon: MessageCircle, status: 'soon', tier: 1 },
  { id: 'whatsapp', displayName: 'WhatsApp', taglineKey: 'settings.channelsIndex.whatsappTagline', icon: MessageCircle, status: 'soon', tier: 1 },
  { id: 'sms-twilio', displayName: 'SMS (Twilio)', taglineKey: 'settings.channelsIndex.smsTwilioTagline', icon: MessageSquare, status: 'soon', tier: 1 },

  // ---------- Tier 2 — pro & regional ----------
  { id: 'signal', displayName: 'Signal', taglineKey: 'settings.channelsIndex.signalTagline', icon: ShieldCheck, status: 'soon', tier: 2 },
  { id: 'matrix', displayName: 'Matrix', taglineKey: 'settings.channelsIndex.matrixTagline', icon: Network, status: 'soon', tier: 2 },
  { id: 'ms-teams', displayName: 'MS Teams', taglineKey: 'settings.channelsIndex.msteamsTagline', icon: Users, status: 'soon', tier: 2 },
  { id: 'line', displayName: 'LINE', taglineKey: 'settings.channelsIndex.lineTagline', icon: Send, status: 'soon', tier: 2 },
  { id: 'imessage', displayName: 'iMessage', taglineKey: 'settings.channelsIndex.imessageTagline', icon: MessageSquareDot, status: 'soon', tier: 2 },
  { id: 'email-agentmail', displayName: 'Email (AgentMail)', taglineKey: 'settings.channelsIndex.emailAgentMailTagline', icon: Mail, status: 'soon', tier: 2 },
  { id: 'email-imap', displayName: 'Email (IMAP/SMTP)', taglineKey: 'settings.channelsIndex.emailImapTagline', icon: Mail, status: 'soon', tier: 2 },
  { id: 'lark', displayName: 'Lark / Feishu', taglineKey: 'settings.channelsIndex.larkTagline', icon: Bird, status: 'idle', tier: 2 },
  { id: 'dingtalk', displayName: 'DingTalk', taglineKey: 'settings.channelsIndex.dingtalkTagline', icon: Building2, status: 'idle', tier: 2 },
  { id: 'wechat', displayName: 'WeChat', taglineKey: 'settings.channelsIndex.wechatTagline', icon: QrCode, status: 'idle', tier: 2 },
  { id: 'wecom', displayName: 'WeCom', taglineKey: 'settings.channelsIndex.wecomTagline', icon: Briefcase, status: 'idle', tier: 2 },

  // ---------- Tier 3 — long tail ----------
  { id: 'viber', displayName: 'Viber', taglineKey: 'settings.channelsIndex.viberTagline', icon: Phone, status: 'soon', tier: 3 },
  { id: 'mastodon', displayName: 'Mastodon', taglineKey: 'settings.channelsIndex.mastodonTagline', icon: AtSign, status: 'soon', tier: 3 },
  { id: 'bluesky', displayName: 'Bluesky', taglineKey: 'settings.channelsIndex.blueskyTagline', icon: Cloud, status: 'soon', tier: 3 },
  { id: 'telegram-userbot', displayName: 'Telegram Userbot', taglineKey: 'settings.channelsIndex.telegramUserbotTagline', icon: User, status: 'soon', tier: 3 },
  { id: 'threema', displayName: 'Threema', taglineKey: 'settings.channelsIndex.threemaTagline', icon: Lock, status: 'soon', tier: 3 },
  { id: 'reddit', displayName: 'Reddit', taglineKey: 'settings.channelsIndex.redditTagline', icon: Megaphone, status: 'soon', tier: 3 },
  { id: 'mattermost', displayName: 'Mattermost', taglineKey: 'settings.channelsIndex.mattermostTagline', icon: Hash, status: 'soon', tier: 3 },
  { id: 'google-chat', displayName: 'Google Chat', taglineKey: 'settings.channelsIndex.googleChatTagline', icon: MessageCircle, status: 'soon', tier: 3 },
  { id: 'nextcloud-talk', displayName: 'Nextcloud Talk', taglineKey: 'settings.channelsIndex.nextcloudTalkTagline', icon: Cloud, status: 'soon', tier: 3 },
  { id: 'irc', displayName: 'IRC', taglineKey: 'settings.channelsIndex.ircTagline', icon: Hash, status: 'soon', tier: 3 },
  { id: 'nostr', displayName: 'Nostr', taglineKey: 'settings.channelsIndex.nostrTagline', icon: Key, status: 'soon', tier: 3 },
  { id: 'zalo', displayName: 'Zalo', taglineKey: 'settings.channelsIndex.zaloTagline', icon: Phone, status: 'soon', tier: 3 },
  { id: 'qq', displayName: 'QQ', taglineKey: 'settings.channelsIndex.qqTagline', icon: Smile, status: 'soon', tier: 3 },
  { id: 'twitch', displayName: 'Twitch', taglineKey: 'settings.channelsIndex.twitchTagline', icon: Tv, status: 'soon', tier: 3 },
  { id: 'synology-chat', displayName: 'Synology Chat', taglineKey: 'settings.channelsIndex.synologyChatTagline', icon: Server, status: 'soon', tier: 3 },
  { id: 'xiaomi', displayName: 'Xiaomi', taglineKey: 'settings.channelsIndex.xiaomiTagline', icon: Smartphone, status: 'soon', tier: 3 },
  { id: 'bluebubbles', displayName: 'BlueBubbles', taglineKey: 'settings.channelsIndex.bluebubblesTagline', icon: Smartphone, status: 'soon', tier: 3 },
  { id: 'x-dms', displayName: 'X / Twitter DMs', taglineKey: 'settings.channelsIndex.xDmsTagline', icon: AlertCircle, status: 'soon', tier: 3 },
  { id: 'webhook', displayName: 'Webhook', taglineKey: 'settings.channelsIndex.webhookTagline', icon: Webhook, status: 'soon', tier: 3 },
];

const STATUS_STYLES: Record<ChannelStatus, string> = {
  idle: 'bg-[var(--bg-3)] text-[var(--text-muted)]',
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
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14px pt-12px'>
      {CHANNELS.filter((c) => c.tier === tier).map((channel) => {
        const Icon = channel.icon;
        const isComingSoon = channel.status === 'soon';
        // Coming-soon tiles remain clickable so users can read about what's planned + when.
        const clickable = true;
        return (
          <article
            key={channel.id}
            className={`flex flex-col gap-12px p-18px rounded-12px bg-[var(--bg-1)] border border-[var(--border-base)] min-h-[150px] transition-all duration-160 ${
              isComingSoon
                ? 'hover:border-[var(--border-strong)] hover:bg-[var(--bg-2)] cursor-pointer'
                : 'hover:border-[var(--brand-soft-border)] hover:bg-[var(--bg-2)] hover:-translate-y-2px cursor-pointer'
            }`}
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
            <div className='flex items-center gap-12px'>
              <span className='w-36px h-36px rounded-9px bg-[var(--bg-3)] border border-[var(--border-light)] flex items-center justify-center shrink-0 text-[var(--text-primary)]'>
                <Icon size={18} />
              </span>
              <div className='text-[14.5px] font-bold text-[var(--text-primary)] min-w-0 truncate'>
                {channel.displayName}
              </div>
            </div>
            <p className='text-[12.5px] text-[var(--text-muted)] m-0 leading-[1.5]'>{t(channel.taglineKey)}</p>
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
      <div className='mt-24px text-12px text-[var(--text-muted)] text-center'>
        {t('settings.channelsIndex.footerText')}{' '}
        <span className='text-[var(--brand)] cursor-pointer'>{t('settings.channelsIndex.browseExtensions')}</span>
      </div>
    </SettingsPageShell>
  );
};

export default ChannelsIndex;
