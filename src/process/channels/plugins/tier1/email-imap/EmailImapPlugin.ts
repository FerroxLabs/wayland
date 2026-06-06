/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Email plugin backed by raw IMAP (inbound) + SMTP (outbound). This is the
 * "bring-your-own-inbox" sibling of the AgentMail plugin: instead of a SaaS
 * vendor signing webhooks, the operator points us at their own mailbox and we
 * connect with imapflow + nodemailer.
 *
 * Inbound: prefer IMAP IDLE when the server advertises it, fall back to a 30s
 * polling loop otherwise. Each new UNSEEN message in INBOX is converted to
 * IUnifiedIncomingMessage and marked seen so it isn't reprocessed.
 *
 * Outbound: SMTP via nodemailer.createTransport. By default the SMTP
 * credentials mirror the IMAP credentials; the form can opt-out and supply
 * distinct SMTP creds (e.g. Gmail with an app-password for IMAP + a custom
 * relay for outbound).
 *
 * Email has no edit / streaming / reaction / typing support so the plugin
 * declares pure-buffered capabilities.
 */

import { ImapFlow } from 'imapflow';
import nodemailer, { type Transporter } from 'nodemailer';
import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import { buildSmtpEnvelope, parseImapMessage, type ImapMessageEnvelope } from './EmailImapAdapter';

/**
 * Polling interval when the server does not advertise IDLE. 30s mirrors the
 * usual gmail/outlook poll budget; aggressive enough for assistant UX, gentle
 * enough that big providers don't rate-limit us.
 */
const POLL_INTERVAL_MS = 30_000;

/**
 * Reconnect backoff bounds. Start at 5s so a brief flap doesn't hammer the
 * server, cap at 60s so a long outage still recovers within a minute of
 * service being restored.
 */
const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_MAX_MS = 60_000;

type ResolvedCredentials = {
  readonly imap: {
    readonly host: string;
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly tls: boolean;
  };
  readonly smtp: {
    readonly host: string;
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly tls: boolean;
  };
};

type ImapFetchMessage = {
  readonly uid: number;
  readonly envelope?: {
    readonly messageId?: string;
    readonly inReplyTo?: string;
    readonly subject?: string;
    readonly date?: Date;
    readonly from?: ReadonlyArray<{ readonly address?: string; readonly name?: string }>;
    readonly to?: ReadonlyArray<{ readonly address?: string; readonly name?: string }>;
  };
  readonly source?: Buffer;
};

