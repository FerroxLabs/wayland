/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomBytes } from 'node:crypto';
import { BasePlugin } from '../BasePlugin';
import { decryptPayloadFull, encryptPayload, sha1Sign, verifySignature as verifyWecomSignature } from './WecomCrypto';
import {
  consumeResponseUrl,
  finishStream,
  getLatestStreamByChatId,
  getStream,
  setActiveWecomPlugin,
  upsertStreamContent,
} from './WecomStreamState';
import type { WecomStreamRecord } from './WecomStreamState';
import type {
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../types';
import AiBot from '@wecom/aibot-node-sdk';

const WECOM_CALLBACK_PATH = '/channels/wecom/webhook';
/** Cap on per-chat WSClient frame headers we retain. Hard-stops a noisy peer
 *  from growing the map without bound (LOW-2 audit fix). */
const WS_CTX_MAX = 10_000;
/** Reconnect ladder for the WebSocket transport (HIGH-2). Exponential with
 *  a 60s ceiling - matches what the wider repo uses for other long-lived
 *  channel sockets. */
const WS_RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 15_000, 30_000, 60_000];

function extractOutgoingText(message: IUnifiedOutgoingMessage): string {
  if (message.type === 'text' && typeof message.text === 'string') {
    return message.text;
  }
  return '';
}

async function postResponseUrlMessage(url: string, text: string): Promise<void> {
  const payload = {
    msgtype: 'markdown',
    markdown: {
      content: text || '',
    },
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`response_url send failed: HTTP ${response.status} ${body}`.trim());
  }
}

/**
 * Enterprise WeChat (WeCom) AI Bot channel plugin.
 *
 * Uses the official encrypted callback (GET verify + POST JSON { encrypt }) and
 * stream-mode JSON responses documented for WeCom intelligent bots.
 *
 * Requires WebUI HTTP server to be running so {@link WECOM_CALLBACK_PATH} is reachable.
 */
