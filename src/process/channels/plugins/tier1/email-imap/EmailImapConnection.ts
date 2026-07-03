/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The IMAP (inbound IDLE/poll) + SMTP (outbound) connection state machine,
 * extracted from the former main-thread EmailImapPlugin so it can run inside
 * the forked email worker (src/process/worker/emailImap.ts) AND be unit-tested
 * directly. Inbound messages are handed to the `onMessage` callback instead of
 * being dispatched in-process.
 */

import { ImapFlow } from 'imapflow';
import nodemailer, { type Transporter } from 'nodemailer';
import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';
import { buildSmtpEnvelope, parseImapMessage } from './EmailImapAdapter';
import {
  buildImapClientOptions,
  describeImapError,
  toEnvelopeForAdapter,
  type ImapFetchMessage,
  type ResolvedCredentials,
} from './EmailImapShared';

const POLL_INTERVAL_MS = 30_000;
const RECONNECT_BACKOFF_START_MS = 5_000;
const RECONNECT_BACKOFF_MAX_MS = 60_000;
/**
 * Cap on remembered outbound Message-IDs. Bounds memory on a long-lived
 * connection while comfortably covering the window between a send and IMAP
 * polling that same message back into INBOX.
 */
const MAX_TRACKED_SENT_IDS = 500;

