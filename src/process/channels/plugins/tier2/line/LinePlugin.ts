/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * LINE Messaging API bot plugin - webhook-driven inbound + reply-token (60s
 * window) with push-API fallback for expired tokens.
 *
 * Inbound flow:
 *   WebhookReceiver verifies x-line-signature HMAC-SHA256 via
 *   webhook/verifiers/line.ts, parses the JSON body, and routes here via
 *   handleWebhookPayload. We process each event, emit unified messages, and
 *   cache the reply token (valid ~60 s from LINE).
 *
 * Outbound flow:
 *   sendMessage checks whether the reply token for the target chatId is still
 *   within its 60-second window. If yes, use replyMessage (free tier friendly).
 *   If the token is expired or absent, fall back to pushMessage (requires a
 *   paid plan or Messaging API push quota).
 *
 * Webhook delivery: receiver owns the HTTP response. handleWebhookPayload is
 * pure side-effect: payload → IUnifiedIncomingMessage → messageHandler.
 */

import { messagingApi } from '@line/bot-sdk';
import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  lineMessageEventToUnified,
  linePostbackEventToUnified,
  toLineTextMessage,
  type LineCallbackRequest,
  type LineMessageEvent,
  type LinePostbackEvent,
  type LineWebhookEvent,
} from './LineAdapter';

/** Reply tokens are valid for 60 seconds from the originating event timestamp. */
const REPLY_TOKEN_TTL_MS = 60_000;

/**
 * Cached reply-token entry. keyed by chatId so we use the most recent token
 * when multiple messages arrive before the bot responds.
 */
type ReplyTokenEntry = {
  token: string;
  expiresAt: number;
};

/** Minimal subset of the GET /v2/bot/info response we care about. */
type LineBotInfoResponse = {
  displayName?: string;
  userId?: string;
  pictureUrl?: string;
};

export class LinePlugin extends BasePlugin {
  readonly type: PluginType = 'line';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private client: messagingApi.MessagingApiClient | null = null;
  private channelAccessToken: string | null = null;
  private botDisplayName: string | null = null;
  private botUserId: string | null = null;

  /** chatId → most-recent valid reply token */
  private readonly replyTokens = new Map<string, ReplyTokenEntry>();

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const token =
      typeof creds.channelAccessToken === 'string' ? creds.channelAccessToken.trim() : '';
    const secret =
      typeof creds.channelSecret === 'string' ? creds.channelSecret.trim() : '';

    if (!token) throw new Error('LINE channel access token is required');
    if (!secret) throw new Error('LINE channel secret is required');

