/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  SLACK_MESSAGE_LIMIT,
  splitSlackMessage,
  toSlackSendParams,
  toUnifiedIncomingMessage,
  type SlackMessageEvent,
} from '@process/channels/plugins/tier1/slack/SlackAdapter';
import type { IUnifiedOutgoingMessage } from '@process/channels/types';

function makeEvent(overrides: Partial<SlackMessageEvent> = {}): SlackMessageEvent {
  return {
    ts: '1700000000.000100',
    channel: 'C123',
    user: 'U123',
    text: 'hello slack',
    ...overrides,
  };
}

describe('SlackAdapter - toUnifiedIncomingMessage', () => {
  it('converts a text message preserving ts, channel, and text', () => {
    const unified = toUnifiedIncomingMessage(makeEvent(), undefined);
    expect(unified).not.toBeNull();
    expect(unified?.platform).toBe('slack');
    expect(unified?.id).toBe('1700000000.000100');
    expect(unified?.chatId).toBe('C123');
    expect(unified?.content).toEqual({ type: 'text', text: 'hello slack' });
    expect(unified?.timestamp).toBe(1_700_000_000_000);
  });

  it('drops messages from the bot itself (feedback-loop guard)', () => {
    const unified = toUnifiedIncomingMessage(
      makeEvent({ user: 'UBOT' }),
      'UBOT',
    );
    expect(unified).toBeNull();
  });

  it('drops events lacking ts or channel', () => {
    expect(toUnifiedIncomingMessage(makeEvent({ ts: '' }), undefined)).toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ channel: '' }), undefined)).toBeNull();
  });

  it('drops edit/delete subtypes but forwards forwarded subtypes (F7)', () => {
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'message_changed' }), undefined)).toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'message_deleted' }), undefined)).toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'channel_join' }), undefined)).toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'file_share' }), undefined)).not.toBeNull();
    // F7 MED - forwarded subtypes a Wayland-driven bot routinely cares about.
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'app_mention' }), undefined)).not.toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'bot_message' }), undefined)).not.toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'me_message' }), undefined)).not.toBeNull();
    expect(toUnifiedIncomingMessage(makeEvent({ subtype: 'thread_broadcast' }), undefined)).not.toBeNull();
  });

  it('preserves millisecond precision from Slack ts (LOW finding)', () => {
    // ts="1700000000.654321" → 1_700_000_000_654 (floor of seconds*1000).
    const unified = toUnifiedIncomingMessage(makeEvent({ ts: '1700000000.654321' }), undefined);
    expect(unified?.timestamp).toBe(1_700_000_000_654);
  });

  it('classifies image file attachments as photo content', () => {
    const event = makeEvent({
      files: [{ id: 'F1', name: 'screenshot.png', mimetype: 'image/png' }],
      text: 'see attached',
    });
    const unified = toUnifiedIncomingMessage(event, undefined);
    expect(unified?.content.type).toBe('photo');
    expect(unified?.content.text).toBe('see attached');
    expect(unified?.content.attachments).toHaveLength(1);
    expect(unified?.content.attachments?.[0]).toEqual({
      type: 'photo',
      fileId: 'F1',
      fileName: 'screenshot.png',
      mimeType: 'image/png',
    });
  });

  it('falls back to document for unknown mime types (incl. command/action excluded)', () => {
    const event = makeEvent({
      files: [{ id: 'F2', name: 'report.bin', mimetype: 'application/octet-stream' }],
    });
    const unified = toUnifiedIncomingMessage(event, undefined);
    expect(unified?.content.type).toBe('document');
    expect(unified?.content.attachments?.[0]?.type).toBe('document');
  });

  it('classifies audio and video mime prefixes', () => {
    const audio = toUnifiedIncomingMessage(
      makeEvent({ files: [{ id: 'F3', mimetype: 'audio/mp3' }] }),
      undefined,
    );
    const video = toUnifiedIncomingMessage(
      makeEvent({ files: [{ id: 'F4', mimetype: 'video/mp4' }] }),
      undefined,
    );
    expect(audio?.content.type).toBe('audio');
    expect(video?.content.type).toBe('video');
  });

  it('preserves thread_ts as replyToMessageId when the message is a reply', () => {
    const event = makeEvent({ thread_ts: '1699999000.000200' });
    const unified = toUnifiedIncomingMessage(event, undefined);
    expect(unified?.replyToMessageId).toBe('1699999000.000200');
  });

  it('does NOT set replyToMessageId when thread_ts equals ts (parent of own thread)', () => {
    const event = makeEvent({ thread_ts: '1700000000.000100' });
    const unified = toUnifiedIncomingMessage(event, undefined);
    expect(unified?.replyToMessageId).toBeUndefined();
  });
});

