/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// ==================== Plugin Types ====================

/**
 * Plugin capability flags - declared per concrete plugin so the ActionExecutor
 * can adapt streaming behavior, agent UX cues, and per-platform fallbacks.
 *
 * Lifted concept from OpenClaw src/channels/plugins/outbound.types.ts (MIT).
 */
export type IPluginCapabilities = {
  /** Plugin supports editing a previously-sent message in place */
  readonly canEdit: boolean;
  /** Plugin supports reactions (emoji/ack) on inbound messages */
  readonly canReact: boolean;
  /** Plugin supports streaming partial response chunks (vs single-shot send) */
  readonly canStream: boolean;
  /** Plugin supports a transient typing indicator */
  readonly canTypingIndicator: boolean;
};

/**
 * Built-in platform types for channel plugins.
 */
export type BuiltinPluginType =
  | 'telegram'
  | 'slack'
  | 'discord'
  | 'whatsapp'
  | 'sms-twilio'
  | 'lark'
  | 'dingtalk'
  | 'weixin'
  | 'wecom'
  | 'matrix'
  | 'email-agentmail'
  | 'email-imap';

/**
 * Supported platform types for plugins.
 * Extension-contributed plugins can use any string type (e.g., 'ext-feishu').
 * Built-in types are preserved for type-safe handling in known code paths.
 */
export type PluginType = BuiltinPluginType | (string & {});

/**
 * Plugin connection status
 */
export type PluginStatus =
  | 'created'
  | 'initializing'
  | 'ready'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error';

/**
 * Plugin credentials (stored encrypted in database)
 * Built-in fields for known platforms + index signature for extension plugins.
 */
export interface IPluginCredentials {
  // Telegram
  token?: string;
  // Lark/Feishu
  appId?: string;
  appSecret?: string;
  encryptKey?: string;
  verificationToken?: string;
  // DingTalk
  clientId?: string;
  clientSecret?: string;
  // WeCom (Enterprise WeChat AI Bot callback)
  encodingAesKey?: string;
  // WeCom (Enterprise WeChat AI Bot websocket)
  botId?: string;
  secret?: string;
  // WeCom CorpID / ReceiveID - required for webhook mode so we can validate
  // the trailing receiveid bytes in the decrypted payload (CRIT-2 fix).
  corpId?: string;
  // Discord (Tier 1) - applicationId and publicKey are only required if the
  // operator opts into slash commands or the HTTP interaction endpoint.
  botToken?: string;
  applicationId?: string;
  publicKey?: string;
  // SMS (Twilio)
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  messagingServiceSid?: string;
  // Slack (Tier 1) - transport is 'socket' or 'events'; appToken is required
  // for Socket Mode, signingSecret for the Events API HTTPS webhook transport.
  appToken?: string;
  signingSecret?: string;
  transport?: string;
  // WhatsApp (Tier 1) - backend is 'baileys' | 'whatsapp-web' | 'meta-business'.
  // Baileys/whatsapp-web pair via QR code at runtime; only Meta Cloud API
  // needs credentials at form-time. verifyToken is the static string Meta GET
  // /webhook handshake checks against (operator-chosen).
  backend?: string;
  accessToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  verifyToken?: string;
  // WhatsApp mode (default 'personal' when absent). 'personal' = the linked
  // account is the operator's own number; only the self-chat is trusted and
  // unknown contacts are ignored silently. 'dedicated' = a separate bot number
  // others may pair with; ownerNumbers lists the operator's personal number(s)
  // so Wayland can recognize the owner from a different device.
  mode?: 'personal' | 'dedicated';
  ownerNumbers?: readonly string[];
  // Matrix (Tier 2) - federation-aware messaging via matrix-js-sdk. accessToken
  // reused from WhatsApp Meta. homeserverUrl is the canonical HTTPS base
  // (e.g. https://matrix.org); userId is the full mxid (e.g. @bot:matrix.org).
  homeserverUrl?: string;
  userId?: string;
  // Email (AgentMail) - apiKey + inboxAddress are required; webhookSecret is
  // optional and used by the AgentMail HMAC-SHA256 webhook verifier.
  apiKey?: string;
  inboxAddress?: string;
  webhookSecret?: string;
  // Email (IMAP/SMTP) - operator-owned mailbox via imapflow + nodemailer.
  // useSameAuth (default true) makes SMTP reuse the IMAP creds; smtpHost
  // defaults to imapHost when blank.
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;
  imapTls?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpTls?: boolean;
  useSameAuth?: boolean;
  // Extension plugins + new-channel array/list fields (IRC channels, Nostr
  // relays, iMessage allowedHandles, etc). arrays-of-primitives are stored
  // as-is; nested objects are NOT permitted by design - push them into
  // pluginRuntimeConfig instead.
  [key: string]: string | number | boolean | readonly string[] | readonly number[] | undefined;
}