/** Lower-case + trim an address/Message-ID for case-insensitive comparison. */
function normalizeKey(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export type TestResult = { success: boolean; botUsername?: string; error?: string };

export class EmailImapConnection {
  private creds: ResolvedCredentials | null = null;
  private client: ImapFlow | null = null;
  private smtp: Transporter | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollInFlight = false;
  private idleActive = false;
  private lastSeenUid = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectBackoffMs = RECONNECT_BACKOFF_START_MS;
  private stopped = false;
  /**
   * Inbound self-reply loop guard (#547). The agent sends from its own inbox
   * over SMTP; IMAP later polls that same mail back into INBOX as UNSEEN. Without
   * a guard, fetchUnseen() would hand the agent its own message, trigger another
   * reply, and loop unbounded. We suppress those echoes two ways:
   *   - selfAddresses: any inbound whose From equals our own inbox address.
   *   - sentMessageIds: any inbound carrying a Message-ID we just sent (covers
   *     alias/relay rewrites where the From no longer matches the inbox).
   * This is inbound-only - the send path is never gated.
   */
  private readonly selfAddresses = new Set<string>();
  private readonly sentMessageIds = new Set<string>();

  constructor(private readonly onMessage: (message: IUnifiedIncomingMessage) => void) {}

  async connect(creds: ResolvedCredentials): Promise<void> {
    this.creds = creds;
    this.stopped = false;
    this.rememberSelfAddress(creds.imap.user);
    this.rememberSelfAddress(creds.smtp.user);

    // Build outbound SMTP transport eagerly so send-failures surface here
    // rather than on the first agent reply.
    this.smtp = nodemailer.createTransport({
      host: creds.smtp.host,
      port: creds.smtp.port,
      secure: creds.smtp.port === 465,
      requireTLS: creds.smtp.tls && creds.smtp.port !== 465,
      auth: { user: creds.smtp.user, pass: creds.smtp.password },
    });

    await this.connectAndArm();
  }

  async send(chatId: string, message: IUnifiedOutgoingMessage, fromUser: string): Promise<string> {
    if (!this.smtp) throw new Error('Email-IMAP worker not connected');
    // The From we are about to send is one of our own addresses; record it so
    // the echo it produces is recognised even before its Message-ID is known.
    this.rememberSelfAddress(fromUser);
    const envelope = buildSmtpEnvelope(message, chatId, fromUser, message.replyToMessageId);
    const info = await this.smtp.sendMail({
      from: envelope.from,
      to: envelope.to,
      subject: envelope.subject,
      text: envelope.text,
      ...(envelope.inReplyTo ? { inReplyTo: envelope.inReplyTo } : {}),
      ...(envelope.references ? { references: envelope.references } : {}),
    });
    const id = typeof info.messageId === 'string' ? info.messageId : '';
    if (!id) throw new Error('SMTP send returned no Message-ID');
    this.rememberSentMessageId(id);
    return id;
  }

  async stop(): Promise<void> {
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
        console.warn('[emailWorker] logout failed:', err);
      }
      this.client = null;
    }
    if (this.smtp) {
      this.smtp.close();
      this.smtp = null;
    }
    this.creds = null;
    this.lastSeenUid = 0;
    this.reconnectBackoffMs = RECONNECT_BACKOFF_START_MS;
    this.selfAddresses.clear();
    this.sentMessageIds.clear();
  }

  /**
   * Build a fresh ImapFlow, connect, drain UNSEEN, then arm IDLE or polling.
   * Used both by connect() and by the reconnect machine - keeping the sequence
   * in one place ensures recovery looks identical to a cold start.
   */
  private async connectAndArm(): Promise<void> {
    if (!this.creds) throw new Error('Email-IMAP worker not initialized');

    const client = new ImapFlow(buildImapClientOptions(this.creds));
    this.attachTransportListeners(client);
    this.client = client;

    try {
      await client.connect();
      await client.mailboxOpen('INBOX');
    } catch (err) {
      throw new Error(describeImapError(err));
    }

    this.reconnectBackoffMs = RECONNECT_BACKOFF_START_MS;
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
   * in-flight `idle()` promise on every server, so listening here is what makes
   * the reconnect machine actually trigger.
   */
  private attachTransportListeners(client: ImapFlow): void {
    const handle = (reason: string, err?: unknown): void => {
      if (this.stopped) return;
      if (this.client !== client) return;
      console.warn(`[emailWorker] transport ${reason}, scheduling reconnect:`, err ?? '');
      this.scheduleReconnect();
    };
    client.on('close', () => handle('close'));
    client.on('error', (err: unknown) => handle('error', err));
  }

  private startIdleLoop(): void {
    if (!this.client) return;
    this.idleActive = true;
    const client = this.client;
    client.on('exists', () => {
      void this.fetchUnseen().catch((err) => console.error('[emailWorker] fetch on exists failed:', err));
    });
    void (async () => {
      while (this.idleActive && this.client === client && !this.stopped) {
        try {
          await client.idle();
        } catch (err) {
          if (this.stopped || !this.idleActive) return;
          console.warn('[emailWorker] IDLE error, triggering reconnect:', err);
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

    this.idleActive = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    const dead = this.client;
    this.client = null;
    if (dead) {
      try {
        void dead.logout().catch((): void => undefined);
      } catch {
        // ignore - the client is being discarded
      }
    }

    // Jitter (0-1000ms) to avoid synchronized reconnect storms against a shared
    // hosted-mail provider during a brief outage.
    const delay = this.reconnectBackoffMs + Math.floor(Math.random() * 1000);
    this.reconnectBackoffMs = Math.min(this.reconnectBackoffMs * 2, RECONNECT_BACKOFF_MAX_MS);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      void this.connectAndArm().catch((err) => {
        console.warn('[emailWorker] reconnect attempt failed:', err);
        if (!this.stopped) this.scheduleReconnect();
      });
    }, delay);
  }

  private startPollingLoop(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      if (this.pollInFlight) return;
      void this.fetchUnseen().catch((err) => console.error('[emailWorker] poll fetch failed:', err));
    }, POLL_INTERVAL_MS);
  }

  /**
   * FETCH all UNSEEN messages, project each into the unified shape, hand to
   * onMessage, and mark seen so the same message is not reprocessed on the next
   * IDLE/poll cycle.
   *
   * imapflow holds a connection-level lock for the duration of a fetch()
   * iteration; running another command (messageFlagsAdd) inside the for-await
   * deadlocks - fetch waits for the loop to advance, the loop waits for the
   * command, the command waits for the lock fetch holds. So we collect UIDs
   * during iteration and mark them seen in ONE command after the generator is
   * exhausted and the lock is released.
   */
  private async fetchUnseen(): Promise<void> {
    const client = this.client;
    if (!client) return;
    if (this.pollInFlight) return;
    this.pollInFlight = true;

    try {
      const search = { seen: false };
      const messages = client.fetch(search, { envelope: true, source: true, uid: true });

      const seenUids: number[] = [];
      for await (const raw of messages as AsyncIterable<ImapFetchMessage>) {
        const projected = toEnvelopeForAdapter(raw);
        const unified = parseImapMessage(projected);
        if (!unified) {
          console.warn('[emailWorker] dropping message with missing uid/from/messageId');
          continue;
        }
        // Suppress the agent's own outbound echoing back into INBOX (#547) - mark
        // it seen so it is not re-fetched, but never hand it to onMessage.
        if (this.isOwnEcho(unified)) {
          console.debug(`[emailWorker] suppressing own echo uid=${raw.uid}`);
          if (raw.uid > this.lastSeenUid) this.lastSeenUid = raw.uid;
          seenUids.push(raw.uid);
          continue;
        }
        try {
          this.onMessage(unified);
        } catch (err) {
          console.error('[emailWorker] onMessage threw:', err);
        }
        if (raw.uid > this.lastSeenUid) this.lastSeenUid = raw.uid;
        seenUids.push(raw.uid);
      }

      // The fetch generator is now exhausted and the connection lock is free,
      // so it is safe to issue the flag command. Mark every drained UID seen in
      // a single command so the same messages are skipped next cycle.
      if (seenUids.length > 0 && this.client === client) {
        try {
          await client.messageFlagsAdd(seenUids.join(','), ['\\Seen'], { uid: true });
        } catch (err) {
          console.warn(`[emailWorker] failed to mark uids=${seenUids.join(',')} seen:`, err);
        }
      }
    } finally {
      this.pollInFlight = false;
    }
  }

  /**
   * True when an inbound message is the agent's own outbound mail echoing back
   * into INBOX - either its From is one of our own addresses, or it carries a
   * Message-ID we recently sent. See the selfAddresses/sentMessageIds fields.
   */
  private isOwnEcho(message: IUnifiedIncomingMessage): boolean {
    const from = normalizeKey(message.email?.from ?? message.chatId);
    if (from && this.selfAddresses.has(from)) return true;
    const messageId = normalizeKey(message.email?.messageId ?? message.id);
    if (messageId && this.sentMessageIds.has(messageId)) return true;
    return false;
  }

  private rememberSelfAddress(address: string | undefined): void {
    const key = normalizeKey(address);
    if (key) this.selfAddresses.add(key);
  }

  private rememberSentMessageId(messageId: string): void {
    const key = normalizeKey(messageId);
    if (!key) return;
    this.sentMessageIds.add(key);
    // Evict oldest (insertion-ordered Set) once over the cap.
    if (this.sentMessageIds.size > MAX_TRACKED_SENT_IDS) {
      const oldest = this.sentMessageIds.values().next().value;
      if (oldest !== undefined) this.sentMessageIds.delete(oldest);
    }
  }
}

/**
 * One-shot connection probe for the Settings "Test & Enable" flow. Runs in the
 * worker so the connect cannot be starved by the main loop.
 */
export async function testEmailConnection(creds: ResolvedCredentials): Promise<TestResult> {
  const client = new ImapFlow(buildImapClientOptions(creds));
  try {
    await client.connect();
    await client.mailboxOpen('INBOX');
    await client.mailboxClose();
    return { success: true, botUsername: creds.imap.user };
  } catch (err) {
    return { success: false, error: describeImapError(err) };
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout failures during test
    }
  }
}
