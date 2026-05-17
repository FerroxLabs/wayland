/**
 * Portions of this file are derived from OpenClaw's discord extension
 *   https://github.com/openclaw/openclaw  (extensions/discord/src/client.ts,
 *   monitor.gateway.ts, send.ts, send.reactions.ts, send.typing.ts,
 *   accounts.ts, api.ts) pinned at aee2681ab1eff720f3ca8a2cb9ecbab5faff84f2.
 *   Copyright OpenClaw contributors, licensed under the MIT License.
 *
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Client,
  GatewayIntentBits,
  Partials,
  type Message as DiscordMessage,
  type TextBasedChannel,
} from 'discord.js';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  DISCORD_MESSAGE_LIMIT,
  splitMessage,
  toDiscordSendParams,
  toUnifiedIncomingMessage,
} from './DiscordAdapter';
import { sendTyping } from './DiscordActions';

/**
 * DiscordPlugin — Discord Bot integration for Wayland's Channels subsystem.
 *
 * Transport: Gateway WebSocket via discord.js v14. We do not register an
 * Events API webhook in Phase 1 — Discord's Gateway already covers DMs,
 * guild messages, reactions, and interaction events without a public URL.
 *
 * Capability surface: full streaming (edit-in-place), reactions, and typing
 * indicators. Moderation, presence, and voice actions live in DiscordActions
 * and are invoked by the ActionExecutor via getClient().
 */