/**
 * Check whether a plugin has valid credentials configured.
 * Centralized so every call-site stays in sync when a new platform is added.
 * For extension plugins, any non-empty credential value is considered valid.
 */
export function hasPluginCredentials(type: PluginType, credentials?: IPluginCredentials): boolean {
  if (!credentials) return false;
  if (type === 'lark') return !!(credentials.appId && credentials.appSecret);
  if (type === 'dingtalk') return !!(credentials.clientId && credentials.clientSecret);
  if (type === 'telegram') return !!credentials.token;
  if (type === 'slack') return !!credentials.botToken;
  if (type === 'discord') return !!credentials.botToken;
  if (type === 'sms-twilio') {
    return !!(
      credentials.accountSid &&
      credentials.authToken &&
      (credentials.fromNumber || credentials.messagingServiceSid)
    );
  }
  if (type === 'whatsapp') {
    // Baileys / whatsapp-web pair via QR at runtime - no form-time creds.
    // Meta Business Cloud API requires accessToken + phoneNumberId up front.
    const backend = (credentials.backend ?? 'baileys') as string;
    if (backend === 'meta-business') {
      return !!(credentials.accessToken && credentials.phoneNumberId);
    }
    return true;
  }
  if (type === 'matrix') {
    return !!(credentials.homeserverUrl && credentials.accessToken && credentials.userId);
  }
  if (type === 'email-agentmail') {
    return !!(credentials.apiKey && credentials.inboxAddress);
  }
  if (type === 'email-imap') {
    return !!(credentials.imapHost && credentials.imapUser && credentials.imapPassword);
  }
  if (type === 'weixin') return !!(credentials.accountId && credentials.botToken);
  if (type === 'wecom') {
    const key = credentials.encodingAesKey;
    const hasWebhook = !!(credentials.token && key && key.length === 43 && credentials.corpId);
    const hasWebsocket = !!(credentials.botId && credentials.secret);
    return hasWebhook || hasWebsocket;
  }
  // Extension or unknown plugins: check if any credential value is non-empty
  return Object.values(credentials).some((v) => v !== undefined && v !== null && v !== '');
}

/**
 * Plugin configuration options
 */
export interface IPluginConfigOptions {
  mode?: 'polling' | 'webhook' | 'websocket';
  webhookUrl?: string;
  rateLimit?: number; // Max messages per minute
  requireMention?: boolean; // Require @mention in groups
  // Extension plugins may define additional primitive config fields
  [key: string]: string | number | boolean | undefined;
}

/**
 * Plugin configuration stored in database
 */
