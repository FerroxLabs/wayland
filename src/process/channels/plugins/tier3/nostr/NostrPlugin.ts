/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Nostr channel plugin. Connects to operator-configured WebSocket relays,
 * subscribes to NIP-04 encrypted DMs (kind:4) tagged to our pubkey, decrypts
 * inbound events, and publishes kind:4 events for outbound DMs.
 *
 * Multi-relay fanout: each relay gets its own WebSocket and reconnect backoff
 * (5s → 60s, max 5 attempts). Plugin status='error' only when ALL relays are
 * down; remaining relays keep the channel partially live.
 *
 * Capabilities: text + reactions (kind:7). No edits - Nostr is append-only.
 */

import { verifyEvent } from 'nostr-tools';
import WebSocket from 'ws';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  derivePublicKey,
  fromUnifiedOutgoingToNostr,
  hexToNpub,
  nip04Decrypt,
  nip04Encrypt,
  normalizePubkey,
  toUnifiedIncomingFromNostr,
  validatePrivateKey,
  type NostrEventLike,
} from './NostrAdapter';

// ── Constants ─────────────────────────────────────────────────────────────────

const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_CAP_MS = 60_000;
const RECONNECT_BACKOFF_MAX_ATTEMPTS = 5;

/** Wait up to 5s for EOSE during testConnection. */
const TEST_CONNECT_TIMEOUT_MS = 5_000;

const DEFAULT_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol'];

/**
 * Hard caps on inbound NIP-04 payloads to prevent DoS from a malicious or
 * misbehaving relay. Values mirror OpenClaw's `guardPolicy.maxCiphertextBytes`
 * and `maxPlaintextBytes` defaults (nostr-bus.ts:586-592, :635-638).
 */
const MAX_CIPHERTEXT_BYTES = 64_000;
const MAX_PLAINTEXT_BYTES = 32_000;

// ── Guard policy constants (audit MED-1/2/3 2026-05-18) ──────────────────────
/** Bounded LRU+TTL for inbound event dedupe (MED-1). Mirrors OpenClaw
 *  `maxSeenEntries = 100_000`, `seenTtlMs = 60 * 60 * 1000` (nostr-bus.ts:421-424). */
const MAX_SEEN = 100_000;
const SEEN_TTL_MS = 60 * 60 * 1000;
/** Clock-skew guard for inbound events (MED-2). Mirrors OpenClaw
 *  `guardPolicy.maxFutureSkewSec` (nostr-bus.ts:520-523). */
const MAX_FUTURE_SKEW_SEC = 60 * 5;
/** Per-sender + global fixed-window rate-limiting (MED-3). Mirrors OpenClaw
 *  `createFixedWindowRateLimiter` defaults (nostr-bus.ts:478-487). */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_SENDER = 30;
const RATE_LIMIT_MAX_GLOBAL = 200;

// ── Nostr wire types ──────────────────────────────────────────────────────────

type NostrFilter = {
  kinds?: number[];
  '#p'?: string[];
  since?: number;
  limit?: number;
};

type RelayStatus = 'connecting' | 'connected' | 'down';

