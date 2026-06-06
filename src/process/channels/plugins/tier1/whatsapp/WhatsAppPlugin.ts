/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WhatsAppPlugin - Wayland's tier-1 WhatsApp surface.
 *
 * Transport: spawns the `whatsapp-bridge` Node subprocess via
 * `child_process.fork` and speaks JSON-RPC 2.0 over stdio (one JSON object
 * per `\n`). Three interchangeable backends, selected at fork time via the
 * `--backend` CLI flag:
 *
 *   - `baileys`       (default) direct WhatsApp Web protocol - pairs via QR
 *   - `whatsapp-web`  whatsapp-web.js library - pairs via QR
 *   - `meta-business` Meta WhatsApp Business Cloud API - webhooks + REST
 *
 * Capability surface is declared at the optimistic union: the Baileys /
 * whatsapp-web.js backends support reactions and typing-presence updates,
 * so we expose those flags at the class level. The Meta Cloud API can't do
 * either, so the corresponding bridge handlers return `{ok: false, reason}`
 * notifications which we surface via `setError`. We never advertise edit
 * capability - WhatsApp has no edit primitive on any backend.
 *
 * Webhook routing: only the `meta-business` backend ever sees inbound HTTPS
 * deliveries. The parent process's WebhookReceiver HMAC-verifies the
 * `X-Hub-Signature-256` header and routes the parsed payload here via
 * `handleWebhookPayload`. We forward the payload to the bridge via the
 * `webhookDelivery` JSON-RPC method; the bridge re-emits per-message
 * `inbound.message` notifications which flow back through the same
 * messageHandler path the Baileys/web backends use.
 */

import type { ChildProcess} from 'child_process';
import { fork } from 'child_process';
import { randomUUID } from 'crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { app } from 'electron';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';

/** Backend selector for the whatsapp-bridge subprocess. */
export type WhatsAppBackend = 'baileys' | 'whatsapp-web' | 'meta-business';

/** JSON-RPC primitive types - the bridge wire-format is JSON. */
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

type JsonRpcFrame = JsonRpcResponse | JsonRpcNotification;

/**
 * Shape of `inbound.message` notifications from the bridge. Both the Baileys
 * and Meta backends emit this exact subset (see backends/baileys.js line 254
 * and backends/meta-business.js line 111).
 */
interface BridgeInboundMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  /** Baileys-only: full JID `<num>@s.whatsapp.net` for outbound reply targeting (W-9). */
  senderRawJid?: string;
  senderName?: string;
  isGroup?: boolean;
  fromMe?: boolean;
  body?: string;
  mediaType?: string;
  mediaId?: string;
  mediaPath?: string;
  timestamp?: number;
  /** Reply / quote context. Baileys: `contextInfo.stanzaId`. Meta: `msg.context.id`. (W-5) */
  replyToMessageId?: string;
  /** Meta reaction event: id of the message the emoji reacted to. (W-6) */
  reactionMessageId?: string;
}

/** Hard deadline for webhookDelivery RPC; without it a wedged bridge would
 *  hang the WebhookReceiver Express handler. Mirrors onStop's race pattern. */
const WEBHOOK_DELIVERY_TIMEOUT_MS = 5_000;

/**
 * Resolve the bridge entry path for both dev and packaged Electron builds.
 *
 * Packaged: electron-builder's `extraResources` rule copies the bridge dir to
 *   `<process.resourcesPath>/whatsapp-bridge/`. The bundled JS bundle would
 *   never resolve to a real on-disk path because it lives inside `app.asar`,
 *   so `child_process.fork` would throw ENOENT. We point at the resources
 *   copy instead, which is real on disk and ships with its own node_modules/.
 *
 * Dev: the source tree is real on disk; resolve relative to this file's
 *   compiled location. electron-vite bundles the main process into
 *   `out/main/`, but the source layout maps deterministically so the relative
 *   path `../../../whatsapp-bridge/bridge.js` from this file's compiled
 *   location still lands on `src/process/channels/whatsapp-bridge/bridge.js`
 *   in dev runs.
 */
