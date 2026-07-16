/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Email plugin backed by raw IMAP (inbound) + SMTP (outbound). This is the
 * "bring-your-own-inbox" sibling of the AgentMail plugin: instead of a SaaS
 * vendor signing webhooks, the operator points us at their own mailbox.
 *
 * The actual imapflow/nodemailer sockets run in a forked worker
 * (src/process/worker/emailImap.ts) rather than on the Electron main loop. A
 * busy main process used to starve the IMAP socket and trip "Socket timeout";
 * isolating the connection to its own process makes it immune to main-thread
 * blocking. This plugin is the thin main-side shell: it resolves credentials,
 * forwards commands to the worker, and re-emits inbound messages to the channel
 * bus.
 *
 * Email has no edit / streaming / reaction / typing support so the plugin
 * declares pure-buffered capabilities.
 */

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import { EmailImapWorkerClient } from './EmailImapWorkerClient';
import type { ResolvedCredentials } from './EmailImapShared';

export type { ResolvedCredentials } from './EmailImapShared';

export class EmailImapPlugin extends BasePlugin {
  readonly type: PluginType = 'email-imap';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private creds: ResolvedCredentials | null = null;
  private worker: EmailImapWorkerClient | null = null;
  private readonly activeUsers: Set<string> = new Set();

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    this.creds = resolveCredentials(config.credentials ?? {});
  }

  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('Email-IMAP plugin not initialized');

    const worker = new EmailImapWorkerClient();
    this.worker = worker;

    // Inbound messages arrive from the worker already projected into the
    // unified shape; track the sender and hand off to the channel bus.
    worker.onMessage((message) => {
      this.activeUsers.add(message.user.id);
      void this.emitMessage(message).catch((err) => console.error('[email-imapPlugin] emit failed:', err));
    });

    // connect() resolves on the first successful connect (or rejects with a
    // human-readable reason); the worker owns IDLE/poll/reconnect after that.
    await worker.connect(this.creds);
  }

  protected async onStop(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.stopConnection();
      } catch (err) {
        console.warn('[email-imapPlugin] worker stop failed:', err);
      }
      try {
        await this.worker.kill();
      } catch (err) {
        console.warn('[email-imapPlugin] worker kill failed:', err);
      }
      this.worker = null;
    }
    this.creds = null;
    this.activeUsers.clear();
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.creds) return null;
    return {
      id: this.creds.imap.user,
      username: this.creds.imap.user,
      displayName: this.creds.imap.user,
    };
  }

  /**
   * Email can initiate a thread by sending to its own inbox address, so the
   * operator has a live message to reply into on connect (mirrors the WhatsApp
   * self-chat model). Returns null until credentials are resolved.
   */
  override getSelfTarget(): string | null {
    return this.creds?.imap.user ?? null;
  }

  /** Account identity for the once-per-account welcome marker is the inbox address. */
  override getAccountIdentity(): string | null {
    return this.creds?.imap.user ?? null;
  }

  async editMessage(): Promise<void> {
    throw new Error('Email does not support editing messages');
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('IMAP plugin uses pull/IDLE, not webhooks');
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.worker || !this.creds) {
      throw new Error('Email-IMAP plugin not started');
    }
    return this.worker.sendEmail(chatId, message, this.creds.imap.user);
  }

  // ==================== Static Methods ====================

  /**
   * Validate credentials by opening an IMAP connection + SELECTing INBOX inside
   * a throwaway worker (so the probe cannot be starved by the main loop).
   * Signature mirrors BasePlugin.testConnection (single `token` string) so the
   * Settings IPC layer can call it generically. The token is the JSON-encoded
   * credentials block from the renderer, identical to Matrix + WhatsApp.
   */
  static override async testConnection(
    token: string
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(token) as Record<string, unknown>;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }

    let creds: ResolvedCredentials;
    try {
      creds = resolveCredentials(parsed as Parameters<typeof resolveCredentials>[0]);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }

    const worker = new EmailImapWorkerClient();
    try {
      return await worker.test(creds);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      try {
        await worker.kill();
      } catch {
        // ignore kill failures during test
      }
    }
  }
}

/**
 * Validate + normalize the raw credentials shape coming from either the
 * persisted IChannelPluginConfig or the renderer's testConnection token.
 * Throws on missing required fields so onInitialize / testConnection can
 * surface a clear message.
 *
 * Exported for unit testing (whitespace stripping, defaults, required-field
 * errors) - it is the single normalization seam every connect path flows
 * through, so it earns a direct test.
 */
export function resolveCredentials(creds: Record<string, unknown>): ResolvedCredentials {
  const imapHost = readString(creds.imapHost);
  const imapUser = readString(creds.imapUser);
  // App passwords are displayed by Gmail/Outlook in 4-char groups separated by
  // spaces (e.g. "yahr vkqu tevs rjvy"). Operators paste them verbatim. Gmail
  // tolerates the spaces server-side, but stripping all whitespace here removes
  // any ambiguity and means a spaced paste can never fail auth on a stricter
  // provider. readPassword also trims the leading/trailing whitespace readString
  // would have caught.
  const imapPassword = readPassword(creds.imapPassword);
  if (!imapHost) throw new Error('IMAP host is required');
  if (!imapUser) throw new Error('IMAP user is required');
  if (!imapPassword) throw new Error('IMAP password is required');

  const imapPort = readNumber(creds.imapPort, 993);
  const imapTls = readBool(creds.imapTls, true);

  const useSameAuth = readBool(creds.useSameAuth, true);
  const smtpHost = readString(creds.smtpHost) || imapHost;
  const smtpPort = readNumber(creds.smtpPort, 587);
  const smtpTls = readBool(creds.smtpTls, true);
  const smtpUser = useSameAuth ? imapUser : readString(creds.smtpUser);
  const smtpPassword = useSameAuth ? imapPassword : readPassword(creds.smtpPassword);
  if (!smtpUser) throw new Error('SMTP user is required');
  if (!smtpPassword) throw new Error('SMTP password is required');

  return {
    imap: { host: imapHost, port: imapPort, user: imapUser, password: imapPassword, tls: imapTls },
    smtp: { host: smtpHost, port: smtpPort, user: smtpUser, password: smtpPassword, tls: smtpTls },
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Like {@link readString} but strips ALL whitespace, not just the ends. App
 * passwords are 16-char tokens shown in 4-char groups; the spaces are purely
 * cosmetic and never part of the secret. Stripping them defensively means a
 * verbatim paste authenticates regardless of how the provider formats it.
 */
function readPassword(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, '') : '';
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}
