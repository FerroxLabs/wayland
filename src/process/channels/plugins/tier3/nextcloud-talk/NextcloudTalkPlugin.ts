/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Nextcloud Talk channel plugin - self-hosted chat via app-password Basic auth + REST.
 *
 * Inbound: long-poll on /ocs/v2.php/apps/spreed/api/v1/chat/{token}?lookIntoFuture=1
 * with X-Chat-Last-Given tracking per room. Each successful poll updates lastKnownId
 * and emits new messages as unified incoming messages.
 *
 * Outbound: POST /ocs/v2.php/apps/spreed/api/v1/chat/{token}
 * Edit:     PUT  /ocs/v2.php/apps/spreed/api/v1/chat/{token}/{messageId}
 * React:    POST /ocs/v2.php/apps/spreed/api/v1/reaction/{token}/{messageId}
 *
 * Reconnect backoff: 5s → 60s, max 5 attempts then status='error'.
 * Capabilities: canEdit=true, canReact=true, canStream=false, canTypingIndicator=false.
 */

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  fromUnifiedOutgoingToNextcloudTalk,
  toUnifiedIncomingFromNextcloudTalk,
  type NextcloudTalkChatMessage,
  type OcsEnvelope,
} from './NextcloudTalkAdapter';

// Reconnect backoff - mirrors EmailImapPlugin and IrcPlugin.
const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_CAP_MS = 60_000;
const RECONNECT_BACKOFF_MAX_ATTEMPTS = 5;

// How long the server should hold the long-poll open (seconds).
// Nextcloud Talk supports up to 30s; we use 20s to give headroom for
// client-side timeouts.
const LONG_POLL_TIMEOUT_S = 20;

// How long we wait for a fetch() call before aborting it.
const FETCH_ABORT_TIMEOUT_MS = (LONG_POLL_TIMEOUT_S + 10) * 1000;

// When the server returns 304 (no new messages), yield for this many ms
// before re-polling. This prevents the loop from burning the event loop
// when fetch() resolves synchronously (e.g. in tests).
const POLL_IDLE_YIELD_MS = 50;

// User-Agent sent with every request.
const WAYLAND_UA = 'Wayland/1.0 (Nextcloud Talk plugin)';

type Creds = {
  serverUrl: string;
  username: string;
  appPassword: string;
};

/**
 * OCS /cloud/user response shape - only fields Wayland reads.
 */
type OcsUserData = {
  id: string;
  displayname?: string;
};

