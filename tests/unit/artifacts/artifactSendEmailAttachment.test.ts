/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The far end of "Send to...": can the connector actually carry the file?
 *
 * Before this change the answer was NO, and silently so. `EmailImapConnection`
 * called `sendMail` with exactly `from`/`to`/`subject`/`text` - a deliverable
 * handed to it would have produced a cheerful "sent" and an email with nothing
 * attached. A button that reports success and delivers nothing is worse than no
 * button, so the attachment path is proved here rather than assumed.
 *
 * THE SECOND HALF IS THE SECURITY HALF, and it is why the payload rides a NEW
 * field instead of the existing `mediaActions`.
 *
 * `mediaActions` is AGENT-REACHABLE: an agent writes a `[WAYLAND_CHANNEL_SEND]`
 * block into its own reply, `resolveChannelSendProtocol` parses it, and
 * `ActionExecutor` attaches the result to the outgoing message. Teaching email
 * to attach `mediaActions` would therefore have handed the agent a mail-shaped
 * exfiltration primitive as a side effect of building a human one. So email
 * attaches ONLY `hostAttachments`, a field the channel-send protocol cannot
 * produce and only the main-process artifact send ever sets.
 */

import { describe, expect, it } from 'vitest';

import { buildSmtpEnvelope } from '@process/channels/plugins/tier1/email-imap/EmailImapAdapter';
import { extractChannelSendProtocol } from '@process/channels/utils/channelSendProtocol';
import type { IUnifiedOutgoingMessage } from '@process/channels/types';

const BYTES = Buffer.from('<h1>Morning Brief</h1>');

describe('buildSmtpEnvelope attachments', () => {
  it('carries a host attachment onto the SMTP envelope', () => {
    const message: IUnifiedOutgoingMessage = {
      type: 'file',
      text: 'Attached: brief.html',
      subject: 'Morning Brief',
      hostAttachments: [{ filename: 'brief.html', contentBase64: BYTES.toString('base64') }],
    };

    const envelope = buildSmtpEnvelope(message, 'team@example.com', 'me@example.com');

    expect(envelope.to).toBe('team@example.com');
    expect(envelope.attachments).toEqual([
      {
        filename: 'brief.html',
        content: BYTES.toString('base64'),
        // base64, not a Buffer, because this envelope crosses a forked-worker
        // IPC boundary that serialises as JSON. A Buffer arrives at the worker
        // as `{type:'Buffer',data:[...]}` and nodemailer would attach the JSON.
        encoding: 'base64',
      },
    ]);
  });

  it('round-trips the exact bytes, so the delivered file is the verified one', () => {
    const message: IUnifiedOutgoingMessage = {
      type: 'file',
      text: 'Attached: brief.html',
      hostAttachments: [{ filename: 'brief.html', contentBase64: BYTES.toString('base64') }],
    };

    const attached = buildSmtpEnvelope(message, 'team@example.com', 'me@example.com').attachments![0];
    expect(Buffer.from(attached.content, 'base64').equals(BYTES)).toBe(true);
  });

  it('omits the field entirely for an ordinary reply', () => {
    const envelope = buildSmtpEnvelope(
      { type: 'text', text: 'just a reply' },
      'team@example.com',
      'me@example.com'
    );
    expect(envelope.attachments).toBeUndefined();
  });

  it('uses the basename only, so a filename can never steer a path', () => {
    // The filename reaching nodemailer is a HEADER value. It is host-built from
    // the ledger's recorded relative path, but the envelope refuses to pass a
    // separator through regardless - a second lock on the same door.
    const envelope = buildSmtpEnvelope(
      {
        type: 'file',
        text: 'x',
        hostAttachments: [{ filename: '../../../etc/passwd', contentBase64: BYTES.toString('base64') }],
      },
      'team@example.com',
      'me@example.com'
    );
    expect(envelope.attachments![0].filename).toBe('passwd');
  });
});

describe('the AGENT cannot produce an email attachment', () => {
  it('the channel-send protocol yields mediaActions and never hostAttachments', () => {
    // This is the exact block an agent writes into its own reply to ask for a
    // file to be sent out over a channel.
    const agentReply =
      'Here is the report.\n' +
      '[WAYLAND_CHANNEL_SEND]{"type":"file","path":"secrets.env","fileName":"secrets.env"}[/WAYLAND_CHANNEL_SEND]';

    const extracted = extractChannelSendProtocol(agentReply);

    // Control: the parse really did fire. A zero here would make the assertion
    // below vacuous - it would pass for a block that was never recognised.
    expect(extracted.actions).toHaveLength(1);
    expect(extracted.actions[0].path).toBe('secrets.env');

    // ...and it produced a mediaAction, which the email path ignores. There is
    // no key in this output that `buildSmtpEnvelope` will attach.
    expect(Object.keys(extracted.actions[0])).not.toContain('hostAttachments');
    expect(Object.keys(extracted.actions[0])).not.toContain('contentBase64');
  });

  it('an outgoing message carrying only mediaActions attaches NOTHING to email', () => {
    // The shape ActionExecutor builds after resolving an agent's send block.
    const fromAgent: IUnifiedOutgoingMessage = {
      type: 'text',
      text: 'Here is the report.',
      mediaActions: [{ type: 'file', path: '/home/user/secrets.env', fileName: 'secrets.env' }],
    };

    const envelope = buildSmtpEnvelope(fromAgent, 'attacker@evil.test', 'me@example.com');

    expect(envelope.attachments).toBeUndefined();
    expect(JSON.stringify(envelope)).not.toContain('secrets.env');
  });
});
