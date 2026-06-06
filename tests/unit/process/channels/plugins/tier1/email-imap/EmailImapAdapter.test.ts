/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  buildSmtpEnvelope,
  parseImapMessage,
} from '@process/channels/plugins/tier1/email-imap/EmailImapAdapter';

describe('parseImapMessage', () => {
  const inboxAddress = 'agent@example.com';

  it('maps a complete IMAP envelope into IUnifiedIncomingMessage', () => {
    const unified = parseImapMessage({
      uid: 42,
      messageId: '<abc123@mail.example.com>',
      from: { address: 'alice@example.com', name: 'Alice Example' },
      to: [{ address: inboxAddress }],
      subject: 'Quarterly report',
      date: '2026-05-17T10:00:00Z',
      text: 'Hello, here is the report.',
    });

    expect(unified).not.toBeNull();
    expect(unified?.id).toBe('<abc123@mail.example.com>');
    expect(unified?.platform).toBe('email-imap');
    expect(unified?.chatId).toBe('alice@example.com');
    expect(unified?.user.id).toBe('alice@example.com');
    expect(unified?.user.displayName).toBe('Alice Example');
    expect(unified?.content.type).toBe('text');
    expect(unified?.content.text).toBe('Hello, here is the report.');
    expect(unified?.email?.from).toBe('alice@example.com');
    expect(unified?.email?.to).toBe(inboxAddress);
    expect(unified?.email?.subject).toBe('Quarterly report');
    expect(unified?.timestamp).toBe(Date.parse('2026-05-17T10:00:00Z'));
  });

  it('preserves the In-Reply-To header into both replyToMessageId and email.inReplyTo', () => {
    const unified = parseImapMessage({
      uid: 99,
      messageId: '<reply@mail.example.com>',
      inReplyTo: '<thread-root@mail.example.com>',
      from: { address: 'bob@example.com' },
      subject: 'Re: thing',
      text: 'replying',
    });

    expect(unified?.replyToMessageId).toBe('<thread-root@mail.example.com>');
    expect(unified?.email?.inReplyTo).toBe('<thread-root@mail.example.com>');
  });

  it('falls back to html-to-text when text body is missing', () => {
    const unified = parseImapMessage({
      uid: 7,
      messageId: '<html@mail.example.com>',
      from: { address: 'html@example.com' },
      subject: 'HTML only',
      html: '<p>Hello <strong>world</strong></p>',
    });

    expect(unified?.content.text).toContain('Hello');
    expect(unified?.content.text).toContain('world');
    expect(unified?.content.text).not.toContain('<p>');
  });

  it('returns null when from is missing', () => {
    const unified = parseImapMessage({
      uid: 1,
      messageId: '<no-from@mail.example.com>',
    });
    expect(unified).toBeNull();
  });

  it('returns null when messageId is missing', () => {
    const unified = parseImapMessage({
      uid: 1,
      from: { address: 'someone@example.com' },
    });
    expect(unified).toBeNull();
  });

  it('returns null when uid is not a finite number', () => {
    const unified = parseImapMessage({
      uid: Number.NaN,
      messageId: '<m@example.com>',
      from: { address: 'someone@example.com' },
    });
    expect(unified).toBeNull();
  });

  it('defaults the subject to "(no subject)" when missing', () => {
    const unified = parseImapMessage({
      uid: 5,
      messageId: '<no-subj@mail.example.com>',
      from: { address: 'x@example.com' },
      text: 'body',
    });
    expect(unified?.email?.subject).toBe('(no subject)');
  });
});

describe('buildSmtpEnvelope', () => {
  const fromAddress = 'agent@example.com';

  it('builds a basic envelope when no reply context is supplied', () => {
    const envelope = buildSmtpEnvelope(
      { type: 'text', text: 'Hello world', subject: 'Hello' },
      'alice@example.com',
      fromAddress
    );
    expect(envelope).toEqual({
      from: fromAddress,
      to: 'alice@example.com',
      subject: 'Hello',
      text: 'Hello world',
    });
  });

  it('threads replies via inReplyTo + references when supplied explicitly', () => {
    const envelope = buildSmtpEnvelope(
      { type: 'text', text: 'replying', subject: 'Re: hi' },
      'alice@example.com',
      fromAddress,
      '<root@mail.example.com>'
    );
    expect(envelope.inReplyTo).toBe('<root@mail.example.com>');
    expect(envelope.references).toBe('<root@mail.example.com>');
  });

  it('threads replies via the message replyToMessageId fallback', () => {
    const envelope = buildSmtpEnvelope(
      {
        type: 'text',
        text: 'replying',
        subject: 'Re: hi',
        replyToMessageId: '<root2@mail.example.com>',
      },
      'alice@example.com',
      fromAddress
    );
    expect(envelope.inReplyTo).toBe('<root2@mail.example.com>');
  });

  it('throws when the body is empty', () => {
    expect(() =>
      buildSmtpEnvelope({ type: 'text', text: '' }, 'alice@example.com', fromAddress)
    ).toThrow(/cannot be empty/i);
  });

  it('defaults the subject to "(no subject)" when missing', () => {
    const envelope = buildSmtpEnvelope(
      { type: 'text', text: 'body' },
      'alice@example.com',
      fromAddress
    );
    expect(envelope.subject).toBe('(no subject)');
  });
});
