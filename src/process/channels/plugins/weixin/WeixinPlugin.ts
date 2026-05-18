/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';

import { getPlatformServices } from '@/common/platform';
import type {
  IChannelMediaAction,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../types';
import { BasePlugin } from '../BasePlugin';
import { toUnifiedIncomingMessage, stripHtml } from './WeixinAdapter';
import { startMonitor } from './WeixinMonitor';
import type { WeixinChatRequest, WeixinChatResponse } from './WeixinMonitor';

const RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Persist a stable per-account WeChat UIN to disk on first use. The UIN is
 * sent as the `X-WECHAT-UIN` header on every iLink request. Regenerating it
 * per process startup looks like bot rotation to Tencent's risk-control and
 * accelerates token revocation (audit CRIT-3). Stored under the plugin's
 * data dir so it survives restarts and respects the same encryption-at-rest
 * boundary as the rest of plugin state.
 */
function loadOrCreateWechatUin(dataDir: string, accountId: string): string {
  const uinDir = path.join(dataDir, 'weixin-monitor');
  const uinFile = path.join(uinDir, `${accountId}.uin`);
  try {
    const existing = fs.readFileSync(uinFile, 'utf-8').trim();
    if (existing) return existing;
  } catch {
    // fall through to create
  }
  // Hex (not base64) — base64 padding chars '=' and '+' may not be valid
  // header characters depending on Tencent's parser (audit LOW-2).
  const uin = crypto.randomBytes(4).toString('hex');
  try {
    fs.mkdirSync(uinDir, { recursive: true });
    fs.writeFileSync(uinFile, uin, 'utf-8');
  } catch (err) {
    // Non-fatal — worst case we regenerate next start. Log so it's not silent.
    console.warn(`[WeixinPlugin] Failed to persist UIN for ${accountId}:`, err);
  }
  return uin;
}

interface PendingResponse {
  resolve: (response: WeixinChatResponse) => void;
  reject: (error: Error) => void;
  draftText: string;
  hasDraft: boolean;
  sentTextNow: boolean;
  lastSentText?: string;
  sendTextNow?: (text: string) => Promise<void>;
  sendQueue: Promise<void>;
  sendError?: Error;
  mediaActions: IChannelMediaAction[];
  timer: ReturnType<typeof setTimeout>;
}

export class WeixinPlugin extends BasePlugin {
  readonly type: PluginType = 'weixin';

  // canTypingIndicator: true — WeixinTyping is actively wired through
  // WeixinMonitor (TypingManager.startTyping/stopTyping around every
  // agent.chat). Audit HIGH-2: previous `false` value lied to upstream
  // capability consumers.
  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canReact: false,
    canStream: true,
    canTypingIndicator: true,
  };

  private accountId = '';
  // botToken is decrypted at the framework boundary by BasePlugin via
  // credentialCrypto (sensitive-field classification in
  // @process/secrets/fieldClassification). It is held in memory only and
  // re-encrypted before persistence. Audit CRIT-4.
  private botToken = '';
  private baseUrl = 'https://ilinkai.weixin.qq.com';
  private abortController: AbortController | null = null;
  private _stopping = false;
  private pendingResponses = new Map<string, PendingResponse>();
  private activeUsers = new Set<string>();

  // ==================== Lifecycle ====================

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const { accountId, botToken, baseUrl } = config.credentials ?? {};
    if (!accountId || !botToken) {
      throw new Error('WeChat accountId and botToken are required');
    }
    this.accountId = accountId as string;
    this.botToken = botToken as string;
    this.baseUrl = (baseUrl as string | undefined) ?? 'https://ilinkai.weixin.qq.com';
  }

  protected async onStart(): Promise<void> {
    this._stopping = false;
    this.abortController = new AbortController();
    const dataDir = getPlatformServices().paths.getDataDir();
    const wechatUin = loadOrCreateWechatUin(dataDir, this.accountId);
    startMonitor({
      baseUrl: this.baseUrl,
      token: this.botToken,
      accountId: this.accountId,
      wechatUin,
      dataDir,
      agent: { chat: (req) => this.handleChat(req) },
      abortSignal: this.abortController.signal,
      log: (msg) => console.warn(`[WeixinPlugin] ${msg}`),
    });
  }

  protected async onStop(): Promise<void> {
    this._stopping = true;

    for (const [chatId, pending] of this.pendingResponses.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Plugin stopped'));
      this.pendingResponses.delete(chatId);
    }

    this.abortController?.abort();
    this.abortController = null;
    this.activeUsers.clear();
  }

  // ==================== BasePlugin interface ====================

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    const pending = this.pendingResponses.get(chatId);
    if (pending && message.text !== undefined) {
      this.flushDraft(pending);
      this.updateDraft(pending, message.text);
    }
    if (pending && message.mediaActions) {
      pending.mediaActions = message.mediaActions;
    }
    return `weixin_pending_${chatId}`;
  }

  async editMessage(chatId: string, _messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    const pending = this.pendingResponses.get(chatId);
    if (!pending) return;

    if (message.text !== undefined) {
      this.updateDraft(pending, message.text);
    }
    if (message.mediaActions) {
      pending.mediaActions = message.mediaActions;
    }

    if (message.replyMarkup !== undefined) {
      this.flushDraft(pending);
      await pending.sendQueue;
      clearTimeout(pending.timer);
      this.pendingResponses.delete(chatId);
      if (pending.sendError) {
        pending.reject(pending.sendError);
        return;
      }
      pending.resolve({
        text: pending.sentTextNow ? undefined : pending.draftText || undefined,
        mediaActions: pending.mediaActions,
      });
    }
  }

  async flushTextDraft(chatId: string): Promise<void> {
    const pending = this.pendingResponses.get(chatId);
    if (!pending) return;

    this.flushDraft(pending);
    await pending.sendQueue;
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): { username?: string; displayName?: string } | null {
    return { displayName: 'Wayland Core Assistant' };
  }

  // ==================== Promise bridge ====================

  private handleChat(request: WeixinChatRequest): Promise<WeixinChatResponse> {
    if (this._stopping) {
      return Promise.reject(new Error('Plugin stopped'));
    }

    const { conversationId } = request;
    this.activeUsers.add(conversationId);

    const existing = this.pendingResponses.get(conversationId);
    if (existing) {
      clearTimeout(existing.timer);
      existing.reject(new Error('superseded'));
      this.pendingResponses.delete(conversationId);
    }

    return new Promise<WeixinChatResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingResponses.delete(conversationId);
        reject(new Error('Response timeout'));
      }, RESPONSE_TIMEOUT_MS);

      this.pendingResponses.set(conversationId, {
        resolve,
        reject,
        draftText: '',
        hasDraft: false,
        sentTextNow: false,
        sendTextNow: request.sendTextNow,
        sendQueue: Promise.resolve(),
        mediaActions: [],
        timer,
      });

      const unified = toUnifiedIncomingMessage(request);

      // Check for menu button commands (consistent with Lark)
      if (unified.content.type === 'text' && unified.content.text) {
        const buttonAction = this.getMenuButtonAction(unified.content.text);
        if (buttonAction) {
          // Transform into action message
          unified.content.type = 'action';
          unified.content.text = buttonAction.action;
          unified.action = {
            type: buttonAction.type as 'system' | 'platform' | 'chat',
            name: buttonAction.action,
          };
        }
      }

      this.emitMessage(unified)
        .then(async () => {
          const pending = this.pendingResponses.get(conversationId);
          if (pending) {
            this.flushDraft(pending);
            await pending.sendQueue;
            clearTimeout(pending.timer);
            this.pendingResponses.delete(conversationId);
            if (pending.sendError) {
              pending.reject(pending.sendError);
              return;
            }
            pending.resolve({
              text: pending.sentTextNow ? undefined : pending.draftText || undefined,
              mediaActions: pending.mediaActions,
            });
          }
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          this.pendingResponses.delete(conversationId);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  private updateDraft(pending: PendingResponse, text: string): void {
    const plainText = stripHtml(text);
    const trimmedPlainText = plainText.trim();
    if (!trimmedPlainText || trimmedPlainText === '⏳ Thinking...') {
      pending.draftText = '';
      pending.hasDraft = false;
      return;
    }
    if (pending.sentTextNow && plainText === pending.lastSentText) {
      pending.draftText = '';
      pending.hasDraft = false;
      return;
    }

    pending.draftText = plainText;
    pending.hasDraft = pending.draftText.trim().length > 0;
  }

  private flushDraft(pending: PendingResponse): void {
    if (!pending.hasDraft) return;

    const text = pending.draftText;
    pending.hasDraft = false;

    if (!pending.sendTextNow) {
      return;
    }

    const sendTextNow = pending.sendTextNow;
    pending.sentTextNow = true;
    pending.lastSentText = text;
    pending.draftText = '';
    pending.sendQueue = pending.sendQueue
      .then(() => sendTextNow(text))
      .then((): void => undefined)
      .catch((error: unknown) => {
        pending.sendError = error instanceof Error ? error : new Error(String(error));
      });
  }

  /**
   * Map menu action strings to action info
   * Consistent with Lark implementation
   */
  private getMenuButtonAction(text: string): { type: string; action: string } | null {
    const menuActions: Record<string, { type: string; action: string }> = {
      'session.new': { type: 'system', action: 'session.new' },
      'session.status': { type: 'system', action: 'session.status' },
      'help.show': { type: 'system', action: 'help.show' },
      'agent.show': { type: 'system', action: 'agent.show' },
      'pairing.check': { type: 'platform', action: 'pairing.check' },
    };
    return menuActions[text] || null;
  }

  // ==================== Static ====================

  /**
   * Validate the bot token by issuing a short-timeout `ilink/bot/getupdates`
   * request. Treats non-zero `ret`/`errcode` as failure. Audit HIGH-1 /
   * CRIT-10: the previous implementation merely checked whether a `.buf`
   * file existed on disk — a stale token from months ago passed; a fresh
   * valid token with no buf yet failed; and `botToken` was ignored entirely.
   *
   * Falls back to the prior buf-file probe ONLY when `botToken` is omitted,
   * to preserve the legacy callable shape (`testConnection(accountId)`).
   */
  static async testConnection(accountId: string, botToken?: string): Promise<{ success: boolean; error?: string }> {
    if (!botToken) {
      try {
        const stateDir = getPlatformServices().paths.getDataDir();
        const bufFile = path.join(stateDir, 'weixin-monitor', `${accountId}.buf`);
        fs.accessSync(bufFile);
        return { success: true };
      } catch {
        return { success: false, error: `No sync buf found for accountId: ${accountId}` };
      }
    }

    const baseUrl = 'https://ilinkai.weixin.qq.com';
    const dataDir = getPlatformServices().paths.getDataDir();
    const wechatUin = loadOrCreateWechatUin(dataDir, accountId);
    const url = `${baseUrl}/ilink/bot/getupdates`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          AuthorizationType: 'ilink_bot_token',
          Authorization: `Bearer ${botToken}`,
          'X-WECHAT-UIN': wechatUin,
        },
        // Empty buf + short long-poll keeps the round-trip cheap; we only
        // care whether the auth header is accepted.
        body: JSON.stringify({ get_updates_buf: '', base_info: {} }),
        signal: controller.signal,
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { ret?: number; errcode?: number; errmsg?: string };
      const isErr = (data.ret !== undefined && data.ret !== 0) || (data.errcode !== undefined && data.errcode !== 0);
      if (isErr) {
        return {
          success: false,
          error: data.errmsg || `iLink error ret=${data.ret} errcode=${data.errcode}`,
        };
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    } finally {
      clearTimeout(timer);
    }
  }
}
