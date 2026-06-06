/**
 * Portions of this file are derived from OpenClaw's discord extension
 *   https://github.com/openclaw/openclaw  (extensions/discord/src/client.ts,
 *   monitor.gateway.ts, send.ts, send.reactions.ts, send.typing.ts,
 *   accounts.ts, api.ts) pinned at aee2681ab1eff720f3ca8a2cb9ecbab5faff84f2.
 *   Copyright OpenClaw contributors, licensed under the MIT License.
 *
 * @license
 * Copyright 2026 Ferrox Labs
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
 * DiscordPlugin - Discord Bot integration for Wayland's Channels subsystem.
 *
 * Transport: Gateway WebSocket via discord.js v14. We do not register an
 * Events API webhook in Phase 1 - Discord's Gateway already covers DMs,
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
  // F-15: set true on shardDisconnect; cleared on shardResume (session
  // intact, no events lost) or shardReady-after-degraded (session-loss
  // reconnect - events during the gap ARE lost; surfaced as a warning).
  private gatewayDegraded = false;
  // F-12: surface backpressure from discord.js's internal REST queue. The
  // library queues 429-bound requests transparently which makes the agent
  // appear to hang under fan-out load; we count + log instead of silently
  // swallowing the signal.
  private rateLimitEvents = 0;
  private lastRateLimitAt: number | null = null;

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
    // discord.js does not connect on construction - we hold the client and
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
    const params = toDiscordSendParams(message);
    const chunks = splitMessage(params.content, DISCORD_MESSAGE_LIMIT);

    // F-11: return the FIRST chunk's id so streaming-edit consumers can
    // anchor on the message they intend to update. Returning the last id
    // (previous behaviour) orphaned every earlier chunk on subsequent edits.
    // F-9: reply pointer + mention allowlist apply only to the first chunk;
    // follow-ups are plain content so they don't re-quote the parent.
    const send = (channel as TextBasedChannel & {
      send: (payload: string | { content: string; messageReference?: { messageId: string }; allowedMentions?: unknown }) => Promise<DiscordMessage>;
    }).send.bind(channel);

    let firstId = '';
    let isFirst = true;
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const payload = isFirst
        ? {
            content: chunk,
            ...(params.messageReference ? { messageReference: params.messageReference } : {}),
            ...(params.allowedMentions ? { allowedMentions: params.allowedMentions } : {}),
          }
        : { content: chunk };
      const sent = await send(payload);
      if (isFirst) {
        firstId = sent.id;
        isFirst = false;
      }
    }
    return firstId;
  }

  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.client) throw new Error('Discord client not initialized');

    const channel = await this.fetchTextChannel(chatId);
    const existing = await (
      channel as TextBasedChannel & { messages: { fetch: (id: string) => Promise<DiscordMessage> } }
    ).messages.fetch(messageId);
    const { content } = toDiscordSendParams(message);

    if (!content.trim()) return;

    if (content.length <= DISCORD_MESSAGE_LIMIT) {
      if (existing.content === content) return; // Discord rejects no-op edits.
      await existing.edit(content);
      return;
    }

    // F-10: content overflowed mid-edit. Previous behaviour was to silently
    // `slice(0, LIMIT-3) + '...'` and drop the rest - streaming demos showed
    // only the tail growing and users saw no signal of the truncation. New
    // behaviour: edit the anchor with the first chunk, then post the
    // remainder as follow-up messages so the entire payload reaches the
    // user. Streaming-edit consumers should re-anchor on the id from
    // `sendMessage` for steady-state edits; this path is the unbounded-
    // growth fallback.
    const chunks = splitMessage(content, DISCORD_MESSAGE_LIMIT);
    if (existing.content !== chunks[0]) {
      await existing.edit(chunks[0]);
    }
    const send = (channel as TextBasedChannel & { send: (c: string) => Promise<DiscordMessage> }).send.bind(channel);
    for (let i = 1; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      if (!chunk.trim()) continue;
      await send(chunk);
    }
    console.warn(
      `[DiscordPlugin] editMessage overflowed ${DISCORD_MESSAGE_LIMIT} chars (${content.length}); split into ${chunks.length} chunks (1 edit + ${chunks.length - 1} follow-up).`,
    );
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
      // F-7: previous rule (`if (msg.author?.bot) return`) blanket-dropped
      // every bot author and silently hid webhook re-posters like PluralKit
      // / NQN / Tupperbox that deliver real user content via the bot flag.
      // Narrower rule: only ignore our own bot account; let other bots and
      // webhook reposters flow through so PluralKit users are visible.
      if (msg.author?.id && msg.author.id === this.client?.user?.id) return;
      const userId = msg.author?.id;
      if (userId) this.activeUsers.add(userId);

      const unified = toUnifiedIncomingMessage(msg);
      if (!unified) return;
      // Fire-and-forget - discord.js handlers are sync; awaiting would block
      // subsequent event delivery from the Gateway shard.
      void this.emitMessage(unified).catch((err) =>
        console.error('[DiscordPlugin] messageCreate handler failed:', err),
      );
    });

    // F-6 (DEFERRED): no `interactionCreate` listener - slash commands,
    // buttons, and modal submits flow into the bot but are dropped. The
    // Ed25519 verifier exists for the HTTP interactions endpoint, but the
    // Gateway-side dispatch surface (component registry, custom-id router,
    // 3-second deferred-response plumbing - see F-16) is unimplemented.
    // Wiring it is a multi-file feature (registry + dispatcher + outbound
    // deferred-response + capability flag), out of scope for this audit-
    // fix pass. Reference: OpenClaw `interactive-dispatch.ts` +
    // `components-registry.ts`. TODO(channels): wire interactionCreate when
    // slash/button capability lands in IPluginCapabilities.

    this.client.on('error', (err) => {
      console.error('[DiscordPlugin] Gateway error:', err);
      this.setError(err.message);
    });

    this.client.on('shardDisconnect', (event, shardId) => {
      console.warn(`[DiscordPlugin] Shard ${shardId} disconnected (code=${event.code})`);
      // F-15: mark the connection degraded so the next reconnect path can
      // distinguish session-resumed (no data loss) from session-lost.
      this.gatewayDegraded = true;
    });

    this.client.on('shardReconnecting', (shardId) => {
      this.reconnectAttempts += 1;
      console.log(
        `[DiscordPlugin] Shard ${shardId} reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );
      // F-14: previously the counter was decorative - discord.js retries
      // forever and once attempts >10 the log read `(11/10)` with no
      // action. Enforce the cap: tear down the client and surface an error
      // so the user sees a real failure rather than an infinite silent
      // retry loop.
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error(
          `[DiscordPlugin] Shard ${shardId} exceeded max reconnect attempts (${this.maxReconnectAttempts}); destroying client.`,
        );
        this.setError(
          `Discord Gateway failed to reconnect after ${this.maxReconnectAttempts} attempts. Check network connectivity and Discord status, then restart the plugin.`,
        );
        void this.client?.destroy().catch((): void => undefined);
        this.client = null;
      }
    });

    this.client.on('shardResume', (shardId, replayedEvents) => {
      // F-15: shardResume = session intact; `replayedEvents` is the count
      // Discord buffered for us. No data loss; clear degraded.
      console.log(
        `[DiscordPlugin] Shard ${shardId} resumed (replayed ${replayedEvents ?? 0} events)`,
      );
      this.reconnectAttempts = 0;
      this.gatewayDegraded = false;
    });

    this.client.on('shardReady', (shardId) => {
      // F-15: a fresh READY (not RESUME) while degraded means session-loss
      // reconnect - events that fired during the disconnect window are
      // gone. discord.js also emits shardReady on initial boot, but
      // gatewayDegraded is false then, so the warning fires only on actual
      // session-loss reconnect.
      if (this.gatewayDegraded) {
        console.warn(
          `[DiscordPlugin] Shard ${shardId} reconnected with a NEW session - events during the disconnect window were lost.`,
        );
        this.gatewayDegraded = false;
      }
      this.reconnectAttempts = 0;
    });

    // F-13: Discord emits `invalidated` when the Gateway permanently rejects
    // our session - most commonly because an admin reset the bot token in the
    // Developer Portal. discord.js will NOT auto-recover from this; the
    // WebSocket stays closed and no further events fire. Surface an
    // actionable error so the UI can prompt for a fresh token instead of
    // showing a silently-dead bot.
    this.client.on('invalidated', () => {
      console.error('[DiscordPlugin] Gateway session invalidated (token reset or revoked)');
      this.botUser = null;
      // setStatus (not setError) so external consumers polling `.status`
      // transition out of `running` - setError alone only records the
      // message and the plugin appears live.
      this.setStatus(
        'error',
        'Discord session invalidated - the bot token was reset or revoked. Stop the plugin, paste the new token from the Developer Portal, and start again.',
      );
      // Best-effort cleanup; discord.js has already closed the WS.
      void this.client?.destroy().catch((): void => undefined);
      this.client = null;
    });

    // F-12: surface 429 backpressure. discord.js v14 emits `rateLimited` on
    // the REST manager whenever a route hits its bucket; logging it gives
    // the operator a visible signal before the queue depth turns into
    // user-perceived hang.
    const rest = (this.client as Client & {
      rest?: { on?: (event: string, handler: (info: unknown) => void) => void };
    }).rest;
    if (rest && typeof rest.on === 'function') {
      rest.on('rateLimited', (info) => {
        this.rateLimitEvents += 1;
        this.lastRateLimitAt = Date.now();
        const detail = info as {
          route?: string;
          method?: string;
          timeToReset?: number;
          global?: boolean;
        } | undefined;
        const route = detail?.route ?? 'unknown';
        const method = detail?.method ?? 'unknown';
        const wait = detail?.timeToReset ?? 0;
        const scope = detail?.global ? 'GLOBAL' : 'route';
        console.warn(
          `[DiscordPlugin] Rate-limited (${scope}) ${method} ${route} - waiting ${wait}ms (event #${this.rateLimitEvents})`,
        );
      });
    }
  }

  /** F-12: observability hook for tests + operator telemetry. */
  getRateLimitStats(): { events: number; lastAt: number | null } {
    return { events: this.rateLimitEvents, lastAt: this.lastRateLimitAt };
  }

  // ==================== Static ====================

  /**
   * Validate a bot token by booting a transient Client, logging in, and
   * destroying it. discord.js exposes no `getMe` equivalent, so the cheapest
   * connectivity probe is a real login.
   *
   * F-1/F-4: the probe MUST request the same privileged intents the
   * production plugin requests (MessageContent + GuildMembers). A Guilds-only
   * probe lies about real start-up viability: it succeeds for any valid
   * token, then the production client crashes on `Used disallowed intents`
   * because the user never toggled the privileged intents in the Developer
   * Portal. Aligning the intent set turns "Test & Enable" into a truthful
   * gate.
   */
  static async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let probe: Client | null = null;
    try {
      probe = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMembers, // privileged
          GatewayIntentBits.MessageContent, // privileged
        ],
      });
      await probe.login(token);
      const username = probe.user?.username;
      return { success: true, botUsername: username };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      // discord.js raises `Used disallowed intents` (close code 4014) when
      // the bot requests a privileged intent the Developer Portal hasn't
      // enabled. Translate to an actionable message instead of leaking the
      // raw library string.
      if (lower.includes('disallowed intents') || lower.includes('4014')) {
        return {
          success: false,
          error:
            'Privileged intents not enabled. Open the Discord Developer Portal → your app → Bot → Privileged Gateway Intents, and turn on both "Message Content Intent" and "Server Members Intent", then retry.',
        };
      }
      // discord.js wraps invalid tokens in a generic TokenInvalid error -
      // surface a user-friendly message rather than the stack-y default.
      if (lower.includes('token')) {
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
