/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { DWClient, TOPIC_ROBOT, TOPIC_CARD, EventAck } from 'dingtalk-stream';
import type { DWClientDownStream } from 'dingtalk-stream';
import crypto from 'crypto';
import https from 'https';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../types';
import { BasePlugin } from '../BasePlugin';
import {
  DINGTALK_MESSAGE_LIMIT,
  encodeChatId,
  extractCardAction,
  inferConversationTypeFromSpace,
  parseChatId,
  splitMessage,
  toDingTalkSendParams,
  toUnifiedIncomingMessage,
  convertHtmlToDingTalkMarkdown,
} from './DingTalkAdapter';
import type { DingTalkStreamMessage } from './DingTalkAdapter';

/**
 * Default display name surfaced everywhere we present the bot identity.
 * Plugins can override via `credentials.displayName`. L2/L6: single source.
 */
const DEFAULT_DISPLAY_NAME = 'Wayland DingTalk Bot';

/**
 * Default DingTalk AI Card template ID. Plugins can override via
 * `credentials.aiCardTemplateId` to use an org-scoped template. L1.
 */
const DEFAULT_AI_CARD_TEMPLATE_ID = '382e4302-551d-4880-bf29-a30acfab2e71.schema';

/** Reconnect backoff bounds for the Stream WebSocket. M8. */
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 60_000;

/**
 * DingTalkPlugin - DingTalk Bot integration for Personal Assistant
 *
 * Uses dingtalk-stream SDK for WebSocket Stream connection.
 * Supports AI Card streaming for real-time response updates.
 * Falls back to sessionWebhook for plain markdown messages.
 */

// Event deduplication settings
const EVENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const EVENT_CACHE_CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// DingTalk API base URL (new version)
const DINGTALK_API_BASE = 'https://api.dingtalk.com';

// AI Card flow status values
const AICardStatus = {
  PROCESSING: '1',
  INPUTING: '2',
  FINISHED: '3',
  FAILED: '5',
} as const;

/**
 * Token cache structure
 */
interface ITokenCache {
  accessToken: string;
  expiresAt: number;
}

/**
 * AI Card session tracking
 */
interface IAICardSession {
  outTrackId: string;
  openSpaceId: string;
  isFinished: boolean;
  inputingStarted: boolean;
}