export interface IChannelPluginConfig {
  id: string;
  type: PluginType;
  name: string;
  enabled: boolean;
  credentials?: IPluginCredentials;
  config?: IPluginConfigOptions;
  status: PluginStatus;
  lastConnected?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Saved-config view for rehydrating a channel's Settings form on reopen.
 *
 * Deliberately split from IChannelPluginStatus (which is remote-readable by a
 * paired WebUI) because it discloses the operator's saved connection details
 * (e.g. the IMAP/SMTP hosts + the account address). `config` carries only the
 * non-secret scalar fields; every sensitive field (per `isSensitiveField`) is
 * reduced to a presence boolean in `secretPresence` so the form can show a
 * "saved - leave blank to keep" hint without the secret ever leaving main.
 * The `channel.get-plugin-config` provider is remote-denied for this reason.
 */
export interface IChannelPluginConfigView {
  id: string;
  type: PluginType;
  enabled: boolean;
  status: PluginStatus;
  config: Record<string, string | number | boolean>;
  secretPresence: Record<string, boolean>;
}

/**
 * Plugin status for IPC communication
 */
export interface IChannelPluginStatus {
  id: string;
  type: PluginType;
  name: string;
  enabled: boolean;
  connected: boolean;
  status: PluginStatus;
  lastConnected?: number;
  error?: string;
  activeUsers: number;
  botUsername?: string;
  /** Whether the plugin has a token configured (token itself is not exposed for security) */
  hasToken?: boolean;
  /**
   * Pending QR-pairing payload for plugins whose runtime initiates a code-scan
   * handshake (e.g. WhatsApp Baileys / whatsapp-web.js). Renderer surfaces it
   * in the config form. Cleared once the plugin status transitions to
   * `running` after a successful pair.
   */
  qrCode?: string;
  /**
   * Live transport-connection state for plugins backed by a long-lived socket
   * (e.g. WhatsApp Baileys: 'connecting' | 'connected' | 'disconnected' |
   * 'logged_out'). Lets the renderer distinguish "connected, no QR needed" from
   * "waiting for a pairing QR" - both of which otherwise have a null qrCode.
   */
  connectionState?: string;
  /**
   * Non-secret WhatsApp account mode ('personal' | 'dedicated') surfaced so the
   * config form can restore the saved mode on reopen (IChannelPluginStatus does
   * not carry credentials). The mode itself is not a secret; ownerNumbers (the
   * operator's phone numbers) are deliberately NOT exposed here because status
   * is readable by remote WebUI callers.
   */
  whatsappMode?: 'personal' | 'dedicated';
  /** Whether this plugin comes from an extension (not built-in) */
  isExtension?: boolean;
  /** Extension-contributed metadata for dynamic UI rendering */
  extensionMeta?: {
    /** Credential fields required by this extension plugin */
    credentialFields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'password' | 'select' | 'number' | 'boolean';
      required?: boolean;
      options?: string[];
      default?: string | number | boolean;
    }>;
    /** Additional config fields */
    configFields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'password' | 'select' | 'number' | 'boolean';
      required?: boolean;
      options?: string[];
      default?: string | number | boolean;
    }>;
    /** Description of the plugin */
    description?: string;
    /** Extension name this plugin belongs to */
    extensionName?: string;
    /** Icon URL for the extension channel plugin */
    icon?: string;
    /**
     * Credential keys (from `credentialFields[].key`) that the secrets layer
     * should encrypt at rest. Omitting this falls back to the default policy
     * of encrypting every credential value.
     */
    sensitiveFields?: readonly string[];
  };
}

// ==================== User Types ====================

/**
 * Authorized user in the assistant system
 */
export interface IChannelUser {
  id: string;
  platformUserId: string;
  platformType: PluginType;
  displayName?: string;
  authorizedAt: number;
  lastActive?: number;
  sessionId?: string;
}

/**
 * Database row for assistant users
 */
export interface IChannelUserRow {
  id: string;
  platform_user_id: string;
  platform_type: string;
  display_name: string | null;
  authorized_at: number;
  last_active: number | null;
  session_id: string | null;
}

// ==================== Session Types ====================

/**
 * Agent types supported in assistant sessions
 */
export type ChannelAgentType = 'gemini' | 'acp' | 'codex' | 'openclaw-gateway';

/**
 * User session in the assistant system
 */
export interface IChannelSession {
  id: string;
  userId: string;
  agentType: ChannelAgentType;
  conversationId?: string;
  workspace?: string;
  chatId?: string; // Channel chat isolation ID (e.g. user:xxx, group:xxx)
  createdAt: number;
  lastActivity: number;
}

