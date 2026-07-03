/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression guard for the imapflow fetch-lock deadlock: messageFlagsAdd must
 * run ONCE after the fetch() generator is fully drained, never inside the
 * for-await. Calling another command mid-fetch deadlocks the connection (fetch
 * holds the lock the command waits for), which previously hung connect() right
 * after the first message.
 *
 * Also covers the inbound self-reply loop guard (#547): the agent's own
 * outbound, polled back into INBOX, must not be re-emitted to onMessage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ResolvedCredentials } from '@process/channels/plugins/tier1/email-imap/EmailImapShared';

const { ImapFlowStub, fetchMessages, flagsAddCalls, fetchActive, sentMail, lastClient } = vi.hoisted(() => {
  type Raw = { uid: number; envelope: unknown; source: Buffer };
  const fetchMessages: Raw[] = [];
  const flagsAddCalls: Array<{ uids: string; duringFetch: boolean }> = [];
  const fetchActive = { value: false };
  const sentMail = { messageId: '<sent-default>' };
  const lastClient: { emit: (event: string, ...args: unknown[]) => void } = {
    emit: () => undefined,
  };

  function makeEmitter() {
    const listeners: Record<string, Array<(...a: unknown[]) => void>> = {};
    return {
      on(event: string, cb: (...a: unknown[]) => void) {
        (listeners[event] ??= []).push(cb);
        return this;
      },
      off() {
        return this;
      },
      emit(event: string, ...args: unknown[]) {
        for (const cb of listeners[event] ?? []) cb(...args);
        return true;
      },
    };
  }

  class ImapFlowStub {
    constructor(_opts: unknown) {
      const fake = Object.assign(makeEmitter(), {
        connect: vi.fn(async () => undefined),
        mailboxOpen: vi.fn(async () => undefined),
        idle: vi.fn(() => new Promise<void>(() => undefined)),
        logout: vi.fn(async () => undefined),
        serverInfo: { capability: ['IDLE'] },
        fetch: vi.fn(() => {
          fetchActive.value = true;
          return {
            async *[Symbol.asyncIterator]() {
              for (const m of fetchMessages) yield m;
              fetchActive.value = false; // generator exhausted, lock released
            },
          };
        }),
        messageFlagsAdd: vi.fn(async (uids: string) => {
          flagsAddCalls.push({ uids, duringFetch: fetchActive.value });
        }),
      });
      lastClient.emit = (event: string, ...args: unknown[]) => fake.emit(event, ...args);
      return fake as unknown as ImapFlowStub;
    }
  }

  return { ImapFlowStub, fetchMessages, flagsAddCalls, fetchActive, sentMail, lastClient };
});

vi.mock('imapflow', () => ({ ImapFlow: ImapFlowStub }));
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(async () => ({ messageId: sentMail.messageId })),
      close: vi.fn(),
    })),
  },
}));

import { EmailImapConnection } from '@process/channels/plugins/tier1/email-imap/EmailImapConnection';

function makeCreds(): ResolvedCredentials {
  return {
    imap: { host: 'imap.example.com', port: 993, user: 'a@b', password: 'pw', tls: true },
    smtp: { host: 'imap.example.com', port: 587, user: 'a@b', password: 'pw', tls: true },
  };
}

function makeRaw(uid: number, addr: string) {
  return {
    uid,
    envelope: { messageId: `<m${uid}>`, from: [{ address: addr }], subject: 's' },
    source: Buffer.from('body'),
  };
}

describe('EmailImapConnection - fetch drain marks seen after iteration', () => {
  beforeEach(() => {
    fetchMessages.length = 0;
    flagsAddCalls.length = 0;
    fetchActive.value = false;
  });
  afterEach(() => vi.restoreAllMocks());

  it('emits every message and marks all seen in ONE post-iteration command', async () => {
    fetchMessages.push(makeRaw(1, 'x@y.com'), makeRaw(2, 'z@y.com'));

    const seen: string[] = [];
    const conn = new EmailImapConnection((m) => seen.push(m.chatId));
    await conn.connect(makeCreds());

    // Both messages delivered.
    expect(seen).toEqual(['x@y.com', 'z@y.com']);

    // messageFlagsAdd called exactly once, with both UIDs, AFTER the generator
    // drained (never while the fetch lock was held).
    expect(flagsAddCalls).toHaveLength(1);
    expect(flagsAddCalls[0]!.uids).toBe('1,2');
    expect(flagsAddCalls[0]!.duringFetch).toBe(false);

    await conn.stop();
  });

  it('connect resolves even when unseen messages are present', async () => {
    fetchMessages.push(makeRaw(1, 'x@y.com'));
    const conn = new EmailImapConnection(() => undefined);
    // The bug made this hang forever; a passing test proves connect() returns.
    await expect(conn.connect(makeCreds())).resolves.toBeUndefined();
    await conn.stop();
  });
});

describe('EmailImapConnection - inbound self-reply loop guard (#547)', () => {
  beforeEach(() => {
    fetchMessages.length = 0;
    flagsAddCalls.length = 0;
    fetchActive.value = false;
    sentMail.messageId = '<sent-default>';
  });
  afterEach(() => vi.restoreAllMocks());

  it('does NOT re-emit the agent own mail (from == inbox address) but still marks it seen', async () => {
    // makeCreds() logs in as a@b, so a message FROM a@b is the agent echoing
    // its own just-sent mail back into INBOX. A genuine reply from z@y.com must
    // still be delivered.
    fetchMessages.push(makeRaw(1, 'a@b'), makeRaw(2, 'z@y.com'));

    const seen: string[] = [];
    const conn = new EmailImapConnection((m) => seen.push(m.chatId));
    await conn.connect(makeCreds());

    // Only the genuine inbound reply reaches onMessage.
    expect(seen).toEqual(['z@y.com']);
    // Both UIDs are still marked seen so the echo is not re-fetched forever.
    expect(flagsAddCalls).toHaveLength(1);
    expect(flagsAddCalls[0]!.uids).toBe('1,2');

    await conn.stop();
  });

  it('does NOT re-emit a message whose Message-ID matches one we just sent', async () => {
    // The agent sends a reply; SMTP returns <m5>. When IMAP polls that exact
    // message back (even if the From header does not equal the inbox address,
    // e.g. an alias/relay rewrite), the Message-ID dedup must still suppress it.
    sentMail.messageId = '<m5>';

    const seen: string[] = [];
    const conn = new EmailImapConnection((m) => seen.push(m.id));
    await conn.connect(makeCreds());
    await conn.send('to@x.com', { text: 'hi' } as never, 'alias@b');

    // From is NOT the inbox address - isolates the Message-ID dedup path.
    fetchMessages.push(
      {
        uid: 5,
        envelope: { messageId: '<m5>', from: [{ address: 'noreply@relay.example' }], subject: 's' },
        source: Buffer.from('body'),
      },
      makeRaw(6, 'stranger@y.com')
    );
    // Drive a second poll the way IMAP IDLE does - via the 'exists' event.
    lastClient.emit('exists');
    await vi.waitFor(() => expect(seen).toEqual(['<m6>']));

    await conn.stop();
  });

  it('delivers a genuine inbound reply from a third party unchanged', async () => {
    fetchMessages.push(makeRaw(9, 'customer@acme.com'));

    const seen: string[] = [];
    const conn = new EmailImapConnection((m) => seen.push(m.chatId));
    await conn.connect(makeCreds());

    expect(seen).toEqual(['customer@acme.com']);

    await conn.stop();
  });
});