type RelayState = {
  url: string;
  ws: WebSocket | null;
  status: RelayStatus;
  failureCount: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  subId: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSubId(): string {
  return `wayland-${Math.random().toString(36).slice(2, 10)}`;
}

function buildReqMessage(subId: string, pk: string, since: number): string {
  const filter: NostrFilter = { kinds: [4], '#p': [pk], since };
  return JSON.stringify(['REQ', subId, filter]);
}

function buildEventMessage(event: NostrEventLike): string {
  return JSON.stringify(['EVENT', event]);
}

/**
 * finalizeEvent from nostr-tools: signs a partial event and returns the full
 * signed Event. We import it lazily to keep the class testable with mocks.
 */
async function signEvent(
  partial: { kind: number; content: string; tags: string[][]; created_at: number },
  sk: Uint8Array,
): Promise<NostrEventLike> {
  const { finalizeEvent } = await import('nostr-tools');
  return finalizeEvent(partial, sk) as NostrEventLike;
}

// ── Plugin ────────────────────────────────────────────────────────────────────

export class NostrPlugin extends BasePlugin {
  readonly type: PluginType = 'nostr';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: true,
    canTypingIndicator: false,
  };

  private sk: Uint8Array | null = null;
  private pk: string = '';
  private relayStates: RelayState[] = [];
  private stopped = false;
  /**
   * Unix seconds: start time - small overlap so we don't miss recent events.
   * NOTE (LOW-1 documented limitation): `since` is NOT persisted across restarts.
   * After a restart, events older than 120s before the bot came back up are lost,
   * and events inside the 120s window may be replayed (since `seenEvents` below
   * is also in-memory and empty on cold start). OpenClaw persists both
   * `lastProcessedAt` and `recentEventIds` to disk via `nostr-state-store`
   * (nostr-bus.ts:434-450); porting that requires Electron `app.getPath('userData')`
   * wiring that lives outside this class. Deferred - see review LOW-1.
   */
  private since = 0;
  /**
   * Bounded LRU+TTL dedupe map: event id → expires-at (ms). Replaces the
   * previously-unbounded `Set<string>` (audit MED-1). Capped at MAX_SEEN
   * entries; entries expire after SEEN_TTL_MS. Cleanup runs lazily on insert
   * via `cleanSeen()`.
   */
  private seenEvents: Map<string, number> = new Map();
  /**
   * Hex pubkeys allowed to message the bot. Empty Set = open mode (every
   * authenticated sender is accepted). Populated from `credentials.allowedSenders`
   * (comma-separated npub or hex) in `onInitialize`. Mirrors OpenClaw's
   * `dmPolicy: allowlist` + `allowFrom: string[]` (nostr-bus.ts:609-618).
   */
  private readonly allowedSenders = new Set<string>();

  /**
   * Per-sender fixed-window rate-limit state (audit MED-3). Resets every
   * RATE_LIMIT_WINDOW_MS. Mirrors OpenClaw `perSenderRateLimiter`.
   */
  private senderWindowCounts = new Map<string, { count: number; resetAt: number }>();
  /** Global fixed-window rate-limit state (audit MED-3). */
  private globalWindow = { count: 0, resetAt: 0 };

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const privateKey = typeof creds['privateKey'] === 'string' ? creds['privateKey'].trim() : '';
    if (!privateKey) throw new Error('Nostr private key is required');

    this.sk = validatePrivateKey(privateKey);
    this.pk = derivePublicKey(privateKey);

    const rawRelays = creds['relays'];
    const relays: string[] =
      Array.isArray(rawRelays) && rawRelays.length > 0
        ? (rawRelays as string[]).filter((r) => typeof r === 'string' && r.trim().startsWith('wss://'))
        : DEFAULT_RELAYS;

    if (relays.length === 0) throw new Error('At least one wss:// relay URL is required');

    // Parse optional sender allowlist. Accepts comma-separated string or string[].
    // Each entry is normalized (npub → hex, hex → lowercase) via normalizePubkey.
    // Invalid entries are dropped with a warning; empty result = open mode.
    this.allowedSenders.clear();
    const rawAllowed = creds['allowedSenders'];
    const allowedRaw: string[] = Array.isArray(rawAllowed)
      ? (rawAllowed as unknown[]).filter((v): v is string => typeof v === 'string')
      : typeof rawAllowed === 'string'
        ? rawAllowed.split(',')
        : [];
    for (const entry of allowedRaw) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      try {
        this.allowedSenders.add(normalizePubkey(trimmed));
      } catch (err) {
        console.warn(
          `[NostrPlugin] Skipping invalid allowedSenders entry "${trimmed}":`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    this.relayStates = relays.map((url): RelayState => ({
      url,
      ws: null,
      status: 'connecting',
      failureCount: 0,
      reconnectTimer: null,
      subId: makeSubId(),
    }));
  }

  protected async onStart(): Promise<void> {
    if (!this.sk || !this.pk) throw new Error('Nostr plugin not initialized');
    this.stopped = false;
    // 120s lookback to tolerate relay lag and clock skew (matches OpenClaw).
    this.since = Math.floor(Date.now() / 1000) - 120;

    // Wait for at least one relay to reach 'connected' before resolving.
    // Promise.any resolves on the first success; if all fail we still continue
    // so the plugin can recover via scheduleReconnect. A 10s timeout prevents
    // hanging indefinitely when all relays are unreachable at startup.
    const connectPromises = this.relayStates.map((state) => this.connectRelay(state));
    await Promise.race([
      Promise.any(connectPromises).catch(() => Promise.resolve()),
      new Promise<void>((r) => setTimeout(r, 10_000)),
    ]);
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;
    for (const state of this.relayStates) {
      if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
        state.reconnectTimer = null;
      }
      this.closeRelayWs(state);
    }
    this.relayStates = [];
    this.sk = null;
    this.pk = '';
    this.seenEvents.clear();
    this.senderWindowCounts.clear();
    this.globalWindow = { count: 0, resetAt: 0 };
  }

  // ── Guards: dedupe LRU + rate-limit (audit MED-1 / MED-3) ────────────────────

  /** Evict expired entries, then trim to MAX_SEEN by oldest-insertion order. */
  private cleanSeen(): void {
    const now = Date.now();
    for (const [id, exp] of this.seenEvents) {
      if (exp < now) this.seenEvents.delete(id);
    }
    while (this.seenEvents.size > MAX_SEEN) {
      const oldest = this.seenEvents.keys().next().value;
      if (!oldest) break;
      this.seenEvents.delete(oldest);
    }
  }

  private markSeen(id: string): void {
    this.cleanSeen();
    this.seenEvents.set(id, Date.now() + SEEN_TTL_MS);
  }

  private isSeen(id: string): boolean {
    const exp = this.seenEvents.get(id);
    if (exp === undefined) return false;
    if (exp < Date.now()) {
      this.seenEvents.delete(id);
      return false;
    }
    return true;
  }

  /** Returns true if the inbound event is within both the per-sender and global windows. */
  private withinRateLimit(sender: string): boolean {
    const now = Date.now();
    // Global window
    if (this.globalWindow.resetAt < now) {
      this.globalWindow = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    }
    if (this.globalWindow.count >= RATE_LIMIT_MAX_GLOBAL) return false;
    // Per-sender window
    const slot = this.senderWindowCounts.get(sender);
    if (!slot || slot.resetAt < now) {
      this.senderWindowCounts.set(sender, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      this.globalWindow.count += 1;
      return true;
    }
    if (slot.count >= RATE_LIMIT_MAX_PER_SENDER) return false;
    slot.count += 1;
    this.globalWindow.count += 1;
    return true;
  }

  // ── Send / React ─────────────────────────────────────────────────────────────

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.sk || !this.pk) throw new Error('Nostr plugin not running');
    const plaintext = fromUnifiedOutgoingToNostr(message);
    if (!plaintext) return '';

    const recipientPubkey = chatId; // chatId is the hex pubkey of the recipient
    const ciphertext = nip04Encrypt(this.sk, recipientPubkey, plaintext);
    const partial = {
      kind: 4,
      content: ciphertext,
      tags: [['p', recipientPubkey]],
      created_at: Math.floor(Date.now() / 1000),
    };
    const signed = await signEvent(partial, this.sk);
    await this.publishToRelays(signed);
    return signed.id;
  }

  /**
   * Publish a kind:7 reaction event. emoji defaults to '+' (like).
   * chatId is the pubkey of the original sender; messageId is the event id.
   */
  async addReaction(chatId: string, messageId: string, emoji = '+'): Promise<void> {
    if (!this.sk || !this.pk) throw new Error('Nostr plugin not running');
    const partial = {
      kind: 7,
      content: emoji,
      tags: [
        ['e', messageId],
        ['p', chatId],
      ],
      created_at: Math.floor(Date.now() / 1000),
    };
    const signed = await signEvent(partial, this.sk);
    await this.publishToRelays(signed);
  }

  getActiveUserCount(): number {
    return 0;
  }

  getBotInfo(): BotInfo | null {
    if (!this.pk) return null;
    const npub = hexToNpub(this.pk);
    return { id: this.pk, username: npub, displayName: npub };
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('Nostr uses persistent WebSocket relays, not webhooks');
  }

  // ── Relay management ──────────────────────────────────────────────────────────

  /**
   * Open a WebSocket to the relay and subscribe. Returns a Promise that
   * resolves once the relay is connected (open event fired), or rejects on
   * error/close before open. Used by onStart to await the first live relay.
   * Reconnect logic (scheduleReconnect) still fires on subsequent closes.
   */
  private connectRelay(state: RelayState): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.stopped) { reject(new Error('stopped')); return; }

      state.subId = makeSubId();
      const ws = new WebSocket(state.url);
      state.ws = ws;
      state.status = 'connecting';

      let settled = false;

      ws.on('open', () => {
        if (this.stopped || state.ws !== ws) return;
        state.status = 'connected';
        state.failureCount = 0;
        console.log(`[NostrPlugin] connected to ${state.url}`);

        // Subscribe to kind:4 DMs tagged to our pubkey.
        ws.send(buildReqMessage(state.subId, this.pk, this.since));

        if (!settled) { settled = true; resolve(); }
      });

    ws.on('message', (data: Buffer | string) => {
      if (this.stopped || state.ws !== ws) return;
      this.handleRelayMessage(String(data), state);
    });

    ws.on('error', (err: Error) => {
      if (this.stopped || state.ws !== ws) return;
      console.warn(`[NostrPlugin] relay error ${state.url}:`, err.message);
      if (!settled) { settled = true; reject(err); }
    });

    ws.on('close', () => {
      if (this.stopped || state.ws !== ws) return;
      console.warn(`[NostrPlugin] relay closed ${state.url}, scheduling reconnect`);
      state.status = 'down';
      state.ws = null;
      if (!settled) { settled = true; reject(new Error(`relay ${state.url} closed before open`)); }
      this.scheduleReconnect(state);
    });
    }); // end new Promise
  }

  private closeRelayWs(state: RelayState): void {
    const ws = state.ws;
    state.ws = null;
    state.status = 'down';
    if (ws) {
      try {
        ws.removeAllListeners();
        ws.terminate();
      } catch {
        // ignore teardown errors
      }
    }
  }

  private scheduleReconnect(state: RelayState): void {
    if (this.stopped) return;
    if (state.reconnectTimer) return; // already scheduled

    state.failureCount += 1;

    if (state.failureCount > RECONNECT_BACKOFF_MAX_ATTEMPTS) {
      console.error(`[NostrPlugin] relay ${state.url} down after ${RECONNECT_BACKOFF_MAX_ATTEMPTS} attempts`);
      state.status = 'down';
      this.updatePluginStatus();
      return;
    }

    // Audit gemini MED1 2026-05-18: per-relay jitter (0-1000ms) to avoid
    // synchronized reconnect storms across multiple bots when a relay flaps.
    const delay = Math.min(
      RECONNECT_BACKOFF_START_MS * 2 ** (state.failureCount - 1),
      RECONNECT_BACKOFF_CAP_MS,
    ) + Math.floor(Math.random() * 1000);
    console.warn(
      `[NostrPlugin] relay ${state.url} attempt ${state.failureCount}/${RECONNECT_BACKOFF_MAX_ATTEMPTS} in ${delay}ms`,
    );
    this.setError(`Relay ${state.url} disconnected; retrying in ${Math.round(delay / 1000)}s`);

    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      if (this.stopped) return;
      // Reconnect attempts: catch the rejection so it doesn't surface as an
      // unhandled rejection. scheduleReconnect will be called again from the
      // ws 'close' handler inside connectRelay if it fails.
      void this.connectRelay(state).catch((): undefined => undefined);
    }, delay);

    this.updatePluginStatus();
  }

  /**
   * Status='error' only if ALL relays are down. While at least one relay is
   * connected the plugin stays 'running' so the channel remains partially live.
   */
  private updatePluginStatus(): void {
    if (this.stopped) return;
    const allDown = this.relayStates.every((s) => s.status === 'down');
    if (allDown) {
      this.setStatus('error', 'All Nostr relays are down');
    }
  }

  // ── Inbound event handling ────────────────────────────────────────────────────

  private handleRelayMessage(raw: string, _state: RelayState): void {
    let msg: unknown;
    try {
      msg = JSON.parse(raw) as unknown;
    } catch {
      return; // unparseable relay message - silently drop
    }

    if (!Array.isArray(msg) || msg.length < 2) return;
    const type = msg[0] as string;

    if (type === 'EVENT' && msg.length >= 3) {
      const event = msg[2] as NostrEventLike;
      this.handleInboundEvent(event);
    }
    // NOTICE and EOSE are informational - no action needed.
  }

  private handleInboundEvent(event: NostrEventLike): void {
    if (!this.sk || !this.pk) return;

    // Deduplicate across relay fanout (MED-1 - bounded LRU+TTL).
    if (this.isSeen(event.id)) return;
    this.markSeen(event.id);

    // Only kind:4 NIP-04 DMs.
    if (event.kind !== 4) return;

    // Self-echo filter.
    if (event.pubkey === this.pk) return;

    // Must be tagged to our pubkey.
    const targetsUs = event.tags.some((t) => t[0] === 'p' && t[1] === this.pk);
    if (!targetsUs) return;

    // Stale-event filter.
    if (event.created_at < this.since) return;

    // Future-timestamp guard (MED-2). Reject events more than
    // MAX_FUTURE_SKEW_SEC ahead of our clock to prevent clock-skew attacks.
    if (event.created_at > Math.floor(Date.now() / 1000) + MAX_FUTURE_SKEW_SEC) {
      console.warn(
        `[NostrPlugin] Dropping future-dated event: ${event.id} from ${event.pubkey}`,
      );
      return;
    }

    // [HIGH-1] Verify Schnorr signature. NIP-04 provides confidentiality but
    // NOT authenticity - without verifyEvent a malicious relay can forge a
    // kind:4 event bearing any pubkey and have it routed to emitMessage.
    // Mirrors OpenClaw nostr-bus.ts:599-603.
    if (!verifyEvent(event as unknown as Parameters<typeof verifyEvent>[0])) {
      console.warn(`[NostrPlugin] Dropping event with invalid signature: id=${event.id}`);
      return;
    }

    // [HIGH-2] Sender authorization. When `allowedSenders` is non-empty, only
    // listed pubkeys may message the bot. Empty = open mode (matches OpenClaw
    // `dmPolicy: open`); production deployments should set an allowlist.
    // Mirrors OpenClaw nostr-bus.ts:609-618.
    if (this.allowedSenders.size > 0 && !this.allowedSenders.has(event.pubkey)) {
      console.warn(`[NostrPlugin] Dropping event from unauthorized sender: ${event.pubkey}`);
      return;
    }

    // Per-sender + global rate-limit (MED-3). Applied AFTER the cheap-to-check
    // filters so we don't burn rate-limit budget on self-echo or wrong-target
    // events.
    if (!this.withinRateLimit(event.pubkey)) {
      console.debug(
        `[NostrPlugin] Rate-limit drop: event ${event.id} from ${event.pubkey}`,
      );
      return;
    }

    // [HIGH-3] Cap ciphertext size BEFORE decrypt to prevent DoS via giant
    // payloads streamed through nip04Decrypt's AES path. Mirrors OpenClaw
    // nostr-bus.ts:586-592.
    const ciphertextBytes = Buffer.byteLength(event.content, 'utf8');
    if (ciphertextBytes > MAX_CIPHERTEXT_BYTES) {
      console.warn(
        `[NostrPlugin] Dropping oversized ciphertext: ${ciphertextBytes} bytes from ${event.pubkey}`,
      );
      return;
    }

    let plaintext: string;
    try {
      plaintext = nip04Decrypt(this.sk, event.pubkey, event.content);
    } catch (err) {
      console.warn(`[NostrPlugin] NIP-04 decrypt failed for event ${event.id}:`, err);
      return;
    }

    // [HIGH-3] Cap plaintext size AFTER decrypt to prevent downstream DoS
    // (decryption can expand the payload). Mirrors OpenClaw nostr-bus.ts:635-638.
    const plaintextBytes = Buffer.byteLength(plaintext, 'utf8');
    if (plaintextBytes > MAX_PLAINTEXT_BYTES) {
      console.warn(
        `[NostrPlugin] Dropping oversized plaintext: ${plaintextBytes} bytes from ${event.pubkey}`,
      );
      return;
    }

    if (!plaintext.trim()) return;

    const unified = toUnifiedIncomingFromNostr(event, plaintext);
    void this.emitMessage(unified).catch((err) =>
      console.error('[NostrPlugin] emitMessage failed:', err),
    );
  }

  // ── Publish helpers ───────────────────────────────────────────────────────────

  /**
   * Publish a signed event to all connected relays. Throws if no relay
   * accepts the publish (all relays down or all fail).
   */
  private async publishToRelays(event: NostrEventLike): Promise<void> {
    const connected = this.relayStates.filter((s) => s.status === 'connected' && s.ws);
    if (connected.length === 0) throw new Error('No Nostr relays connected');

    const wire = buildEventMessage(event);
    const results = await Promise.allSettled(
      connected.map((state) =>
        new Promise<void>((resolve, reject) => {
          if (!state.ws) { reject(new Error('ws gone')); return; }
          const okListener = (data: Buffer | string) => {
            try {
              const msg = JSON.parse(String(data)) as unknown[];
              if (Array.isArray(msg) && msg[0] === 'OK' && msg[1] === event.id) {
                state.ws!.off('message', okListener);
                if (msg[2] === true) resolve();
                else reject(new Error(String(msg[3] ?? 'relay rejected event')));
              }
            } catch {
              // keep waiting
            }
          };
          state.ws.on('message', okListener);
          // Resolve after 3s even without OK - relay may not send it.
          setTimeout(() => { state.ws?.off('message', okListener); resolve(); }, 3_000);
          try {
            state.ws.send(wire);
          } catch (err) {
            state.ws.off('message', okListener);
            reject(err);
          }
        }),
      ),
    );

    const anyOk = results.some((r) => r.status === 'fulfilled');
    if (!anyOk) {
      const firstErr = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      throw new Error(`Failed to publish to any relay: ${firstErr?.reason instanceof Error ? firstErr.reason.message : String(firstErr?.reason)}`);
    }
  }

  // ── Static testConnection ─────────────────────────────────────────────────────

  /**
   * Validate credentials by deriving the pubkey from the private key, then
   * opening a WebSocket to the first relay and waiting for EOSE (end of stored
   * events) within TEST_CONNECT_TIMEOUT_MS. Returns botUsername as npub.
   *
   * Token is JSON-encoded: { privateKey: string, relays: string[] }.
   */
  static override async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let parsed: { privateKey?: string; relays?: string[] };
    try {
      parsed = JSON.parse(token) as typeof parsed;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }

    const privateKey = parsed.privateKey?.trim() ?? '';
    if (!privateKey) return { success: false, error: 'Private key is required' };

    let sk: Uint8Array;
    let pk: string;
    try {
      sk = validatePrivateKey(privateKey);
      pk = derivePublicKey(privateKey);
      void sk; // used indirectly via derivePublicKey above
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }

    const relays = Array.isArray(parsed.relays) && parsed.relays.length > 0
      ? parsed.relays
      : DEFAULT_RELAYS;

    const relayUrl = relays[0];

    return new Promise((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { ws.terminate(); } catch { /* ignore */ }
        resolve({ success: false, error: `Relay did not respond within ${TEST_CONNECT_TIMEOUT_MS / 1000}s` });
      }, TEST_CONNECT_TIMEOUT_MS);

      const ws = new WebSocket(relayUrl);

      ws.on('open', () => {
        const subId = makeSubId();
        const filter: NostrFilter = { kinds: [4], '#p': [pk], since: Math.floor(Date.now() / 1000), limit: 1 };
        ws.send(JSON.stringify(['REQ', subId, filter]));
      });

      ws.on('message', (data: Buffer | string) => {
        try {
          const msg = JSON.parse(String(data)) as unknown[];
          if (Array.isArray(msg) && (msg[0] === 'EOSE' || msg[0] === 'EVENT' || msg[0] === 'NOTICE')) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { ws.terminate(); } catch { /* ignore */ }
            resolve({ success: true, botUsername: hexToNpub(pk) });
          }
        } catch {
          // keep waiting
        }
      });

      ws.on('error', (err: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ success: false, error: err.message });
      });

      ws.on('close', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ success: false, error: 'Relay connection closed before EOSE' });
      });
    });
  }
}