export class WecomPlugin extends BasePlugin {
  readonly type: PluginType = 'wecom';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canReact: false,
    canStream: true,
    canTypingIndicator: false,
  };

  private mode: 'webhook' | 'websocket' = 'webhook';
  private token = '';
  private encodingAesKey = '';
  /** CorpID expected in decrypted receiveid trailer. Empty disables the
   *  CRIT-2 check (websocket mode + legacy configs). */
  private corpId = '';

  private botId = '';
  private secret = '';
  private wsClient: unknown | null = null;
  /** Connected/healthy state for the WSClient transport. We track this
   *  separately from `_status` so the UI "Connected" pill reflects the
   *  socket-layer reality, not just the lifecycle-layer state (HIGH-2). */
  private wsConnected = false;
  private wsReconnectAttempt = 0;
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsStopping = false;
  private readonly wsActiveUsers = new Set<string>();
  private readonly wsContexts = new Map<string, { frameHeaders: { headers: { req_id: string } }; streamId: string }>();

  private readonly activeUsers = new Set<string>();
  private readonly pendingFinalizeTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Streams that have received their first visible-content chunk. Used to
   *  short-circuit the 1200ms finalize timer scheduled by handleInboundMessage
   *  so slow agents don't have `finished:true` set before their content
   *  arrives (MED-3 audit fix). */
  private readonly firstChunkReceived = new Set<string>();

  readonly metrics = {
    received: 0,
    streamRefresh: 0,
    sent: 0,
    updated: 0,
    verified: 0,
    lastEventAt: 0,
  };

  isRunning(): boolean {
    return this._status === 'running';
  }

  /** Public URL path (relative to WebUI base) for the management console. */
  static getCallbackPath(): string {
    return WECOM_CALLBACK_PATH;
  }

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const botId = config.credentials?.botId?.trim();
    const secret = config.credentials?.secret?.trim();
    const token = config.credentials?.token?.trim();
    const encodingAesKey = config.credentials?.encodingAesKey?.trim();
    const corpId = config.credentials?.corpId?.trim();

    if (botId && secret) {
      this.mode = 'websocket';
      this.botId = botId;
      this.secret = secret;
      return;
    }

    this.mode = 'webhook';
    if (!token) {
      throw new Error('WeCom: callback Token is required');
    }
    if (!encodingAesKey || encodingAesKey.length !== 43) {
      throw new Error('WeCom: EncodingAESKey must be 43 characters (from WeCom admin)');
    }
    if (!corpId) {
      // CRIT-2: webhook mode without CorpID cannot validate the receiveid
      // trailer, which is one of the two anti-forgery checks WeCom provides.
      throw new Error('WeCom: CorpID is required in webhook mode (used to validate decrypted receiveid)');
    }
    this.token = token;
    this.encodingAesKey = encodingAesKey;
    this.corpId = corpId;
  }

  protected async onStart(): Promise<void> {
    if (this.mode === 'websocket') {
      this.wsStopping = false;
      await this.startWebsocket();
      return;
    }
    setActiveWecomPlugin(this);
  }

  protected async onStop(): Promise<void> {
    if (this.mode === 'websocket') {
      this.stopWebsocket();
      return;
    }
    setActiveWecomPlugin(null);
    for (const timer of this.pendingFinalizeTimers.values()) {
      clearTimeout(timer);
    }
    this.pendingFinalizeTimers.clear();
    this.firstChunkReceived.clear();
  }

  verifySignature(signature: string, timestamp: string, nonce: string, encrypted: string): boolean {
    if (!this.token) return false;
    return verifyWecomSignature(this.token, timestamp, nonce, encrypted, signature);
  }

  /**
   * Decrypts the body and validates the trailing receiveid against the
   * configured CorpID. Throws on mismatch (CRIT-2 audit fix). The GET-verify
   * echostr path also funnels through here, so the same check defends both
   * code paths.
   */
  decrypt(encrypted: string): string {
    const { message, receiveId } = decryptPayloadFull(this.encodingAesKey, encrypted);
    if (this.corpId && receiveId && receiveId !== this.corpId) {
      throw new Error('WeCom: decrypted receiveid does not match configured CorpID');
    }
    return message;
  }

  buildEncryptedStreamResponse(
    streamState: WecomStreamRecord,
    timestamp: string,
    nonce: string
  ): { encrypt: string; msgsignature: string; timestamp: string; nonce: string } {
    const payload: Record<string, unknown> = {
      msgtype: 'stream',
      stream: {
        id: streamState.streamId,
        finish: !!streamState.finished,
        content: streamState.visibleContent || '',
      },
    };
    if (streamState.thinkingContent) {
      (payload.stream as Record<string, unknown>).thinking_content = streamState.thinkingContent;
    }
    const plain = JSON.stringify(payload);
    // Use the CorpID as receiveid in the encrypted response trailer so a
    // peer that does the same validation we now do can verify our reply.
    const encrypted = encryptPayload(this.encodingAesKey, plain, this.corpId);
    const tsNum = Number(timestamp);
    const resolvedTs = Number.isFinite(tsNum) ? tsNum : Math.floor(Date.now() / 1000);
    const n = String(nonce);
    return {
      encrypt: encrypted,
      msgsignature: sha1Sign(this.token, String(resolvedTs), n, encrypted),
      timestamp: String(resolvedTs),
      nonce: n,
    };
  }

  private extractInboundText(payload: Record<string, unknown>): string {
    const msgType = typeof payload.msgtype === 'string' ? payload.msgtype : 'text';
    if (msgType === 'text') {
      const text = payload.text as { content?: string } | undefined;
      return text?.content || '';
    }
    if (msgType === 'voice') {
      const voice = payload.voice as { content?: string } | undefined;
      return voice?.content || '';
    }
    if (msgType === 'mixed') {
      const mixed = payload.mixed as { msg_item?: Array<Record<string, unknown>> } | undefined;
      const items = Array.isArray(mixed?.msg_item) ? mixed.msg_item : [];
      return items
        .map((item) => {
          if (item?.msgtype === 'text') {
            const t = item.text as { content?: string } | undefined;
            return t?.content || '';
          }
          if (item?.msgtype === 'image') {
            const im = item.image as { url?: string } | undefined;
            return im?.url ? `[image] ${im.url}` : '';
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
    if (msgType === 'image') {
      const image = payload.image as { url?: string } | undefined;
      return image?.url ? `[image] ${image.url}` : '[image]';
    }
    if (msgType === 'file') {
      const file = payload.file as { name?: string } | undefined;
      return file?.name ? `[file] ${file.name}` : '[file]';
    }
    if (msgType === 'location') {
      const loc = payload.location as
        | { name?: string; label?: string; latitude?: string; longitude?: string }
        | undefined;
      const name = loc?.name || loc?.label || '';
      const lat = loc?.latitude || '';
      const lng = loc?.longitude || '';
      return name ? `[location] ${name} (${lat}, ${lng})` : `[location] ${lat}, ${lng}`;
    }
    return '';
  }

  private toUnifiedIncomingMessage(payload: Record<string, unknown>): IUnifiedIncomingMessage {
    const msgType = typeof payload.msgtype === 'string' ? payload.msgtype : 'text';
    const from = payload.from as { userid?: string; name?: string } | undefined;
    const fromUserId =
      from?.userid ||
      (payload.from_userid as string | undefined) ||
      (payload.userid as string | undefined) ||
      'wecom-user';
    const fromName = from?.name || fromUserId;
    const groupId = typeof payload.chatid === 'string' ? payload.chatid : '';
    const chatType = typeof payload.chattype === 'string' ? payload.chattype : 'single';
    const chatId = groupId || `dm:${fromUserId}`;
    const text = this.extractInboundText(payload);
    return {
      id: (typeof payload.msgid === 'string' && payload.msgid) || `wecom-${Date.now()}`,
      platform: 'wecom',
      chatId,
      user: {
        id: fromUserId,
        displayName: fromName,
      },
      content: {
        type: msgType === 'command' ? 'command' : 'text',
        text,
      },
      timestamp: Date.now(),
      raw: { ...payload, _wecomChatType: chatType },
    };
  }

  async handleInboundMessage(payload: Record<string, unknown>, streamId: string): Promise<void> {
    if (!this.messageHandler) return;
    const unified = this.toUnifiedIncomingMessage(payload);
    unified.raw = {
      ...payload,
      __streamId: streamId,
      _wecomChatType: typeof payload.chattype === 'string' ? payload.chattype : 'single',
    };
    this.activeUsers.add(unified.user.id);
    this.metrics.received += 1;
    this.metrics.lastEventAt = Date.now();
    await this.messageHandler(unified);

    // MED-3: the 1200ms timer only fires if no chunk has arrived. The first
    // call into sendMessage / editMessage clears it via noteFirstChunk().
    // If a slow agent posts later, we still gracefully finalize.
    const timer = setTimeout(() => {
      if (!this.firstChunkReceived.has(streamId)) {
        finishStream(streamId);
      }
      this.pendingFinalizeTimers.delete(streamId);
    }, 1200);
    this.pendingFinalizeTimers.set(streamId, timer);
  }

  /** Cancels the pending finalize timer for a stream the first time we see
   *  a visible-content chunk. Subsequent writes are no-ops. */
  private noteFirstChunk(streamId: string): void {
    if (this.firstChunkReceived.has(streamId)) return;
    this.firstChunkReceived.add(streamId);
    const t = this.pendingFinalizeTimers.get(streamId);
    if (t) clearTimeout(t);
    this.pendingFinalizeTimers.delete(streamId);
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (this.mode === 'websocket') {
      await this.wsUpsertStream(chatId, extractOutgoingText(message), !!message.replyMarkup);
      const ctx = this.wsContexts.get(chatId);
      return ctx?.streamId || `wecomws-msg-${Date.now()}`;
    }

    const stream = getLatestStreamByChatId(chatId);
    const text = extractOutgoingText(message);
    this.metrics.sent += 1;
    this.metrics.lastEventAt = Date.now();

    if (!stream) {
      const responseUrl = consumeResponseUrl(chatId);
      if (responseUrl) {
        await postResponseUrlMessage(responseUrl, text);
      }
      return `wecom-msg-${Date.now()}`;
    }

    const isThinking = text.startsWith('⏳ Thinking...');
    // MED-3: any visible (non-thinking) chunk counts as first content; clear
    // the latent finalize timer so we don't mark this stream finished while
    // the agent is still streaming.
    if (text && !isThinking) {
      this.noteFirstChunk(stream.streamId);
    }
    upsertStreamContent(stream.streamId, {
      visibleContent: isThinking ? '' : text,
      thinkingContent: isThinking ? text : '',
      lastMessageId: `wecom-msg-${Date.now()}`,
      finished: !!message.replyMarkup,
    });
    if (message.replyMarkup) {
      const t = this.pendingFinalizeTimers.get(stream.streamId);
      if (t) clearTimeout(t);
      this.pendingFinalizeTimers.delete(stream.streamId);
      this.firstChunkReceived.delete(stream.streamId);
    }
    return stream.streamId;
  }

  async editMessage(chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (this.mode === 'websocket') {
      await this.wsUpsertStream(chatId, extractOutgoingText(message), !!message.replyMarkup, messageId);
      return;
    }

    const stream = messageId ? getStream(messageId) : getLatestStreamByChatId(chatId);
    if (!stream) return;
    const text = extractOutgoingText(message);
    this.metrics.updated += 1;
    this.metrics.lastEventAt = Date.now();

    const isThinking = text.startsWith('⏳ Thinking...');
    if (text && !isThinking) {
      this.noteFirstChunk(stream.streamId);
    }
    upsertStreamContent(stream.streamId, {
      visibleContent: isThinking ? '' : text,
      thinkingContent: isThinking ? text : '',
      finished: !!message.replyMarkup,
    });
    if (message.replyMarkup) {
      const t = this.pendingFinalizeTimers.get(stream.streamId);
      if (t) clearTimeout(t);
      this.pendingFinalizeTimers.delete(stream.streamId);
      this.firstChunkReceived.delete(stream.streamId);
    }
  }

  getActiveUserCount(): number {
    return this.mode === 'websocket' ? this.wsActiveUsers.size : this.activeUsers.size;
  }

  getBotInfo(): { username?: string; displayName: string } | null {
    return { displayName: this.mode === 'websocket' ? 'WeCom (WS)' : 'WeCom' };
  }

  /** True when the transport-layer is healthy. For websocket mode this is
   *  the SDK socket state; for webhook mode it tracks whether we are the
   *  active webhook target. Used by UI status pill (HIGH-2). */
  isConnected(): boolean {
    return this.mode === 'websocket' ? this.wsConnected : this._status === 'running';
  }

  private async startWebsocket(): Promise<void> {
    const WSClientCtor = (AiBot as unknown as { WSClient?: new (opts: Record<string, unknown>) => unknown }).WSClient;
    if (!WSClientCtor) {
      throw new Error('WeCom: WSClient not found in SDK');
    }
    const client = new WSClientCtor({ botId: this.botId, secret: this.secret });

    const emitter = client as unknown as {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      connect?: () => unknown;
      disconnect?: () => unknown;
    };
    if (!emitter.on || !emitter.connect) {
      throw new Error('WeCom: SDK client missing on/connect methods');
    }

    emitter.on('authenticated', () => {
      this.metrics.lastEventAt = Date.now();
      this.wsConnected = true;
      this.wsReconnectAttempt = 0;
      // Reconnect succeeded - clear any stale error so the UI status pill
      // doesn't keep showing the old failure (HIGH-2). setError only accepts
      // strings, so route through the lower-level field via setStatus.
      this.errorMessage = null;
      if (this._status === 'error') {
        this.setStatus('running');
      }
    });
    emitter.on('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      this.setError(msg);
      this.wsConnected = false;
      console.error('[WecomPlugin][WS] error:', err);
      this.scheduleWsReconnect();
    });
    // If the SDK exposes a disconnected/close event, treat it as a trigger
    // for the reconnect ladder. Both names are seen in WeCom SDK releases.
    emitter.on('disconnected', () => {
      this.wsConnected = false;
      console.warn('[WecomPlugin][WS] disconnected');
      this.scheduleWsReconnect();
    });
    emitter.on('close', () => {
      this.wsConnected = false;
      console.warn('[WecomPlugin][WS] close');
      this.scheduleWsReconnect();
    });

    const handleMsg = (frame: unknown) => {
      void this.handleWsMessageFrame(frame).catch((error) => {
        console.error('[WecomPlugin][WS] handle message frame failed:', error);
      });
    };

    emitter.on('message.text', handleMsg);
    emitter.on('message.voice', handleMsg);
    emitter.on('message.mixed', handleMsg);
    emitter.on('message.image', handleMsg);
    emitter.on('message.file', handleMsg);
    emitter.on('message.video', handleMsg);

    // (Optional) welcome message. Keep minimal: no auto-welcome to avoid extra behavior.

    emitter.connect();
    this.wsClient = client;
  }

  private scheduleWsReconnect(): void {
    if (this.wsStopping) return;
    if (this.wsReconnectTimer) return; // already pending
    const idx = Math.min(this.wsReconnectAttempt, WS_RECONNECT_DELAYS_MS.length - 1);
    const delay = WS_RECONNECT_DELAYS_MS[idx];
    this.wsReconnectAttempt += 1;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      if (this.wsStopping) return;
      // Tear down the old client and start fresh - safer than trying to
      // reuse the SDK instance, which may be in an invalid internal state.
      try {
        const old = this.wsClient as unknown as { disconnect?: () => unknown } | null;
        old?.disconnect?.();
      } catch {
        // swallow - we're recovering, not surfacing
      }
      this.wsClient = null;
      void this.startWebsocket().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[WecomPlugin][WS] reconnect failed:', msg);
        this.setError(msg);
        this.scheduleWsReconnect();
      });
    }, delay);
  }

  private stopWebsocket(): void {
    this.wsStopping = true;
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    this.wsContexts.clear();
    this.wsActiveUsers.clear();
    this.firstChunkReceived.clear();
    this.wsConnected = false;
    const client = this.wsClient as unknown as { disconnect?: () => unknown };
    client?.disconnect?.();
    this.wsClient = null;
  }

  private getWsReqId(frame: unknown): string | null {
    if (!frame || typeof frame !== 'object') return null;
    const headers = (frame as { headers?: unknown }).headers;
    const reqId = headers && typeof headers === 'object' ? (headers as { req_id?: unknown }).req_id : undefined;
    return typeof reqId === 'string' && reqId.trim() ? reqId : null;
  }

  private getWsFrameHeaders(frame: unknown): { headers: { req_id: string } } | null {
    const reqId = this.getWsReqId(frame);
    return reqId ? { headers: { req_id: reqId } } : null;
  }

  private getWsBody(frame: unknown): Record<string, unknown> {
    if (!frame || typeof frame !== 'object') return {};
    const body = (frame as { body?: unknown }).body;
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  }

  private async handleWsMessageFrame(frame: unknown): Promise<void> {
    if (!this.messageHandler) return;
    const frameHeaders = this.getWsFrameHeaders(frame);
    const payload = this.getWsBody(frame);
    const unified = this.toUnifiedIncomingMessage(payload);

    this.wsActiveUsers.add(unified.user.id);
    this.metrics.received += 1;
    this.metrics.lastEventAt = Date.now();

    if (frameHeaders) {
      // Cap the map at WS_CTX_MAX entries to bound memory if a peer floods
      // with distinct chatIds (LOW-2 audit fix). Evict oldest insertion.
      if (this.wsContexts.size >= WS_CTX_MAX && !this.wsContexts.has(unified.chatId)) {
        const firstKey = this.wsContexts.keys().next().value as string | undefined;
        if (firstKey) this.wsContexts.delete(firstKey);
      }
      // RT-S4: use crypto.randomBytes for an unguessable stream id. The id
      // correlates streamed reply chunks back to this chat with the WeCom peer,
      // so a predictable Math.random() suffix is a (low) forgery/collision risk.
      const streamId = `wecomws-stream-${Date.now()}-${randomBytes(9).toString('base64url')}`;
      this.wsContexts.set(unified.chatId, { frameHeaders, streamId });
    }

    // Non-blocking like other plugins
    void this.messageHandler(unified).catch((error) =>
      console.error('[WecomPlugin][WS] messageHandler failed:', error)
    );
  }

  private async wsUpsertStream(
    chatId: string,
    text: string,
    finish: boolean,
    streamIdOverride?: string
  ): Promise<void> {
    const ctx = this.wsContexts.get(chatId);
    if (!ctx || !this.wsClient) return;
    const streamId = streamIdOverride || ctx.streamId;
    const client = this.wsClient as unknown as {
      replyStream?: (
        frame: { headers: { req_id: string } },
        streamId: string,
        content: string,
        finish?: boolean
      ) => Promise<unknown>;
    };
    if (!client.replyStream) return;
    await client.replyStream(ctx.frameHeaders, streamId, text || '', finish);
  }
}
