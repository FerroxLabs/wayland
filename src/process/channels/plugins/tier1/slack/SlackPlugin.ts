/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

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
  SLACK_MESSAGE_LIMIT,
  splitSlackMessage,
  toSlackSendParams,
  toUnifiedIncomingMessage,
} from './SlackAdapter';

/**
 * Transport selection. Socket Mode is the default: a WebSocket connection
 * Slack initiates outbound, so no public webhook URL is required. Events API
 * is the alternative for users with a stable HTTPS endpoint and a signing
 * secret — Bolt's HTTPReceiver verifies the X-Slack-Signature HMAC.
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
 * SlackPlugin — In-process Bolt integration covering both Socket Mode and
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
    // For Events API transport the receiver doesn't bind a port itself —
    // inbound deliveries arrive via handleWebhookPayload() from Wayland's
    // shared WebhookReceiver. Bolt's processEvent dispatches them through
    // the registered listeners.
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
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.resolvedBotInfo) return null;
    return {
      id: this.resolvedBotInfo.userId,
      ...(this.resolvedBotInfo.user ? { username: this.resolvedBotInfo.user } : {}),
      displayName: this.resolvedBotInfo.team ?? this.resolvedBotInfo.user ?? 'Slack Bot',
    };
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    const { text, blocks, thread_ts } = toSlackSendParams(message);
    const chunks = splitSlackMessage(text, SLACK_MESSAGE_LIMIT);
    let lastTs = '';
    for (let i = 0; i < chunks.length; i += 1) {
      const isLast = i === chunks.length - 1;
      const params: Parameters<WebClient['chat']['postMessage']>[0] = {
        channel: chatId,
        text: chunks[i] || (blocks && isLast ? buildSlackBlocksFallbackText(blocks) : ' '),
        ...(thread_ts ? { thread_ts } : {}),
        ...(isLast && blocks ? { blocks } : {}),
      };
      const result = await this.webClient.chat.postMessage(params);
      const ts = typeof result.ts === 'string' ? result.ts : '';
      if (ts) lastTs = ts;
    }
    return lastTs;
  }

  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.webClient) throw new Error('Slack web client not initialized');
    const { text, blocks } = toSlackSendParams(message);
    const trimmed = text.trim();
    if (!trimmed && !blocks) return;
    await this.webClient.chat.update({
      channel: chatId,
      ts: messageId,
      text: trimmed || (blocks ? buildSlackBlocksFallbackText(blocks) : ' '),
      ...(blocks ? { blocks } : {}),
    });
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
    // url_verification: Slack pings the endpoint with a challenge on setup.
    // The shared WebhookReceiver replies on our behalf, so we just no-op here.
    const body = payload as { type?: string; event?: unknown };
    if (body?.type === 'url_verification') return;

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
      if (event.user) this.activeUsers.add(event.user);
      if (this.messageHandler) {
        await this.messageHandler(unified).catch((err) =>
          console.error('[SlackPlugin] message handler error:', err),
        );
      }
    });

    // Slash commands — Bolt normalizes them across both transports.
    this.app.command(/.*/, async ({ command, ack }) => {
      await ack();
      if (command.user_id) this.activeUsers.add(command.user_id);
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
      const channelId = (body as { channel?: { id?: string } }).channel?.id ?? userId;
      this.activeUsers.add(userId);
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
      this.activeUsers.add(userId);
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
    });
  }

  /**
   * Validate a Slack bot token by calling auth.test. Used by the settings
   * test-connection flow before persisting credentials.
   */
  static async testConnection(
    botToken: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    try {
      const client = new WebClient(botToken);
      const auth = await client.auth.test();
      if (typeof auth.user_id !== 'string') {
        return { success: false, error: 'auth.test returned no user_id' };
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