export class DiscordPlugin extends BasePlugin {
  readonly type: PluginType = 'discord';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: true,
    canReact: true,
    canTypingIndicator: true,
  };

  private client: Client | null = null;
  private botUser: { id: string; username: string; globalName: string | null } | null = null;
  private activeUsers: Set<string> = new Set();
  private readonly maxReconnectAttempts = 10;
  private reconnectAttempts = 0;

  /**
   * Resolve a config + return the bot token. Throws when missing so the
   * BasePlugin lifecycle transitions to `error` rather than booting a
   * Gateway connection with a null token.
   */
  private requireToken(config: IChannelPluginConfig): string {
    const token = config.credentials?.botToken;
    if (!token || typeof token !== 'string') {
      throw new Error('Discord bot token is required (credentials.botToken)');
    }
    return token;
  }

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const token = this.requireToken(config);

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
    });

    this.setupHandlers();
    // discord.js does not connect on construction — we hold the client and
    // only `client.login(token)` in onStart so failed starts don't leak a
    // half-open Gateway socket.
    (this.client as Client & { __waylandToken?: string }).__waylandToken = token;
  }

  protected async onStart(): Promise<void> {
    if (!this.client) {
      throw new Error('Discord client not initialized');
    }
    const token = (this.client as Client & { __waylandToken?: string }).__waylandToken;
    if (!token) {
      throw new Error('Discord token missing from cached client');
    }

    try {
      await this.client.login(token);
      // login() resolves after READY; client.user is populated.
      if (this.client.user) {
        this.botUser = {
          id: this.client.user.id,
          username: this.client.user.username,
          globalName: this.client.user.globalName ?? null,
        };
      }
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('[DiscordPlugin] Failed to start:', error);
      throw error;
    }
  }

  protected async onStop(): Promise<void> {
    if (!this.client) return;
    try {
      // destroy() closes the Gateway WebSocket and clears all event listeners.
      await this.client.destroy();
    } catch (error) {
      console.warn('[DiscordPlugin] Error during client destroy (ignored):', error);
    } finally {
      this.client = null;
      this.botUser = null;
      this.activeUsers.clear();
      this.reconnectAttempts = 0;
    }
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.botUser) return null;
    return {
      id: this.botUser.id,
      username: this.botUser.username,
      displayName: this.botUser.globalName ?? this.botUser.username,
    };
  }

  /**
   * Expose the underlying discord.js Client for moderation/voice helpers in
   * DiscordActions. Null until onStart resolves.
   */
  getClient(): Client | null {
    return this.client;
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) throw new Error('Discord client not initialized');

    const channel = await this.fetchTextChannel(chatId);
    const { content } = toDiscordSendParams(message);
    const chunks = splitMessage(content, DISCORD_MESSAGE_LIMIT);
    let lastId = '';
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const sent = await (channel as TextBasedChannel & { send: (c: string) => Promise<DiscordMessage> }).send(chunk);
      lastId = sent.id;
    }
    return lastId;
  }

  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.client) throw new Error('Discord client not initialized');

    const channel = await this.fetchTextChannel(chatId);
    const existing = await (
      channel as TextBasedChannel & { messages: { fetch: (id: string) => Promise<DiscordMessage> } }
    ).messages.fetch(messageId);
    const { content } = toDiscordSendParams(message);
    const truncated = content.length > DISCORD_MESSAGE_LIMIT ? content.slice(0, DISCORD_MESSAGE_LIMIT - 3) + '...' : content;
    if (!truncated.trim()) return;
    if (existing.content === truncated) return; // Discord rejects no-op edits.
    await existing.edit(truncated);
  }

  /**
   * Send a typing indicator. Exposed via capabilities.canTypingIndicator so
   * the ActionExecutor only invokes it when the agent UI requests one.
   */
  async sendTypingIndicator(chatId: string): Promise<void> {
    if (!this.client) return;
    const channel = await this.fetchTextChannel(chatId);
    await sendTyping(channel);
  }

  /**
   * Add a reaction to a message. Discord supports unicode emoji directly and
   * custom emoji as `name:id` strings.
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.client) throw new Error('Discord client not initialized');
    const channel = await this.fetchTextChannel(chatId);
    const msg = await (
      channel as TextBasedChannel & { messages: { fetch: (id: string) => Promise<DiscordMessage> } }
    ).messages.fetch(messageId);
    await msg.react(emoji);
  }

  // ==================== Internal ====================

  private async fetchTextChannel(chatId: string): Promise<TextBasedChannel> {
    if (!this.client) throw new Error('Discord client not initialized');
    const channel = await this.client.channels.fetch(chatId);
    if (!channel) {
      throw new Error(`Discord channel ${chatId} not found`);
    }
    const maybe = channel as TextBasedChannel & { send?: unknown };
    if (typeof maybe.send !== 'function') {
      throw new Error(`Discord channel ${chatId} is not text-based`);
    }
    return channel as TextBasedChannel;
  }

  private setupHandlers(): void {
    if (!this.client) return;

    this.client.on('messageCreate', (msg) => {
      // Ignore self + other bots to prevent loops.
      if (msg.author?.bot) return;
      const userId = msg.author?.id;
      if (userId) this.activeUsers.add(userId);

      const unified = toUnifiedIncomingMessage(msg);
      if (!unified) return;
      // Fire-and-forget — discord.js handlers are sync; awaiting would block
      // subsequent event delivery from the Gateway shard.
      void this.emitMessage(unified).catch((err) =>
        console.error('[DiscordPlugin] messageCreate handler failed:', err),
      );
    });

    this.client.on('error', (err) => {
      console.error('[DiscordPlugin] Gateway error:', err);
      this.setError(err.message);
    });

    this.client.on('shardDisconnect', (event, shardId) => {
      console.warn(`[DiscordPlugin] Shard ${shardId} disconnected (code=${event.code})`);
    });

    this.client.on('shardReconnecting', (shardId) => {
      this.reconnectAttempts += 1;
      console.log(
        `[DiscordPlugin] Shard ${shardId} reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );
    });

    this.client.on('shardResume', (shardId) => {
      console.log(`[DiscordPlugin] Shard ${shardId} resumed`);
      this.reconnectAttempts = 0;
    });
  }

  // ==================== Static ====================

  /**
   * Validate a bot token by booting a transient Client, logging in, and
   * destroying it. discord.js exposes no `getMe` equivalent, so the cheapest
   * connectivity probe is a real login.
   */
  static async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let probe: Client | null = null;
    try {
      probe = new Client({ intents: [GatewayIntentBits.Guilds] });
      await probe.login(token);
      const username = probe.user?.username;
      return { success: true, botUsername: username };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // discord.js wraps invalid tokens in a generic TokenInvalid error — surface
      // a user-friendly message rather than the stack-y default.
      if (message.toLowerCase().includes('token')) {
        return { success: false, error: 'Invalid Discord bot token' };
      }
      return { success: false, error: message };
    } finally {
      if (probe) {
        await probe.destroy().catch((): void => undefined);
      }
    }
  }
}
