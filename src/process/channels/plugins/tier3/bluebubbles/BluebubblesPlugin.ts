/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * BluebubblesPlugin - iMessage relay via a self-hosted BlueBubbles server.
 *
 * Transport: Socket.IO client connecting to the BB server (ws/wss).  Password
 * is passed as a query param.  Listens for `new-message` events; sends via
 * REST POST /api/v1/message/text.  Tapback reactions via POST
 * /api/v1/message/react.
 *
 * Capabilities: text + tapback reactions + typing indicator. No edits
 * (iMessage limitation).
 *
 * Reconnect backoff: 5 s → 60 s, max 5 attempts, then status='error'.
 */

import { randomUUID } from 'node:crypto';

import { io, type Socket } from 'socket.io-client';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import { buildTapbackPayload, toUnifiedIncomingFromBluebubbles } from './BluebubblesAdapter';

// Reconnect backoff mirrors MattermostPlugin / MatrixPlugin.
const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_CAP_MS = 60_000;
const RECONNECT_BACKOFF_MAX_ATTEMPTS = 5;

type BluebubblesCreds = {
  serverUrl: string;
  password: string;
};

type BBServerInfoResponse = {
  status: number;
  data?: {
    server_address?: string;
    name?: string;
  };
};

type BBTextResponse = {
  status: number;
  data?: {
    guid?: string;
  };
};

type BBChatQueryResponse = {
  status: number;
  data?: Array<{ guid?: string }> | { guid?: string };
};

type BBChatNewResponse = {
  status: number;
  data?: { guid?: string };
};

