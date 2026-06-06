/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Twitch channel plugin via tmi.js (IRC-over-WebSocket).
 * Joins configured channels, listens for PRIVMSG, emits unified messages.
 * Outbound sends via client.say() with 500-char chunking.
 *
 * Reconnect backoff: 5s → 60s, max 5 attempts then status='error'.
 * Capabilities: text only - no edit, no reactions, no typing indicator.
 *
 * Adapted from openclaw/extensions/twitch/src/monitor.ts and probe.ts (MIT).
 */

// tmi.js v1 ships no bundled type declarations; we use our own TmiClientLike
// interface below and cast through `unknown` at the construction sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TmiOptions = any;

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  fromUnifiedOutgoingToTwitch,
  normalizeTwitchChannel,
  normalizeTwitchToken,
  toUnifiedIncomingFromTwitch,
} from './TwitchAdapter';

// Reconnect backoff - mirrors IrcPlugin and MatrixPlugin.
const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_CAP_MS = 60_000;
const RECONNECT_BACKOFF_MAX_ATTEMPTS = 5;

// testConnection: wait up to 10s for GLOBALUSERSTATE (successful OAuth login).
const TEST_CONNECT_TIMEOUT_MS = 10_000;

type TwitchCreds = {
  botUsername: string;
  oauthToken: string; // bare token, no "oauth:" prefix required
  channels: string[]; // channel names to join (normalised on use)
  // Optional OAuth refresh-token flow. When all three are present the plugin
  // mints a fresh access token before each connect and schedules a refresh at
  // expires_in - 300s. When any are absent we fall back to the static
  // oauthToken (legacy / twitchtokengenerator.com path).
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
};

const TWITCH_TOKEN_ENDPOINT = 'https://id.twitch.tv/oauth2/token';
const TOKEN_REFRESH_LEAD_MS = 300_000; // refresh 5 min before expiry

type RefreshedToken = {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
};

/**
 * Minimal subset of the tmi.js Client we touch. Declared here so unit tests
 * can swap it with a hand-rolled EventEmitter without depending on tmi internals.
 */
export type TmiClientLike = {
  connect(): Promise<[string, number]>;
  disconnect(): Promise<[string, number]>;
  say(channel: string, message: string): Promise<[string]>;
  on(event: string, listener: (...args: unknown[]) => void): TmiClientLike;
  removeAllListeners(event?: string): void;
  readyState(): string;
};

