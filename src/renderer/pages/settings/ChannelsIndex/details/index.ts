/**
 * Barrel for all channel-detail setup pages. Imported by ChannelDetailPage.tsx
 * to keep route -> component wiring in one place.
 *
 * Default exports are re-exported as named exports.
 */

// chat - bot-API platforms
export { default as TelegramSetup } from './chat/TelegramSetup';
export { default as SlackSetup } from './chat/SlackSetup';
export { default as DiscordSetup } from './chat/DiscordSetup';
export { default as LarkSetup } from './chat/LarkSetup';
export { default as DingTalkSetup } from './chat/DingTalkSetup';
export { default as WeChatSetup } from './chat/WeChatSetup';
export { default as WeComSetup } from './chat/WeComSetup';

// messaging - SMS / consumer messengers
export { default as WhatsAppSetup } from './messaging/WhatsAppSetup';
export { default as SmsSetup } from './messaging/SmsSetup';
export { default as SignalSetup } from './messaging/SignalSetup';
export { default as LineSetup } from './messaging/LineSetup';
export { default as IMessageSetup } from './messaging/IMessageSetup';
export { default as BluebubblesSetup } from './messaging/BluebubblesSetup';

// social
export { default as TwitchSetup } from './social/TwitchSetup';
export { default as NostrSetup } from './social/NostrSetup';

// collab
export { default as MsTeamsSetup } from './collab/MsTeamsSetup';
export { default as MatrixSetup } from './collab/MatrixSetup';
export { default as MattermostSetup } from './collab/MattermostSetup';
export { default as GoogleChatSetup } from './collab/GoogleChatSetup';
export { default as NextcloudTalkSetup } from './collab/NextcloudTalkSetup';
export { default as SynologyChatSetup } from './collab/SynologyChatSetup';

// email
export { default as EmailAgentMailSetup } from './email/EmailAgentMailSetup';
export { default as EmailImapSetup } from './email/EmailImapSetup';

// integration
export { default as WebhookSetup } from './integration/WebhookSetup';
export { default as IrcSetup } from './integration/IrcSetup';