export function resolveBridgeEntryPath(): string {
  // `app` is undefined in non-Electron unit-test contexts; guard so we don't
  // throw before tests can mock it.
  const isPackaged = (() => {
    try {
      return Boolean(app?.isPackaged);
    } catch {
      return false;
    }
  })();
  if (isPackaged) {
    return path.join(process.resourcesPath, 'whatsapp-bridge', 'bridge.js');
  }
  // Dev: __dirname semantics differ between tsc-noEmit/vitest (source tree)
  // and electron-vite (out/main/index.js bundle). Try each candidate path
  // and return the first one that actually exists on disk.
  const candidates = [
    // 1. From source tree (vitest / tsc-noEmit):
    //    src/process/channels/plugins/tier1/whatsapp/ → src/process/channels/whatsapp-bridge/bridge.js
    path.resolve(__dirname, '../../../whatsapp-bridge/bridge.js'),
    // 2. From electron-vite compiled main (out/main/index.js) - app.getAppPath()
    //    returns the unpacked app root, which contains src/ in dev runs.
    (() => {
      try {
        return path.resolve(
          app.getAppPath(),
          'src/process/channels/whatsapp-bridge/bridge.js'
        );
      } catch {
        return '';
      }
    })(),
  ].filter((p): p is string => p.length > 0);
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // Continue to next candidate
    }
  }
  // Fallback to the first candidate so callers still get a (possibly
  // ENOENT-ing) path rather than empty string. Tests assert this path shape.
  return candidates[0] ?? path.resolve(__dirname, '../../../whatsapp-bridge/bridge.js');
}

/**
 * R6 (v0.4.3): IPv4 private/reserved-range guard for SSRF defense. Covers
 * 10/8 + 172.16/12 + 192.168/16 (RFC1918), 127/8 (loopback), 169.254/16
 * (link-local), 0.0.0.0/8 (this-network), 100.64/10 (CGNAT). Accepts
 * decimal-dotted v4 only.
 */
