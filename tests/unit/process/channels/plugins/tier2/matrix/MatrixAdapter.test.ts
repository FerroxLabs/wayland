/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  MATRIX_MESSAGE_LIMIT,
  splitMatrixMessage,
  toUnifiedIncomingFromMatrix,
  type MatrixEventLike,
  type MatrixMessageContent,
} from '@process/channels/plugins/tier2/matrix/MatrixAdapter';

/**
 * Build a minimal MatrixEventLike for adapter tests. Each field is overridable
 * so individual tests can null specific surfaces.
 */
function buildEvent(overrides: {
  type?: string;
  id?: string;
  roomId?: string;
  sender?: string;
  ts?: number;
  content?: MatrixMessageContent;
} = {}): MatrixEventLike {
  // Distinguish "key not present" (use default) from "key explicitly undefined"
  // (return undefined). The latter is what the "drops missing field" tests
  // need so the adapter's null guards exercise.
  const hasKey = (k: keyof typeof overrides) => Object.prototype.hasOwnProperty.call(overrides, k);
  return {
    getType: () => (hasKey('type') ? (overrides.type as string) : 'm.room.message'),
    getId: () => (hasKey('id') ? overrides.id : '$evt:matrix.org'),
    getRoomId: () => (hasKey('roomId') ? overrides.roomId : '!room:matrix.org'),
    getSender: () => (hasKey('sender') ? overrides.sender : '@alice:matrix.org'),
    getTs: () => (hasKey('ts') ? (overrides.ts as number) : 1_700_000_000_000),
    getContent: () =>
      hasKey('content')
        ? (overrides.content as MatrixMessageContent)
        : { msgtype: 'm.text', body: 'hello' },
  };
}

describe('toUnifiedIncomingFromMatrix', () => {
  const selfUserId = '@bot:matrix.org';

  it('converts an m.text message into a unified text message', () => {
    const event = buildEvent({ content: { msgtype: 'm.text', body: 'hi there' } });
    const result = toUnifiedIncomingFromMatrix(event, selfUserId);
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('matrix');
    expect(result!.chatId).toBe('!room:matrix.org');
    expect(result!.content).toEqual({ type: 'text', text: 'hi there' });
    expect(result!.user.id).toBe('@alice:matrix.org');
  });

  it('classifies m.image as photo with the mxc url as the fileId', () => {
    const event = buildEvent({
      content: {
        msgtype: 'm.image',
        body: 'photo.png',
        url: 'mxc://matrix.org/abc',
        info: { mimetype: 'image/png', size: 1234 },
      },
    });
    const result = toUnifiedIncomingFromMatrix(event, selfUserId);
    expect(result!.content.type).toBe('photo');
    expect(result!.content.attachments?.[0]).toMatchObject({
      type: 'photo',
      fileId: 'mxc://matrix.org/abc',
      mimeType: 'image/png',
      size: 1234,
    });
  });

  it('classifies m.video as video', () => {
    const event = buildEvent({
      content: { msgtype: 'm.video', body: 'clip.mp4', url: 'mxc://x/v' },
    });
    const result = toUnifiedIncomingFromMatrix(event, selfUserId);
    expect(result!.content.type).toBe('video');
    expect(result!.content.attachments?.[0].type).toBe('video');
  });

  it('classifies m.audio as audio', () => {
    const event = buildEvent({
      content: { msgtype: 'm.audio', body: 'voice.ogg', url: 'mxc://x/a' },
    });
    const result = toUnifiedIncomingFromMatrix(event, selfUserId);
    expect(result!.content.type).toBe('audio');
    expect(result!.content.attachments?.[0].type).toBe('audio');
  });

  it('classifies m.file as document', () => {
    const event = buildEvent({
      content: {
        msgtype: 'm.file',
        body: 'report.pdf',
        url: 'mxc://x/f',
        filename: 'report.pdf',
        info: { mimetype: 'application/pdf', size: 999 },
      },
    });
    const result = toUnifiedIncomingFromMatrix(event, selfUserId);
    expect(result!.content.type).toBe('document');
    expect(result!.content.attachments?.[0]).toMatchObject({
      type: 'document',
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('drops own messages (sender === selfUserId) to prevent loops', () => {
    const event = buildEvent({ sender: selfUserId });
    expect(toUnifiedIncomingFromMatrix(event, selfUserId)).toBeNull();
  });

  it('drops non-message events (membership, state, etc.)', () => {
    const event = buildEvent({ type: 'm.room.member' });
    expect(toUnifiedIncomingFromMatrix(event, selfUserId)).toBeNull();
  });

  it('drops events with no sender / id / roomId', () => {
    expect(toUnifiedIncomingFromMatrix(buildEvent({ sender: undefined }), selfUserId)).toBeNull();
    expect(toUnifiedIncomingFromMatrix(buildEvent({ id: undefined }), selfUserId)).toBeNull();
    expect(toUnifiedIncomingFromMatrix(buildEvent({ roomId: undefined }), selfUserId)).toBeNull();
  });

  it('preserves reply parent via m.relates_to.event_id', () => {
    const event = buildEvent({
      content: {
        msgtype: 'm.text',
        body: 'reply',
        'm.relates_to': { rel_type: 'm.in_reply_to', event_id: '$parent:matrix.org' },
      },
    });
    const result = toUnifiedIncomingFromMatrix(event, selfUserId);
    expect(result!.replyToMessageId).toBe('$parent:matrix.org');
  });
});

describe('splitMatrixMessage', () => {
  it('returns the input as a single chunk when under the limit', () => {
    expect(splitMatrixMessage('short')).toEqual(['short']);
  });

  it('splits over the limit at a paragraph boundary when possible', () => {
    const head = 'A'.repeat(50);
    const tail = 'B'.repeat(50);
    const text = `${head}\n\n${tail}`;
    const chunks = splitMatrixMessage(text, 60);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toContain(head);
  });

  it('falls back to a hard cut when no whitespace boundary exists', () => {
    const text = 'X'.repeat(150);
    const chunks = splitMatrixMessage(text, 100);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(50);
  });

  it('uses the default MATRIX_MESSAGE_LIMIT of 65000', () => {
    expect(MATRIX_MESSAGE_LIMIT).toBe(65000);
  });
});