/**
 * Database row for assistant sessions
 */
export interface IChannelSessionRow {
  id: string;
  user_id: string;
  agent_type: string;
  conversation_id: string | null;
  workspace: string | null;
  chat_id: string | null; // Channel chat isolation ID
  created_at: number;
  last_activity: number;
}

// ==================== Pairing Types ====================

/**
 * Pairing request status
 */
export type PairingStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * Pending pairing request
 */
export interface IChannelPairingRequest {
  code: string;
  platformUserId: string;
  platformType: PluginType;
  displayName?: string;
  requestedAt: number;
  expiresAt: number;
  status: PairingStatus;
}

/**
 * Database row for pairing codes
 */
export interface IChannelPairingCodeRow {
  code: string;
  platform_user_id: string;
  platform_type: string;
  display_name: string | null;
  requested_at: number;
  expires_at: number;
  status: string;
}

// ==================== Message Types ====================

/**
 * Content types for unified messages
 */
export type MessageContentType =
  | 'text'
  | 'photo'
  | 'document'
  | 'voice'
  | 'audio'
  | 'video'
  | 'sticker'
  | 'action'
  | 'command';

/**
 * Unified user information across platforms
 */
export interface IUnifiedUser {
  id: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
}

/**
 * Attachment types for messages
 */
export type AttachmentType = 'photo' | 'document' | 'voice' | 'audio' | 'video' | 'sticker';

/**
 * Unified attachment information
 */
export interface IUnifiedAttachment {
  type: AttachmentType;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  /**
   * On-disk path where the channel has already cached the media bytes for
   * direct read. Set by channels that download media to a temp file before
   * surfacing the unified message (e.g. WhatsApp QR backends). Absent when
   * the channel exposes only an opaque platform-side fileId.
   */
  localPath?: string;
}

/**
 * Unified message content
 */
export interface IUnifiedMessageContent {
  type: MessageContentType;
  text: string;
  attachments?: IUnifiedAttachment[];
}

/**
 * Unified action in a message
 */
export interface IMessageAction {
  type: ActionCategory;
  name: string;
  params?: Record<string, string>;
}

/**
 * Unified incoming message format (Platform -> System)
 */
export interface IUnifiedIncomingMessage {
  id: string;
  platform: PluginType;
  chatId: string;
  user: IUnifiedUser;
  content: IUnifiedMessageContent;
  timestamp: number;
  /**
   * True when the message originated in a group/multi-party chat (e.g. WhatsApp
   * group, Discord channel) rather than a 1:1 DM. Optional because not every
   * channel exposes group state (e.g. Meta Cloud API is 1:1-only); plugins
   * that DO know should forward it so downstream permission/scoping logic can
   * branch on it.
   */
  isGroup?: boolean;
  /**
   * True when the message comes from the channel operator's own trusted thread
   * (e.g. a linked-device WhatsApp "message yourself" chat). Such messages skip
   * the pairing gate - the operator does not need to approve a conversation
   * with themselves.
   */
  isOwner?: boolean;
  replyToMessageId?: string;
  action?: IMessageAction;
  raw?: unknown;
  readonly email?: {
    readonly from: string;
    readonly to: string;
    readonly subject?: string;
    readonly messageId?: string;
    readonly inReplyTo?: string;
    readonly references?: readonly string[];
  };
}

/**
 * Parse mode for outgoing messages
 */
export type MessageParseMode = 'plain' | 'markdown' | 'html';

/**
 * Button for inline keyboards
 */
export interface IActionButton {
  label: string;
  action: string;
  params?: Record<string, string>;
}

export interface IChannelMediaAction {
  type: 'image' | 'file';
  path: string;
  fileName?: string;
  caption?: string;
}

/**
 * Unified outgoing message format (System -> Platform)
 */