export class NextcloudTalkPlugin extends BasePlugin {
  readonly type: PluginType = 'nextcloud-talk';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: false,
    canReact: true,
    canTypingIndicator: false,
  };

  private creds: Creds | null = null;
  private selfUserId: string | null = null;
  private selfDisplayName: string | null = null;

  // Per-room last-seen message ID (used as X-Chat-Last-Given header).
  private lastKnownIds: Map<string, number> = new Map();

  // Track active long-poll abort controllers so onStop() can cancel them.
  private pollAborts: Map<string, AbortController> = new Map();

  // Room tokens being polled. Populated from config.
  private rooms: string[] = [];

  private stopped = false;
  private reconnectFailureCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly activeUsers: Set<string> = new Set();

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    this.creds = resolveCreds(config.credentials ?? {});

    const rawRooms = config.credentials?.['rooms'];
    if (Array.isArray(rawRooms)) {
      this.rooms = (rawRooms as unknown[]).map(String).filter(Boolean);
    } else if (typeof rawRooms === 'string' && rawRooms.trim()) {
      this.rooms = rawRooms
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
    } else {
      // No rooms configured - we'll still poll a default room if one lands via
      // emitMessage but can't start a poll loop without at least one token.
      this.rooms = [];
    }
  }

  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('Nextcloud Talk plugin not initialized');
    this.stopped = false;
    this.reconnectFailureCount = 0;

    // Confirm identity - mirrors MatrixPlugin.onStart() whoami pattern.
    const me = await this.whoami(this.creds);
    this.selfUserId = me.id;
    this.selfDisplayName = me.displayname ?? me.id;

    // Start a long-poll loop for each configured room.
    for (const token of this.rooms) {
      this.startPollLoop(token);
    }
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;

    // Cancel all in-flight long-polls.
    for (const [, abort] of this.pollAborts) {
      try {
        abort.abort();
      } catch {
        // ignore
      }
    }
    this.pollAborts.clear();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.creds = null;
    this.selfUserId = null;
    this.selfDisplayName = null;
    this.lastKnownIds.clear();
    this.activeUsers.clear();
    this.reconnectFailureCount = 0;
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.selfUserId) return null;
    return {
      id: this.selfUserId,
      username: this.selfUserId,
      displayName: this.selfDisplayName ?? this.selfUserId,
    };
  }

  // ── Outbound ────────────────────────────────────────────────────────────────

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.creds) throw new Error('Nextcloud Talk plugin not started');
    const { chunks, replyTo } = fromUnifiedOutgoingToNextcloudTalk(message);
    if (chunks.length === 0) return '';

    let lastMessageId = '';
    for (const chunk of chunks) {
      const body: Record<string, unknown> = { message: chunk };
      if (replyTo) body['replyTo'] = Number(replyTo);

      const resp = await this.ncFetch(
        `${this.creds.serverUrl}/ocs/v2.php/apps/spreed/api/v1/chat/${chatId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!resp.ok) {
        throw new Error(
          `Nextcloud Talk sendMessage failed: ${resp.status} ${resp.statusText}`,
        );
      }

      const json = (await resp.json()) as OcsEnvelope<NextcloudTalkChatMessage>;
      const id = json?.ocs?.data?.id;
      if (id !== undefined) lastMessageId = String(id);
    }

    return lastMessageId;
  }

  async editMessage(
    chatId: string,
    messageId: string,
    message: IUnifiedOutgoingMessage,
  ): Promise<void> {
    if (!this.creds) throw new Error('Nextcloud Talk plugin not started');
    const text = (message.text ?? '').trim();
    if (!text) return;

    const resp = await this.ncFetch(
      `${this.creds.serverUrl}/ocs/v2.php/apps/spreed/api/v1/chat/${chatId}/${messageId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      },
    );

    if (!resp.ok) {
      throw new Error(
        `Nextcloud Talk editMessage failed: ${resp.status} ${resp.statusText}`,
      );
    }
  }

  /**
   * Add a reaction to a message.
   * POST /ocs/v2.php/apps/spreed/api/v1/reaction/{token}/{messageId}
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.creds) throw new Error('Nextcloud Talk plugin not started');

    const resp = await this.ncFetch(
      `${this.creds.serverUrl}/ocs/v2.php/apps/spreed/api/v1/reaction/${chatId}/${messageId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji }),
      },
    );

    if (!resp.ok) {
      throw new Error(
        `Nextcloud Talk addReaction failed: ${resp.status} ${resp.statusText}`,
      );
    }
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('Nextcloud Talk uses long-polling, not webhooks');
  }

  // ── Long-poll loop ──────────────────────────────────────────────────────────

  /**
   * Long-poll loop for a single room token. Runs continuously until stopped.
   * On error, delegates to the reconnect state machine.
   *
   * A small yield after a 304 response prevents tight-loop spinning when
   * fetch() resolves synchronously (mocked in tests, or extremely fast LAN).
   */
  private startPollLoop(roomToken: string): void {
    void (async () => {
      while (!this.stopped) {
        try {
          const result = await this.pollOnce(roomToken);
          if (result === 'stop') return;
          if (result === 'idle' && !this.stopped) {
            // Yield before the next poll so we don't starve the event loop.
            await new Promise<void>((r) => setTimeout(r, POLL_IDLE_YIELD_MS));
          }
        } catch (err) {
          if (this.stopped) return;
          console.warn(
            `[NextcloudTalkPlugin] poll error for room ${roomToken}:`,
            err,
          );
          // Schedule reconnect and stop this loop. scheduleReconnect will
          // restart all loops when it reconnects.
          this.scheduleReconnect();
          return;
        }
      }
    })();
  }

  /**
   * Issue a single long-poll request and dispatch any new messages.
   * Respects per-room lastKnownId as X-Chat-Last-Given.
   * Returns 'idle' on 304, 'ok' on a successful poll with/without messages,
   * and 'stop' when this room's loop should exit (e.g. 401 plugin-wide error
   * or 404 room-not-found).
   */
  private async pollOnce(roomToken: string): Promise<'idle' | 'ok' | 'stop'> {
    if (!this.creds || !this.selfUserId) return 'idle';

    const lastId = this.lastKnownIds.get(roomToken) ?? 0;
    const url = new URL(
      `${this.creds.serverUrl}/ocs/v2.php/apps/spreed/api/v1/chat/${roomToken}`,
    );
    url.searchParams.set('lookIntoFuture', '1');
    url.searchParams.set('timeout', String(LONG_POLL_TIMEOUT_S));
    url.searchParams.set('limit', '200');
    if (lastId > 0) url.searchParams.set('lastKnownMessageId', String(lastId));

    const abort = new AbortController();
    this.pollAborts.set(roomToken, abort);

    const fetchTimer = setTimeout(() => abort.abort(), FETCH_ABORT_TIMEOUT_MS);

    let resp: Response;
    try {
      resp = await this.ncFetch(url.toString(), {
        method: 'GET',
        signal: abort.signal,
      });
    } finally {
      clearTimeout(fetchTimer);
      this.pollAborts.delete(roomToken);
    }

    // 304 = no new messages within the poll window - normal, signal idle.
    if (resp.status === 304) return 'idle';

    // Fast-fail on 401 (app password revoked) - skip reconnect backoff and
    // surface an actionable error so the user knows to re-test credentials.
    if (resp.status === 401) {
      this.stopped = true;
      this.setStatus(
        'error',
        'Nextcloud Talk: app-password revoked or invalid - re-test credentials',
      );
      return 'stop';
    }

    // 404 = room/token not found. Skip this room without consuming reconnect
    // attempts; other rooms continue polling normally.
    if (resp.status === 404) {
      console.warn(
        `[NextcloudTalkPlugin] Room ${roomToken} not found (404) - skipping further polls for this room`,
      );
      this.rooms = this.rooms.filter((r) => r !== roomToken);
      this.lastKnownIds.delete(roomToken);
      return 'stop';
    }

    if (!resp.ok) {
      throw new Error(
        `Nextcloud Talk poll failed: ${resp.status} ${resp.statusText}`,
      );
    }

    const json = (await resp.json()) as OcsEnvelope<NextcloudTalkChatMessage[]>;
    const messages = json?.ocs?.data;
    if (!Array.isArray(messages) || messages.length === 0) return 'ok';

    // Reset reconnect counter on a successful poll.
    this.reconnectFailureCount = 0;

    for (const msg of messages) {
      // Advance lastKnownId.
      if (msg.id > (this.lastKnownIds.get(roomToken) ?? 0)) {
        this.lastKnownIds.set(roomToken, msg.id);
      }

      const unified = toUnifiedIncomingFromNextcloudTalk(
        msg,
        roomToken,
        this.selfUserId,
      );
      if (!unified) continue;

      this.activeUsers.add(unified.user.id);
      void this.emitMessage(unified).catch((err) =>
        console.error('[NextcloudTalkPlugin] emitMessage failed:', err),
      );
    }
    return 'ok';
  }

  // ── Reconnect state machine ─────────────────────────────────────────────────

  /**
   * Cancel all running polls, wait with exponential backoff, then restart.
   * After RECONNECT_BACKOFF_MAX_ATTEMPTS give up and set status='error'.
   */
  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return; // already scheduled

    // Cancel in-flight polls.
    for (const [, abort] of this.pollAborts) {
      try {
        abort.abort();
      } catch {
        // ignore
      }
    }
    this.pollAborts.clear();

    this.reconnectFailureCount += 1;
    if (this.reconnectFailureCount > RECONNECT_BACKOFF_MAX_ATTEMPTS) {
      const reason = `Nextcloud Talk disconnected after ${RECONNECT_BACKOFF_MAX_ATTEMPTS} reconnect attempts`;
      console.error(`[NextcloudTalkPlugin] ${reason}; giving up`);
      this.setStatus('error', reason);
      return;
    }

    const delay = Math.min(
      RECONNECT_BACKOFF_START_MS * 2 ** (this.reconnectFailureCount - 1),
      RECONNECT_BACKOFF_CAP_MS,
    );
    console.warn(
      `[NextcloudTalkPlugin] reconnect attempt ${this.reconnectFailureCount}/${RECONNECT_BACKOFF_MAX_ATTEMPTS} in ${delay}ms`,
    );
    this.setError(`Nextcloud Talk poll failed; retrying in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      for (const token of this.rooms) {
        this.startPollLoop(token);
      }
    }, delay);
  }

  // ── HTTP helpers ────────────────────────────────────────────────────────────

  /**
   * Authenticated fetch wrapper - injects Basic auth, OCS-APIRequest, and
   * Accept headers for every request to the Nextcloud instance.
   */
  private async ncFetch(
    url: string,
    init: RequestInit = {},
  ): Promise<Response> {
    if (!this.creds) throw new Error('Nextcloud Talk plugin not started');
    const { username, appPassword } = this.creds;
    const basic = Buffer.from(`${username}:${appPassword}`).toString('base64');

    const headers = new Headers(init.headers as HeadersInit | undefined);
    headers.set('Authorization', `Basic ${basic}`);
    headers.set('OCS-APIRequest', 'true');
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', WAYLAND_UA);

    return fetch(url, { ...init, headers });
  }

  /**
   * Verify identity via GET /ocs/v2.php/cloud/user.
   * Returns the server-confirmed user object.
   */
  private async whoami(creds: Creds): Promise<OcsUserData> {
    const basic = Buffer.from(`${creds.username}:${creds.appPassword}`).toString('base64');
    const resp = await fetch(`${creds.serverUrl}/ocs/v2.php/cloud/user`, {
      headers: {
        Authorization: `Basic ${basic}`,
        'OCS-APIRequest': 'true',
        Accept: 'application/json',
        'User-Agent': WAYLAND_UA,
      },
    });
    if (!resp.ok) {
      throw new Error(
        `Nextcloud Talk whoami failed: ${resp.status} ${resp.statusText}`,
      );
    }
    const json = (await resp.json()) as OcsEnvelope<OcsUserData>;
    const data = json?.ocs?.data;
    if (!data?.id) throw new Error('Nextcloud Talk whoami: server returned no user id');
    return data;
  }

  // ── Static ──────────────────────────────────────────────────────────────────

  /**
   * Validate credentials by calling GET /ocs/v2.php/cloud/user with Basic auth.
   * The token argument is a JSON-encoded {serverUrl, username, appPassword} blob.
   */
  static override async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let creds: Creds;
    try {
      creds = JSON.parse(token) as Creds;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }

    try {
      creds = resolveCreds(creds as unknown as Record<string, unknown>);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }

    try {
      const basic = Buffer.from(`${creds.username}:${creds.appPassword}`).toString('base64');
      const resp = await fetch(`${creds.serverUrl}/ocs/v2.php/cloud/user`, {
        headers: {
          Authorization: `Basic ${basic}`,
          'OCS-APIRequest': 'true',
          Accept: 'application/json',
          'User-Agent': WAYLAND_UA,
        },
      });

      if (resp.status === 401) {
        return { success: false, error: 'Invalid credentials (401 Unauthorized)' };
      }
      if (!resp.ok) {
        return {
          success: false,
          error: `Nextcloud Talk server returned ${resp.status} ${resp.statusText}`,
        };
      }

      const json = (await resp.json()) as OcsEnvelope<OcsUserData>;
      const userId = json?.ocs?.data?.id;
      if (!userId) {
        return { success: false, error: 'Server returned no user id' };
      }

      return { success: true, botUsername: userId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}

// ── Credential resolution ─────────────────────────────────────────────────────

function resolveCreds(raw: Record<string, unknown>): Creds {
  const serverUrl = readString(raw['serverUrl']).replace(/\/+$/, '');
  if (!serverUrl) throw new Error('Nextcloud server URL is required');

  const username = readString(raw['username']);
  if (!username) throw new Error('Nextcloud username is required');

  const appPassword = readString(raw['appPassword']);
  if (!appPassword) throw new Error('Nextcloud app password is required');

  return { serverUrl, username, appPassword };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
