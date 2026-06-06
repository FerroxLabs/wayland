/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Synology Chat (NAS-hosted) plugin - incoming webhook + outgoing REST.
 *
 * Synology Chat sends outgoing webhook events (form-encoded, `payload` JSON)
 * to our WebhookReceiver. The verifier checks the query-string token with
 * timing-safe comparison. We send replies back by POSTing form-encoded data to
 * the Synology-generated incoming webhook URL.
 *
 * Capabilities: text only (no edit, no reactions, no streaming, no typing).
 */

import { Agent, type Dispatcher } from 'undici';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  parseSynologyChatBody,
  toSynologyChatSendBody,
  toUnifiedIncomingFromSynologyChat,
  type SynologyChatInboundPayload,
} from './SynologyChatAdapter';

type SynologyChatCreds = {
  /** Synology-generated incoming webhook URL we POST replies to */
  incomingUrl: string;
  /** Static token Synology sends in the inbound webhook query string */
  incomingToken: string;
  /**
   * Skip TLS certificate verification when POSTing to the incoming webhook.
   * Synology NAS boxes on LAN routinely ship with self-signed certs on
   * `https://*.local`. Default false; never enable for public hosts.
   */
  allowInsecureSsl: boolean;
};

export class SynologyChatPlugin extends BasePlugin {
  readonly type: PluginType = 'synology-chat';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private incomingUrl: string | null = null;
  private allowInsecureSsl = false;
  private readonly activeUsers: Set<string> = new Set();

  /**
   * Wall-clock ms of the most recent outbound POST. Used to enforce a
   * 500 ms client-side minimum interval between sends - Synology Chat is
   * documented as 429-prone on bursty replies.
   */
  private lastSendAt = 0;

  /**
   * Lazy cache of (outgoing-webhook user_id → Chat-API user_id). Populated
   * on first send via `method=user_list`; re-fetched after USER_LIST_TTL_MS.
   * The two id spaces diverge on multi-account Synology Chat servers - replies
   * addressed to the webhook-supplied user_id can silently fail unless we
   * remap to the Chat-API id. See OpenClaw `resolveLegacyWebhookNameToChatUserId`.
   */
  private userIdMap: Map<string, string> | null = null;
  private userIdMapFetchedAt = 0;

