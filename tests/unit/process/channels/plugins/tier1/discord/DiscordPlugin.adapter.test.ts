/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import type { Attachment, Message as DiscordMessage, User as DiscordUser } from 'discord.js';

import {
  DISCORD_MESSAGE_LIMIT,
  splitMessage,
  toDiscordSendParams,
  toUnifiedIncomingMessage,
  toUnifiedUser,
} from '@process/channels/plugins/tier1/discord/DiscordAdapter';
import type { IUnifiedOutgoingMessage } from '@process/channels/types';

/**
 * Stub builders - we deliberately type-cast minimal objects to the discord.js
 * surface the adapter actually reads. discord.js types are large but the
 * adapter only touches a few well-known fields per message; faking the full
 * Client/Manager graph is unnecessary.
 */
function makeUser(overrides: Partial<DiscordUser> = {}): DiscordUser {
  return {
    id: '1001',
    username: 'sean',
    globalName: 'Sean Donahoe',
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/1001/abc.png',
    ...overrides,
  } as unknown as DiscordUser;
}

function makeMessage(overrides: Partial<DiscordMessage> & Record<string, unknown> = {}): DiscordMessage {
  const base = {
    id: 'msg-42',
    channelId: 'chan-7',
    author: makeUser(),
    content: 'hello world',
    createdTimestamp: 1_700_000_000_000,
    reference: null,
    attachments: new Map(),
  } as unknown as DiscordMessage;
  return { ...base, ...overrides } as DiscordMessage;
}

describe('DiscordAdapter - toUnifiedUser', () => {
  it('converts a populated Discord user to the unified shape', () => {
    const unified = toUnifiedUser(makeUser());
    expect(unified).toEqual({
      id: '1001',
      username: 'sean',
      displayName: 'Sean Donahoe',
      avatarUrl: 'https://cdn.discordapp.com/avatars/1001/abc.png',
    });
  });

  it('falls back to username when globalName is null', () => {
    const unified = toUnifiedUser(makeUser({ globalName: null }));
    expect(unified?.displayName).toBe('sean');
  });

  it('returns null for missing user', () => {
    expect(toUnifiedUser(null)).toBeNull();
    expect(toUnifiedUser(undefined)).toBeNull();
  });
});

describe('DiscordAdapter - toUnifiedIncomingMessage', () => {
  it('converts a text message preserving id, channel, and content', () => {
    const unified = toUnifiedIncomingMessage(makeMessage());
    expect(unified).not.toBeNull();
    expect(unified?.platform).toBe('discord');
    expect(unified?.id).toBe('msg-42');
    expect(unified?.chatId).toBe('chan-7');
    expect(unified?.content).toEqual({ type: 'text', text: 'hello world' });
    expect(unified?.timestamp).toBe(1_700_000_000_000);
    expect(unified?.replyToMessageId).toBeUndefined();
  });

  it('exposes replyToMessageId when the message is a reply', () => {
    const msg = makeMessage({
      reference: { messageId: 'parent-99', channelId: 'chan-7', guildId: null },
    } as unknown as Partial<DiscordMessage>);
    const unified = toUnifiedIncomingMessage(msg);
    expect(unified?.replyToMessageId).toBe('parent-99');
  });

  it('classifies image attachments as photo content', () => {
    const attachments = new Map<string, Attachment>();
    attachments.set('att-1', {
      id: 'att-1',
      name: 'screenshot.png',
      contentType: 'image/png',
      size: 1234,
    } as unknown as Attachment);
    const unified = toUnifiedIncomingMessage(
      makeMessage({ attachments, content: 'see attached' } as unknown as Partial<DiscordMessage>),
    );
    expect(unified?.content.type).toBe('photo');
    expect(unified?.content.text).toBe('see attached');
    expect(unified?.content.attachments).toHaveLength(1);
    expect(unified?.content.attachments?.[0]).toMatchObject({
      type: 'photo',
      fileId: 'att-1',
      fileName: 'screenshot.png',
      mimeType: 'image/png',
      size: 1234,
    });
  });

  it('falls back to document for unknown mime types', () => {
    const attachments = new Map<string, Attachment>();
    attachments.set('att-2', {
      id: 'att-2',
      name: 'report.bin',
      contentType: 'application/octet-stream',
      size: 9999,
    } as unknown as Attachment);
    const unified = toUnifiedIncomingMessage(
      makeMessage({ attachments } as unknown as Partial<DiscordMessage>),
    );
    expect(unified?.content.type).toBe('document');
  });

  it('returns null when message has no author', () => {
    const msg = makeMessage({ author: null as unknown as DiscordUser });
    expect(toUnifiedIncomingMessage(msg)).toBeNull();
  });
});

describe('DiscordAdapter - toDiscordSendParams', () => {
  it('extracts content text from a unified outgoing message', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text', text: 'reply body' };
    expect(toDiscordSendParams(out)).toEqual({ content: 'reply body' });
  });

  it('coerces missing text to empty string', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text' };
    expect(toDiscordSendParams(out).content).toBe('');
  });

  // F-9: replyToMessageId must map to native Discord messageReference so the
  // client renders as a quote-reply rather than a flat send.
  it('maps replyToMessageId to messageReference for native reply rendering', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text', text: 'thread reply', replyToMessageId: 'parent-99' };
    const params = toDiscordSendParams(out);
    expect(params.content).toBe('thread reply');
    expect(params.messageReference).toEqual({ messageId: 'parent-99' });
  });

  // F-9: silent: true should suppress all mention categories. `repliedUser:
  // false` prevents pinging the original author when quote-replying.
  it('silences all mentions when silent=true', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text', text: 'no pings', silent: true };
    const params = toDiscordSendParams(out);
    expect(params.allowedMentions).toEqual({ parse: [], repliedUser: false });
  });

  it('omits allowedMentions/messageReference when neither is set', () => {
    const out: IUnifiedOutgoingMessage = { type: 'text', text: 'plain' };
    const params = toDiscordSendParams(out);
    expect(params.allowedMentions).toBeUndefined();
    expect(params.messageReference).toBeUndefined();
  });
});

// F-8: raw must be a plain, IPC-safe primitives object - not the full
// discord.js Message graph (which has circular Client/Channel/Guild refs).
describe('DiscordAdapter - toUnifiedIncomingMessage raw shape', () => {
  it('survives JSON.stringify (no circular structures from discord.js Message)', () => {
    const unified = toUnifiedIncomingMessage(
      makeMessage({ guildId: 'guild-1', webhookId: null } as unknown as Partial<DiscordMessage>),
    );
    expect(unified).not.toBeNull();
    expect(() => JSON.stringify(unified)).not.toThrow();
    expect(unified?.raw).toEqual({
      guildId: 'guild-1',
      channelId: 'chan-7',
      authorId: '1001',
      authorIsBot: false,
      webhookId: null,
    });
  });
});

describe('DiscordAdapter - splitMessage', () => {
  it('returns the original message when under the limit', () => {
    expect(splitMessage('short message')).toEqual(['short message']);
  });

  it('splits at the 2000-char Discord boundary', () => {
    const long = 'a'.repeat(DISCORD_MESSAGE_LIMIT + 500);
    const chunks = splitMessage(long);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    }
    expect(chunks.join('')).toBe(long);
  });

  it('prefers paragraph boundaries when possible', () => {
    const para = 'a'.repeat(1500);
    const text = `${para}\n\n${'b'.repeat(800)}`;
    const chunks = splitMessage(text, DISCORD_MESSAGE_LIMIT);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(para);
  });
});
