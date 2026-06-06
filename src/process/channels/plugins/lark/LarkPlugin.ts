/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as lark from '@larksuiteoapi/node-sdk';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../types';
import { BasePlugin } from '../BasePlugin';
import {
  DEFAULT_DISPLAY_NAME,
  extractCardAction,
  isBotMentioned,
  LARK_MESSAGE_LIMIT,
  type LarkMessageEvent,
  resolveLarkDomain,
  toLarkSendParams,
  toUnifiedIncomingMessage,
} from './LarkAdapter';

/**
 * Minimal Lark card-action event shape used by `handleCardAction`. We don't import
 * the full SDK event type because the SDK ships them as `any` callbacks - this
 * keeps the field access narrow and lint-clean without a top-level any cast.
 */
type LarkCardEventPayload = {
  event?: {
    action?: { value?: Record<string, unknown>; tag?: string };
    operator?: { user_id?: string; open_id?: string };
    token?: string;
  };
};

/**
 * Minimal Lark bot-menu event shape.
 */
type LarkBotMenuPayload = {
  event?: {
    operator?: { operator_id?: { user_id?: string; open_id?: string } };
    event_key?: string;
    timestamp?: string;
    chat_id?: string;
  };
};

/**
 * LarkPlugin - Lark/Feishu Bot integration for Personal Assistant
 *
 * Uses official Lark Node SDK
 * Supports WebSocket long connection mode (no public URL required)
 */
// Event deduplication settings
const EVENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const EVENT_CACHE_CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// Lark caps im.message.patch at 5 QPS per app. We throttle per-chat at ~4.5 QPS
// so streaming card edits stay under the platform limit even with multiple active chats.
export const LARK_PATCH_MIN_INTERVAL_MS = 220;

