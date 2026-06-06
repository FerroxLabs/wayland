/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  rowToUnifiedMessage,
  chatDbDateToMs,
  normalizeSenderId,
  type ChatDbRow,
} from '@process/channels/plugins/tier2/imessage/ImessageAdapter';

function makeRow(overrides: Partial<ChatDbRow> = {}): ChatDbRow {
  return {
    rowid: 1,
    text: 'hello',
    is_from_me: 0,
    date: 0,
    chat_guid: 'chat0011223344556677',
    sender_handle: '+15551234567',
    is_group: 0,
    ...overrides,
  };
}

describe('rowToUnifiedMessage', () => {
  it('converts a 1:1 inbound text message to unified format', () => {
    const row = makeRow({ text: 'hi there', sender_handle: '+15551234567', rowid: 42 });
    const msg = rowToUnifiedMessage(row);
    expect(msg).not.toBeNull();
    expect(msg!.id).toBe('42');
    expect(msg!.platform).toBe('imessage');
    expect(msg!.content.type).toBe('text');
    expect(msg!.content.text).toBe('hi there');
    expect(msg!.user.id).toBe('+15551234567');
    // 1:1 chatId is the normalized handle
    expect(msg!.chatId).toBe('+15551234567');
  });

  it('uses chat_guid as chatId for group messages', () => {
    const row = makeRow({ is_group: 1, chat_guid: 'chatdeadbeef', sender_handle: '+15559876543' });
    const msg = rowToUnifiedMessage(row);
    expect(msg).not.toBeNull();
    expect(msg!.chatId).toBe('chatdeadbeef');
  });

  it('returns null for own messages (is_from_me = 1)', () => {
    const row = makeRow({ is_from_me: 1 });
    expect(rowToUnifiedMessage(row)).toBeNull();
  });

  it('returns null for rows with no text body', () => {
    expect(rowToUnifiedMessage(makeRow({ text: null }))).toBeNull();
    expect(rowToUnifiedMessage(makeRow({ text: '   ' }))).toBeNull();
  });

  it('returns null when sender_handle is missing', () => {
    expect(rowToUnifiedMessage(makeRow({ sender_handle: null }))).toBeNull();
    expect(rowToUnifiedMessage(makeRow({ sender_handle: '' }))).toBeNull();
  });

  it('strips imessage: prefix from sender_handle in the unified user id', () => {
    const row = makeRow({ sender_handle: 'imessage:+15551234567' });
    const msg = rowToUnifiedMessage(row);
    expect(msg!.user.id).toBe('+15551234567');
  });

  it('converts the date field using the Apple CoreData epoch offset', () => {
    // date=0 means 2001-01-01 00:00:00 UTC = 978307200 * 1000 ms
    const row = makeRow({ date: 0 });
    const msg = rowToUnifiedMessage(row);
    expect(msg!.timestamp).toBe(978_307_200 * 1000);
  });
});

describe('chatDbDateToMs', () => {
  it('returns the Apple epoch base for date=0', () => {
    expect(chatDbDateToMs(0)).toBe(978_307_200_000);
  });

  it('converts nanoseconds correctly for a known timestamp', () => {
    // 1_000_000_000 ns = 1 second after Apple epoch
    expect(chatDbDateToMs(1_000_000_000)).toBe(978_307_200_000 + 1000);
  });
});

describe('normalizeSenderId', () => {
  it('strips imessage: prefix', () => {
    expect(normalizeSenderId('imessage:+15551234567')).toBe('+15551234567');
  });

  it('strips sms: prefix', () => {
    expect(normalizeSenderId('sms:+15551234567')).toBe('+15551234567');
  });

  it('strips auto: prefix', () => {
    expect(normalizeSenderId('auto:user@icloud.com')).toBe('user@icloud.com');
  });

  it('lowercases email addresses', () => {
    expect(normalizeSenderId('User@ICloud.COM')).toBe('user@icloud.com');
  });

  it('returns phone numbers unchanged (already E.164)', () => {
    expect(normalizeSenderId('+15551234567')).toBe('+15551234567');
  });

  it('strips internal whitespace from phone-like strings', () => {
    expect(normalizeSenderId('+1 555 123 4567')).toBe('+15551234567');
  });
});
