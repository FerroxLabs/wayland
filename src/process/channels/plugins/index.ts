/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export { BasePlugin } from './BasePlugin';
export type { PluginMessageHandler } from './BasePlugin';

// Telegram plugin
export { TelegramPlugin } from './telegram/TelegramPlugin';
export * from './telegram/TelegramAdapter';
export * from './telegram/TelegramKeyboards';

// DingTalk plugin
export { DingTalkPlugin } from './dingtalk/DingTalkPlugin';

// WeChat plugin
export { WeixinPlugin } from './weixin/WeixinPlugin';

// WeCom (Enterprise WeChat) plugin
export { WecomPlugin } from './wecom/WecomPlugin';

// Slack plugin (tier 1)
export { SlackPlugin } from './tier1/slack/SlackPlugin';
export type { SlackTransport } from './tier1/slack/SlackPlugin';

// SMS (Twilio) plugin (tier 1) — webhook-driven buffered messaging
export { SmsTwilioPlugin } from './tier1/sms/SmsTwilioPlugin';

// WhatsApp plugin (tier 1) — bridge subprocess (Baileys / whatsapp-web.js / Meta Cloud API)
export { WhatsAppPlugin } from './tier1/whatsapp/WhatsAppPlugin';
export type { WhatsAppBackend } from './tier1/whatsapp/WhatsAppPlugin';

// Discord plugin (tier 1)
export { DiscordPlugin } from './tier1/discord/DiscordPlugin';
export {
  DISCORD_MESSAGE_LIMIT,
  splitMessage as splitDiscordMessage,
  toDiscordSendParams,
  toUnifiedIncomingMessage as toUnifiedIncomingMessageFromDiscord,
  toUnifiedUser as toUnifiedUserFromDiscord,
} from './tier1/discord/DiscordAdapter';
export type { DiscordSendParams } from './tier1/discord/DiscordAdapter';
export {
  banMember as discordBanMember,
  joinVoiceChannelById as discordJoinVoiceChannel,
  kickMember as discordKickMember,
  sendTyping as discordSendTyping,
  setBotPresence as discordSetBotPresence,
  timeoutMember as discordTimeoutMember,
} from './tier1/discord/DiscordActions';