export interface IUnifiedOutgoingMessage {
  type: 'text' | 'image' | 'file' | 'buttons';
  text?: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  buttons?: IActionButton[][];
  keyboard?: IActionButton[][];
  replyMarkup?: unknown;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  mediaActions?: IChannelMediaAction[];
  replyToMessageId?: string;
  silent?: boolean;
  subject?: string; // email subject
  capabilities?: IPluginCapabilities; // hint from agent to plugin
}

/**
 * Bot information for display
 */
export interface BotInfo {
  id: string;
  username?: string;
  displayName: string;
}

// ==================== Action Types ====================

/**
 * Action categories
 */
export type ActionCategory = 'platform' | 'system' | 'chat';

/**
 * Unified action structure
 */
export interface IUnifiedAction {
  action: string;
  category: ActionCategory;
  params?: Record<string, string>;
  context: {
    platform: PluginType;
    userId: string;
    chatId: string;
    messageId?: string;
    sessionId?: string;
  };
}

/**
 * Response behavior for actions
 */
export type ActionResponseBehavior = 'send' | 'edit' | 'answer';

/**
 * Unified action response
 */
export interface IActionResponse {
  text?: string;
  parseMode?: MessageParseMode;
  buttons?: IActionButton[][];
  keyboard?: IActionButton[][];
  behavior: ActionResponseBehavior;
  toast?: string;
  editMessageId?: string;
}

// ==================== Agent Response Types ====================

/**
 * Agent response types for streaming
 */
export type AgentResponseType = 'text' | 'stream_start' | 'stream_chunk' | 'stream_end' | 'error';

/**
 * Agent response structure
 */
export interface IAgentResponse {
  type: AgentResponseType;
  text?: string;
  chunk?: string;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    model?: string;
    tokensUsed?: number;
    duration?: number;
  };
  suggestedActions?: IActionButton[];
}

// ==================== Type Conversion Helpers ====================

/**
 * Convert database row to IChannelUser
 */
export function rowToChannelUser(row: IChannelUserRow): IChannelUser {
  return {
    id: row.id,
    platformUserId: row.platform_user_id,
    platformType: row.platform_type as PluginType,
    displayName: row.display_name ?? undefined,
    authorizedAt: row.authorized_at,
    lastActive: row.last_active ?? undefined,
    sessionId: row.session_id ?? undefined,
  };
}

/**
 * Convert IChannelUser to database row
 */
export function channelUserToRow(user: IChannelUser): IChannelUserRow {
  return {
    id: user.id,
    platform_user_id: user.platformUserId,
    platform_type: user.platformType,
    display_name: user.displayName ?? null,
    authorized_at: user.authorizedAt,
    last_active: user.lastActive ?? null,
    session_id: user.sessionId ?? null,
  };
}

/**
 * Convert database row to IChannelSession
 */
export function rowToChannelSession(row: IChannelSessionRow): IChannelSession {
  return {
    id: row.id,
    userId: row.user_id,
    agentType: row.agent_type as ChannelAgentType,
    conversationId: row.conversation_id ?? undefined,
    workspace: row.workspace ?? undefined,
    chatId: row.chat_id ?? undefined,
    createdAt: row.created_at,
    lastActivity: row.last_activity,
  };
}

/**
 * Convert IChannelSession to database row
 */
export function channelSessionToRow(session: IChannelSession): IChannelSessionRow {
  return {
    id: session.id,
    user_id: session.userId,
    agent_type: session.agentType,
    conversation_id: session.conversationId ?? null,
    workspace: session.workspace ?? null,
    chat_id: session.chatId ?? null,
    created_at: session.createdAt,
    last_activity: session.lastActivity,
  };
}

/**
 * Convert database row to IChannelPairingRequest
 */
export function rowToPairingRequest(row: IChannelPairingCodeRow): IChannelPairingRequest {
  return {
    code: row.code,
    platformUserId: row.platform_user_id,
    platformType: row.platform_type as PluginType,
    displayName: row.display_name ?? undefined,
    requestedAt: row.requested_at,
    expiresAt: row.expires_at,
    status: row.status as PairingStatus,
  };
}

/**
 * Convert IChannelPairingRequest to database row
 */