export class DingTalkPlugin extends BasePlugin {
  readonly type: PluginType = 'dingtalk';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canReact: false,
    canStream: true,
    canTypingIndicator: false,
  };

  private client: DWClient | null = null;
  private isConnected: boolean = false;

  // Credentials
  private clientId: string = '';
  private clientSecret: string = '';
  // HIGH-1: optional custom-robot signing secret (set on open-dev.dingtalk.com under
  // Robot → Security Settings → "Signing Secret"). When non-empty, every webhook POST
  // is signed with HMAC-SHA256 and appended as `&timestamp=&sign=`.
  private webhookSecret: string = '';

  // Per-plugin overrides (L1, L2)
  private displayName: string = DEFAULT_DISPLAY_NAME;
  private aiCardTemplateId: string = DEFAULT_AI_CARD_TEMPLATE_ID;

  // Token management
  private tokenCache: ITokenCache | null = null;
  // M1: single-flight token refresh - concurrent callers share one promise.
  private tokenRefreshInFlight: Promise<void> | null = null;

  // M8: reconnect bookkeeping
  private reconnectAttempt: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect: boolean = false;

  // Track active users for status reporting
  private activeUsers: Set<string> = new Set();

  // Event deduplication
  private processedEvents: Map<string, number> = new Map();
  private eventCleanupTimer: ReturnType<typeof setInterval> | null = null;

  // R11 / HIGH H2: reject stream-delivered events whose timestamp is older than
  // this window. Mitigates replay if the upstream Stream transport is ever
  // compromised. dingtalk-stream does not expose a per-event HMAC signature on
  // DWClientDownStream, so this skew check is the strongest defence we can
  // apply without round-tripping every event back to the DingTalk API.
  private static readonly EVENT_MAX_SKEW_MS = 5 * 60 * 1000;

  // AI Card sessions: messageId -> card session
  private aiCardSessions: Map<string, IAICardSession> = new Map();
  // M4: reverse index from outTrackId -> openSpaceId so card callbacks can
  // recover the originating space and infer conversationType correctly.
  private trackIdToSpace: Map<string, string> = new Map();

  // Store sessionWebhook per chatId for fallback sending
  private webhookCache: Map<string, string> = new Map();

  /**
   * Initialize the DingTalk client
   */
  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const clientId = config.credentials?.clientId;
    const clientSecret = config.credentials?.clientSecret;

    if (!clientId || !clientSecret) {
      throw new Error('DingTalk Client ID and Client Secret are required');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;

    // L1/L2: optional per-plugin overrides
    const creds = config.credentials as Record<string, unknown> | undefined;
    const overrideName = creds && typeof creds.displayName === 'string' ? (creds.displayName as string) : '';
    if (overrideName.trim()) this.displayName = overrideName.trim();
    const overrideTemplate =
      creds && typeof creds.aiCardTemplateId === 'string' ? (creds.aiCardTemplateId as string) : '';
    if (overrideTemplate.trim()) this.aiCardTemplateId = overrideTemplate.trim();

    // HIGH-1: optional custom-robot signing secret (empty when robot has no Security
    // Settings → Signing Secret enabled, in which case unsigned posts are accepted).
    const webhookSecret = creds && typeof creds.webhookSecret === 'string' ? (creds.webhookSecret as string) : '';
    this.webhookSecret = webhookSecret.trim();
  }

  /**
   * Start WebSocket Stream connection
   */
  protected async onStart(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Credentials not available');
    }

    try {
      // Refresh access token first
      await this.refreshAccessToken();

      // Create DWClient
      this.client = new DWClient({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        keepAlive: true,
        debug: false,
      });

      // Register robot message listener (TOPIC_ROBOT uses CALLBACK type in Stream protocol)
      this.client.registerCallbackListener(TOPIC_ROBOT, (msg: DWClientDownStream) => {
        // Immediately acknowledge the message to prevent retry
        this.client?.socketCallBackResponse(msg.headers.messageId, EventAck.SUCCESS);

        // Process message asynchronously
        try {
          const data: DingTalkStreamMessage = JSON.parse(msg.data);
          void this.handleRobotMessage(data, msg.headers.messageId).catch((error) => {
            console.error('[DingTalkPlugin] Error handling robot message:', error);
          });
        } catch (error) {
          console.error('[DingTalkPlugin] Failed to parse robot message:', error);
        }
      });

      // Register card callback listener
      this.client.registerCallbackListener(TOPIC_CARD, (msg: DWClientDownStream) => {
        // Acknowledge card callback
        this.client?.socketCallBackResponse(msg.headers.messageId, EventAck.SUCCESS);

        // Process card action asynchronously
        try {
          const data = JSON.parse(msg.data);
          void this.handleCardCallback(data, msg.headers.messageId).catch((error) => {
            console.error('[DingTalkPlugin] Error handling card callback:', error);
          });
        } catch (error) {
          console.error('[DingTalkPlugin] Failed to parse card callback:', error);
        }
      });

      // M8: best-effort disconnect/error listeners. dingtalk-stream's typings
      // do not expose .on() on DWClient, but the underlying EventEmitter does
      // surface 'disconnect' / 'error' / 'close' on its socket. We attach via
      // an any-cast so we never crash if the SDK changes; reconnect will then
      // rely on keepAlive only.
      const emitter = this.client as unknown as { on?: (event: string, listener: (...args: unknown[]) => void) => void };
      if (typeof emitter.on === 'function') {
        emitter.on('disconnect', () => this.handleStreamDisconnect('disconnect'));
        emitter.on('close', () => this.handleStreamDisconnect('close'));
        emitter.on('error', (err: unknown) => {
          console.error('[DingTalkPlugin] Stream error:', err);
          this.handleStreamDisconnect('error');
        });
      }

      // Connect
      this.shouldReconnect = true;
      await this.client.connect();
      this.isConnected = true;
      this.reconnectAttempt = 0;

      // Start event cache cleanup timer
      this.startEventCleanup();

      console.log(`[DingTalkPlugin] Started for client ${this.clientId}`);
    } catch (error) {
      console.error('[DingTalkPlugin] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Handle Stream disconnect / error events. M8.
   * Schedules an exponential-backoff reconnect attempt unless onStop() ran.
   */
  private handleStreamDisconnect(reason: string): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer) return; // already scheduled
    this.isConnected = false;
    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS * 2 ** Math.min(this.reconnectAttempt, 6)
    );
    this.reconnectAttempt += 1;
    console.warn(
      `[DingTalkPlugin] Stream ${reason}; reconnect attempt ${this.reconnectAttempt} in ${delay}ms`
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.shouldReconnect) return;
      void this.client
        ?.connect()
        .then(() => {
          this.isConnected = true;
          this.reconnectAttempt = 0;
          console.log('[DingTalkPlugin] Stream reconnected');
        })
        .catch((err) => {
          console.error('[DingTalkPlugin] Reconnect failed:', err);
          // Re-arm with the next backoff slot.
          this.handleStreamDisconnect('reconnect-failed');
        });
    }, delay);
  }

  /**
   * Stop connection and cleanup
   */
  protected async onStop(): Promise<void> {
    this.shouldReconnect = false;
    this.stopEventCleanup();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;

    if (this.client) {
      try {
        this.client.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.client = null;
    }

    this.tokenCache = null;
    this.tokenRefreshInFlight = null;
    this.activeUsers.clear();
    this.processedEvents.clear();
    this.aiCardSessions.clear();
    this.trackIdToSpace.clear();
    this.webhookCache.clear();
    this.isConnected = false;

    console.log('[DingTalkPlugin] Stopped and cleaned up');
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
    if (!this.clientId) return null;
    return {
      id: this.clientId,
      displayName: this.displayName,
    };
  }

  /**
   * Send a message to a chat
   * Uses AI Card for streaming support, falls back to sessionWebhook
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    await this.ensureAccessToken();

    const { contentType, content, rawText } = toDingTalkSendParams(message);
    const { type: chatType, id } = parseChatId(chatId);

    // Try AI Card streaming for text/markdown messages
    if (contentType === 'markdown' && rawText !== undefined) {
      try {
        const cardMessageId = await this.createAndDeliverAICard(chatType, id, rawText);
        return cardMessageId;
      } catch (error) {
        console.warn('[DingTalkPlugin] AI Card failed, falling back to webhook:', error);
      }
    }

    // Fallback: use sessionWebhook for sending
    const webhook = this.webhookCache.get(chatId);
    if (webhook) {
      try {
        const msgId = await this.sendViaWebhook(webhook, contentType, content, rawText);
        return msgId;
      } catch (error) {
        console.error('[DingTalkPlugin] Webhook send failed:', error);
        throw error;
      }
    }

    // Last resort: use DingTalk API to send message
    try {
      const msgId = await this.sendViaAPI(chatType, id, contentType, content, rawText);
      return msgId;
    } catch (error) {
      console.error('[DingTalkPlugin] API send failed:', error);
      throw error;
    }
  }

  /**
   * Edit an existing message (update AI Card content)
   */
  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    const cardSession = this.aiCardSessions.get(messageId);
    const isFinal = !!message.replyMarkup;

    // No card session (sent via webhook/API) or card already finished/failed
    if (!cardSession || cardSession.isFinished) {
      // Send final response as a new plain message
      if (isFinal && message.text) {
        await this.sendPlainMessage(chatId, message);
      }
      return;
    }

    await this.ensureAccessToken();

    const { rawText } = toDingTalkSendParams(message);
    const text = rawText || message.text || '';

    // HIGH-3 fix: DINGTALK_MESSAGE_LIMIT (4000) is the webhook *markdown* limit, NOT the AI Card
    // `msgContent` limit - AI Card streaming accepts much larger payloads. Truncating + appending
    // '...' here previously caused two bugs: (a) silent data loss on long agent replies, and
    // (b) the trailing ellipsis got persisted into the finalized card. We're in the AI Card branch
    // here (cardSession is non-null), so pass `text` through unmodified.
    try {
      await this.streamAICard(cardSession.outTrackId, text, isFinal);

      if (isFinal) {
        await this.finishAICard(cardSession.outTrackId, text);
        this.aiCardSessions.set(messageId, { ...cardSession, isFinished: true });
      }
    } catch (error: any) {
      // Ignore "not modified" style errors
      const errorMsg = error?.message || '';
      if (errorMsg.includes('not modified') || errorMsg.includes('not found')) {
        return;
      }
      console.error('[DingTalkPlugin] Failed to update AI Card:', error);

      // Mark card as finished to prevent further failed streaming attempts
      this.aiCardSessions.set(messageId, { ...cardSession, isFinished: true });

      // Fall back to sending the final response as a plain message
      if (isFinal && message.text) {
        await this.sendPlainMessage(chatId, message);
      }
    }
  }

  // ==================== Robot Message Handling ====================

  /**
   * Handle incoming robot message from Stream
   */
  private async handleRobotMessage(data: DingTalkStreamMessage, streamMessageId: string): Promise<void> {
    try {
      // R11 / HIGH H2: defence-in-depth. dingtalk-stream's DWClientDownStream
      // type does NOT carry per-event signing data we can verify ourselves -
      // we trust the WebSocket TLS + the stream session bootstrap (which IS
      // authenticated with appKey/appSecret). To narrow the replay window if
      // the transport is ever compromised:
      //   1. Require senderStaffId (rejects malformed envelopes).
      //   2. Reject events whose createAt is older than EVENT_MAX_SKEW_MS.
      //   3. Log a warning that this delivery lacked a verifiable per-event
      //      signature so the audit trail is greppable in production.
      // Existing event deduplication below provides additional replay defence
      // within EVENT_CACHE_TTL.
      const createAt = typeof data.createAt === 'number' ? data.createAt : 0;
      if (createAt > 0) {
        // v0.4.3 Wave D (codex re-audit HIGH): the original `skew > MAX` check
        // only rejected events from the PAST. A far-future createAt produced a
        // negative skew and slipped through, defeating the replay defence.
        // Use absolute value so both past and future drift are rejected.
        const skew = Date.now() - createAt;
        if (Math.abs(skew) > DingTalkPlugin.EVENT_MAX_SKEW_MS) {
          console.warn(
            `[DingTalkPlugin] Rejected stream event with out-of-range timestamp (skew=${skew}ms, max=${DingTalkPlugin.EVENT_MAX_SKEW_MS}ms)`
          );
          return;
        }
      } else {
        console.warn('[DingTalkPlugin] Stream event missing createAt; cannot verify freshness');
      }

      // M5: namespace robot events to avoid hash collisions with card events
      // (which use `card_` prefix at line below).
      const rawId = data.msgId || streamMessageId;
      const eventId = rawId ? `robot_${rawId}` : '';

      // Event deduplication
      if (eventId && this.isEventProcessed(eventId)) {
        return;
      }
      if (eventId) {
        this.markEventProcessed(eventId);
      }

      const userId = data.senderStaffId || '';
      if (!userId) return;

      // Track user
      this.activeUsers.add(userId);

      // HIGH-1 fix: validate sessionWebhook URL before trusting it. A spoofed Stream
      // payload could otherwise redirect outbound messages anywhere. Accept ONLY https
      // URLs on the official oapi.dingtalk.com /robot/send endpoint.
      if (data.sessionWebhook && DingTalkPlugin.isValidDingTalkWebhook(data.sessionWebhook)) {
        const chatId = encodeChatId(data);
        this.webhookCache.set(chatId, data.sessionWebhook);
      } else if (data.sessionWebhook) {
        console.warn('[DingTalkPlugin] Rejected suspicious sessionWebhook URL');
      }

      // Convert to unified message
      const unifiedMessage = toUnifiedIncomingMessage(data);
      if (unifiedMessage && this.messageHandler) {
        // Check for menu button commands
        if (unifiedMessage.content.type === 'text' && unifiedMessage.content.text) {
          const buttonAction = this.getMenuButtonAction(unifiedMessage.content.text);
          if (buttonAction) {
            const actionMessage = {
              ...unifiedMessage,
              content: {
                ...unifiedMessage.content,
                type: 'action' as const,
                text: buttonAction.action,
              },
              action: {
                type: buttonAction.type as 'system' | 'platform' | 'chat',
                name: buttonAction.action,
              },
            };
            void this.emitMessage(actionMessage).catch((error) =>
              console.error('[DingTalkPlugin] Error handling message:', error)
            );
            return;
          }
        }

        // Process in background to avoid blocking
        void this.emitMessage(unifiedMessage).catch((error) =>
          console.error('[DingTalkPlugin] Error handling message:', error)
        );
      }
    } catch (error) {
      console.error('[DingTalkPlugin] Error processing robot message:', error);
    }
  }

  /**
   * Handle card action callback from Stream
   */
  private async handleCardCallback(data: any, streamMessageId: string): Promise<void> {
    try {
      // Event deduplication
      const eventId = `card_${streamMessageId}`;
      if (this.isEventProcessed(eventId)) {
        return;
      }
      this.markEventProcessed(eventId);

      const userId = data.userId || '';
      if (!userId) return;

      // Track user
      this.activeUsers.add(userId);

      // Extract action from card callback
      const params = data.content?.cardPrivateData?.params || {};
      const actionInfo = extractCardAction(params);
      if (!actionInfo) return;

      // Handle tool confirmation specially
      if (actionInfo.name === 'system.confirm' && actionInfo.params?.callId && actionInfo.params?.value) {
        if (this.confirmHandler) {
          void this.confirmHandler(userId, 'dingtalk', actionInfo.params.callId, actionInfo.params.value).catch(
            (error) => {
              console.error('[DingTalkPlugin] Confirm handler error:', error);
            }
          );
        }
        return;
      }

      // M4: recover the originating space from outTrackId so group callbacks
      // route back to the group context instead of being misclassified as a
      // private DM. Falls back to '1' (private) when no mapping is known.
      const outTrackId = (data.outTrackId as string) || '';
      const openSpaceId = outTrackId ? this.trackIdToSpace.get(outTrackId) : undefined;
      const conversationType = inferConversationTypeFromSpace(openSpaceId);
      // For groups, extract the conversation id from the space string
      // (`dtv1.card//IM_GROUP.<conversationId>`).
      let conversationId: string | undefined;
      if (conversationType === '2' && openSpaceId) {
        const idx = openSpaceId.indexOf('IM_GROUP.');
        if (idx >= 0) conversationId = openSpaceId.slice(idx + 'IM_GROUP.'.length);
      }

      // Build a minimal DingTalkStreamMessage for conversion
      const mockData: DingTalkStreamMessage = {
        senderStaffId: userId,
        senderNick: `User ${userId.slice(-6)}`,
        msgId: streamMessageId,
        conversationType,
        conversationId,
        createAt: Date.now(),
      };

      const unifiedMessage = toUnifiedIncomingMessage(mockData, actionInfo);
      if (unifiedMessage && this.messageHandler) {
        void this.emitMessage(unifiedMessage).catch((error) =>
          console.error('[DingTalkPlugin] Error handling card action:', error)
        );
      }
    } catch (error) {
      console.error('[DingTalkPlugin] Error processing card callback:', error);
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

  // ==================== AI Card Streaming ====================

  /**
   * Create and deliver an AI Card for streaming
   * Returns a synthetic messageId for tracking
   */
  private async createAndDeliverAICard(chatType: 'user' | 'group', id: string, _initialText: string): Promise<string> {
    const token = await this.getAccessToken();
    const outTrackId = `aion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 1. Create AI Card instance with STREAM callback type and space models
    await this.apiRequest('POST', '/v1.0/card/instances', token, {
      cardTemplateId: this.aiCardTemplateId,
      outTrackId,
      cardData: {
        cardParamMap: {},
      },
      callbackType: 'STREAM',
      imGroupOpenSpaceModel: { supportForward: true },
      imRobotOpenSpaceModel: { supportForward: true },
    });

    // 2. Deliver card to user/group
    const openSpaceId = chatType === 'group' ? `dtv1.card//IM_GROUP.${id}` : `dtv1.card//IM_ROBOT.${id}`;

    await this.apiRequest('POST', '/v1.0/card/instances/deliver', token, {
      outTrackId,
      openSpaceId,
      userIdType: 1,
      imGroupOpenDeliverModel: chatType === 'group' ? { robotCode: this.clientId } : undefined,
      imRobotOpenDeliverModel: chatType === 'user' ? { spaceType: 'IM_ROBOT' } : undefined,
    });

    // Track the AI Card session
    const messageId = `aicard_${outTrackId}`;
    this.aiCardSessions.set(messageId, {
      outTrackId,
      openSpaceId,
      isFinished: false,
      inputingStarted: false,
    });
    // M4/L8: index outTrackId -> openSpaceId so card callbacks can recover
    // the originating space (group vs private) for correct routing.
    this.trackIdToSpace.set(outTrackId, openSpaceId);

    return messageId;
  }

  /**
   * Update AI Card content (streaming)
   */
  private async streamAICard(outTrackId: string, content: string, isFinalize = false): Promise<void> {
    const token = await this.getAccessToken();

    // Transition to INPUTING state on first stream write
    const session = this.findCardSessionByTrackId(outTrackId);
    if (session && !session.inputingStarted) {
      await this.apiRequest('PUT', '/v1.0/card/instances', token, {
        outTrackId,
        cardData: {
          cardParamMap: {
            flowStatus: AICardStatus.INPUTING,
            msgContent: '',
            staticMsgContent: '',
            sys_full_json_obj: JSON.stringify({ order: ['msgContent'] }),
          },
        },
      });
      session.inputingStarted = true;
    }

    // Stream content update
    // Always use isFull=true because editMessage sends complete content each time (not deltas)
    await this.apiRequest('PUT', '/v1.0/card/streaming', token, {
      outTrackId,
      key: 'msgContent',
      content,
      isFull: true,
      isFinalize,
      isError: false,
      guid: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    });
  }

  /**
   * Finish AI Card by setting flow status to FINISHED
   */
  private async finishAICard(outTrackId: string, finalContent: string): Promise<void> {
    const token = await this.getAccessToken();
    await this.apiRequest('PUT', '/v1.0/card/instances', token, {
      outTrackId,
      cardData: {
        cardParamMap: {
          flowStatus: AICardStatus.FINISHED,
          msgContent: finalContent,
          staticMsgContent: '',
          sys_full_json_obj: JSON.stringify({ order: ['msgContent'] }),
        },
      },
    });
  }

  /**
   * Find AI Card session by outTrackId
   */
  private findCardSessionByTrackId(outTrackId: string): IAICardSession | undefined {
    for (const session of this.aiCardSessions.values()) {
      if (session.outTrackId === outTrackId) return session;
    }
    return undefined;
  }

  // ==================== Fallback Sending ====================

  /**
   * Send a message via webhook or API, bypassing AI Card
   * Used as fallback when AI Card streaming is unavailable or fails
   */
  private async sendPlainMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    try {
      await this.ensureAccessToken();
      const { contentType, content, rawText } = toDingTalkSendParams(message);
      const { type: chatType, id } = parseChatId(chatId);

      // Try sessionWebhook first
      const webhook = this.webhookCache.get(chatId);
      if (webhook) {
        await this.sendViaWebhook(webhook, contentType, content, rawText);
        return;
      }

      // Fall back to DingTalk API
      await this.sendViaAPI(chatType, id, contentType, content, rawText);
    } catch (error) {
      console.error('[DingTalkPlugin] Fallback plain message send failed:', error);
    }
  }

  // ==================== Message Sending ====================

  /**
   * Send message via sessionWebhook (simple markdown)
   */
  private async sendViaWebhook(
    webhook: string,
    contentType: string,
    content: Record<string, unknown>,
    rawText?: string
  ): Promise<string> {
    // HIGH-1 fix: defence-in-depth - re-validate the URL at send time. Cached webhook
    // URLs are validated at intake (handleRobotMessage), but a caller could in theory
    // pass an unvalidated URL here.
    if (!DingTalkPlugin.isValidDingTalkWebhook(webhook)) {
      throw new Error('Refusing to POST to non-DingTalk webhook URL');
    }
    // HIGH-1 fix: if a custom-robot signing secret is configured, append the
    // `&timestamp=&sign=` HMAC-SHA256 query params that DingTalk requires when the
    // robot has "Signing Secret" security enabled. Without this, robots with secrets
    // configured return 310000 / "sign not match" and the send silently fails.
    const signedWebhook = this.signWebhookUrl(webhook);
    if (contentType === 'actionCard') {
      const response = await this.httpPost(signedWebhook, {
        msgtype: 'actionCard',
        actionCard: content,
      });
      return response?.messageId || `webhook_${Date.now()}`;
    }

    // Markdown path: M2 split + H4 mitigation (convert HTML→DingTalk markdown).
    const text = rawText || (typeof content.text === 'string' ? (content.text as string) : JSON.stringify(content));
    const rendered = convertHtmlToDingTalkMarkdown(text);
    const chunks = splitMessage(rendered, DINGTALK_MESSAGE_LIMIT);
    let lastResponse: { messageId?: string } | undefined;
    for (const chunk of chunks) {
      lastResponse = await this.httpPost(signedWebhook, {
        msgtype: 'markdown',
        markdown: {
          title: this.displayName,
          text: chunk,
        },
      });
    }
    return lastResponse?.messageId || `webhook_${Date.now()}`;
  }

  /**
   * HIGH-1 fix: validate that a webhook URL is an https URL on the official
   * DingTalk custom-robot endpoint. Rejects http://, non-DingTalk hosts, and
   * URLs missing the /robot/send path.
   */
  static isValidDingTalkWebhook(url: string): boolean {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') return false;
      if (u.hostname !== 'oapi.dingtalk.com') return false;
      if (u.pathname !== '/robot/send') return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * HIGH-1 fix: append HMAC-SHA256 signature to a custom-robot webhook URL when a
   * `webhookSecret` is configured. Per DingTalk docs:
   *   stringToSign = `${timestamp}\n${secret}`
   *   sign = urlEncode(base64(HmacSHA256(stringToSign, secret)))
   *   url += `&timestamp=${timestamp}&sign=${sign}`
   * If no secret is set the URL is returned unmodified (safe for robots without
   * the Signing Secret security setting enabled).
   */
  private signWebhookUrl(webhook: string): string {
    if (!this.webhookSecret) return webhook;
    const timestamp = Date.now().toString();
    const stringToSign = `${timestamp}\n${this.webhookSecret}`;
    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(stringToSign, 'utf8')
      .digest('base64');
    const sign = encodeURIComponent(signature);
    const sep = webhook.includes('?') ? '&' : '?';
    return `${webhook}${sep}timestamp=${timestamp}&sign=${sign}`;
  }

  /**
   * Send message via DingTalk Open API
   */
  private async sendViaAPI(
    chatType: 'user' | 'group',
    id: string,
    contentType: string,
    content: Record<string, unknown>,
    rawText?: string
  ): Promise<string> {
    const token = await this.getAccessToken();

    if (contentType === 'actionCard') {
      // Cards are sent as-is - DingTalk handles size limits server-side.
      if (chatType === 'user') {
        const response = await this.apiRequest('POST', '/v1.0/robot/oToMessages/batchSend', token, {
          robotCode: this.clientId,
          userIds: [id],
          msgKey: 'sampleActionCard6',
          msgParam: JSON.stringify(content),
        });
        return response?.processQueryKey || `api_${Date.now()}`;
      }
      const response = await this.apiRequest('POST', '/v1.0/robot/groupMessages/send', token, {
        robotCode: this.clientId,
        openConversationId: id,
        msgKey: 'sampleActionCard6',
        msgParam: JSON.stringify(content),
      });
      return response?.processQueryKey || `api_${Date.now()}`;
    }

    // Markdown path: M2 split + H4 mitigation (HTML→DingTalk markdown).
    const text = rawText || (typeof content.text === 'string' ? (content.text as string) : '');
    const rendered = convertHtmlToDingTalkMarkdown(text);
    const chunks = splitMessage(rendered, DINGTALK_MESSAGE_LIMIT);
    let lastResponse: { processQueryKey?: string } | undefined;

    for (const chunk of chunks) {
      const msgParam = JSON.stringify({ title: this.displayName, text: chunk });
      if (chatType === 'user') {
        lastResponse = await this.apiRequest('POST', '/v1.0/robot/oToMessages/batchSend', token, {
          robotCode: this.clientId,
          userIds: [id],
          msgKey: 'sampleMarkdown',
          msgParam,
        });
      } else {
        lastResponse = await this.apiRequest('POST', '/v1.0/robot/groupMessages/send', token, {
          robotCode: this.clientId,
          openConversationId: id,
          msgKey: 'sampleMarkdown',
          msgParam,
        });
      }
    }
    return lastResponse?.processQueryKey || `api_${Date.now()}`;
  }

  // ==================== Access Token Management ====================

  /**
   * Get current access token (cached)
   */
  private async getAccessToken(): Promise<string> {
    await this.ensureAccessToken();
    return this.tokenCache?.accessToken || '';
  }

  /**
   * Ensure access token is valid.
   * M1: concurrent callers share a single in-flight refresh to avoid
   * stampeding `/v1.0/oauth2/accessToken` (rate-limited 60/min/appKey).
   */
  private async ensureAccessToken(): Promise<void> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt - now >= 60 * 1000) {
      return;
    }
    if (this.tokenRefreshInFlight) {
      await this.tokenRefreshInFlight;
      return;
    }
    this.tokenRefreshInFlight = this.refreshAccessToken().finally(() => {
      this.tokenRefreshInFlight = null;
    });
    await this.tokenRefreshInFlight;
  }

  /**
   * Refresh access token from DingTalk API
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await this.httpPost(`${DINGTALK_API_BASE}/v1.0/oauth2/accessToken`, {
        appKey: this.clientId,
        appSecret: this.clientSecret,
      });

      if (response?.accessToken) {
        this.tokenCache = {
          accessToken: response.accessToken,
          expiresAt: Date.now() + (response.expireIn || 7200) * 1000,
        };
      } else {
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error('[DingTalkPlugin] Failed to refresh access token:', error);
      throw error;
    }
  }

  // ==================== HTTP Helpers ====================

  /**
   * Make an API request to DingTalk
   */
  private async apiRequest(method: string, path: string, token: string, body?: Record<string, unknown>): Promise<any> {
    const url = `${DINGTALK_API_BASE}${path}`;
    return this.httpRequest(method, url, body, {
      'x-acs-dingtalk-access-token': token,
      'Content-Type': 'application/json',
    });
  }

  /**
   * HTTP POST helper
   */
  private async httpPost(url: string, body: Record<string, unknown>): Promise<any> {
    return this.httpRequest('POST', url, body, {
      'Content-Type': 'application/json',
    });
  }

  /**
   * Generic HTTP request helper using Node.js https module
   */
  private httpRequest(
    method: string,
    url: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const data = body ? JSON.stringify(body) : undefined;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          ...headers,
          ...(data ? { 'Content-Length': Buffer.byteLength(data).toString() } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
            } else {
              resolve(parsed);
            }
          } catch {
            resolve(responseData);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy(new Error('Request timeout'));
      });

      if (data) {
        req.write(data);
      }
      req.end();
    });
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

  // ==================== Static Methods ====================

  /**
   * Test connection with the given credentials.
   *
   * R16 L5/L6: minting an OAuth2 access token at `/v1.0/oauth2/accessToken`
   * is itself the credential verification - DingTalk only issues a token for
   * a valid appKey+appSecret pair, and the bot's token cannot fetch its own
   * profile (`/v1.0/contact/users/me` requires a user-access-token, not an
   * app token). To stop lying about the bot name, surface the caller-supplied
   * `displayName` instead of hardcoded "DingTalk Bot".
   *
   * R16 L9 (status-token semantics): the audit finding is not actionable from
   * codebase grep - there is no separate "status token" in the DingTalk
   * codepath. `accessToken` is the only token, cached with `expiresAt` (see
   * line 76/918). Documented here so the finding has a paper trail; no code
   * change required.
   */
  static async testConnection(
    clientId: string,
    clientSecret?: string,
    displayName?: string
  ): Promise<{ success: boolean; botInfo?: { name?: string }; error?: string }> {
    if (!clientSecret) {
      return { success: false, error: 'Client Secret is required for DingTalk' };
    }

    try {
      // Try to get access token to verify credentials
      const response = await new Promise<any>((resolve, reject) => {
        const data = JSON.stringify({
          appKey: clientId,
          appSecret: clientSecret,
        });

        const options = {
          hostname: 'api.dingtalk.com',
          port: 443,
          path: '/v1.0/oauth2/accessToken',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data).toString(),
          },
        };

        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(responseData));
            } catch {
              reject(new Error('Invalid response'));
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy(new Error('Connection timeout'));
        });
        req.write(data);
        req.end();
      });

      if (response?.accessToken) {
        const resolvedName = displayName && displayName.trim() ? displayName.trim() : DEFAULT_DISPLAY_NAME;
        return { success: true, botInfo: { name: resolvedName } };
      }

      return {
        success: false,
        error: response?.message || response?.errmsg || 'Failed to get access token',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to DingTalk API',
      };
    }
  }
}