describe('SlackAdapter - toSlackSendParams', () => {
  it('extracts text from a unified outgoing message', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text', text: 'reply body' };
    expect(toSlackSendParams(out)).toEqual({ text: 'reply body' });
  });

  it('coerces missing text to empty string', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text' };
    expect(toSlackSendParams(out).text).toBe('');
  });

  it('converts buttons into an actions block', () => {
    const out: IUnifiedOutgoingMessage = {
      type: 'text',
      text: 'choose',
      buttons: [[{ label: 'Yes', action: 'yes' }, { label: 'No', action: 'no' }]],
    };
    const params = toSlackSendParams(out);
    expect(params.blocks).toBeDefined();
    expect(params.blocks?.[0]?.type).toBe('actions');
  });

  it('threads the reply when replyToMessageId is present', () => {
    const out: IUnifiedOutgoingMessage = {
      type: 'text',
      text: 'r',
      replyToMessageId: '1700000000.000200',
    };
    expect(toSlackSendParams(out).thread_ts).toBe('1700000000.000200');
  });

  it('forwards outbound attachments through SlackSendParams (F10 MED)', () => {
    const out = {
      type: 'text',
      text: 'see attached',
      attachments: [
        { data: Buffer.from('hello'), filename: 'note.txt', mimeType: 'text/plain' },
      ],
    } as unknown as IUnifiedOutgoingMessage;
    const params = toSlackSendParams(out);
    expect(params.attachments).toBeDefined();
    expect(params.attachments).toHaveLength(1);
    expect(params.attachments?.[0]?.filename).toBe('note.txt');
  });

  it('drops attachments missing data (defensive)', () => {
    const out = {
      type: 'text',
      text: 'x',
      attachments: [{ filename: 'empty.txt' }],
    } as unknown as IUnifiedOutgoingMessage;
    const params = toSlackSendParams(out);
    expect(params.attachments).toBeUndefined();
  });

  it('fills the notification fallback text when blocks have no text', () => {
    const out: IUnifiedOutgoingMessage = {
      type: 'text',
      text: '',
      buttons: [[{ label: 'Click', action: 'go' }]],
    };
    const params = toSlackSendParams(out);
    expect(params.text.length).toBeGreaterThan(0);
  });
});

describe('SlackAdapter - splitSlackMessage', () => {
  it('returns the original message when under the limit', () => {
    expect(splitSlackMessage('short message')).toEqual(['short message']);
  });

  it('splits at the Slack 3000-char ceiling', () => {
    const long = 'a'.repeat(SLACK_MESSAGE_LIMIT + 500);
    const chunks = splitSlackMessage(long);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(SLACK_MESSAGE_LIMIT);
    }
    expect(chunks.join('')).toBe(long);
  });

  it('prefers paragraph boundaries when possible', () => {
    const para = 'a'.repeat(2500);
    const text = `${para}\n\n${'b'.repeat(800)}`;
    const chunks = splitSlackMessage(text, SLACK_MESSAGE_LIMIT);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(para);
  });
});