export function pairingRequestToRow(request: IChannelPairingRequest): IChannelPairingCodeRow {
  return {
    code: request.code,
    platform_user_id: request.platformUserId,
    platform_type: request.platformType,
    display_name: request.displayName ?? null,
    requested_at: request.requestedAt,
    expires_at: request.expiresAt,
    status: request.status,
  };
}

// ==================== Channel Platform Helpers ====================

/**
 * Channel platform type for model configuration.
 * Includes built-in platforms and extension-contributed platforms (string).
 */
export type ChannelPlatform = 'telegram' | 'lark' | 'dingtalk' | 'weixin' | 'wecom' | (string & {});

/**
 * Type guard to check if a string is a known built-in ChannelPlatform.
 * Extension platform types are valid but not matched here.
 */
export function isBuiltinChannelPlatform(
  value: string
): value is 'telegram' | 'lark' | 'dingtalk' | 'weixin' | 'wecom' {
  return value === 'telegram' || value === 'lark' || value === 'dingtalk' || value === 'weixin' || value === 'wecom';
}

/**
 * Type guard to check if a string is a valid ChannelPlatform (including extensions).
 * All non-empty strings are valid channel platforms.
 */
export function isChannelPlatform(value: string): value is ChannelPlatform {
  return value.length > 0;
}

/**
 * Built-in channel conversation sources (== plugin platform id; see
 * ActionExecutor `const source = platform`). A conversation from any of these
 * has NO interactive human to approve tool-permission prompts, so the agent
 * must run with auto-approve (yoloMode). Keep this in sync with the registered
 * channel plugins. A channel missing here causes tool-using turns to hang on
 * an unconfirmable permission prompt until the channel queue times out.
 * Non-channel sources ('wayland' = in-app, 'user' = workflow) are intentionally
 * absent so they keep interactive approval.
 */
export const CHANNEL_AUTO_APPROVE_SOURCES: ReadonlySet<string> = new Set([
  'telegram',
  'lark',
  'dingtalk',
  'weixin',
  'wecom',
  'slack',
  'discord',
  'whatsapp',
  'email-imap',
  'signal',
  'sms-twilio',
  'google-chat',
  'line',
  'imessage',
]);

/**
 * Whether a conversation source is a channel that should auto-approve tool
 * permissions (no interactive human in the loop).
 */
export function isAutoApproveChannelSource(source: string | null | undefined): boolean {
  return !!source && CHANNEL_AUTO_APPROVE_SOURCES.has(source);
}

/**
 * Resolve a backend string to conversation type and optional backend qualifier.
 * Centralizes the backend → convType mapping used across channels.
 */
export function resolveChannelConvType(backend: string): {
  convType: string;
  convBackend?: string;
} {
  if (backend === 'codex') return { convType: 'codex' };
  if (backend === 'gemini') return { convType: 'gemini' };
  if (backend === 'wcore') return { convType: 'wcore' };
  if (backend === 'openclaw-gateway') return { convType: 'openclaw-gateway' };
  return { convType: 'acp', convBackend: backend };
}

/**
 * Build a structured conversation name for a channel platform.
 * Format: {shortPlatform}-{type}-{backend}-{chatIdPrefix}
 * - platform is shortened: telegram -> tg, dingtalk -> ding, lark -> lark
 * - backend is only included when type === 'acp'
 * - chatIdPrefix is the first 8 characters of chatId
 * - empty segments are omitted
 */
export function getChannelConversationName(
  platform: ChannelPlatform | PluginType,
  type?: string,
  backend?: string,
  chatId?: string
): string {
  const shortPlatform: Record<string, string> = {
    telegram: 'tg',
    dingtalk: 'ding',
    weixin: 'wx',
    wecom: 'wecom',
  };
  const parts: string[] = [shortPlatform[platform] ?? platform];
  if (type) parts.push(type);
  if (type === 'acp' && backend) parts.push(backend);
  if (chatId) parts.push(chatId.slice(0, 8));
  return parts.join('-');
}
