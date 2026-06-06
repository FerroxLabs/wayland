/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  extractLineMessageText,
  getLineSourceInfo,
  lineMessageEventToUnified,
  linePostbackEventToUnified,
  type LineMessageEvent,
  type LinePostbackEvent,
} from '@process/channels/plugins/tier2/line/LineAdapter';

describe('getLineSourceInfo', () => {
  it('extracts userId from a user source', () => {
    const info = getLineSourceInfo({ type: 'user', userId: 'U123' });
    expect(info).toEqual({ userId: 'U123', groupId: undefined, roomId: undefined, isGroup: false });
  });

  it('extracts groupId and userId from a group source', () => {
    const info = getLineSourceInfo({ type: 'group', groupId: 'G999', userId: 'U123' });
    expect(info).toEqual({ userId: 'U123', groupId: 'G999', roomId: undefined, isGroup: true });
  });

  it('extracts roomId from a room source', () => {
    const info = getLineSourceInfo({ type: 'room', roomId: 'R777', userId: 'U456' });
    expect(info).toEqual({ userId: 'U456', groupId: undefined, roomId: 'R777', isGroup: true });
  });

  it('returns all-undefined for undefined source', () => {
    const info = getLineSourceInfo(undefined);
    expect(info).toEqual({ userId: undefined, groupId: undefined, roomId: undefined, isGroup: false });
  });
});

describe('extractLineMessageText', () => {
  it('returns text content from a text message', () => {
    expect(extractLineMessageText({ type: 'text', id: 'm1', text: 'Hello' })).toBe('Hello');
  });

  it('returns placeholder for image', () => {
    expect(extractLineMessageText({ type: 'image', id: 'm2' })).toBe('<media:image>');
  });

  it('returns placeholder for video', () => {
    expect(extractLineMessageText({ type: 'video', id: 'm3' })).toBe('<media:video>');
  });

  it('returns placeholder for audio', () => {
    expect(extractLineMessageText({ type: 'audio', id: 'm4' })).toBe('<media:audio>');
  });

  it('returns placeholder for file', () => {
    expect(extractLineMessageText({ type: 'file', id: 'm5' })).toBe('<media:document>');
  });

  it('returns sticker description with keywords when present', () => {
    const text = extractLineMessageText({
      type: 'sticker',
      id: 'm6',
      packageId: '1',
      stickerId: '1',
      keywords: ['happy', 'smile'],
    });
    expect(text).toBe('[Sent a Moon & James sticker: happy, smile]');
  });

  it('returns sticker description without keywords for unknown package', () => {
    const text = extractLineMessageText({
      type: 'sticker',
      id: 'm7',
      packageId: '9999',
      stickerId: '1',
    });
    expect(text).toBe('[Sent a sticker sticker]');
  });

  it('returns empty string for unknown message type', () => {
    expect(extractLineMessageText({ type: 'contact', id: 'm8' } as any)).toBe('');
  });
});

describe('lineMessageEventToUnified', () => {
  const baseEvent = (overrides: Partial<LineMessageEvent> = {}): LineMessageEvent => ({
    type: 'message',
    replyToken: 'reply-token-abc',
    source: { type: 'user', userId: 'U111' },
    timestamp: 1716000000000,
    message: { type: 'text', id: 'msg001', text: 'Hi there' },
    ...overrides,
  });

  it('maps a text message event to IUnifiedIncomingMessage', () => {
    const unified = lineMessageEventToUnified(baseEvent());
    expect(unified).not.toBeNull();
    expect(unified?.id).toBe('msg001');
    expect(unified?.platform).toBe('line');
    expect(unified?.chatId).toBe('U111');
    expect(unified?.user.id).toBe('U111');
    expect(unified?.content.type).toBe('text');
    expect(unified?.content.text).toBe('Hi there');
    expect(unified?.timestamp).toBe(1716000000000);
  });

  it('uses group chatId for group messages', () => {
    const unified = lineMessageEventToUnified(
      baseEvent({ source: { type: 'group', groupId: 'G42', userId: 'U111' } }),
    );
    expect(unified?.chatId).toBe('group:G42');
    expect(unified?.user.id).toBe('U111');
  });

  it('returns null for unsupported message type with no text', () => {
    const event = baseEvent({ message: { type: 'contact', id: 'm99' } as any });
    expect(lineMessageEventToUnified(event)).toBeNull();
  });

  it('returns non-null with placeholder text for image message', () => {
    const event = baseEvent({ message: { type: 'image', id: 'img01' } });
    const unified = lineMessageEventToUnified(event);
    expect(unified?.content.text).toBe('<media:image>');
  });

  it('formats location messages with title, coords, and address', () => {
    const event = baseEvent({
      message: {
        type: 'location',
        id: 'loc1',
        title: 'Tokyo Station',
        address: '1 Chome Marunouchi, Chiyoda',
        latitude: 35.6812,
        longitude: 139.7671,
      } as any,
    });
    const unified = lineMessageEventToUnified(event);
    expect(unified?.content.text).toBe(
      '📍 Tokyo Station (35.6812, 139.7671) - 1 Chome Marunouchi, Chiyoda',
    );
  });

  it('formats location messages without address', () => {
    const event = baseEvent({
      message: {
        type: 'location',
        id: 'loc2',
        title: 'Pin',
        latitude: 1,
        longitude: 2,
      } as any,
    });
    const unified = lineMessageEventToUnified(event);
    expect(unified?.content.text).toBe('📍 Pin (1, 2)');
  });
});

describe('linePostbackEventToUnified', () => {
  it('maps a postback event into IUnifiedIncomingMessage', () => {
    const event: LinePostbackEvent = {
      type: 'postback',
      replyToken: 'rt-pb-001',
      source: { type: 'user', userId: 'U222' },
      timestamp: 1716000001000,
      postback: { data: 'action=buy&item=42' },
    };
    const unified = linePostbackEventToUnified(event);
    expect(unified).not.toBeNull();
    expect(unified?.content.text).toBe('action=buy&item=42');
    expect(unified?.chatId).toBe('U222');
    expect(unified?.id).toBe('postback:rt-pb-001');
  });

  it('returns null when postback data is empty', () => {
    const event: LinePostbackEvent = {
      type: 'postback',
      source: { type: 'user', userId: 'U333' },
      timestamp: 1716000002000,
      postback: { data: '   ' },
    };
    expect(linePostbackEventToUnified(event)).toBeNull();
  });

  it('rewrites line.action= postback querystring into a human phrase', () => {
    const event: LinePostbackEvent = {
      type: 'postback',
      replyToken: 'rt-pb-act',
      source: { type: 'user', userId: 'U444' },
      timestamp: 1716000003000,
      postback: { data: 'line.action=open&line.device=phone' },
    };
    const unified = linePostbackEventToUnified(event);
    expect(unified?.content.text).toBe('line action open device phone');
  });

  it('rewrites line.action= postback without device into a shorter phrase', () => {
    const event: LinePostbackEvent = {
      type: 'postback',
      replyToken: 'rt-pb-act2',
      source: { type: 'user', userId: 'U555' },
      timestamp: 1716000004000,
      postback: { data: 'line.action=close' },
    };
    const unified = linePostbackEventToUnified(event);
    expect(unified?.content.text).toBe('line action close');
  });
});