export class EmailImapPlugin extends BasePlugin {
  readonly type: PluginType = 'email-imap';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private creds: ResolvedCredentials | null = null;
  private client: ImapFlow | null = null;
  private smtp: Transporter | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollInFlight = false;
  private idleActive = false;
  private lastSeenUid = 0;
  private readonly activeUsers: Set<string> = new Set();
  /**
   * Tracks an in-flight reconnect setTimeout so onStop() can cancel it. Without
   * this a reconnect scheduled mid-flap would create a fresh ImapFlow long
   * after the plugin was told to stop.
   */
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectBackoffMs = RECONNECT_BACKOFF_START_MS;
  /**
   * True once onStop() begins. Reconnect handlers check this before scheduling
   * a new connect - `this.client` and `this.status` are not enough on their own
   * because a transport-level `close` event can race with logout().
   */
  private stopped = false;

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    this.creds = resolveCredentials(config.credentials ?? {});
  }

  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('Email-IMAP plugin not initialized');
    this.stopped = false;

    // Build outbound SMTP transport eagerly so send-failures surface here
    // rather than on the first agent reply.
    this.smtp = nodemailer.createTransport({
      host: this.creds.smtp.host,
      port: this.creds.smtp.port,
      secure: this.creds.smtp.port === 465,
      requireTLS: this.creds.smtp.tls && this.creds.smtp.port !== 465,
      auth: {
        user: this.creds.smtp.user,
        pass: this.creds.smtp.password,
      },
    });

    await this.connectAndArm();
  }

  /**
   * Build a fresh ImapFlow, connect, drain UNSEEN, then arm IDLE or polling.
   * Used both by onStart and by the reconnect state machine - keeping the
   * sequence in one place ensures recovery looks identical to a cold start.
   */
  private async connectAndArm(): Promise<void> {
    if (!this.creds) throw new Error('Email-IMAP plugin not initialized');

    // logger:false silences imapflow's pino-style chatter.
    const client = new ImapFlow({
      host: this.creds.imap.host,
      port: this.creds.imap.port,
      secure: this.creds.imap.tls,
      auth: {
        user: this.creds.imap.user,
        pass: this.creds.imap.password,
      },
      logger: false,
    });

    // Wire transport-level failure listeners BEFORE connect so a connect-time
    // socket error still routes through the reconnect machine instead of
    // being silently swallowed.
    this.attachTransportListeners(client);

    this.client = client;

    await client.connect();
    await client.mailboxOpen('INBOX');

    // Successful connect resets backoff so the next outage starts at the
    // floor again rather than escalating across unrelated incidents.
    this.reconnectBackoffMs = RECONNECT_BACKOFF_START_MS;

    // Drain unread on startup, then start IDLE or fall back to polling.
    await this.fetchUnseen();

    if (client.serverInfo?.capability?.includes('IDLE')) {
      this.startIdleLoop();
    } else {
      this.startPollingLoop();
    }
  }

  /**
   * Subscribe to imapflow's transport-level events. A hard TCP/TLS drop fires
   * `close` (and sometimes `error`) but does NOT necessarily reject the
   * in-flight `idle()` promise on every server, so listening here is what
   * makes the reconnect machine actually trigger.
   */
  private attachTransportListeners(client: ImapFlow): void {
    const handle = (reason: string, err?: unknown): void => {
      if (this.stopped) return;
      // Only react if this is the currently-active client. A late event from
      // an already-replaced client would otherwise schedule a duplicate
      // reconnect.
      if (this.client !== client) return;
      console.warn(`[email-imapPlugin] transport ${reason}, scheduling reconnect:`, err ?? '');
      this.scheduleReconnect();
    };
    client.on('close', () => handle('close'));
    client.on('error', (err: unknown) => handle('error', err));
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;
    this.idleActive = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.client) {
      try {
        await this.client.logout();
      } catch (err) {
        console.warn('[email-imapPlugin] logout failed:', err);
      }
      this.client = null;
    }
    if (this.smtp) {
      this.smtp.close();
      this.smtp = null;
    }
    this.creds = null;
    this.activeUsers.clear();
    this.lastSeenUid = 0;
    this.reconnectBackoffMs = RECONNECT_BACKOFF_START_MS;
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

  async editMessage(): Promise<void> {
    throw new Error('Email does not support editing messages');
  }

  async handleWebhookPayload(): Promise<void> {
    throw new Error('IMAP plugin uses pull/IDLE, not webhooks');
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.smtp || !this.creds) {
      throw new Error('Email-IMAP plugin not started');
    }
    const envelope = buildSmtpEnvelope(message, chatId, this.creds.imap.user, message.replyToMessageId);

    const info = await this.smtp.sendMail({
      from: envelope.from,
      to: envelope.to,
      subject: envelope.subject,
      text: envelope.text,
      ...(envelope.inReplyTo ? { inReplyTo: envelope.inReplyTo } : {}),
      ...(envelope.references ? { references: envelope.references } : {}),
    });

    const id = typeof info.messageId === 'string' ? info.messageId : '';
    if (!id) {
      throw new Error('SMTP send returned no Message-ID');
    }
    return id;
  }

  /**
   * IDLE loop: when the server pushes "new message", drain the unseen set and
   * re-arm IDLE. We don't use imapflow's higher-level helpers because they
   * conflict with manual fetchUnseen() - explicit drain → re-arm is simpler
   * and easier to reason about.
   */
  private startIdleLoop(): void {
    if (!this.client) return;
    this.idleActive = true;

    const client = this.client;
    client.on('exists', () => {
      // Server says "new message exists". Drain on next tick so we are not
      // holding the IDLE lock while running our own FETCH.
      void this.fetchUnseen().catch((err) =>
        console.error('[email-imapPlugin] fetch on exists failed:', err)
      );
    });

    // Kick off the long-lived IDLE call. imapflow returns when IDLE ends
    // (server timeout or our stop()); we just re-arm. On error we hand off
    // to the reconnect machine - re-arming idle() on a dead client spins
    // forever, which is the bug this loop used to have.
    void (async () => {
      while (this.idleActive && this.client === client && !this.stopped) {
        try {
          await client.idle();
        } catch (err) {
          if (this.stopped || !this.idleActive) return;
          console.warn('[email-imapPlugin] IDLE error, triggering reconnect:', err);
          this.scheduleReconnect();
          return;
        }
      }
    })();
  }

  /**
   * Tear down the current client and schedule a fresh connect after backoff.
   * Idempotent - if a reconnect is already scheduled, return without doubling
   * up.
   */
  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;

    // Stop the IDLE loop / poll so the existing client doesn't keep racing
    // against the new one.
    this.idleActive = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // Best-effort close of the dead client. We don't await - the socket may
    // already be gone and logout() can hang.
    const dead = this.client;
    this.client = null;
    if (dead) {
      try {
        void dead.logout().catch((): void => undefined);
      } catch {
        // ignore - the client is being discarded
      }
    }

    // Audit gemini MED1 2026-05-18: jitter (0-1000ms) to avoid synchronized
    // IMAP reconnect storms when many operators hit the same hosted-mail
    // provider during a brief outage.
    const delay = this.reconnectBackoffMs + Math.floor(Math.random() * 1000);
    this.reconnectBackoffMs = Math.min(this.reconnectBackoffMs * 2, RECONNECT_BACKOFF_MAX_MS);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      void this.connectAndArm().catch((err) => {
        console.warn('[email-imapPlugin] reconnect attempt failed:', err);
        if (!this.stopped) this.scheduleReconnect();
      });
    }, delay);
  }

  private startPollingLoop(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      if (this.pollInFlight) return;
      void this.fetchUnseen().catch((err) =>
        console.error('[email-imapPlugin] poll fetch failed:', err)
      );
    }, POLL_INTERVAL_MS);
  }

  /**
   * FETCH all UNSEEN messages > lastSeenUid, project each into the unified
   * shape, dispatch through messageHandler, and mark seen so the same message
   * is not reprocessed on the next IDLE/poll cycle.
   */
  private async fetchUnseen(): Promise<void> {
    if (!this.client) return;
    if (this.pollInFlight) return;
    this.pollInFlight = true;

    try {
      const search = { seen: false };
      // Use the high-level fetch generator with envelope + source body so we
      // get both the parsed envelope and the raw text for the adapter.
      const messages = this.client.fetch(search, { envelope: true, source: true, uid: true });

      // Iterate sequentially - order matters for lastSeenUid bookkeeping.
      for await (const raw of messages as AsyncIterable<ImapFetchMessage>) {
        const projected = toEnvelopeForAdapter(raw);
        const unified = parseImapMessage(projected);
        if (!unified) {
          console.warn('[email-imapPlugin] dropping message with missing uid/from/messageId');
          continue;
        }
        this.activeUsers.add(unified.user.id);
        try {
          await this.dispatch(unified);
        } catch (err) {
          console.error('[email-imapPlugin] handler threw:', err);
        }
        if (raw.uid > this.lastSeenUid) this.lastSeenUid = raw.uid;

        // Mark this UID as seen so subsequent IDLE/poll iterations skip it.
        try {
          await this.client.messageFlagsAdd(`${raw.uid}`, ['\\Seen'], { uid: true });
        } catch (err) {
          console.warn(`[email-imapPlugin] failed to mark uid=${raw.uid} seen:`, err);
        }
      }
    } finally {
      this.pollInFlight = false;
    }
  }

  private async dispatch(message: IUnifiedIncomingMessage): Promise<void> {
    await this.emitMessage(message);
  }

  // ==================== Static Methods ====================

  /**
   * Validate credentials by opening an IMAP connection + SELECTing INBOX.
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

    const client = new ImapFlow({
      host: creds.imap.host,
      port: creds.imap.port,
      secure: creds.imap.tls,
      auth: {
        user: creds.imap.user,
        pass: creds.imap.password,
      },
      logger: false,
    });

    try {
      await client.connect();
      await client.mailboxOpen('INBOX');
      await client.mailboxClose();
      return { success: true, botUsername: creds.imap.user };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore logout failures during test
      }
    }
  }
}

/**
 * Validate + normalize the raw credentials shape coming from either the
 * persisted IChannelPluginConfig or the renderer's testConnection token.
 * Throws on missing required fields so onInitialize / testConnection can
 * surface a clear message.
 */
function resolveCredentials(creds: Record<string, unknown>): ResolvedCredentials {
  const imapHost = readString(creds.imapHost);
  const imapUser = readString(creds.imapUser);
  const imapPassword = readString(creds.imapPassword);
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
  const smtpPassword = useSameAuth ? imapPassword : readString(creds.smtpPassword);
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

function toEnvelopeForAdapter(raw: ImapFetchMessage): ImapMessageEnvelope {
  const envelope = raw.envelope ?? {};
  const firstFrom = envelope.from?.[0];
  const text = raw.source ? raw.source.toString('utf8') : undefined;
  return {
    uid: raw.uid,
    messageId: envelope.messageId,
    inReplyTo: envelope.inReplyTo,
    subject: envelope.subject,
    date: envelope.date,
    from: firstFrom ? { address: firstFrom.address, name: firstFrom.name } : undefined,
    to: envelope.to?.map((t) => ({ address: t.address, name: t.name })),
    text,
  };
}