const CHAT_GUID_DM_RE = /^iMessage;-;.+$/;
const CHAT_GUID_GROUP_RE = /^iMessage;\+;.+$/;
const PHONE_RE = /^\+\d{8,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class BluebubblesPlugin extends BasePlugin {
  readonly type: PluginType = 'bluebubbles';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: true,
    canTypingIndicator: true,
  };

  private creds: BluebubblesCreds | null = null;
  private socket: Socket | null = null;
  private serverAddress: string | null = null;
  private reconnectFailureCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly chatGuidCache = new Map<string, string>();

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const raw = config.credentials ?? {};
    const serverUrl = readString(raw['serverUrl']).replace(/\/$/, '');
    const password = readString(raw['password']);

    if (!serverUrl) throw new Error('BlueBubbles server URL is required');
    if (!password) throw new Error('BlueBubbles server password is required');

    this.creds = { serverUrl, password };
  }

  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('BlueBubbles plugin not initialized');
    this.stopped = false;
    this.reconnectFailureCount = 0;

    // Verify credentials by fetching server info before opening the socket.
    const info = await this.fetchServerInfo(this.creds);
    this.serverAddress = info.data?.server_address ?? info.data?.name ?? 'bluebubbles-server';

    await this.connectSocket();
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.teardownSocket();
    this.serverAddress = null;
    this.reconnectFailureCount = 0;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  getActiveUserCount(): number {
    return 0;
  }

  getBotInfo(): BotInfo | null {
    if (!this.serverAddress) return null;
    return {
      id: this.serverAddress,
      username: this.serverAddress,
      displayName: this.serverAddress,
    };
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.creds) throw new Error('BlueBubbles client not initialized');
    const text = message.text ?? '';
    if (!text.trim()) return '';

    const resolvedChatGuid = await this.resolveChatGuid(chatId, text);

    const url = `${this.creds.serverUrl}/api/v1/message/text?password=${encodeURIComponent(this.creds.password)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatGuid: resolvedChatGuid,
        message: text,
        tempGuid: randomUUID(),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`BlueBubbles sendMessage failed ${resp.status}: ${errText}`);
    }

    const body = (await resp.json()) as BBTextResponse;
    return body.data?.guid ?? '';
  }

  /**
   * Resolve a caller-supplied target to a BlueBubbles chatGuid.
   *
   * Accepts:
   * - An iMessage DM chat GUID (`iMessage;-;...`) - returned as-is.
   * - An iMessage group chat GUID (`iMessage;+;...`) - returned as-is.
   * - A phone number (`+15551234567`) or email - queries `/api/v1/chat/query`,
   *   falling back to `/api/v1/chat/new` to create a 1:1 chat. The first
   *   outgoing `message` is sent as the seed body when creating.
   *
   * Resolved guids are cached per-target to avoid re-querying on every send.
   */
  private async resolveChatGuid(target: string, seedMessage: string): Promise<string> {
    if (!this.creds) throw new Error('BlueBubbles client not initialized');

    if (CHAT_GUID_DM_RE.test(target) || CHAT_GUID_GROUP_RE.test(target)) {
      return target;
    }

    const cached = this.chatGuidCache.get(target);
    if (cached) return cached;

    const isHandle = PHONE_RE.test(target) || EMAIL_RE.test(target);
    if (!isHandle) {
      throw new Error(
        `BlueBubbles: cannot resolve chatGuid for target "${target}". ` +
          `Expected an iMessage chat GUID (iMessage;-;... or iMessage;+;...), ` +
          `a phone number (+15551234567), or an email address.`,
      );
    }

    const queriedGuid = await this.queryChatGuidByAddress(target);
    if (queriedGuid) {
      this.chatGuidCache.set(target, queriedGuid);
      return queriedGuid;
    }

    const newGuid = await this.createChatForAddress(target, seedMessage);
    if (!newGuid) {
      throw new Error(
        `BlueBubbles: failed to create new chat for address "${target}" (no guid returned)`,
      );
    }
    this.chatGuidCache.set(target, newGuid);
    return newGuid;
  }

  private async queryChatGuidByAddress(address: string): Promise<string | null> {
    if (!this.creds) return null;
    const url = `${this.creds.serverUrl}/api/v1/chat/query?password=${encodeURIComponent(this.creds.password)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, limit: 1, offset: 0 }),
    });
    if (!resp.ok) return null;
    const body = (await resp.json()) as BBChatQueryResponse;
    const data = body.data;
    if (Array.isArray(data)) {
      const first = data[0];
      const guid = first?.guid;
      return typeof guid === 'string' && guid ? guid : null;
    }
    const guid = data?.guid;
    return typeof guid === 'string' && guid ? guid : null;
  }

  private async createChatForAddress(
    address: string,
    seedMessage: string,
  ): Promise<string | null> {
    if (!this.creds) return null;
    const url = `${this.creds.serverUrl}/api/v1/chat/new?password=${encodeURIComponent(this.creds.password)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [address],
        message: seedMessage,
        tempGuid: randomUUID(),
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`BlueBubbles chat/new failed ${resp.status}: ${errText}`);
    }
    const body = (await resp.json()) as BBChatNewResponse;
    const guid = body.data?.guid;
    return typeof guid === 'string' && guid ? guid : null;
  }

  /**
   * Send a tapback reaction. The `emoji` parameter must be one of the six
   * iMessage tapback emoji (❤️ 👍 👎 😂 ‼️ ❓). Throws if unsupported.
   * `chatId` is the chatGuid; `messageId` is the message guid to react to.
   */
  async sendReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.creds) throw new Error('BlueBubbles client not initialized');

    const payload = buildTapbackPayload(chatId, messageId, emoji);
    if (!payload) {
      throw new Error(`BlueBubbles: unsupported tapback emoji "${emoji}"`);
    }

    const url = `${this.creds.serverUrl}/api/v1/message/react?password=${encodeURIComponent(this.creds.password)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`BlueBubbles sendReaction failed ${resp.status}: ${errText}`);
    }
  }

  /**
   * Send a typing indicator via POST /api/v1/chat/{chatGuid}/typing.
   */
  async sendTypingIndicator(chatId: string): Promise<void> {
    if (!this.creds) return;
    const url = `${this.creds.serverUrl}/api/v1/chat/${encodeURIComponent(chatId)}/typing?password=${encodeURIComponent(this.creds.password)}`;
    await fetch(url, { method: 'POST' }).catch((err: unknown) => {
      console.warn('[BluebubblesPlugin] typing indicator failed:', err);
    });
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('BlueBubbles uses Socket.IO, not webhooks');
  }

  // ── Socket.IO ────────────────────────────────────────────────────────────────

  private connectSocket(): Promise<void> {
    if (!this.creds) return Promise.reject(new Error('BlueBubbles plugin not initialized'));
    const { serverUrl, password } = this.creds;

    return new Promise<void>((resolve, reject) => {
      const socket = io(serverUrl, {
        transports: ['websocket'],
        query: { password },
        reconnection: false, // We manage our own backoff.
        timeout: 10_000,
      });

      const onConnect = () => {
        this.socket = socket;
        this.reconnectFailureCount = 0;
        resolve();
      };

      const onConnectError = (err: Error) => {
        socket.removeAllListeners();
        socket.disconnect();
        reject(err);
      };

      const onDisconnect = (reason: string) => {
        if (this.stopped) return;
        if (this.socket !== socket && this.socket !== null) return;
        console.warn(`[BluebubblesPlugin] Socket disconnected: ${reason}, scheduling reconnect`);
        this.socket = null;
        this.scheduleReconnect();
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.on('disconnect', onDisconnect);

      socket.on('new-message', (data: unknown) => {
        const unified = toUnifiedIncomingFromBluebubbles(data, this.type);
        if (!unified) return;
        void this.emitMessage(unified).catch((err: unknown) =>
          console.error('[BluebubblesPlugin] emitMessage failed:', err),
        );
      });
    });
  }

  private teardownSocket(): void {
    const dead = this.socket;
    this.socket = null;
    if (dead) {
      try {
        dead.removeAllListeners();
        dead.disconnect();
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
      const reason = `BlueBubbles socket disconnected after ${RECONNECT_BACKOFF_MAX_ATTEMPTS} reconnect attempts`;
      console.error(`[BluebubblesPlugin] ${reason}; giving up`);
      this.setStatus('error', reason);
      return;
    }

    const delay = Math.min(
      RECONNECT_BACKOFF_START_MS * 2 ** (this.reconnectFailureCount - 1),
      RECONNECT_BACKOFF_CAP_MS,
    );
    console.warn(
      `[BluebubblesPlugin] reconnect attempt ${this.reconnectFailureCount}/${RECONNECT_BACKOFF_MAX_ATTEMPTS} in ${delay}ms`,
    );
    this.setError(`BlueBubbles socket disconnected; retrying in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      void this.connectSocket().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[BluebubblesPlugin] reconnect attempt failed:', message);
        if (!this.stopped) this.scheduleReconnect();
      });
    }, delay);
  }

  // ── REST helpers ─────────────────────────────────────────────────────────────

  private async fetchServerInfo(creds: BluebubblesCreds): Promise<BBServerInfoResponse> {
    const url = `${creds.serverUrl}/api/v1/server/info?password=${encodeURIComponent(creds.password)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      if (resp.status === 401 || resp.status === 403) {
        throw new Error('Invalid BlueBubbles server password');
      }
      throw new Error(`BlueBubbles server/info failed ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<BBServerInfoResponse>;
  }

  // ── Static ───────────────────────────────────────────────────────────────────

  /**
   * Validate credentials by calling GET /api/v1/server/info.
   * tokenJson is JSON-encoded { serverUrl, password }.
   */
  static override async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let creds: { serverUrl?: string; password?: string };
    try {
      creds = JSON.parse(tokenJson) as typeof creds;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }

    const serverUrl = (creds.serverUrl ?? '').trim().replace(/\/$/, '');
    const password = (creds.password ?? '').trim();

    if (!serverUrl) return { success: false, error: 'Server URL is required' };
    if (!password) return { success: false, error: 'Password is required' };

    try {
      const url = `${serverUrl}/api/v1/server/info?password=${encodeURIComponent(password)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          return { success: false, error: 'Invalid BlueBubbles server password' };
        }
        return { success: false, error: `Server returned ${resp.status}` };
      }
      const body = (await resp.json()) as BBServerInfoResponse;
      const serverAddress = body.data?.server_address ?? body.data?.name ?? 'bluebubbles-bot';
      return { success: true, botUsername: serverAddress };
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
