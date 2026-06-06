/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac } from 'node:crypto';

import { App, HTTPReceiver, SocketModeReceiver } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import { buildSlackBlocksFallbackText } from './blocks-fallback';
import {
  type SlackBotInfo,
  type SlackMessageEvent,
  type SlackOutgoingAttachment,
  SLACK_MESSAGE_LIMIT,
  splitSlackMessage,
  toSlackSendParams,
  toUnifiedIncomingMessage,
} from './SlackAdapter';

/**
 * Upper bound on `activeUsers` set. LOW finding: prior implementation never
 * evicted, so a busy workspace grew the set unbounded for the lifetime of
 * the plugin. When the cap is hit we drop the oldest insertion (Set
 * preserves insertion order) before adding the new id.
 */
const ACTIVE_USERS_MAX = 1000;

/**
 * Slack terminal auth errors. When Bolt surfaces one of these the bot can no
 * longer make API calls and must be re-authorized; we transition to a
 * stopped state rather than leaving the plugin in `running` with a stale
 * error message (F14 MED).
 */
const TERMINAL_AUTH_ERRORS: ReadonlySet<string> = new Set([
  'token_revoked',
  'invalid_auth',
  'account_inactive',
  'token_expired',
  'not_authed',
]);

/**
 * Transport selection. Socket Mode is the default: a WebSocket connection
 * Slack initiates outbound, so no public webhook URL is required. Events API
 * is the alternative for users with a stable HTTPS endpoint and a signing
 * secret - Bolt's HTTPReceiver verifies the X-Slack-Signature HMAC.
 */
export type SlackTransport = 'socket' | 'events';

/**
 * Resolved Slack credentials extracted from IChannelPluginConfig.
 */
interface SlackCredentials {
  botToken: string;
  appToken?: string;
  signingSecret?: string;
  transport: SlackTransport;
}

function resolveCredentials(config: IChannelPluginConfig): SlackCredentials {
  const c = config.credentials ?? {};
  const botToken = typeof c.botToken === 'string' ? c.botToken : '';
  if (!botToken) {
    throw new Error('Slack bot token is required (credentials.botToken)');
  }
  const rawTransport = typeof c.transport === 'string' ? c.transport : 'socket';
  const transport: SlackTransport = rawTransport === 'events' ? 'events' : 'socket';
  const appToken = typeof c.appToken === 'string' && c.appToken.length > 0 ? c.appToken : undefined;
  const signingSecret =
    typeof c.signingSecret === 'string' && c.signingSecret.length > 0 ? c.signingSecret : undefined;

  if (transport === 'socket' && !appToken) {
    throw new Error('Slack Socket Mode requires an app-level token (credentials.appToken xapp-...)');
  }
  if (transport === 'events' && !signingSecret) {
    throw new Error('Slack Events API transport requires a signing secret (credentials.signingSecret)');
  }
  return { botToken, appToken, signingSecret, transport };
}

/**
 * SlackPlugin - In-process Bolt integration covering both Socket Mode and
 * Events API webhook transports. Surface includes message events, slash
 * commands, interactive button actions, and view (modal) submissions.
 *
 * Block Kit modals + slash commands are wired natively via Bolt's `view` /
 * `command` middleware. Inline buttons round-trip through Bolt's `action`
 * middleware.
 */