export class TwitchPlugin extends BasePlugin {
  readonly type: PluginType = 'twitch';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private client: TmiClientLike | null = null;
  private creds: TwitchCreds | null = null;
  private reconnectFailureCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  // F-1: OAuth refresh-token state. activeToken is the bearer used by tmi.js
  // (preferring the refreshed access token over the static oauthToken).
  private activeToken: string | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private currentRefreshToken: string | null = null;
  // F-5: chatter set per channel (tmi.js membership-state events).
  private chattersByChannel: Map<string, Set<string>> = new Map();

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    this.creds = resolveCreds(config.credentials ?? {});
  }

  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('Twitch plugin not initialized');
    this.stopped = false;
    this.reconnectFailureCount = 0;
    await this.connectAndListen();
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.client) {
      try {
        this.client.removeAllListeners();
        await this.client.disconnect();
      } catch {
        // ignore disconnect errors during teardown
      }
      this.client = null;
    }
    this.reconnectFailureCount = 0;
    this.activeToken = null;
    this.currentRefreshToken = null;
    this.chattersByChannel.clear();
  }

  /**
   * F-5: Sum of unique chatters across all joined channels.
   * Returns 0 if Twitch's membership state isn't being delivered - this is
   * Twitch's documented default; join/part events on IRC are gated by the
   * cap-membership capability which tmi.js does not request. We still
   * maintain the Set if events do arrive (some hosts deliver them).
   */
  getActiveUserCount(): number {
    let total = 0;
    for (const set of this.chattersByChannel.values()) total += set.size;
    return total;
  }

  getBotInfo(): BotInfo | null {
    if (!this.creds || !this.client) return null;
    return {
      id: this.creds.botUsername,
      username: this.creds.botUsername,
      displayName: this.creds.botUsername,
    };
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) throw new Error('Twitch client not connected');
    const { lines } = fromUnifiedOutgoingToTwitch(message);
    if (lines.length === 0) return '';
    const channel = normalizeTwitchChannel(chatId);
    for (const line of lines) {
      await this.client.say(channel, line);
    }
    // tmi.js say() does not return a server-assigned message id.
    return `twitch:${channel}:${Date.now()}`;
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('Twitch uses a persistent IRC/WebSocket connection, not webhooks');
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private async connectAndListen(): Promise<void> {
    if (!this.creds) throw new Error('Twitch plugin not initialized');
    const creds = this.creds;

    // F-1: If refresh-token creds are present, mint a fresh access token
    // before connecting. Otherwise use the static oauthToken (legacy path).
    if (creds.clientId && creds.clientSecret && (this.currentRefreshToken ?? creds.refreshToken)) {
      try {
        const refreshed = await refreshTwitchAccessToken({
          clientId: creds.clientId,
          clientSecret: creds.clientSecret,
          refreshToken: this.currentRefreshToken ?? creds.refreshToken ?? '',
        });
        this.activeToken = refreshed.accessToken;
        this.currentRefreshToken = refreshed.refreshToken;
        this.scheduleTokenRefresh(refreshed.expiresInSec);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Twitch token refresh failed: ${message}`, { cause: err });
      }
    } else {
      this.activeToken = normalizeTwitchToken(creds.oauthToken);
    }

    // Import tmi.js lazily so unit tests can mock it via vi.mock before the
    // module loads. tmi.js v1 is CJS with no bundled types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type TmiModule = { default: new (opts: TmiOptions) => any };
    // @ts-expect-error - tmi.js v1 ships no type declarations
    const tmi = (await import('tmi.js')) as TmiModule;
    const TmiClientCtor = tmi.default;

    const opts: TmiOptions = {
      identity: {
        username: creds.botUsername,
        password: this.activeToken,
      },
      channels: creds.channels.map(normalizeTwitchChannel).filter(Boolean),
      connection: {
        reconnect: false, // we own the reconnect state machine
        secure: true,
      },
      logger: {
        info: (): void => undefined,
        warn: (msg: string): void => { console.warn('[TwitchPlugin:tmi]', msg); },
        error: (msg: string): void => { console.error('[TwitchPlugin:tmi]', msg); },
      },
    };

    const client = new TmiClientCtor(opts) as unknown as TmiClientLike;

    // F-2: Wire disconnect BEFORE connect so a pre-welcome close fires.
    // Inspect reason to fast-fail on auth errors instead of burning the
    // full 5-attempt backoff on an unrecoverable token.
    client.on('disconnected', (reason: unknown) => {
      if (this.stopped) return;
      if (this.client !== client) return;
      const reasonStr = typeof reason === 'string' ? reason : String(reason);
      if (/Login authentication failed/i.test(reasonStr) || /\bauth\b/i.test(reasonStr)) {
        console.error('[TwitchPlugin] auth failure - not reconnecting:', reasonStr);
        // Tear down dead client without scheduling another attempt.
        this.client = null;
        try {
          client.removeAllListeners();
          void client.disconnect();
        } catch {
          // ignore
        }
        this.setStatus(
          'error',
          'Token invalid or expired - re-generate at twitchtokengenerator.com',
        );
        return;
      }
      console.warn('[TwitchPlugin] disconnected:', reasonStr, '- scheduling reconnect');
      this.scheduleReconnect();
    });

    client.on('message', (channel: unknown, userstate: unknown, message: unknown, self: unknown) => {
      const unified = toUnifiedIncomingFromTwitch({
        channel: channel as string,
        userstate: userstate as Parameters<typeof toUnifiedIncomingFromTwitch>[0]['userstate'],
        message: message as string,
        self: self as boolean,
      });
      if (!unified) return;
      void this.emitMessage(unified).catch((err) =>
        console.error('[TwitchPlugin] emitMessage failed:', err),
      );
    });

    // F-4: Surface send rejections from Twitch NOTICE. tmi.js's say() does
    // not reject when the server filters a message - it only resolves on
    // socket-send. NOTICE is the only signal.
    client.on('notice', (channel: unknown, msgid: unknown, message: unknown) => {
      const id = typeof msgid === 'string' ? msgid : String(msgid);
      const rejectionIds = new Set([
        'msg_slowmode',
        'msg_subsonly',
        'msg_followersonly',
        'msg_followersonly_followed',
        'msg_followersonly_zero',
        'msg_r9k',
        'msg_banned',
        'msg_channel_suspended',
        'msg_duplicate',
        'msg_emoteonly',
        'msg_ratelimit',
        'msg_timedout',
        'msg_verified_email',
        'no_permission',
      ]);
      if (!rejectionIds.has(id)) return;
      const text = typeof message === 'string' ? message : String(message);
      const ch = typeof channel === 'string' ? channel : String(channel);
      console.warn(`[TwitchPlugin] send rejected on ${ch} (${id}): ${text}`);
      // Surface via status without changing the connection state - connection
      // is still healthy, the message was just filtered.
      this.setError(`Twitch send rejected on ${ch}: ${id}`);
    });

    // F-5: Track chatters via join/part when membership state is delivered.
    // Twitch IRC gates these on the cap-membership capability; tmi.js does
    // not request it by default, so on many servers these events never fire.
    // We wire the handler anyway - it's cheap and graceful when absent.
    client.on('join', (channel: unknown, username: unknown, self: unknown) => {
      if (self === true) return;
      const ch = normalizeTwitchChannel(typeof channel === 'string' ? channel : String(channel));
      const user = typeof username === 'string' ? username.toLowerCase() : '';
      if (!ch || !user) return;
      let set = this.chattersByChannel.get(ch);
      if (!set) {
        set = new Set();
        this.chattersByChannel.set(ch, set);
      }
      set.add(user);
    });
    client.on('part', (channel: unknown, username: unknown, self: unknown) => {
      if (self === true) {
        this.chattersByChannel.delete(
          normalizeTwitchChannel(typeof channel === 'string' ? channel : String(channel)),
        );
        return;
      }
      const ch = normalizeTwitchChannel(typeof channel === 'string' ? channel : String(channel));
      const user = typeof username === 'string' ? username.toLowerCase() : '';
      const set = this.chattersByChannel.get(ch);
      if (set && user) set.delete(user);
    });

    try {
      await client.connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Twitch connect failed: ${message}`, { cause: err });
    }

    // Connected - reset backoff and store client reference.
    this.reconnectFailureCount = 0;
    this.client = client;
  }

  /**
   * F-1: Schedule a token refresh at expires_in - 300s. On refresh we tear
   * down the current tmi.js client and reconnect with the new access token.
   */
  private scheduleTokenRefresh(expiresInSec: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const delay = Math.max(60_000, expiresInSec * 1000 - TOKEN_REFRESH_LEAD_MS);
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      if (this.stopped) return;
      console.warn('[TwitchPlugin] refreshing access token + reconnecting');
      // Tear down + reconnect - connectAndListen will mint the new token.
      const dead = this.client;
      this.client = null;
      if (dead) {
        try {
          dead.removeAllListeners();
          void dead.disconnect();
        } catch {
          // ignore
        }
      }
      void this.connectAndListen().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[TwitchPlugin] token-refresh reconnect failed:', message);
        if (!this.stopped) this.scheduleReconnect();
      });
    }, delay);
  }

  /**
   * Schedule a reconnect with exponential backoff. After
   * RECONNECT_BACKOFF_MAX_ATTEMPTS failures, give up and set status='error'.
   * Mirrors IrcPlugin.scheduleReconnect().
   */
  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return; // already scheduled

    // Tear down dead client.
    const dead = this.client;
    this.client = null;
    if (dead) {
      try {
        dead.removeAllListeners();
        void dead.disconnect();
      } catch {
        // ignore
      }
    }

    this.reconnectFailureCount += 1;
    if (this.reconnectFailureCount > RECONNECT_BACKOFF_MAX_ATTEMPTS) {
      const reason = `Twitch disconnected after ${RECONNECT_BACKOFF_MAX_ATTEMPTS} reconnect attempts`;
      console.error(`[TwitchPlugin] ${reason}; giving up`);
      this.setStatus('error', reason);
      return;
    }

    // Audit gemini MED1 2026-05-18: jitter (0-1000ms) to avoid synchronized
    // chat reconnects during Twitch IRC server hiccups.
    const delay = Math.min(
      RECONNECT_BACKOFF_START_MS * 2 ** (this.reconnectFailureCount - 1),
      RECONNECT_BACKOFF_CAP_MS,
    ) + Math.floor(Math.random() * 1000);
    console.warn(
      `[TwitchPlugin] reconnect attempt ${this.reconnectFailureCount}/${RECONNECT_BACKOFF_MAX_ATTEMPTS} in ${delay}ms`,
    );
    this.setError(`Twitch disconnected; retrying in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      void this.connectAndListen().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[TwitchPlugin] reconnect attempt failed:', message);
        if (!this.stopped) this.scheduleReconnect();
      });
    }, delay);
  }

  // ── Static ──────────────────────────────────────────────────────────────────

  /**
   * Validate credentials by connecting via tmi.js and waiting for the
   * GLOBALUSERSTATE event (indicates successful OAuth authentication) within
   * TEST_CONNECT_TIMEOUT_MS, then disconnecting.
   *
   * The token argument is a JSON-encoded TwitchCreds blob from the renderer.
   * Adapted from openclaw/extensions/twitch/src/probe.ts (MIT).
   */
  static override async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(token) as Record<string, unknown>;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }

    let creds: TwitchCreds;
    try {
      creds = resolveCreds(parsed);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type TmiModule2 = { default: new (opts: TmiOptions) => any };
    // @ts-expect-error - tmi.js v1 ships no type declarations
    const tmi = (await import('tmi.js')) as TmiModule2;
    const TmiClientCtor = tmi.default;

    const opts: TmiOptions = {
      identity: {
        username: creds.botUsername,
        password: normalizeTwitchToken(creds.oauthToken),
      },
      channels: [],
      connection: {
        reconnect: false,
        secure: true,
      },
      logger: {
        info: (): void => undefined,
        warn: (): void => undefined,
        error: (): void => undefined,
      },
    };

    const client = new TmiClientCtor(opts) as unknown as TmiClientLike;

    return new Promise<{ success: boolean; botUsername?: string; error?: string }>((resolve) => {
      let settled = false;

      const settle = (result: { success: boolean; botUsername?: string; error?: string }): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        client.removeAllListeners();
        void client.disconnect().catch((): undefined => undefined);
        resolve(result);
      };

      const timer = setTimeout(() => {
        settle({ success: false, error: `Twitch connect timed out after ${TEST_CONNECT_TIMEOUT_MS}ms` });
      }, TEST_CONNECT_TIMEOUT_MS);

      // GLOBALUSERSTATE fires after successful OAuth login on Twitch IRC.
      client.on('globaluserstate', () => {
        settle({ success: true, botUsername: creds.botUsername });
      });

      // connected fires when the TCP/WebSocket link is up but before auth.
      // If globaluserstate follows, we resolve there. If auth fails, we get
      // 'disconnected' instead.
      client.on('disconnected', (reason: unknown) => {
        settle({ success: false, error: String(reason) });
      });

      client.connect().catch((err: unknown) => {
        settle({ success: false, error: err instanceof Error ? err.message : String(err) });
      });
    });
  }
}

// ── Credential resolution ─────────────────────────────────────────────────────

function resolveCreds(raw: Record<string, unknown>): TwitchCreds {
  const botUsername = readString(raw['botUsername'] ?? raw['username']);
  if (!botUsername) throw new Error('Twitch botUsername is required');

  const oauthToken = readString(raw['oauthToken'] ?? raw['accessToken'] ?? raw['token']);
  if (!oauthToken) throw new Error('Twitch OAuth token is required');

  const rawChannels = raw['channels'];
  let channels: string[] = [];
  if (typeof rawChannels === 'string') {
    channels = rawChannels
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  } else if (Array.isArray(rawChannels)) {
    channels = (rawChannels as unknown[]).map(String).filter(Boolean);
  }

  // F-1: optional refresh-token flow. All three must be present to opt in.
  const clientId = readString(raw['clientId']);
  const clientSecret = readString(raw['clientSecret']);
  const refreshToken = readString(raw['refreshToken']);

  const result: TwitchCreds = { botUsername, oauthToken, channels };
  if (clientId && clientSecret && refreshToken) {
    result.clientId = clientId;
    result.clientSecret = clientSecret;
    result.refreshToken = refreshToken;
  }
  return result;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * F-1: Exchange a refresh token for a fresh access token via Twitch OAuth.
 * Exported for unit tests.
 *
 * See https://dev.twitch.tv/docs/authentication/refresh-tokens/
 */
export async function refreshTwitchAccessToken(args: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fetchImpl?: typeof fetch;
}): Promise<RefreshedToken> {
  const fetchFn = args.fetchImpl ?? fetch;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: args.refreshToken,
    client_id: args.clientId,
    client_secret: args.clientSecret,
  });
  const res = await fetchFn(TWITCH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch((): string => '');
    throw new Error(`Twitch token endpoint ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!json.access_token || typeof json.expires_in !== 'number') {
    throw new Error('Twitch token endpoint returned malformed response');
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? args.refreshToken,
    expiresInSec: json.expires_in,
  };
}
