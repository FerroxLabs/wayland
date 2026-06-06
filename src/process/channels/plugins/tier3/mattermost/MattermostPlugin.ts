/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Mattermost team-chat plugin via personal access token + REST + WebSocket.
 *
 * Transport: WebSocket /api/v4/websocket with Bearer auth challenge, listens
 * for 'posted' events. Outbound via REST POST /api/v4/posts (send) and
 * PUT /api/v4/posts/{id} (edit). No @mattermost/client - raw fetch + ws
 * avoids the package's heavy React-Native peer deps.
 *
 * Capabilities: text + edit + react + typing.
 * Reconnect backoff: 5s → 60s, max 5 attempts then status='error'.
 */

import { lookup as dnsLookup } from 'dns';
import { isIP } from 'net';
import { promisify } from 'util';
import WebSocket from 'ws';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';

const dnsLookupAsync = promisify(dnsLookup);
import { BasePlugin } from '../../BasePlugin';
import {
  MATTERMOST_MESSAGE_LIMIT,
  extractPostFromEvent,
  parseMattermostWsEvent,
  splitMattermostMessage,
  toMattermostEditPayload,
  toMattermostPostPayload,
  toUnifiedIncomingFromMattermost,
} from './MattermostAdapter';

// Reconnect backoff mirrors MatrixPlugin and IrcPlugin.
const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_CAP_MS = 60_000;
const RECONNECT_BACKOFF_MAX_ATTEMPTS = 5;

// WS auth challenge sequence id.
const WS_AUTH_SEQ = 1;

type MattermostCreds = {
  serverUrl: string;
  accessToken: string;
  teamId?: string;
  // SSRF guard: when false, block fetches that resolve to private IPs.
  // Default true because Mattermost is overwhelmingly self-hosted on LANs;
  // users on managed SaaS Mattermost can flip the "Block private-network
  // destinations" advanced toggle to harden against DNS-rebinding.
  allowPrivateNetwork: boolean;
};

// Private/loopback/link-local ranges we refuse to fetch when allowPrivateNetwork=false.
// IPv4: 10/8, 172.16/12, 192.168/16, 127/8. IPv6: ::1, fc00::/7, fe80::/10.
function isPrivateAddress(addr: string): boolean {
  const family = isIP(addr);
  if (family === 4) {
    const [a, b] = addr.split('.').map((p) => Number.parseInt(p, 10));
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }
  if (family === 6) {
    const lower = addr.toLowerCase();
    if (lower === '::1') return true;
    // fc00::/7 → first byte 0xFC or 0xFD
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
    // fe80::/10 → fe8x, fe9x, feax, febx
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
    return false;
  }
  return false;
}

async function assertSsrfAllowed(urlString: string, allowPrivate: boolean): Promise<void> {
  if (allowPrivate) return;
  let host: string;
  try {
    host = new URL(urlString).hostname;
  } catch {
    throw new Error(`Mattermost SSRF guard: invalid URL ${urlString}`);
  }
  // Strip [] from IPv6 literals.
  const cleaned = host.replace(/^\[|\]$/g, '');
  let resolved: string;
  if (isIP(cleaned)) {
    resolved = cleaned;
  } else {
    try {
      const result = await dnsLookupAsync(cleaned);
      resolved = result.address;
    } catch (err) {
      throw new Error(
        `Mattermost SSRF guard: DNS lookup failed for ${cleaned}: ${err instanceof Error ? err.message : String(err)}`, { cause: err },
      );
    }
  }
  if (isPrivateAddress(resolved)) {
    throw new Error(
      `Mattermost SSRF guard: ${cleaned} resolved to private/loopback address ${resolved} (enable "I'm running Mattermost on my LAN" to allow)`,
    );
  }
}

type MattermostUser = {
  id: string;
  username: string;
};