export class LarkPlugin extends BasePlugin {
  readonly type: PluginType = 'lark';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canReact: false,
    canStream: true,
    canTypingIndicator: false,
  };

  private client: lark.Client | null = null;
  private wsClient: lark.WSClient | null = null;
  private eventDispatcher: lark.EventDispatcher | null = null;
  private botInfo: { appId: string; openId?: string; name?: string } | null = null;
  private isConnected: boolean = false;

  // Token expiry timestamp used by ensureAccessToken() to know when to refresh.
  // (The actual token string is owned by the SDK; we only track expiry here.)
  private tokenExpiresAt: number = 0;

  // Display name cache (cacheKey -> resolved name)
  private displayNameCache: Map<string, string> = new Map();

  // Per-chat patch queue (chatId -> tail promise) for the 5 QPS throttle.
  private patchQueues: Map<string, Promise<void>> = new Map();

  // Track active users for status reporting
  private activeUsers: Set<string> = new Set();

  // Event deduplication - track processed event IDs with timestamps
  private processedEvents: Map<string, number> = new Map();
  private eventCleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the Lark client instance
   */
  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const appId = config.credentials?.appId;
    const appSecret = config.credentials?.appSecret;

    if (!appId || !appSecret) {
      throw new Error('Lark App ID and App Secret are required');
    }

    // Domain comes from the UI selector (feishu | lark). Default = feishu (mainland China).
    const domain = resolveLarkDomain(config.credentials?.domain as string | undefined);

    // Create Lark client
    this.client = new lark.Client({
      appId,
      appSecret,
      appType: lark.AppType.SelfBuild,
      domain,
    });

    this.botInfo = { appId };
  }

  /**
   * Start WebSocket connection for receiving events
   */
  protected async onStart(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const appId = this.config?.credentials?.appId;
    const appSecret = this.config?.credentials?.appSecret;

    if (!appId || !appSecret) {
      throw new Error('Credentials not available');
    }

    const domain = resolveLarkDomain(this.config?.credentials?.domain as string | undefined);

    try {
      // Refresh access token first
      await this.refreshAccessToken();

      // Get optional security config
      const encryptKey = this.config?.credentials?.encryptKey;
      const verificationToken = this.config?.credentials?.verificationToken;

      // Create EventDispatcher with security config
      this.eventDispatcher = new lark.EventDispatcher({
        encryptKey: encryptKey || '',
        verificationToken: verificationToken || '',
      });

      // Setup event handlers on the dispatcher
      this.setupEventHandlers();

      // Create WebSocket client for receiving events
      this.wsClient = new lark.WSClient({
        appId,
        appSecret,
        domain,
        loggerLevel: lark.LoggerLevel.info,
      });

      // Await wsClient.start() so we only flip isConnected = true on actual success.
      // Previously this was fire-and-forget with isConnected = true set unconditionally,
      // which made the plugin lie about connection status when the WS failed to start.
      try {
        await this.wsClient.start({
          eventDispatcher: this.eventDispatcher,
        });
        this.isConnected = true;
      } catch (err) {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.setError(`WebSocket connection failed: ${msg}`);
        console.error('[LarkPlugin] WebSocket start() failed:', err);
        // Best-effort cleanup so a retry can rebind from a clean state.
        this.wsClient = null;
        this.eventDispatcher = null;
        throw err;
      }

      // Resolve the bot's open_id so we can filter @mentions in group chats.
      // Best-effort: the SDK call may fail without the right scope; tolerate it.
      try {
        const appInfo = await (this.client as unknown as {
          application?: { v6?: { application?: { get?: (req: unknown) => Promise<unknown> } } };
        }).application?.v6?.application?.get?.({ path: { app_id: appId } });
        const data = (appInfo as { data?: { app?: { bot_id?: string }; application?: { bot_id?: string } } })?.data;
        const openId: string | undefined = data?.app?.bot_id || data?.application?.bot_id || undefined;
        if (openId) {
          this.botInfo = { ...(this.botInfo ?? { appId }), openId };
        }
      } catch (botInfoErr) {
        console.warn('[LarkPlugin] Could not resolve bot openId for mention filter:', botInfoErr);
      }

      // Start event cache cleanup timer
      this.startEventCleanup();

      console.info(`[LarkPlugin] started app=${appId} domain=${String(domain)}`);
    } catch (error) {
      console.error('[LarkPlugin] failed to start:', error);
      throw error;
    }
  }

  // Warn-once flag for unknown Lark event-schema versions (R15 LOW #18).
  private warnedSchemaVersions: Set<string> = new Set();

  /**
   * One-time warn when an incoming event's `schema` field is not `'2.0'`.
   * Lark may migrate to a newer schema someday; the warn surfaces it early.
   */
  private warnOnUnknownSchema(schema: string | undefined): void {
    if (!schema || schema === '2.0') return;
    if (this.warnedSchemaVersions.has(schema)) return;
    this.warnedSchemaVersions.add(schema);
    console.warn(`[LarkPlugin] unexpected event schema=${schema} (expected '2.0')`);
  }

  /**
   * Log a decrypt failure with enough context to debug (R15 LOW #17) - eventId,
   * the configured algorithm (we only ever use AES via encryptKey so a literal
   * is fine), and a short hex preview of the raw payload bounded to 100 bytes
   * so secrets can't accidentally land in logs.
   */
  private logDecryptFailure(eventId: string | undefined, rawPayload: Buffer | string | undefined): void {
    const id = eventId ?? '<no-event-id>';
    let preview = '<empty>';
    if (rawPayload) {
      const buf = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(String(rawPayload));
      preview = buf.slice(0, 100).toString('hex');
    }
    console.error(`[LarkPlugin] decrypt failed event=${id} algo=AES-CBC payload[0..100]=${preview}`);
  }

  /**
   * Stop WebSocket connection and cleanup
   */
  protected async onStop(): Promise<void> {
    // Stop event cleanup timer
    this.stopEventCleanup();

    if (this.wsClient) {
      // SDK exposes `close({ force? })` on WSClient; call it so the socket and
      // reconnect/ping timers are torn down deterministically instead of waiting
      // for GC. (R14 MED #8.) close() is best-effort - swallow errors so a stale
      // socket can never wedge plugin shutdown.
      try {
        const ws = this.wsClient as unknown as { close?: (p?: { force?: boolean }) => void };
        ws.close?.({ force: true });
      } catch (err) {
        console.warn('[LarkPlugin] WSClient.close() failed during shutdown:', err);
      }
      this.wsClient = null;
    }

    this.eventDispatcher = null;
    this.client = null;
    this.botInfo = null;
    this.tokenExpiresAt = 0;
    this.activeUsers.clear();
    this.processedEvents.clear();
    this.displayNameCache.clear();
    this.patchQueues.clear();
    this.isConnected = false;

    console.info('[LarkPlugin] stopped and cleaned up');
  }

  /**
   * Get active user count
   */
  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  /**
   * Get bot information
   */
  getBotInfo(): BotInfo | null {
    if (!this.botInfo) return null;
    // Configured displayName wins over the resolved bot name, which wins over
    // the DEFAULT_DISPLAY_NAME constant. Mirrors the R17 WeixinPlugin pattern
    // so admins can override the surfaced bot name without forking the plugin.
    const configured = this.config?.credentials?.displayName as string | undefined;
    const displayName =
      (configured && configured.trim()) || this.botInfo.name || DEFAULT_DISPLAY_NAME;
    return {
      id: this.botInfo.appId,
      displayName,
    };
  }

  /**
   * Get receive_id_type based on the ID prefix
   * - ou_ -> open_id (user's open_id)
   * - oc_ -> chat_id (group chat)
   * - on_ -> union_id
   * - other -> user_id
   */
  private getReceiveIdType(receiveId: string): 'open_id' | 'chat_id' | 'union_id' | 'user_id' {
    if (receiveId.startsWith('ou_')) return 'open_id';
    if (receiveId.startsWith('oc_')) return 'chat_id';
    if (receiveId.startsWith('on_')) return 'union_id';
    return 'user_id';
  }

  /**
   * Send a message to a chat
   * Note: For streaming support, we send text as interactive card (can be updated)
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    await this.ensureAccessToken();

    const { contentType, content, rawText } = toLarkSendParams(message);
    const receiveIdType = this.getReceiveIdType(chatId);

    // Handle text messages - send as card for streaming support
    if (contentType === 'text' && rawText !== undefined) {
      const card = this.buildTextCard(rawText);

      try {
        const response = await this.client.im.message.create({
          params: { receive_id_type: receiveIdType },
          data: {
            receive_id: chatId,
            msg_type: 'interactive',
            content: JSON.stringify(card),
          },
        });

        return response.data?.message_id || '';
      } catch (error) {
        console.error('[LarkPlugin] Failed to send card message:', error);
        throw error;
      }
    }

    // Send interactive card or other content types
    try {
      const response = await this.client.im.message.create({
        params: { receive_id_type: receiveIdType },
        data: {
          receive_id: chatId,
          msg_type: contentType,
          content: JSON.stringify(content),
        },
      });

      return response.data?.message_id || '';
    } catch (error) {
      console.error('[LarkPlugin] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Build a simple card for text content (enables editing)
   */
  private buildTextCard(text: string): Record<string, unknown> {
    return {
      config: { wide_screen_mode: true },
      elements: [
        {
          tag: 'markdown',
          content: text,
        },
      ],
    };
  }

  /**
   * Edit an existing message. Throttled per-chat to stay under Lark's 5 QPS patch limit.
   * Lark message.patch only supports updating CARD messages, not text messages.
   */
  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    // R15 LOW #14: allow installations that don't want streaming card edits to
    // opt out via `credentials.disableCardStreaming = true`. We still need to
    // ship the *final* render somewhere; sending a fresh message preserves the
    // user-visible content without thrashing Lark's patch QPS limit.
    const disableStreaming = this.config?.credentials?.disableCardStreaming === true;
    if (disableStreaming) {
      await this.sendMessage(chatId, message);
      return;
    }

    return this.enqueuePatch(chatId, () => this.doEditMessage(messageId, message));
  }

  /**
   * Serialize patch calls per chat and enforce a minimum gap between them.
   * Prevents the streaming card-edit path from blowing through Lark's per-app 5 QPS cap.
   */
  enqueuePatch(chatId: string, task: () => Promise<void>): Promise<void> {
    const tail = this.patchQueues.get(chatId) ?? Promise.resolve();
    const next = tail
      .catch((): void => undefined)
      .then(async () => {
        await task();
        // Wait AFTER the call so the next queued patch has to wait the min interval.
        await new Promise((resolve) => setTimeout(resolve, LARK_PATCH_MIN_INTERVAL_MS));
      });

    // Self-clean: when this chain settles and it's still the tail, drop the entry.
    const tracked = next.finally(() => {
      if (this.patchQueues.get(chatId) === tracked) {
        this.patchQueues.delete(chatId);
      }
    });
    this.patchQueues.set(chatId, tracked);
    return next;
  }

  private async doEditMessage(messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    await this.ensureAccessToken();

    const { contentType, content, rawText } = toLarkSendParams(message);

    try {
      let cardContent: Record<string, unknown>;

      if (contentType === 'text' && rawText !== undefined) {
        const truncatedText =
          rawText.length > LARK_MESSAGE_LIMIT ? rawText.slice(0, LARK_MESSAGE_LIMIT - 3) + '...' : rawText;
        cardContent = this.buildTextCard(truncatedText);
      } else if (contentType === 'interactive') {
        cardContent = content as Record<string, unknown>;
      } else {
        cardContent = this.buildTextCard(rawText || JSON.stringify(content));
      }

      await this.client.im.message.patch({
        path: { message_id: messageId },
        data: { content: JSON.stringify(cardContent) },
      });
    } catch (error: any) {
      const errorCode = error?.response?.data?.code || error?.code;
      const errorMsg = error?.response?.data?.msg || error?.message || '';

      if (errorCode === 230002 || errorMsg.includes('not modified')) {
        return;
      }

      if (errorMsg.includes('NOT a card')) {
        console.warn(`[LarkPlugin] Cannot edit non-card message: ${messageId}, skipping`);
        return;
      }

      console.error('[LarkPlugin] Failed to edit message:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for incoming messages and card actions
   */
  private setupEventHandlers(): void {
    if (!this.eventDispatcher) return;

    this.eventDispatcher.register({
      'im.message.receive_v1': async (data: Record<string, unknown>) => {
        await this.handleMessageEvent({ event: data });
      },

      'card.action.trigger': async (data: Record<string, unknown>) => {
        // Don't await - process in background to avoid 200340 timeout
        void this.handleCardAction({ event: data });
        return {};
      },

      'application.bot.menu_v6': async (data: Record<string, unknown>) => {
        await this.handleBotMenuEvent({ event: data });
      },
    });
  }

  /**
   * Handle incoming message events.
   *
   * Typed as `LarkMessageEvent` (R14 MED #9 / #11) so field access goes through
   * the same surface the adapter validates against - no top-level `any` cast.
   */
  private async handleMessageEvent(event: LarkMessageEvent & { schema?: string }): Promise<void> {
    try {
      this.warnOnUnknownSchema(event.schema);
      const message = event?.event?.message;
      const sender = event?.event?.sender;

      if (!message || !sender) {
        console.warn('[LarkPlugin] Invalid message event:', event);
        return;
      }

      const eventId = message.message_id;
      if (eventId && this.isEventProcessed(eventId)) {
        return;
      }
      if (eventId) {
        this.markEventProcessed(eventId);
      }

      const userId = sender.sender_id?.user_id || sender.sender_id?.open_id;
      if (!userId) return;

      // Group-chat mention filter: in any non-p2p chat, only respond when the bot is @mentioned.
      // Without this filter the bot replies to every message in every group it joins.
      const chatType: string | undefined = message.chat_type;
      if (chatType && chatType !== 'p2p') {
        if (!isBotMentioned(message.mentions, this.botInfo?.openId)) {
          return;
        }
      }

      this.activeUsers.add(userId);

      // Resolve real display name via contact.user.get (cached) and hand it to the adapter
      // so it never falls back to the `User <slice>` placeholder when we know the real name.
      const senderOpenId: string | undefined = sender.sender_id?.open_id;
      const displayName = await this.resolveUserDisplayName(senderOpenId, userId);

      const unifiedMessage = toUnifiedIncomingMessage(event, undefined, { displayName });

      if (unifiedMessage && this.messageHandler) {
        if (unifiedMessage.content.type === 'text' && unifiedMessage.content.text) {
          const buttonAction = this.getMenuButtonAction(unifiedMessage.content.text);
          if (buttonAction) {
            unifiedMessage.content.type = 'action';
            unifiedMessage.content.text = buttonAction.action;
            unifiedMessage.action = {
              type: buttonAction.type as 'system' | 'platform' | 'chat',
              name: buttonAction.action,
            };
          }
        }

        void this.messageHandler(unifiedMessage).catch((error) =>
          console.error(`[LarkPlugin] Error handling message:`, error)
        );
      }
    } catch (error) {
      console.error('[LarkPlugin] Error processing message event:', error);
    }
  }

  /**
   * Resolve a Lark user's display name via contact.user.get, with caching.
   * Falls back to `User <last6>` if the lookup fails or the API isn't available.
   * Cache hits avoid re-hitting the contact API on every message from the same user.
   */
  async resolveUserDisplayName(openId: string | undefined, fallbackId: string): Promise<string> {
    const cacheKey = openId || fallbackId;
    const cached = this.displayNameCache.get(cacheKey);
    if (cached) return cached;

    const placeholder = `User ${fallbackId.slice(-6)}`;

    if (!this.client || !openId) {
      return placeholder;
    }

    try {
      const resp = await (this.client as unknown as {
        contact?: { v3?: { user?: { get?: (req: unknown) => Promise<unknown> } } };
      }).contact?.v3?.user?.get?.({
        path: { user_id: openId },
        params: { user_id_type: 'open_id' },
      });
      const userObj = (resp as { data?: { user?: { name?: string; nickname?: string } } })?.data?.user;
      const name = userObj?.name || userObj?.nickname;
      const resolved = name && typeof name === 'string' && name.length > 0 ? name : placeholder;
      // Cache even the placeholder so a missing scope doesn't cause an API call per message.
      this.displayNameCache.set(cacheKey, resolved);
      return resolved;
    } catch (err) {
      console.warn('[LarkPlugin] contact.user.get failed, using placeholder name:', err);
      this.displayNameCache.set(cacheKey, placeholder);
      return placeholder;
    }
  }

  /**
   * Map menu action strings to action info
   */
  private getMenuButtonAction(text: string): { type: string; action: string } | null {
    const menuActions: Record<string, { type: string; action: string }> = {
      'session.new': { type: 'system', action: 'session.new' },
      'session.status': { type: 'system', action: 'session.status' },
      'help.show': { type: 'system', action: 'help.show' },
      'agent.show': { type: 'system', action: 'agent.show' },
      'pairing.check': { type: 'platform', action: 'pairing.check' },
    };
    return menuActions[text] || null;
  }

  /**
   * Handle bot menu click events (application.bot.menu_v6)
   */
  private async handleBotMenuEvent(event: LarkBotMenuPayload): Promise<void> {
    try {
      const operator = event?.event?.operator;
      const eventKey = event?.event?.event_key;
      const timestamp = event?.event?.timestamp;

      if (!operator || !eventKey) {
        console.warn('[LarkPlugin] Invalid bot menu event:', event);
        return;
      }

      const eventId = `menu_${eventKey}_${timestamp}`;
      if (this.isEventProcessed(eventId)) {
        return;
      }
      this.markEventProcessed(eventId);

      const userId = operator.operator_id?.user_id || operator.operator_id?.open_id;
      if (!userId) {
        console.warn('[LarkPlugin] No user ID in bot menu event');
        return;
      }

      this.activeUsers.add(userId);

      const chatId = event?.event?.chat_id || userId;

      const buttonAction = this.getMenuButtonAction(eventKey);
      if (!buttonAction) {
        console.warn(`[LarkPlugin] Unknown menu event_key: ${eventKey}`);
        return;
      }

      const displayName = await this.resolveUserDisplayName(operator.operator_id?.open_id, userId);

      const unifiedMessage = {
        id: eventId,
        platform: 'lark' as const,
        chatId,
        user: { id: userId, displayName },
        content: {
          type: 'action' as const,
          text: buttonAction.action,
        },
        action: {
          type: buttonAction.type as 'system' | 'platform' | 'chat',
          name: buttonAction.action,
        },
        timestamp: timestamp ? parseInt(timestamp, 10) : Date.now(),
        raw: event,
      };

      if (this.messageHandler) {
        void this.messageHandler(unifiedMessage).catch((error) =>
          console.error(`[LarkPlugin] Error handling bot menu action:`, error)
        );
      }
    } catch (error) {
      console.error('[LarkPlugin] Error processing bot menu event:', error);
    }
  }

  /**
   * Handle card action callbacks (button clicks)
   */
  private async handleCardAction(event: LarkCardEventPayload): Promise<void> {
    try {
      const action = event?.event?.action;
      const operator = event?.event?.operator;
      const eventToken = event?.event?.token;

      if (!action || !operator) {
        console.warn('[LarkPlugin] Invalid card action event:', event);
        return;
      }

      if (eventToken && this.isEventProcessed(eventToken)) {
        return;
      }
      if (eventToken) {
        this.markEventProcessed(eventToken);
      }

      const userId = operator.user_id || operator.open_id;
      if (!userId) return;

      this.activeUsers.add(userId);

      const actionInfo = extractCardAction(action);
      if (!actionInfo) return;

      const displayName = await this.resolveUserDisplayName(operator.open_id, userId);

      const unifiedMessage = toUnifiedIncomingMessage(event, actionInfo, { displayName });
      if (unifiedMessage && this.messageHandler) {
        void this.messageHandler(unifiedMessage).catch((error) =>
          console.error(`[LarkPlugin] Error handling card action:`, error)
        );
      }
    } catch (error) {
      console.error('[LarkPlugin] Error processing card action:', error);
    }
  }

  /**
   * Refresh access token
   * Lark tokens expire after 2 hours
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      // The SDK handles token refresh internally
    } catch (error) {
      console.error('[LarkPlugin] Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Ensure access token is valid before making API calls
   */
  private async ensureAccessToken(): Promise<void> {
    const now = Date.now();
    if (this.tokenExpiresAt - now < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
  }

  // ==================== Event Deduplication ====================

  private isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  private markEventProcessed(eventId: string): void {
    this.processedEvents.set(eventId, Date.now());
  }

  private startEventCleanup(): void {
    if (this.eventCleanupTimer) return;

    this.eventCleanupTimer = setInterval(() => {
      this.cleanupOldEvents();
    }, EVENT_CACHE_CLEANUP_INTERVAL);
  }

  private stopEventCleanup(): void {
    if (this.eventCleanupTimer) {
      clearInterval(this.eventCleanupTimer);
      this.eventCleanupTimer = null;
    }
  }

  private cleanupOldEvents(): void {
    const now = Date.now();

    for (const [eventId, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > EVENT_CACHE_TTL) {
        this.processedEvents.delete(eventId);
      }
    }
  }

  /**
   * Test connection with the given credentials
   * @param appId - Lark App ID
   * @param appSecret - Lark App Secret
   * @param extraConfig - Optional extra config (e.g., domain selector)
   */
  static async testConnection(
    appId: string,
    appSecret?: string,
    extraConfig?: { domain?: string }
  ): Promise<{ success: boolean; botInfo?: { name?: string }; error?: string }> {
    if (!appSecret) {
      return { success: false, error: 'App Secret is required for Lark' };
    }

    try {
      const client = new lark.Client({
        appId,
        appSecret,
        appType: lark.AppType.SelfBuild,
        domain: resolveLarkDomain(extraConfig?.domain),
      });

      await client.auth.tenantAccessToken.internal({
        data: {
          app_id: appId,
          app_secret: appSecret,
        },
      });

      return { success: true, botInfo: { name: 'Lark Bot' } };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Lark API',
      };
    }
  }
}