export class SlackPlugin extends BasePlugin {
  readonly type: PluginType = 'slack';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: true,
    canReact: true,
    canTypingIndicator: false,
  };

  private app: App | null = null;
  private webClient: WebClient | null = null;
  private socketReceiver: SocketModeReceiver | null = null;
  private httpReceiver: HTTPReceiver | null = null;
  private resolvedTransport: SlackTransport = 'socket';
  private resolvedBotInfo: SlackBotInfo | null = null;
  private activeUsers: Set<string> = new Set();
  // Cache of resolved DM channel IDs keyed by user id, so we resolve once per
  // recipient rather than every send (F11 MED).
  private dmChannelByUser: Map<string, string> = new Map();

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = resolveCredentials(config);
    this.resolvedTransport = creds.transport;

    if (creds.transport === 'socket') {
      this.socketReceiver = new SocketModeReceiver({
        appToken: creds.appToken!,
      });
      this.app = new App({
        token: creds.botToken,
        receiver: this.socketReceiver,
      });
    } else {
      this.httpReceiver = new HTTPReceiver({
        signingSecret: creds.signingSecret!,
      });
      this.app = new App({
        token: creds.botToken,
        receiver: this.httpReceiver,
      });
    }

    this.webClient = new WebClient(creds.botToken);
    this.registerListeners();
  }

  protected async onStart(): Promise<void> {
    if (!this.app || !this.webClient) {
      throw new Error('SlackPlugin not initialized');
    }
    // auth.test reveals bot user id used for self-filtering inbound events.
    const auth = await this.webClient.auth.test();
    this.resolvedBotInfo = {
      userId: typeof auth.user_id === 'string' ? auth.user_id : '',
      teamId: typeof auth.team_id === 'string' ? auth.team_id : '',
      ...(typeof auth.team === 'string' ? { team: auth.team } : {}),
      ...(typeof auth.user === 'string' ? { user: auth.user } : {}),
    };

    if (this.resolvedTransport === 'socket') {
      await this.app.start();
    }
    // For Events API transport the receiver doesn't bind a port itself -
    // inbound deliveries arrive via handleWebhookPayload() from Wayland's
    // shared WebhookReceiver (wired in ChannelManager →
    // registerWebhookDispatcher → plugin.handleWebhookPayload). Bolt's
    // processEvent dispatches them through the registered listeners. F12
    // HIGH verified live as of v0.4.2.
  }

  protected async onStop(): Promise<void> {
    if (this.app && this.resolvedTransport === 'socket') {
      try {
        await this.app.stop();
      } catch (error) {
        console.warn('[SlackPlugin] Error during app.stop:', error);
      }
    }
    this.app = null;
    this.webClient = null;
    this.socketReceiver = null;
    this.httpReceiver = null;
    this.resolvedBotInfo = null;
    this.activeUsers.clear();
    this.dmChannelByUser.clear();
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  /**
   * Add a user id to the bounded activeUsers set. LOW finding: prior code
   * grew the set unbounded; here we evict the oldest insertion when over
   * the cap.
   */
  private noteActiveUser(userId: string): void {
    if (!userId) return;
    if (this.activeUsers.has(userId)) return;
    if (this.activeUsers.size >= ACTIVE_USERS_MAX) {
      const oldest = this.activeUsers.values().next().value;
      if (oldest !== undefined) this.activeUsers.delete(oldest);
    }
    this.activeUsers.add(userId);
  }

  getBotInfo(): BotInfo | null {
    if (!this.resolvedBotInfo) return null;
    return {
      id: this.resolvedBotInfo.userId,
      ...(this.resolvedBotInfo.user ? { username: this.resolvedBotInfo.user } : {}),
      // LOW finding: a bot's displayName should be the bot, not the
      // workspace. Prefer the bot user → workspace team → static fallback.
      displayName: this.resolvedBotInfo.user ?? this.resolvedBotInfo.team ?? 'Slack Bot',
    };
  }

  /**
   * Resolve a bare Slack user id (U-prefix) into the corresponding DM
   * channel id (D-prefix) via conversations.open. Slack tolerates U IDs in
   * chat.postMessage but rejects them in completeUploadExternal, so any
   * code path that uploads files must address the D channel. We cache
   * the resolution to avoid hammering conversations.open. F11 MED.
   */
  private async resolveChannelId(chatId: string): Promise<string> {
    if (!this.webClient) return chatId;
    if (!chatId || chatId[0] !== 'U') return chatId;
    const cached = this.dmChannelByUser.get(chatId);
    if (cached) return cached;
    try {
      const result = await this.webClient.conversations.open({ users: chatId });
      const channelId = (result.channel as { id?: string } | undefined)?.id;
      if (channelId) {
        this.dmChannelByUser.set(chatId, channelId);
        return channelId;
      }
    } catch (err) {
      console.warn('[SlackPlugin] conversations.open failed for', chatId, err);
    }
    return chatId;
  }

  /**
   * F10 MED: upload outbound attachments using Slack's modern 3-step
   * external upload flow (files.getUploadURLExternal → POST → completeUploadExternal).
   * Errors are logged but do not throw, so a failed attachment does not
   * roll back a successful text post.
   */
  private async uploadAttachments(
    channelId: string,
    attachments: SlackOutgoingAttachment[],
    threadTs: string | undefined,
  ): Promise<void> {
    if (!this.webClient) return;
    for (const a of attachments) {
      try {
        const filename = a.filename ?? 'attachment';
        const body = a.data instanceof Buffer
          ? a.data
          : typeof a.data === 'string'
            ? Buffer.from(a.data)
            : Buffer.from(a.data);
        const upload = await this.webClient.files.getUploadURLExternal({
          filename,
          length: body.byteLength,
        });
        const uploadUrl = typeof upload.upload_url === 'string' ? upload.upload_url : '';
        const fileId = typeof upload.file_id === 'string' ? upload.file_id : '';
        if (!uploadUrl || !fileId) {
          console.warn('[SlackPlugin] files.getUploadURLExternal returned no upload_url/file_id');
          continue;
        }
        const postResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: body as unknown as BodyInit,
          headers: a.mimeType ? { 'Content-Type': a.mimeType } : undefined,
        });
        if (!postResponse.ok) {
          console.warn('[SlackPlugin] upload POST failed', postResponse.status, postResponse.statusText);
          continue;
        }
        // Slack SDK's typed shape requires `files` to be a tuple-of-objects
        // with a non-optional `title`. The runtime API accepts a minimal
        // `[{ id }]` form (title is optional in the docs), so we cast to
        // the SDK's call signature to satisfy the strict types without
        // fabricating titles.
        const completeParams = {
          files: [{ id: fileId, ...(a.title ? { title: a.title } : {}) }],
          channel_id: channelId,
          ...(threadTs ? { thread_ts: threadTs } : {}),
        } as unknown as Parameters<WebClient['files']['completeUploadExternal']>[0];
        await this.webClient.files.completeUploadExternal(completeParams);
      } catch (err) {
        console.warn('[SlackPlugin] attachment upload failed:', err);
      }
    }
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    // F11 MED: resolve bare U-prefix recipient ids to their D-channel before
    // sending so subsequent file uploads / conversations.replies use a
    // channel id Slack accepts.
    const resolvedChannel = await this.resolveChannelId(chatId);
    const { text, blocks, thread_ts, attachments } = toSlackSendParams(message);
    const chunks = splitSlackMessage(text, SLACK_MESSAGE_LIMIT);
    // F4 HIGH: return the FIRST chunk's ts so subsequent editMessage(...)
    // calls patch from the head of the thread, not the tail. Slack's
    // chat.update edits the single ts it's given; without this an edit on a
    // chunked reply would only touch chunk N and orphan chunks 0..N-1.
    let firstTs = '';
    for (let i = 0; i < chunks.length; i += 1) {
      const isLast = i === chunks.length - 1;
      const params: Parameters<WebClient['chat']['postMessage']>[0] = {
        channel: resolvedChannel,
        text: chunks[i] || (blocks && isLast ? buildSlackBlocksFallbackText(blocks) : ' '),
        ...(thread_ts ? { thread_ts } : {}),
        ...(isLast && blocks ? { blocks } : {}),
      };
      // F13 HIGH: prior code threw out of the chunk loop on first 429,
      // leaving a half-posted reply. postWithRetry honors Slack's
      // Retry-After.
      const ts = await this.postWithRetry(params);
      if (ts && !firstTs) firstTs = ts;
    }
    // F10 MED: upload attachments after the text post. Uses the resolved
    // channel id (DMs by U-prefix would be rejected by completeUploadExternal).
    if (attachments && attachments.length > 0) {
      await this.uploadAttachments(resolvedChannel, attachments, thread_ts);
    }
    return firstTs;
  }

  /**
   * Wrap chat.postMessage with a single Retry-After-aware retry on 429.
   * Bolt surfaces rate-limit info on `err.code === 'slack_webapi_rate_limited_error'`
   * (or `err.data.error === 'ratelimited'`) with `err.retryAfter` (seconds).
   * F13 HIGH.
   */
  private async postWithRetry(
    params: Parameters<WebClient['chat']['postMessage']>[0],
  ): Promise<string> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    try {
      const result = await this.webClient.chat.postMessage(params);
      return typeof result.ts === 'string' ? result.ts : '';
    } catch (err) {
      const retryAfter = extractRetryAfter(err);
      if (retryAfter === null) throw err;
      const waitMs = Math.min(retryAfter, 60) * 1000;
      console.warn(`[SlackPlugin] rate-limited, waiting ${waitMs}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      const result = await this.webClient.chat.postMessage(params);
      return typeof result.ts === 'string' ? result.ts : '';
    }
  }

  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    const { text, blocks } = toSlackSendParams(message);
    const trimmed = text.trim();
    // F9 MED: prior code silently no-op'd on empty text+blocks so callers
    // had no signal between "edit applied" and "edit suppressed". Submit a
    // single-space update so "clear this message" is at least preserved as
    // a visible edit, matching what Slack accepts via chat.update.
    if (!trimmed && !blocks) {
      console.warn(
        '[SlackPlugin] editMessage called with empty text + blocks; submitting a single space to preserve "cleared" semantics',
      );
      await this.webClient.chat.update({ channel: chatId, ts: messageId, text: ' ' });
      return;
    }
    await this.webClient.chat.update({
      channel: chatId,
      ts: messageId,
      text: trimmed || (blocks ? buildSlackBlocksFallbackText(blocks) : ' '),
      ...(blocks ? { blocks } : {}),
    });
  }

  /**
   * Add an emoji reaction to a message. F3 HIGH: backs the `canReact: true`
   * capability claim, which was previously unimplemented. `emoji` is the
   * Slack short name without surrounding colons (e.g. `thumbsup`, not
   * `:thumbsup:`).
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    const name = emoji.replace(/^:|:$/g, '');
    await this.webClient.reactions.add({ channel: chatId, timestamp: messageId, name });
  }

  /**
   * Remove an emoji reaction previously added by this bot. F3 HIGH.
   */
  async removeReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    const name = emoji.replace(/^:|:$/g, '');
    await this.webClient.reactions.remove({ channel: chatId, timestamp: messageId, name });
  }

  /**
   * Webhook entrypoint for Events API transport. The shared WebhookReceiver
   * has already resolved the connection token, verified the body, and parsed
   * JSON. We hand it to Bolt's HTTPReceiver-backed App via processEvent so
   * the same listener graph fires regardless of transport.
   */
  async handleWebhookPayload(
    payload: object,
    headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string,
  ): Promise<void> {
    if (this.resolvedTransport !== 'events') {
      throw new Error('SlackPlugin received a webhook delivery while not in Events API transport');
    }
    if (!this.app) {
      throw new Error('SlackPlugin not initialized');
    }
    // F15 (v0.4.3): url_verification is short-circuited by the shared
    // WebhookReceiver via the verifier's __challenge field (see
    // webhook/verifiers/slack.ts). The plugin only sees real events.

    await this.app.processEvent({
      body: payload as Record<string, unknown>,
      ack: async () => {
        /* the outer WebhookReceiver already acked the HTTP request */
      },
      retryNum: Number(headers['x-slack-retry-num']) || undefined,
      retryReason: typeof headers['x-slack-retry-reason'] === 'string' ? headers['x-slack-retry-reason'] : undefined,
    });
  }

  /**
   * Register Bolt middleware: message, slash command, interactive action,
   * view (modal) submission. Each handler converts the Slack payload into a
   * unified message and forwards it through messageHandler.
   */
  private registerListeners(): void {
    if (!this.app) return;

    this.app.message(async ({ message }) => {
      const event = message as unknown as SlackMessageEvent;
      const unified = toUnifiedIncomingMessage(event, this.resolvedBotInfo?.userId);
      if (!unified) return;
      if (event.user) this.noteActiveUser(event.user);
      if (this.messageHandler) {
        await this.messageHandler(unified).catch((err) =>
          console.error('[SlackPlugin] message handler error:', err),
        );
      }
    });

    // Slash commands - Bolt normalizes them across both transports.
    this.app.command(/.*/, async ({ command, ack }) => {
      await ack();
      if (command.user_id) this.noteActiveUser(command.user_id);
      if (!this.messageHandler) return;
      await this.messageHandler({
        id: `${command.channel_id}:${Date.now()}`,
        platform: 'slack',
        chatId: command.channel_id,
        user: { id: command.user_id, displayName: command.user_name ?? command.user_id },
        content: { type: 'command', text: `${command.command} ${command.text ?? ''}`.trim() },
        timestamp: Date.now(),
        action: {
          type: 'system',
          name: command.command.replace(/^\//, 'command.'),
          ...(command.text ? { params: { text: command.text } } : {}),
        },
        raw: command,
      }).catch((err) => console.error('[SlackPlugin] command handler error:', err));
    });

    // Interactive button actions (block_actions).
    this.app.action(/.*/, async ({ action, body, ack }) => {
      await ack();
      const userId = (body as { user?: { id?: string } }).user?.id ?? 'slack-unknown';
      // LOW finding: for modal-triggered actions Slack omits body.channel,
      // so the fallback collapses the chat to the user id which means
      // subsequent sendMessage(chatId, ...) will DM the user rather than
      // post in the channel where the modal was opened. Accepted as the
      // best signal Slack gives us; explicitly tagged so callers can
      // re-route via the raw body if they need the original surface.
      const channelId = (body as { channel?: { id?: string } }).channel?.id ?? userId;
      this.noteActiveUser(userId);
      const actionId = (action as { action_id?: string; value?: string }).action_id ?? 'unknown';
      const value = (action as { value?: string }).value;
      if (!this.messageHandler) return;
      await this.messageHandler({
        id: `${channelId}:${Date.now()}`,
        platform: 'slack',
        chatId: channelId,
        user: { id: userId, displayName: userId },
        content: { type: 'action', text: actionId },
        timestamp: Date.now(),
        action: {
          type: 'chat',
          name: actionId,
          ...(value ? { params: { value } } : {}),
        },
        raw: body,
      }).catch((err) => console.error('[SlackPlugin] action handler error:', err));
    });

    // Modal (view) submissions.
    this.app.view(/.*/, async ({ view, body, ack }) => {
      await ack();
      const userId = (body as { user?: { id?: string } }).user?.id ?? 'slack-unknown';
      this.noteActiveUser(userId);
      if (!this.messageHandler) return;
      await this.messageHandler({
        id: `view:${view.id}`,
        platform: 'slack',
        chatId: userId,
        user: { id: userId, displayName: userId },
        content: { type: 'action', text: view.callback_id ?? view.id },
        timestamp: Date.now(),
        action: {
          type: 'system',
          name: `view.${view.callback_id ?? 'submit'}`,
        },
        raw: { view, body },
      }).catch((err) => console.error('[SlackPlugin] view handler error:', err));
    });

    this.app.error(async (err) => {
      console.error('[SlackPlugin] Bolt error:', err);
      this.setError(err.message);
      // F14 MED: on terminal auth errors the bot can no longer call any
      // Slack API, so leaving the plugin in `running` state silently fails
      // every subsequent message. Transition to stopped so the UI surfaces
      // an actionable "re-authorize" state.
      const code = extractSlackErrorCode(err);
      if (code && TERMINAL_AUTH_ERRORS.has(code)) {
        try {
          await this.stop();
        } catch (stopErr) {
          console.warn('[SlackPlugin] terminal auth stop failed:', stopErr);
        }
      }
    });
  }

  /**
   * Validate Slack credentials before persisting them. F2 HIGH: pre-v0.4.2
   * this only exercised the bot token, so a wrong app-level token or signing
   * secret would silently fail at runtime ("Connected!" → first webhook 401).
   *
   * Bot token  - auth.test (always).
   * App token  - surface format check (`xapp-` prefix). A full Socket Mode
   *              handshake would require opening a WebSocket, too heavy for
   *              a synchronous UI test; format validation catches the common
   *              paste-the-wrong-token mistake.
   * Signing    - length check (>= 32 chars) + HMAC self-test (round-trip a
   * secret       synthetic body through createHmac to prove the secret is
   *              not empty/malformed).
   *
   * `extras` is optional so existing call sites that only pass `botToken`
   * remain backward-compatible.
   */
  static async testConnection(
    botToken: string,
    extras: { appToken?: string; signingSecret?: string; transport?: SlackTransport } = {},
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    try {
      const client = new WebClient(botToken);
      const auth = await client.auth.test();
      if (typeof auth.user_id !== 'string') {
        return { success: false, error: 'auth.test returned no user_id' };
      }

      const transport: SlackTransport = extras.transport === 'events' ? 'events' : 'socket';

      if (transport === 'socket') {
        const appToken = extras.appToken ?? '';
        if (appToken) {
          if (!appToken.startsWith('xapp-')) {
            return { success: false, error: 'App-level token must start with "xapp-"' };
          }
        }
        // We don't hard-fail on missing appToken here: the existing call site
        // may pre-date the F2 enrichment. resolveCredentials enforces it at
        // onInitialize, which is the binding contract for runtime.
      } else {
        const secret = extras.signingSecret ?? '';
        if (secret) {
          if (secret.length < 32) {
            return { success: false, error: 'Signing secret looks malformed (expected 32+ chars)' };
          }
          try {
            // HMAC self-test: a non-string / empty / multi-byte-corrupt secret
            // throws here before we ever accept the credential.
            createHmac('sha256', secret).update('v0:0:test').digest('hex');
          } catch {
            return { success: false, error: 'Signing secret could not be used for HMAC' };
          }
        }
      }

      return {
        success: true,
        botUsername: typeof auth.user === 'string' ? auth.user : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}

/**
 * Extract a Retry-After (seconds) hint from a Slack/Bolt error, or null if
 * the error is not a rate-limit. F13 HIGH helper.
 */
function extractRetryAfter(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { code?: string; data?: { error?: string }; retryAfter?: number };
  const isRateLimit =
    e.code === 'slack_webapi_rate_limited_error' ||
    e.data?.error === 'ratelimited' ||
    e.data?.error === 'rate_limited';
  if (!isRateLimit) return null;
  const retryAfter = typeof e.retryAfter === 'number' && Number.isFinite(e.retryAfter) ? e.retryAfter : 1;
  return Math.max(1, retryAfter);
}

/**
 * Pull the Slack-specific error code out of whatever Bolt surfaces. Bolt
 * wraps web-api errors with the platform error under err.data.error; some
 * code paths surface it as err.code directly. F14 MED helper.
 */
function extractSlackErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { code?: string; data?: { error?: string }; original?: { data?: { error?: string } } };
  if (typeof e.data?.error === 'string') return e.data.error;
  if (typeof e.original?.data?.error === 'string') return e.original.data.error;
  if (typeof e.code === 'string') return e.code;
  return null;
}
