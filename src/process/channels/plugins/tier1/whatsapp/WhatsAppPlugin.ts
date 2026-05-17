/**
 * @license
 * Copyright 2025 Wayland (TradeCanyon)
 * SPDX-License-Identifier: Apache-2.0
 *
 * WhatsAppPlugin — Wayland's tier-1 WhatsApp surface.
 *
 * Transport: spawns the `whatsapp-bridge` Node subprocess via
 * `child_process.fork` and speaks JSON-RPC 2.0 over stdio (one JSON object
 * per `\n`). Three interchangeable backends, selected at fork time via the
 * `--backend` CLI flag:
 *
 *   - `baileys`       (default) direct WhatsApp Web protocol — pairs via QR
 *   - `whatsapp-web`  whatsapp-web.js library — pairs via QR
 *   - `meta-business` Meta WhatsApp Business Cloud API — webhooks + REST
 *
 * Capability surface is declared at the optimistic union: the Baileys /
 * whatsapp-web.js backends support reactions and typing-presence updates,
 * so we expose those flags at the class level. The Meta Cloud API can't do
 * either, so the corresponding bridge handlers return `{ok: false, reason}`
 * notifications which we surface via `setError`. We never advertise edit
 * capability — WhatsApp has no edit primitive on any backend.
 *
 * Webhook routing: only the `meta-business` backend ever sees inbound HTTPS
 * deliveries. The parent process's WebhookReceiver HMAC-verifies the
 * `X-Hub-Signature-256` header and routes the parsed payload here via
 * `handleWebhookPayload`. We forward the payload to the bridge via the
 * `webhookDelivery` JSON-RPC method; the bridge re-emits per-message
 * `inbound.message` notifications which flow back through the same
 * messageHandler path the Baileys/web backends use.
 */

import { ChildProcess, fork } from 'child_process';
import path from 'path';
import axios from 'axios';

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

/** JSON-RPC primitive types — the bridge wire-format is JSON. */
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
  senderName?: string;
  isGroup?: boolean;
  fromMe?: boolean;
  body?: string;
  mediaType?: string;
  mediaId?: string;
  timestamp?: number;
}

/** Bridge entry resolved relative to this file. Compiled output preserves layout. */
function resolveBridgeEntryPath(): string {
  // src/process/channels/plugins/tier1/whatsapp/ → src/process/channels/whatsapp-bridge/bridge.js
  return path.resolve(__dirname, '../../../whatsapp-bridge/bridge.js');
}

export class WhatsAppPlugin extends BasePlugin {
  readonly type: PluginType = 'whatsapp';

  /**
   * Optimistic capability set covering Baileys / whatsapp-web.js. The Meta
   * Cloud API cannot do reactions or typing indicators — the bridge handler
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
    const params: Record<string, JsonValue> = {};
    if (this.backend === 'meta-business') {
      // Meta backend needs creds on every (re)connect — Cloud API is stateless.
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
    // Baileys / whatsapp-web.js: no params — sessionDir is supplied at fork
    // time via CLI flag, and pairing is interactive via the qr.update event.
    await this.rpc('connect', params);
  }

  protected async onStop(): Promise<void> {
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
      const result = (await this.rpc('sendMedia', {
        chatId,
        mediaType,
        mediaUrl,
        caption: message.text ?? '',
        fileName: message.fileName ?? '',
      })) as { messageId: string | null } | null;
      return result?.messageId ?? '';
    }
    const text = (message.text ?? '').trim();
    if (!text) throw new Error('WhatsApp message body cannot be empty');
    const result = (await this.rpc('sendText', { chatId, text })) as
      | { messageId: string | null }
      | null;
    return result?.messageId ?? '';
  }

  /**
   * WhatsApp has no edit primitive on any backend. Default no-op on BasePlugin
   * would silently swallow updates — we throw to make the limitation visible
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
   * notifications — those flow back here through the same handler the
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
    await this.rpc('webhookDelivery', {
      payload: payload as Record<string, JsonValue>,
      headers: this.normalizeHeaders(headers),
    });
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
      if (this._status === 'running' || this._status === 'starting') {
        this.setStatus('error', `bridge exited unexpectedly (${why})`);
      }
    });

    this.child.once('error', (err) => {
      console.error('[whatsappPlugin] bridge spawn error:', err);
      this.setError(err.message);
    });
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

    const unified: IUnifiedIncomingMessage = {
      id: msg.messageId,
      platform: 'whatsapp',
      chatId: msg.chatId,
      user: {
        id: msg.senderId,
        displayName: msg.senderName ?? msg.senderId,
      },
      content: {
        type: msg.mediaType === 'image' || msg.mediaType === 'video' ? 'photo' : 'text',
        text: msg.body ?? '',
      },
      timestamp: typeof msg.timestamp === 'number' ? msg.timestamp * 1000 : Date.now(),
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
   * - baileys / whatsapp-web: no static probe is possible — actual pairing
   *   needs the QR handshake. We return success with a note so the UI tells
   *   the operator to proceed to the live QR step.
   */
  static override async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let parsed: { backend?: string; accessToken?: string; phoneNumberId?: string };
    try {
      parsed = JSON.parse(token) as typeof parsed;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }
    const resolved = (parsed.backend as WhatsAppBackend | undefined) ?? 'baileys';
    if (resolved !== 'meta-business') {
      return {
        success: true,
        botUsername: `whatsapp-${resolved}`,
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