export class MattermostPlugin extends BasePlugin {
  readonly type: PluginType = 'mattermost';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: false,
    canReact: true,
    canTypingIndicator: true,
  };

  private creds: MattermostCreds | null = null;
  private ws: WebSocket | null = null;
  private selfUserId = '';
  private selfUsername = '';
  private reconnectFailureCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly activeUsers: Set<string> = new Set();

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const raw = config.credentials ?? {};
    // Audit MED 2026-05-18: strip trailing slashes AND a trailing /api/v4
    // suffix. Users routinely paste the canonical REST URL from Mattermost
    // docs (https://mm.example.com/api/v4); without this, every request
    // hits /api/v4/api/v4/... and 404s. Matches OpenClaw's
    // normalizeMattermostBaseUrl (client.ts:62-69).
    const withoutTrailing = readString(raw['serverUrl']).replace(/\/+$/, '');
    const serverUrl = withoutTrailing.replace(/\/api\/v4$/i, '');
    const accessToken = readString(raw['accessToken']);
    const teamId = readString(raw['teamId']) || undefined;
    // Default true: Mattermost is overwhelmingly self-hosted on LAN/private
    // ranges, so blocking those by default would break the common case.
    // SaaS users can opt in to the strict check via the form toggle.
    const allowPrivateNetwork = raw['allowPrivateNetwork'] === false ? false : true;

    if (!serverUrl) throw new Error('Mattermost server URL is required');
    if (!accessToken) throw new Error('Mattermost access token is required');

    this.creds = { serverUrl, accessToken, teamId, allowPrivateNetwork };
  }

  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('Mattermost plugin not initialized');
    this.stopped = false;
    this.reconnectFailureCount = 0;

    // Verify credentials and resolve our own user id before opening the WS.
    const me = await this.fetchMe(this.creds);
    this.selfUserId = me.id;
    this.selfUsername = me.username;

    await this.connectWs();
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.teardownWs();
    this.selfUserId = '';
    this.selfUsername = '';
    this.activeUsers.clear();
    this.reconnectFailureCount = 0;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.selfUserId) return null;
    return {
      id: this.selfUserId,
      username: this.selfUsername,
      displayName: this.selfUsername,
    };
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.creds) throw new Error('Mattermost client not initialized');
    const text = message.text ?? '';
    if (!text.trim()) return '';

    const chunks = splitMattermostMessage(text, MATTERMOST_MESSAGE_LIMIT);
    let lastId = '';
    let rootId: string | undefined;
    for (const chunk of chunks) {
      // Audit LOW 2026-05-18: thread chunks 2..N under the first chunk's id
      // so a split message appears as a single conversation in Mattermost,
      // not N top-level posts. Matches OpenClaw's createMattermostPost flow.
      const payload = toMattermostPostPayload(chatId, { ...message, text: chunk }, rootId);
      const post = await this.restPost<{ id: string }>('/api/v4/posts', payload);
      lastId = post.id;
      if (!rootId) rootId = post.id;
    }
    return lastId;
  }

  async editMessage(
    _chatId: string,
    messageId: string,
    message: IUnifiedOutgoingMessage,
  ): Promise<void> {
    if (!this.creds) throw new Error('Mattermost client not initialized');
    const text = message.text ?? '';
    if (!text.trim()) return;
    const payload = toMattermostEditPayload(messageId, message);
    await this.restPut(`/api/v4/posts/${messageId}`, payload);
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('Mattermost uses a persistent WebSocket connection, not webhooks');
  }

  // ── WebSocket ────────────────────────────────────────────────────────────────

  private async connectWs(): Promise<void> {
    if (!this.creds) throw new Error('Mattermost plugin not initialized');
    const { serverUrl, accessToken, allowPrivateNetwork } = this.creds;

    // Audit LOW 2026-05-18: SSRF guard runs before the socket opens so a
    // poisoned serverUrl can't pivot to internal hosts from the Electron
    // main process.
    await assertSsrfAllowed(serverUrl, allowPrivateNetwork);

    // Convert http(s) → ws(s) for the WS endpoint.
    const wsUrl = serverUrl.replace(/^http/, 'ws') + '/api/v4/websocket';

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);

      const onOpen = () => {
        // Send the auth challenge immediately on open.
        ws.send(
          JSON.stringify({
            seq: WS_AUTH_SEQ,
            action: 'authentication_challenge',
            data: { token: accessToken },
          }),
        );
      };

      const onMessage = (data: WebSocket.RawData) => {
        const raw = typeof data === 'string' ? data : data.toString();
        const evt = parseMattermostWsEvent(raw);
        if (!evt) return;

        // The server echoes our auth challenge back with seq_reply=1, status=OK.
        if (
          (evt as { seq_reply?: number; status?: string }).seq_reply === WS_AUTH_SEQ
        ) {
          const status = (evt as { status?: string }).status;
          if (status === 'OK') {
            this.ws = ws;
            this.reconnectFailureCount = 0;
            resolve();
          } else {
            const errMsg = (evt as { error?: string }).error ?? 'WS auth failed';
            ws.close();
            reject(new Error(errMsg));
          }
          return;
        }

        if (evt.event === 'posted') {
          // Audit MED 2026-05-18: when teamId is configured, scope inbound
          // events to that team. Mattermost WS events carry the originating
          // team on the broadcast envelope; drop any event from a different
          // team so the bot only acts within its assigned team.
          if (this.creds?.teamId) {
            const eventTeamId = evt.broadcast?.team_id ?? evt.data?.team_id;
            // Only filter when the event actually carries a team_id - direct
            // messages have no team and should still be delivered.
            if (eventTeamId && eventTeamId !== this.creds.teamId) return;
          }
          const post = extractPostFromEvent(evt);
          if (post) this.activeUsers.add(post.user_id ?? '');
          const unified = toUnifiedIncomingFromMattermost(evt, this.selfUserId);
          if (unified) {
            void this.emitMessage(unified).catch((err) =>
              console.error('[MattermostPlugin] emitMessage failed:', err),
            );
          }
        }
      };

      const onClose = () => {
        if (this.stopped) return;
        if (this.ws !== ws && this.ws !== null) return;
        console.warn('[MattermostPlugin] WS closed, scheduling reconnect');
        this.ws = null;
        this.scheduleReconnect();
      };

      const onError = (err: Error) => {
        if (this.stopped) return;
        console.warn('[MattermostPlugin] WS error:', err.message);
        // If we haven't resolved yet, reject so onStart() surfaces the error.
        if (this.ws !== ws) {
          ws.removeAllListeners();
          reject(err);
        }
      };

      ws.on('open', onOpen);
      ws.on('message', onMessage);
      ws.on('close', onClose);
      ws.on('error', onError);
    });
  }

  private teardownWs(): void {
    const dead = this.ws;
    this.ws = null;
    if (dead) {
      try {
        dead.removeAllListeners();
        dead.close();
      } catch {
        // ignore teardown errors
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;

    this.reconnectFailureCount += 1;
    if (this.reconnectFailureCount > RECONNECT_BACKOFF_MAX_ATTEMPTS) {
      const reason = `Mattermost WS disconnected after ${RECONNECT_BACKOFF_MAX_ATTEMPTS} reconnect attempts`;
      console.error(`[MattermostPlugin] ${reason}; giving up`);
      this.setStatus('error', reason);
      return;
    }

    // Audit gemini MED1 2026-05-18: jitter (0-1000ms) to avoid synchronized
    // WS reconnects during Mattermost server restarts.
    const delay = Math.min(
      RECONNECT_BACKOFF_START_MS * 2 ** (this.reconnectFailureCount - 1),
      RECONNECT_BACKOFF_CAP_MS,
    ) + Math.floor(Math.random() * 1000);
    console.warn(
      `[MattermostPlugin] reconnect attempt ${this.reconnectFailureCount}/${RECONNECT_BACKOFF_MAX_ATTEMPTS} in ${delay}ms`,
    );
    this.setError(`Mattermost WS disconnected; retrying in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      void this.connectWs().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[MattermostPlugin] reconnect attempt failed:', message);
        if (!this.stopped) this.scheduleReconnect();
      });
    }, delay);
  }

  // ── REST helpers ─────────────────────────────────────────────────────────────

  private async restPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.restFetch<T>('POST', path, body);
  }

  private async restPut<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.restFetch<T>('PUT', path, body);
  }

  private async restFetch<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.creds) throw new Error('Mattermost client not initialized');
    const url = this.creds.serverUrl + path;
    await assertSsrfAllowed(url, this.creds.allowPrivateNetwork);
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Mattermost REST ${method} ${path} failed ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<T>;
  }

  private async fetchMe(creds: MattermostCreds): Promise<MattermostUser> {
    const url = creds.serverUrl + '/api/v4/users/me';
    await assertSsrfAllowed(url, creds.allowPrivateNetwork);
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      if (resp.status === 401) {
        throw new Error('Invalid Mattermost access token (401)');
      }
      throw new Error(`Mattermost /api/v4/users/me failed ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<MattermostUser>;
  }

  // ── Static ───────────────────────────────────────────────────────────────────

  /**
   * Validate credentials by calling GET /api/v4/users/me with the Bearer token.
   * tokenJson is a JSON-encoded { serverUrl, accessToken, teamId? } object -
   * mirrors the MatrixPlugin.testConnection multi-field pattern.
   */
  static override async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let creds: { serverUrl?: string; accessToken?: string; allowPrivateNetwork?: boolean };
    try {
      creds = JSON.parse(tokenJson) as typeof creds;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }

    const serverUrl = (creds.serverUrl ?? '').trim().replace(/\/$/, '');
    const accessToken = (creds.accessToken ?? '').trim();
    const allowPrivateNetwork = creds.allowPrivateNetwork === false ? false : true;

    if (!serverUrl) return { success: false, error: 'Server URL is required' };
    if (!accessToken) return { success: false, error: 'Access token is required' };

    try {
      await assertSsrfAllowed(`${serverUrl}/api/v4/users/me`, allowPrivateNetwork);
      const resp = await fetch(`${serverUrl}/api/v4/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          return { success: false, error: 'Invalid Mattermost access token (401)' };
        }
        return { success: false, error: `Server returned ${resp.status}` };
      }
      const me = (await resp.json()) as { username?: string };
      return { success: true, botUsername: me.username };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }
}

// ── Credential helpers ────────────────────────────────────────────────────────

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
