/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  toAgentMailSendBody,
  toUnifiedIncomingFromAgentMail,
} from '@process/channels/plugins/tier1/email-agentmail/EmailAgentMailAdapter';

describe('toUnifiedIncomingFromAgentMail', () => {
  const inboxAddress = 'agent@workspace.agentmail.to';

  it('maps a complete AgentMail inbound payload into IUnifiedIncomingMessage', () => {
    const unified = toUnifiedIncomingFromAgentMail(
      {
        event: 'message.received',
        message: {
          message_id: '<abc123@mail.example.com>',
          from: 'alice@example.com',
          from_name: 'Alice Example',
          to: inboxAddress,
          subject: 'Quarterly report',
          text: 'Hello, here is the report.',
          received_at: '2026-05-17T10:00:00Z',
          references: ['<thread-root@example.com>'],
        },
      },
      inboxAddress
    );

    expect(unified).not.toBeNull();
    expect(unified?.id).toBe('<abc123@mail.example.com>');
    expect(unified?.platform).toBe('email-agentmail');
    expect(unified?.chatId).toBe('alice@example.com');
    expect(unified?.user.id).toBe('alice@example.com');
    expect(unified?.user.displayName).toBe('Alice Example');
    expect(unified?.content.type).toBe('text');
    expect(unified?.content.text).toBe('Hello, here is the report.');
    expect(unified?.email?.from).toBe('alice@example.com');
    expect(unified?.email?.to).toBe(inboxAddress);
    expect(unified?.email?.subject).toBe('Quarterly report');
    expect(unified?.email?.references).toEqual(['<thread-root@example.com>']);
    // ISO timestamp parses to ms epoch - sanity check it landed in the right ballpark.
    expect(unified?.timestamp).toBe(Date.parse('2026-05-17T10:00:00Z'));
  });

  it('returns null when message_id is missing', () => {
    const unified = toUnifiedIncomingFromAgentMail(
      { message: { from: 'alice@example.com' } },
      inboxAddress
    );
    expect(unified).toBeNull();
  });

  it('returns null when from is missing', () => {
    const unified = toUnifiedIncomingFromAgentMail(
      { message: { message_id: '<m1@example.com>' } },
      inboxAddress
    );
    expect(unified).toBeNull();
  });

  it('falls back to stripped HTML when text body is empty', () => {
    const unified = toUnifiedIncomingFromAgentMail(
      {
        message: {
          message_id: '<m2@example.com>',
          from: 'bob@example.com',
          html: '<p>Hello <b>world</b></p><script>alert(1)</script>',
        },
      },
      inboxAddress
    );
    expect(unified?.content.text).toBe('Hello world');
  });

  it('falls back to sender address when from_name is absent and uses email subject default', () => {
    const unified = toUnifiedIncomingFromAgentMail(
      {
        message: {
          message_id: '<m3@example.com>',
          from: 'carol@example.com',
          text: 'no subject given',
        },
      },
      inboxAddress
    );
    expect(unified?.user.displayName).toBe('carol@example.com');
    expect(unified?.email?.subject).toBe('(no subject)');
  });
});

describe('toAgentMailSendBody', () => {
  it('builds a basic send body', () => {
    const body = toAgentMailSendBody({ type: 'text', text: 'Hello', subject: 'Greetings' }, 'dest@example.com');
    expect(body).toEqual({ to: 'dest@example.com', subject: 'Greetings', text: 'Hello' });
  });

  it('threads replies via in_reply_to when replyToMessageId is provided', () => {
    const body = toAgentMailSendBody(
      { type: 'text', text: 'Reply body', replyToMessageId: '<root@example.com>' },
      'dest@example.com'
    );
    expect(body.in_reply_to).toBe('<root@example.com>');
    expect(body.subject).toBe('(no subject)');
  });

  it('throws when body text is empty after trim', () => {
    expect(() => toAgentMailSendBody({ type: 'text', text: '   ' }, 'dest@example.com')).toThrow(
      /cannot be empty/i
    );
  });
});