export function isPrivateIPv4(addr: string): boolean {
  const parts = addr.split('.');
  if (parts.length !== 4) return false;
  const oct = parts.map((p) => Number(p));
  if (oct.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = oct as [number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

/**
 * R6 (v0.4.3): IPv6 private/reserved-range guard. Covers ::1 (loopback),
 * fc00::/7 (ULA), fe80::/10 (link-local), and IPv4-mapped (::ffff:a.b.c.d).
 */
export function isPrivateIPv6(addr: string): boolean {
  const normalized = addr.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  const mappedMatch = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(normalized);
  if (mappedMatch) return isPrivateIPv4(mappedMatch[1]!);
  if (/^f[cd][0-9a-f]{0,2}:/.test(normalized)) return true;
  if (/^fe[89ab][0-9a-f]?:/.test(normalized)) return true;
  return false;
}

export class WhatsAppPlugin extends BasePlugin {
  readonly type: PluginType = 'whatsapp';

  /**
   * Optimistic capability set covering Baileys / whatsapp-web.js. The Meta
   * Cloud API cannot do reactions or typing indicators - the bridge handler
   * returns an explicit `{ok: false}` for those calls and we surface the
   * downgrade via `setError` rather than lying about the capability up front.
   * Edit is never advertised: WhatsApp has no edit primitive.
   */
  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: true,
    canTypingIndicator: true,
  };

  private backend: WhatsAppBackend = 'baileys';
  private child: ChildProcess | null = null;
  private rpcId = 0;
  private readonly pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (err: Error) => void }
  >();
  private stdoutBuf = '';
  private connectionState: string = 'starting';
  private lastQr: string | null = null;
  private readonly activeUsers = new Set<string>();
  private accessToken: string | null = null;
  private phoneNumberId: string | null = null;
  /**
   * W-10 (v0.4.3): reconnect ladder for the bridge subprocess. Mirrors
   * OpenClaw's `reconnect.ts` shape - exponential backoff capped at maxMs,
   * hard cap on total attempts so a permanently broken backend doesn't
   * busy-loop. Without this, an unclean bridge exit (e.g. transient Baileys
   * websocket drop) parks the channel in `error` forever and the user has to
   * disable + re-enable to recover.
   */
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopRequested = false;
  private static readonly RECONNECT_INITIAL_MS = 2_000;
  private static readonly RECONNECT_MAX_MS = 30_000;
  private static readonly RECONNECT_FACTOR = 1.8;
  private static readonly RECONNECT_MAX_ATTEMPTS = 12;

  // ==================== BasePlugin lifecycle ====================

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const requested = (typeof creds.backend === 'string' ? creds.backend : 'baileys') as WhatsAppBackend;
    if (requested !== 'baileys' && requested !== 'whatsapp-web' && requested !== 'meta-business') {
      throw new Error(`Unsupported WhatsApp backend: ${requested}`);
    }
    this.backend = requested;

    if (this.backend === 'meta-business') {
      const accessToken = typeof creds.accessToken === 'string' ? creds.accessToken.trim() : '';
      const phoneNumberId = typeof creds.phoneNumberId === 'string' ? creds.phoneNumberId.trim() : '';
      if (!accessToken) throw new Error('Meta WhatsApp Cloud API requires accessToken');
      if (!phoneNumberId) throw new Error('Meta WhatsApp Cloud API requires phoneNumberId');
      this.accessToken = accessToken;
      this.phoneNumberId = phoneNumberId;
    }

    this.forkBridge();
  }

  protected async onStart(): Promise<void> {
    if (!this.child) {
      throw new Error('WhatsApp bridge subprocess not started');
    }
    // W-10 v0.4.3 Wave D: only reset state on an EXTERNAL start (after a real
    // onStop). scheduleReconnect also calls back into onStart during the
    // reconnect cycle, and if we reset the attempt counter there the ladder
    // would never exhaust. stopRequested distinguishes the two: true after
    // onStop, false during a reconnect cycle. (codex re-audit MED.)
    if (this.stopRequested) {
      this.stopRequested = false;
      this.reconnectAttempts = 0;
    }
    const params: Record<string, JsonValue> = {};
    if (this.backend === 'meta-business') {
      // Meta backend needs creds on every (re)connect - Cloud API is stateless.
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('Meta credentials missing at start');
      }
      params.accessToken = this.accessToken;
      params.phoneNumberId = this.phoneNumberId;
      const businessAccountId = this.config?.credentials?.businessAccountId;
      if (typeof businessAccountId === 'string' && businessAccountId.length > 0) {
        params.businessAccountId = businessAccountId;
      }
    }
    // Baileys / whatsapp-web.js: no params - sessionDir is supplied at fork
    // time via CLI flag, and pairing is interactive via the qr.update event.
    await this.rpc('connect', params);
  }

  protected async onStop(): Promise<void> {
    // W-10 (v0.4.3): tell the exit handler not to relaunch the bridge, and
    // cancel any in-flight respawn before we start tearing down. Must come
    // BEFORE killChild so the SIGTERM-triggered exit event doesn't see
    // stopRequested=false and schedule a reconnect against a torn-down plugin.
    this.stopRequested = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (!this.child) return;
    try {
      // Best-effort graceful disconnect. If the bridge is wedged, the SIGTERM
      // below kicks in either way.
      await Promise.race([
        this.rpc('disconnect', {}),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
    } catch (err) {
      console.warn('[whatsappPlugin] disconnect rpc failed (ignored):', err);
    } finally {
      await this.killChild();
    }
    this.activeUsers.clear();
    this.lastQr = null;
    this.connectionState = 'disconnected';
  }

  // ==================== Outbound surface ====================

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.child) throw new Error('WhatsApp bridge not running');
    const hasMedia =
      message.type === 'image' || message.type === 'file' || !!message.imageUrl || !!message.fileUrl;
    if (hasMedia) {
      const mediaType = message.type === 'image' || message.imageUrl ? 'image' : 'document';
      const mediaUrl = message.imageUrl ?? message.fileUrl ?? '';
      // W-1 CRIT: Meta accepts `link` (URL); Baileys / whatsapp-web.js require
      // a local `filePath`. For QR backends, download the media to a temp file
      // first and pass `filePath`; for Meta, keep the URL.
      const params: Record<string, JsonValue> = {
        chatId,
        mediaType,
        caption: message.text ?? '',
        fileName: message.fileName ?? '',
      };
      let tempPath: string | null = null;
      try {
        if (this.backend === 'meta-business') {
          params.mediaUrl = mediaUrl;
        } else {
          tempPath = await this.downloadMediaToTemp(mediaUrl, mediaType, message.fileName);
          params.filePath = tempPath;
          params.mediaUrl = mediaUrl; // fall-back hint for bridges that accept either
        }
        const result = (await this.rpc('sendMedia', params)) as { messageId: string | null } | null;
        return result?.messageId ?? '';
      } finally {
        if (tempPath) {
          fs.promises.unlink(tempPath).catch(() => {
            // best-effort cleanup; OS will sweep tmp eventually.
          });
        }
      }
    }
    const text = (message.text ?? '').trim();
    if (!text) throw new Error('WhatsApp message body cannot be empty');
    const result = (await this.rpc('sendText', { chatId, text })) as
      | { messageId: string | null }
      | null;
    return result?.messageId ?? '';
  }

  /**
   * W-1 CRIT helper: download a remote media URL to a tmp file for handoff to
   * the Baileys / whatsapp-web bridge. Returns the absolute path. Caller is
   * responsible for unlinking after the RPC completes.
   */
  private async downloadMediaToTemp(
    mediaUrl: string,
    mediaType: string,
    fileName?: string,
  ): Promise<string> {
    if (!mediaUrl) throw new Error('WhatsApp media send: mediaUrl required');
    const ext = (() => {
      if (fileName && /\.[A-Za-z0-9]+$/.test(fileName)) {
        return fileName.slice(fileName.lastIndexOf('.'));
      }
      if (mediaType === 'image') return '.jpg';
      if (mediaType === 'video') return '.mp4';
      if (mediaType === 'audio') return '.ogg';
      return '.bin';
    })();
    // SSRF guard (codex v0.4.2 re-audit NEW): reject mediaUrl pointing at
    // private/local-network destinations. Without this an agent-supplied URL
    // could pivot the Electron main process to internal HTTP endpoints
    // before handing the temp file to Baileys. Allow only http(s) scheme +
    // resolve host against IPv4/IPv6 private ranges.
    let parsed: URL;
    try {
      parsed = new URL(mediaUrl);
    } catch {
      throw new Error(`WhatsApp media send: invalid mediaUrl: ${mediaUrl}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`WhatsApp media send: unsupported scheme ${parsed.protocol} (http/https only)`);
    }
    // URL parser keeps IPv6 literal hostnames wrapped in [brackets]; strip
    // them before passing to net.isIP / dns.lookup.
    const rawHost = parsed.hostname.toLowerCase();
    const host = rawHost.startsWith('[') && rawHost.endsWith(']')
      ? rawHost.slice(1, -1)
      : rawHost;
    // R6 (v0.4.3): Resolve hostname via DNS and reject if ANY returned address
    // is in a private range. Closes DNS-rebinding bypass where an attacker
    // points "internal.example.com" at 127.0.0.1. For IP literals, isIP()
    // short-circuits the DNS lookup. IPv6 link-local (fe80::/10) and ULA
    // (fc00::/7) covered. 0.0.0.0/8 + CGNAT (100.64/10) also blocked.
    if (host === 'localhost') {
      throw new Error(
        `SSRF: ${parsed.hostname} resolves to private address`,
      );
    }
    const ipVer = net.isIP(host);
    let addresses: { address: string; family: number }[];
    if (ipVer !== 0) {
      addresses = [{ address: host, family: ipVer }];
    } else {
      try {
        addresses = await dns.lookup(host, { all: true });
      } catch (err) {
        throw new Error(`WhatsApp media send: DNS lookup failed for ${host}: ${(err as Error).message}`);
      }
    }
    for (const { address, family } of addresses) {
      const isPrivate = family === 6 ? isPrivateIPv6(address) : isPrivateIPv4(address);
      if (isPrivate) {
        throw new Error(`SSRF: ${parsed.hostname} resolves to private address`);
      }
    }
    const tempPath = path.join(os.tmpdir(), `wayland-wa-${randomUUID()}${ext}`);
    // R6 v0.4.3 Wave D: codex re-audit caught two SSRF escape hatches.
    //   1. Redirects: even a single 30x to http://127.0.0.1/... bypasses the
    //      private-range guard above, because the redirect target is fetched
    //      without re-validation. Disable redirect-following; callers that
    //      need a 30x must pre-resolve their CDN URL.
    //   2. DNS rebinding (TOCTOU): between dns.lookup and axios connect, the
    //      resolver can answer differently. Pin the resolution by handing the
    //      agent a custom `lookup` that returns the already-validated address,
    //      so the connect attempt cannot land on a private IP.
    const pinned = addresses[0]!;
    const pinnedLookup = (
      _hostname: string,
      _options: unknown,
      callback: (err: Error | null, address: string, family: number) => void,
    ): void => {
      callback(null, pinned.address, pinned.family);
    };
    const HttpsAgent = (await import('node:https')).Agent;
    const HttpAgent = (await import('node:http')).Agent;
    const res = await axios.get<ArrayBuffer>(mediaUrl, {
      responseType: 'arraybuffer',
      timeout: 60_000,
      maxContentLength: 100 * 1024 * 1024, // Meta caps inbound/outbound media at 100MB.
      maxRedirects: 0,
      httpsAgent: new HttpsAgent({ lookup: pinnedLookup as never }),
      httpAgent: new HttpAgent({ lookup: pinnedLookup as never }),
    });
    await fs.promises.writeFile(tempPath, Buffer.from(res.data));
    return tempPath;
  }

  /**
   * WhatsApp has no edit primitive on any backend. Default no-op on BasePlugin
   * would silently swallow updates - we throw to make the limitation visible
   * to anyone who calls past `capabilities.canEdit` (which is false).
   */
  override async editMessage(
    _chatId: string,
    _messageId: string,
    _message: IUnifiedOutgoingMessage,
  ): Promise<void> {
    throw new Error('WhatsApp does not support editing messages');
  }

  /**
   * Meta WhatsApp Business Cloud API only. The WebhookReceiver has already
   * verified the `X-Hub-Signature-256` HMAC and deduplicated against replays
   * before calling. We forward to the bridge's `webhookDelivery` RPC which
   * parses the payload and re-emits per-message `inbound.message`
   * notifications - those flow back here through the same handler the
   * Baileys/web backends use, so the agent surface is uniform.
   */
  override async handleWebhookPayload(
    payload: object,
    headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string,
  ): Promise<void> {
    if (this.backend !== 'meta-business') {
      throw new Error(
        `[whatsappPlugin] handleWebhookPayload only valid for meta-business backend (active: ${this.backend})`,
      );
    }
    if (!this.child) {
      throw new Error('[whatsappPlugin] webhook delivery received but bridge not running');
    }
    // Race the RPC against a hard deadline. Without this, a wedged bridge
    // child would hang the WebhookReceiver Express handler forever and
    // exhaust receiver concurrency. Mirrors onStop's disconnect-race.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('whatsapp bridge webhookDelivery timeout')),
        WEBHOOK_DELIVERY_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([
        this.rpc('webhookDelivery', {
          payload: payload as Record<string, JsonValue>,
          headers: this.normalizeHeaders(headers),
        }),
        timeout,
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (this.backend === 'meta-business' && this.phoneNumberId) {
      return {
        id: this.phoneNumberId,
        username: this.phoneNumberId,
        displayName: `WhatsApp (Meta · ${this.phoneNumberId})`,
      };
    }
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return {
        id: `whatsapp-${this.backend}`,
        username: this.backend,
        displayName: `WhatsApp (${this.backend})`,
      };
    }
    return null;
  }

  /** Renderer surfaces this in the config form to render the pairing QR. */
  getQrCode(): string | null {
    return this.lastQr;
  }

  // ==================== Bridge plumbing ====================

  private forkBridge(): void {
    const entry = resolveBridgeEntryPath();
    this.child = fork(entry, ['--backend', this.backend], {
      // silent: pipe stdin/stdout for JSON-RPC; inherit stderr for parent logs.
      silent: true,
      stdio: ['pipe', 'pipe', 'inherit', 'ipc'],
    });

    const { stdout } = this.child;
    if (stdout) {
      stdout.setEncoding('utf8');
      stdout.on('data', (chunk: string) => this.consumeStdout(chunk));
    }

    this.child.once('exit', (code, signal) => {
      const why = signal ? `signal=${signal}` : `code=${code}`;
      console.warn(`[whatsappPlugin] bridge exited (${why})`);
      this.child = null;
      // Reject in-flight requests so callers don't hang.
      for (const { reject } of this.pending.values()) {
        reject(new Error(`whatsapp bridge exited (${why})`));
      }
      this.pending.clear();
      // W-10 (v0.4.3): if the exit was unexpected (operator did not call
      // onStop), schedule a respawn with exponential backoff. Until the
      // ladder gives up, stay in 'starting' rather than 'error' so the UI
      // doesn't lie about being permanently broken.
      if (!this.stopRequested && (this._status === 'running' || this._status === 'starting')) {
        this.scheduleReconnect(why);
      } else if (this._status === 'running' || this._status === 'starting') {
        // stopRequested === true means onStop is tearing us down; suppress the
        // 'error' transition so the channel ends up 'stopped' cleanly.
      }
    });

    this.child.once('error', (err) => {
      console.error('[whatsappPlugin] bridge spawn error:', err);
      this.setError(err.message);
    });
  }

  /**
   * W-10 (v0.4.3): schedule a bridge respawn with exponential backoff.
   * Clamp delay between INITIAL_MS and MAX_MS; give up after MAX_ATTEMPTS so
   * a permanently-broken backend doesn't busy-loop. Resets to attempt 1 once
   * a successful reconnect lands a `connection.state=connected` notification
   * - see handleNotification's 'connection.state' branch.
   */
  private scheduleReconnect(reason: string): void {
    if (this.stopRequested) return;
    if (this.reconnectAttempts >= WhatsAppPlugin.RECONNECT_MAX_ATTEMPTS) {
      this.setStatus(
        'error',
        `bridge exited and reconnect ladder exhausted after ${this.reconnectAttempts} attempts (${reason})`,
      );
      return;
    }
    this.reconnectAttempts += 1;
    const raw =
      WhatsAppPlugin.RECONNECT_INITIAL_MS *
      WhatsAppPlugin.RECONNECT_FACTOR ** (this.reconnectAttempts - 1);
    const delayMs = Math.min(WhatsAppPlugin.RECONNECT_MAX_MS, Math.round(raw));
    console.warn(
      `[whatsappPlugin] respawning bridge in ${delayMs}ms (attempt ${this.reconnectAttempts}/${WhatsAppPlugin.RECONNECT_MAX_ATTEMPTS}, reason=${reason})`,
    );
    this.setStatus('starting', `reconnecting (attempt ${this.reconnectAttempts})`);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopRequested) return;
      try {
        this.forkBridge();
        void this.onStart().catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[whatsappPlugin] reconnect onStart failed:', message);
          this.scheduleReconnect(`reconnect-start-failed: ${message}`);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.scheduleReconnect(`respawn-failed: ${message}`);
      }
    }, delayMs);
  }

  private consumeStdout(chunk: string): void {
    this.stdoutBuf += chunk;
    let nl: number;
    while ((nl = this.stdoutBuf.indexOf('\n')) !== -1) {
      const line = this.stdoutBuf.slice(0, nl).trim();
      this.stdoutBuf = this.stdoutBuf.slice(nl + 1);
      if (!line) continue;
      this.handleFrame(line);
    }
  }

  private handleFrame(line: string): void {
    let frame: JsonRpcFrame;
    try {
      frame = JSON.parse(line) as JsonRpcFrame;
    } catch (err) {
      console.warn('[whatsappPlugin] bridge emitted invalid JSON:', line.slice(0, 200), err);
      return;
    }
    if ('id' in frame && typeof frame.id === 'number') {
      this.resolvePending(frame);
      return;
    }
    if ('method' in frame) {
      this.handleNotification(frame.method, frame.params ?? {});
    }
  }

  private resolvePending(frame: JsonRpcResponse): void {
    const slot = this.pending.get(frame.id);
    if (!slot) return;
    this.pending.delete(frame.id);
    if (frame.error) {
      slot.reject(new Error(`whatsapp_bridge: ${frame.error.message}`));
    } else {
      slot.resolve(frame.result);
    }
  }

  private handleNotification(method: string, params: Record<string, unknown>): void {
    switch (method) {
      case 'inbound.message':
        this.handleInbound(params as unknown as BridgeInboundMessage);
        return;
      case 'connection.status': {
        const state = typeof params.state === 'string' ? params.state : 'unknown';
        this.connectionState = state;
        if (state === 'connected') {
          this.lastQr = null; // pairing complete
          // W-10 (v0.4.3): a successful connect closes a reconnect cycle;
          // reset the attempt counter so the next failure starts from 0
          // delay instead of resuming the previous backoff curve.
          this.reconnectAttempts = 0;
          if (this._status === 'starting') this.setStatus('running');
        } else if (state === 'logged_out') {
          this.setStatus('error', 'WhatsApp session logged out (re-pair required)');
        } else if (state === 'disconnected' && this._status === 'running') {
          this.setError('WhatsApp bridge disconnected');
        }
        return;
      }
      case 'qr.update': {
        const qr = typeof params.qr === 'string' ? params.qr : null;
        if (qr) {
          this.lastQr = qr;
          console.log('[whatsappPlugin] QR pairing code refreshed');
        }
        return;
      }
      case 'error': {
        const message = typeof params.message === 'string' ? params.message : JSON.stringify(params);
        console.error('[whatsappPlugin] bridge error:', message);
        this.setError(message);
        return;
      }
      default:
        console.warn(`[whatsappPlugin] unknown bridge notification: ${method}`);
    }
  }

  private handleInbound(msg: BridgeInboundMessage): void {
    if (!msg || typeof msg.messageId !== 'string' || typeof msg.chatId !== 'string') {
      console.warn('[whatsappPlugin] dropping inbound without messageId/chatId');
      return;
    }
    if (msg.fromMe) return; // ignore self-echoes to avoid loops.
    this.activeUsers.add(msg.senderId);

    // W-7: preserve audio/document/video/sticker. Previously these collapsed
    // to `text`, hiding the payload - audio voicenotes (extremely common on
    // WhatsApp) silently disappeared.
    const contentType: IUnifiedIncomingMessage['content']['type'] = (() => {
      switch (msg.mediaType) {
        case 'image':
          return 'photo';
        case 'video':
          return 'video';
        case 'audio':
          return 'audio';
        case 'document':
          return 'document';
        case 'sticker':
          return 'sticker';
        default:
          return 'text';
      }
    })();

    // W-8: defensive timestamp coercion. Baileys/Meta wires emit seconds; a
    // fork that emits milliseconds would otherwise double-multiply silently.
    // Heuristic: any value above 1e12 is already milliseconds (year > 33658).
    const tsRaw = msg.timestamp;
    const timestamp =
      typeof tsRaw === 'number' && Number.isFinite(tsRaw)
        ? tsRaw > 1e12
          ? tsRaw
          : tsRaw * 1000
        : Date.now();

    // W-3 (v0.4.3): surface mediaPath via unified attachments so agents can
    // read the bytes without grovelling through `raw`. Only the QR backends
    // download media locally; Meta Business cloud still exposes mediaId only.
    const attachments =
      contentType !== 'text' && (msg.mediaPath || msg.mediaId)
        ? [
            {
              type: contentType as 'photo' | 'document' | 'voice' | 'audio' | 'video' | 'sticker',
              fileId: msg.mediaId ?? msg.messageId,
              ...(msg.mediaPath ? { localPath: msg.mediaPath } : {}),
            },
          ]
        : undefined;

    const unified: IUnifiedIncomingMessage = {
      id: msg.messageId,
      platform: 'whatsapp',
      chatId: msg.chatId,
      user: {
        id: msg.senderId,
        displayName: msg.senderName ?? msg.senderId,
      },
      content: {
        type: contentType,
        text: msg.body ?? '',
        ...(attachments ? { attachments } : {}),
      },
      // W-4 (v0.4.3): forward isGroup so downstream permission/scoping logic
      // can branch on it. The unified contract already declares this field.
      ...(typeof msg.isGroup === 'boolean' ? { isGroup: msg.isGroup } : {}),
      // W-5 / W-6: forward reply context. Meta reactions re-use the same
      // field - reactionMessageId is the id of the message the emoji reacts to.
      ...(msg.replyToMessageId
        ? { replyToMessageId: msg.replyToMessageId }
        : msg.reactionMessageId
          ? { replyToMessageId: msg.reactionMessageId }
          : {}),
      timestamp,
      raw: msg as unknown,
    };
    void this.emitMessage(unified).catch((err) =>
      console.error('[whatsappPlugin] inbound handler failed:', err),
    );
  }

  private rpc(method: string, params: Record<string, JsonValue>): Promise<unknown> {
    if (!this.child || !this.child.stdin) {
      return Promise.reject(new Error('whatsapp bridge not running'));
    }
    const id = ++this.rpcId;
    const frame = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child!.stdin!.write(frame, (err) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  private async killChild(): Promise<void> {
    const child = this.child;
    if (!child) return;
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // best-effort
        }
        resolve();
      }, 5_000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      try {
        child.kill('SIGTERM');
      } catch {
        clearTimeout(timer);
        resolve();
      }
    });
  }

  private normalizeHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (v === undefined) continue;
      out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
    }
    return out;
  }

  // ==================== Static ====================

  /**
   * Cheap credential probe used by the config form's "Test & Enable" button.
   *
   * Signature mirrors BasePlugin.testConnection (single `token` string) so
   * the static side stays assignment-compatible. The form JSON-encodes a
   * `{backend, accessToken, phoneNumberId}` payload as the token.
   *
   * - meta-business: GET the phone-number node directly via Graph API; that
   *   request is what the bridge runs on connect anyway, so we skip the
   *   subprocess round-trip and surface a clean axios error.
   * - baileys / whatsapp-web: no static probe is possible - actual pairing
   *   needs the QR handshake. We return success with a note so the UI tells
   *   the operator to proceed to the live QR step.
   */
  static override async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string; warning?: string }> {
    let parsed: { backend?: string; accessToken?: string; phoneNumberId?: string };
    try {
      parsed = JSON.parse(token) as typeof parsed;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }
    const resolved = (parsed.backend as WhatsAppBackend | undefined) ?? 'baileys';
    if (resolved !== 'meta-business') {
      // R8 (v0.4.3): QR backends cannot be verified ahead of pairing. Return
      // success:true so the UI doesn't block enable, but attach a `warning`
      // field making the limitation explicit. Without this the form claims
      // the channel is verified before the operator has scanned the QR.
      return {
        success: true,
        botUsername: `whatsapp-${resolved}`,
        warning: 'pending-pairing - actual verification happens at QR scan',
      };
    }
    const accessToken = parsed.accessToken?.trim() ?? '';
    const phoneNumberId = parsed.phoneNumberId?.trim() ?? '';
    if (!accessToken || !phoneNumberId) {
      return { success: false, error: 'Meta WhatsApp requires accessToken + phoneNumberId' };
    }
    try {
      const res = await axios.get(`https://graph.facebook.com/v21.0/${phoneNumberId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15_000,
      });
      const display =
        (res.data?.display_phone_number as string | undefined) ??
        (res.data?.verified_name as string | undefined) ??
        phoneNumberId;
      return { success: true, botUsername: display };
    } catch (err) {
      type AxiosErrorShape = {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const e = err as AxiosErrorShape;
      const detail = e.response?.data?.error?.message ?? e.message ?? String(err);
      return { success: false, error: `meta_auth_failed: ${detail}` };
    }
  }
}