  /**
   * Validate credentials. Both incomingUrl and incomingToken are required.
   * The token is held by the verifier (read from config.credentials at verify
   * time); the plugin itself stores incomingUrl for outbound sends.
   */
  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = resolveCreds(config.credentials ?? {});
    this.incomingUrl = creds.incomingUrl;
    this.allowInsecureSsl = creds.allowInsecureSsl;
  }

  /**
   * Webhook-driven plugin - nothing to connect. WebhookReceiver routes inbound
   * traffic here via handleWebhookPayload.
   */
  protected async onStart(): Promise<void> {
    // No-op: delivery is fully push-based via WebhookReceiver.
  }

  /**
   * Clean up references on stop.
   */
  protected async onStop(): Promise<void> {
    this.incomingUrl = null;
    this.allowInsecureSsl = false;
    this.activeUsers.clear();
    this.lastSendAt = 0;
    this.userIdMap = null;
    this.userIdMapFetchedAt = 0;
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.incomingUrl) return null;
    return {
      id: 'wayland-bot',
      username: 'wayland-bot',
      displayName: 'Wayland Bot',
    };
  }

  /**
   * Send a message to Synology Chat via the incoming webhook URL.
   *
   * `chatId` is the Synology Chat user ID to target (numeric string).
   * Returns a synthetic message id - Synology Chat's webhook endpoint does not
   * return a message id in its response.
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.incomingUrl) {
      throw new Error('SynologyChat plugin not initialized');
    }

    // Remap webhook-space user_id → Chat-API user_id when we have a lookup.
    // Lookup failures fall back to the supplied chatId - same behaviour as
    // the bot-DM path, which is the only path most operators ever hit.
    const resolvedChatId = await this.resolveChatUserId(chatId);

    const body = toSynologyChatSendBody(message, resolvedChatId);
    await this.withRetryAndThrottle(() =>
      doPost(this.incomingUrl as string, body, this.allowInsecureSsl),
    );
    return `synology-chat:${resolvedChatId}:${Date.now()}`;
  }

  /**
   * Resolve a webhook-supplied user_id to the Chat-API user_id space.
   *
   * Synology's outgoing webhook minted ids ≠ Chat API ids on multi-account
   * servers - replies addressed to the webhook id silently fail to deliver in
   * those setups. We hit `method=user_list` once and cache the mapping for
   * USER_LIST_TTL_MS; lookup misses and fetch errors fall back to the
   * webhook-supplied id (which is correct for the canonical bot-DM case).
   */
  private async resolveChatUserId(webhookUserId: string): Promise<string> {
    if (!this.incomingUrl) return webhookUserId;

    const now = Date.now();
    const fresh = this.userIdMap && now - this.userIdMapFetchedAt < USER_LIST_TTL_MS;
    if (!fresh) {
      try {
        this.userIdMap = await fetchSynologyUserList(
          this.incomingUrl,
          this.allowInsecureSsl,
        );
        this.userIdMapFetchedAt = now;
      } catch (err) {
        // Don't blow up the send - fall through and use the webhook id. Log so
        // operators on multi-account servers can diagnose silent delivery loss.
        console.warn(
          '[synology-chatPlugin] user_list lookup failed; using webhook user_id verbatim:',
          err instanceof Error ? err.message : String(err),
        );
        this.userIdMap = this.userIdMap ?? new Map();
        this.userIdMapFetchedAt = now;
      }
    }

    return this.userIdMap?.get(webhookUserId) ?? webhookUserId;
  }

  /**
   * Wrap `doPost` with (a) a 500 ms client-side minimum interval between sends
   * and (b) 3 attempts with exponential backoff (300 ms base). Mirrors
   * OpenClaw's defence against Synology Chat's per-bot rate cap.
   */
  private async withRetryAndThrottle(send: () => Promise<void>): Promise<void> {
    const now = Date.now();
    const wait = MIN_SEND_INTERVAL_MS - (now - this.lastSendAt);
    if (wait > 0) await sleep(wait);

    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt++) {
      try {
        await send();
        this.lastSendAt = Date.now();
        return;
      } catch (err) {
        lastErr = err;
        if (attempt === MAX_SEND_ATTEMPTS - 1) break;
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
    this.lastSendAt = Date.now();
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  /**
   * Receive a webhook payload that has already been verified by the
   * synology-chat verifier. The payload is the parsed JSON object from the
   * `payload` form parameter; alternatively if the receiver hands us the raw
   * form body as a string we parse it here.
   *
   * Drops silently when required fields are absent (user_id or text).
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string,
  ): Promise<void> {
    // The verifier hands us the parsed payload object. For Synology Chat the
    // verifier returns the parsed inner JSON (from the `payload` form field).
    const inbound = payload as SynologyChatInboundPayload;
    const unified = toUnifiedIncomingFromSynologyChat(inbound);
    if (!unified) {
      console.warn('[synology-chatPlugin] Dropping payload missing user_id or text');
      return;
    }
    this.activeUsers.add(unified.user.id);
    await this.emitMessage(unified);
  }

  // ── Static ──────────────────────────────────────────────────────────────────

  /**
   * Test connection by POSTing a test message to the incomingUrl.
   * Synology Chat returns `{"success":true}` on a valid delivery.
   * Token argument is JSON-encoded creds per the multi-credential contract.
   */
  static override async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let creds: SynologyChatCreds;
    try {
      creds = resolveCreds(JSON.parse(tokenJson) as Record<string, unknown>);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    try {
      const body = `payload=${encodeURIComponent(JSON.stringify({ text: 'Wayland test connection' }))}`;
      await doPost(creds.incomingUrl, body, creds.allowInsecureSsl);
      return { success: true, botUsername: 'wayland-bot' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ── Credential resolution ─────────────────────────────────────────────────────

function resolveCreds(raw: Record<string, unknown>): SynologyChatCreds {
  const incomingUrl = readString(raw['incomingUrl']);
  if (!incomingUrl) throw new Error('Synology Chat incoming webhook URL is required');

  const incomingToken = readString(raw['incomingToken']);
  if (!incomingToken) throw new Error('Synology Chat incoming token is required');

  const allowInsecureSsl = raw['allowInsecureSsl'] === true;

  return { incomingUrl, incomingToken, allowInsecureSsl };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// ── Retry / throttle / user-list constants ───────────────────────────────────

const MAX_SEND_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;
const MIN_SEND_INTERVAL_MS = 500;
const USER_LIST_TTL_MS = 5 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── User-list lookup ─────────────────────────────────────────────────────────

/**
 * Fetch the bot's user_list once and build a (webhook user_id → Chat user_id)
 * map. Synology Chat's incoming webhook URL accepts `method=user_list` on the
 * same base path with the same `token` query parameter - we derive the
 * lookup URL by swapping `method=incoming` → `method=user_list`. If the
 * response can't be parsed into the expected shape we return an empty map
 * (sends fall back to the webhook id, which works for the canonical bot-DM
 * case).
 */
async function fetchSynologyUserList(
  incomingUrl: string,
  allowInsecureSsl: boolean,
): Promise<Map<string, string>> {
  const listUrl = incomingUrl.replace(/method=incoming/i, 'method=user_list');
  if (listUrl === incomingUrl) {
    // Incoming URL didn't carry `method=incoming` - we have no derivable
    // endpoint, so skip the lookup rather than guess.
    return new Map();
  }

  const dispatcher: Dispatcher | undefined = allowInsecureSsl
    ? new Agent({ connect: { rejectUnauthorized: false } })
    : undefined;
  const init = { method: 'GET', dispatcher } as RequestInit;

  try {
    const response = await fetch(listUrl, init);
    if (!response.ok) {
      throw new Error(`user_list HTTP ${response.status}`);
    }
    const body = (await response.json()) as unknown;
    return parseUserListBody(body);
  } finally {
    if (dispatcher) {
      void dispatcher.close().catch((): void => undefined);
    }
  }
}

/**
 * Synology returns `{ success: true, data: { users: [{ user_id, nickname, ... }, ...] } }`.
 * The legacy webhook id space typically matches nickname; the Chat-API id is
 * the numeric `user_id`. Map nickname → user_id and also user_id → user_id
 * (the identity case, so already-resolved ids round-trip cleanly).
 */
function parseUserListBody(body: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof body !== 'object' || body === null) return map;
  const root = body as { data?: { users?: unknown } };
  const users = root.data?.users;
  if (!Array.isArray(users)) return map;

  for (const u of users as unknown[]) {
    if (typeof u !== 'object' || u === null) continue;
    const entry = u as { user_id?: unknown; nickname?: unknown; username?: unknown };
    const chatId =
      typeof entry.user_id === 'string' || typeof entry.user_id === 'number'
        ? String(entry.user_id)
        : undefined;
    if (!chatId) continue;
    map.set(chatId, chatId);
    if (typeof entry.nickname === 'string' && entry.nickname.trim()) {
      map.set(entry.nickname.trim(), chatId);
    }
    if (typeof entry.username === 'string' && entry.username.trim()) {
      map.set(entry.username.trim(), chatId);
    }
  }
  return map;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

/**
 * POST form-encoded body to the Synology Chat incoming webhook URL.
 * Throws on non-200 or network error. When `allowInsecureSsl` is true,
 * routes through an undici Dispatcher that disables certificate verification
 * (LAN Synology NAS boxes ship self-signed certs by default).
 */
async function doPost(
  url: string,
  body: string,
  allowInsecureSsl: boolean,
): Promise<void> {
  const dispatcher: Dispatcher | undefined = allowInsecureSsl
    ? new Agent({ connect: { rejectUnauthorized: false } })
    : undefined;

  // `dispatcher` is a Node/undici-specific fetch option (not in the lib.dom
  // RequestInit type). Cast at the call-site so we don't leak `any` further.
  const init = { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, dispatcher } as RequestInit;

  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const text = await safeReadText(response);
      throw new Error(`SynologyChat send failed (${response.status}): ${text}`);
    }
  } finally {
    if (dispatcher) {
      void dispatcher.close().catch((): void => undefined);
    }
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}

// Re-export for tests that need access to the parser side.
export { parseSynologyChatBody };