    this.channelAccessToken = token;
    this.client = new messagingApi.MessagingApiClient({ channelAccessToken: token });
  }

  /**
   * Webhook-driven - nothing to connect on start. WebhookReceiver routes
   * inbound traffic via handleWebhookPayload.
   */
  protected async onStart(): Promise<void> {
    // No-op: LINE delivery is fully push-based via WebhookReceiver.
  }

  protected async onStop(): Promise<void> {
    this.client = null;
    this.channelAccessToken = null;
    this.botDisplayName = null;
    this.botUserId = null;
    this.replyTokens.clear();
  }

  getActiveUserCount(): number {
    return 0;
  }

  getBotInfo(): BotInfo | null {
    if (!this.botUserId && !this.botDisplayName) return null;
    const id = this.botUserId ?? 'line-bot';
    return {
      id,
      username: id,
      displayName: this.botDisplayName ?? id,
    };
  }

  /**
   * Send a message to a LINE chat. Prefers the cached reply token (free,
   * ~60 s window). Falls back to pushMessage when the token is absent or
   * expired.
   *
   * Returns a synthetic message id - LINE reply/push responses don't carry
   * per-message IDs we can use for editing (LINE does not support edits).
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) throw new Error('LINE plugin not initialized');

    const lineMsg = toLineTextMessage(message);
    const now = Date.now();
    const entry = this.replyTokens.get(chatId);

    if (entry && entry.expiresAt > now) {
      try {
        await this.client.replyMessage({
          replyToken: entry.token,
          messages: [lineMsg],
        });
        // Consume the token - LINE allows exactly one reply per token.
        this.replyTokens.delete(chatId);
        return `reply:${entry.token}`;
      } catch (err) {
        // Token may have expired server-side slightly ahead of our TTL;
        // fall through to pushMessage.
        this.replyTokens.delete(chatId);
        console.warn(`[linePlugin] reply failed, falling back to push: ${String(err)}`);
      }
    }

    // Push fallback - requires push quota / paid plan.
    // chatId for DMs is the LINE userId; for groups it's "group:<id>".
    const to = chatId.startsWith('group:')
      ? chatId.slice('group:'.length)
      : chatId.startsWith('room:')
        ? chatId.slice('room:'.length)
        : chatId;

    try {
      await this.client.pushMessage({ to, messages: [lineMsg] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`LINE pushMessage failed (likely quota or permission): ${msg}`, { cause: err });
    }
    return `push:${to}:${now}`;
  }

  /**
   * Process a verified LINE webhook payload. Iterates over events and emits
   * unified messages for text/postback events; follow/unfollow/join/leave are
   * logged and dropped.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string,
  ): Promise<void> {
    const body = payload as LineCallbackRequest;
    const events: LineWebhookEvent[] = Array.isArray(body.events) ? body.events : [];

    for (const event of events) {
      try {
        await this.handleSingleEvent(event);
      } catch (err) {
        console.warn(`[linePlugin] event handler error (type=${event.type}): ${String(err)}`);
      }
    }
  }

  private async handleSingleEvent(event: LineWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'message': {
        const msgEvent = event as LineMessageEvent;
        // Cache reply token before conversion - even non-text events consume
        // the token window, and we may want to push a response.
        if (msgEvent.replyToken) {
          this.cacheReplyToken(msgEvent);
        }
        const unified = lineMessageEventToUnified(msgEvent);
        if (unified) {
          await this.emitMessage(unified);
        } else {
          console.warn(`[linePlugin] dropping unsupported message type: ${msgEvent.message.type}`);
        }
        break;
      }

      case 'postback': {
        const pbEvent = event as LinePostbackEvent;
        if (pbEvent.replyToken) {
          this.cacheReplyTokenFromPostback(pbEvent);
        }
        const unified = linePostbackEventToUnified(pbEvent);
        if (unified) {
          await this.emitMessage(unified);
        }
        break;
      }

      case 'follow':
        console.log(`[linePlugin] user followed: ${JSON.stringify(event.source ?? {})}`);
        break;

      case 'unfollow':
        console.log(`[linePlugin] user unfollowed: ${JSON.stringify(event.source ?? {})}`);
        break;

      default:
        console.log(`[linePlugin] unhandled event type: ${event.type}`);
    }
  }

  /**
   * Cache the reply token for the chatId derived from the message event.
   * Token expires REPLY_TOKEN_TTL_MS after the event timestamp.
   */
  private cacheReplyToken(event: LineMessageEvent): void {
    if (!event.replyToken) return;
    const source = event.source;
    let chatId = 'unknown';
    if (source?.type === 'group') chatId = `group:${source.groupId}`;
    else if (source?.type === 'room') chatId = `room:${source.roomId}`;
    else if (source?.type === 'user') chatId = source.userId;
    const expiresAt = event.timestamp + REPLY_TOKEN_TTL_MS;
    this.replyTokens.set(chatId, { token: event.replyToken, expiresAt });
  }

  private cacheReplyTokenFromPostback(event: LinePostbackEvent): void {
    if (!event.replyToken) return;
    const source = event.source;
    let chatId = 'unknown';
    if (source?.type === 'group') chatId = `group:${source.groupId}`;
    else if (source?.type === 'room') chatId = `room:${source.roomId}`;
    else if (source?.type === 'user') chatId = source.userId;
    const expiresAt = event.timestamp + REPLY_TOKEN_TTL_MS;
    this.replyTokens.set(chatId, { token: event.replyToken, expiresAt });
  }

  // ── Static Methods ──────────────────────────────────────────────────────────

  /**
   * Test connection by calling GET /v2/bot/info with the supplied
   * channelAccessToken. Returns botUsername = bot's displayName on success.
   *
   * Credentials are JSON-encoded per TRANSLATION-GUIDE §4:
   *   { channelAccessToken: string; channelSecret: string }
   */
  static async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    type Creds = { channelAccessToken: string; channelSecret: string };
    let creds: Creds;
    try {
      creds = JSON.parse(tokenJson) as Creds;
    } catch {
      return { success: false, error: 'Invalid JSON credentials' };
    }

    const token = (creds.channelAccessToken ?? '').trim();
    const secret = (creds.channelSecret ?? '').trim();

    if (!token) return { success: false, error: 'channelAccessToken is required' };
    if (!secret) return { success: false, error: 'channelSecret is required' };

    try {
      const response = await fetch('https://api.line.me/v2/bot/info', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        let errText = '<unreadable>';
        try {
          errText = await response.text();
        } catch {
          // ignore
        }
        return {
          success: false,
          error: `LINE API returned ${response.status}: ${errText}`,
        };
      }

      const data = (await response.json().catch(() => ({}))) as LineBotInfoResponse;
      const displayName = data.displayName?.trim();
      if (!displayName) {
        return { success: false, error: 'LINE API returned empty bot info' };
      }
      return { success: true, botUsername: displayName };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
