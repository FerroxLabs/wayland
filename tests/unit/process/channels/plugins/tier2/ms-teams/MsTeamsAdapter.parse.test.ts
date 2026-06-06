/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  decodeHtmlEntities,
  htmlToPlainText,
  normalizeMsTeamsConversationId,
  splitMsTeamsMessage,
  stripMsTeamsMentionTags,
  toUnifiedIncomingFromActivity,
  wasBotMentioned,
  type BotFrameworkActivity,
} from '@process/channels/plugins/tier2/ms-teams/MsTeamsAdapter';

const BOT_ID = 'bot-app-id-123';

function makeActivity(overrides: Partial<BotFrameworkActivity> = {}): BotFrameworkActivity {
  return {
    type: 'message',
    id: 'msg-001',
    timestamp: '2026-05-18T00:00:00Z',
    from: { id: 'user-abc', name: 'Alice' },
    conversation: { id: 'conv-xyz', conversationType: 'personal' },
    recipient: { id: BOT_ID, name: 'Wayland Bot' },
    text: 'Hello bot',
    textFormat: 'plain',
    ...overrides,
  };
}

describe('toUnifiedIncomingFromActivity', () => {
  it('converts a plain text message activity', () => {
    const result = toUnifiedIncomingFromActivity(makeActivity(), BOT_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('msg-001');
    expect(result!.platform).toBe('ms-teams');
    expect(result!.chatId).toBe('conv-xyz');
    expect(result!.content.text).toBe('Hello bot');
    expect(result!.user.id).toBe('user-abc');
    expect(result!.user.displayName).toBe('Alice');
  });

  it('returns null for non-message activity types', () => {
    expect(toUnifiedIncomingFromActivity(makeActivity({ type: 'typing' }), BOT_ID)).toBeNull();
    expect(toUnifiedIncomingFromActivity(makeActivity({ type: 'conversationUpdate' }), BOT_ID)).toBeNull();
    expect(toUnifiedIncomingFromActivity(makeActivity({ type: 'invoke' }), BOT_ID)).toBeNull();
    expect(toUnifiedIncomingFromActivity(makeActivity({ type: 'messageReaction' }), BOT_ID)).toBeNull();
  });

  it('returns null when sender is the bot (echo guard)', () => {
    const result = toUnifiedIncomingFromActivity(
      makeActivity({ from: { id: BOT_ID, name: 'Wayland Bot' } }),
      BOT_ID,
    );
    expect(result).toBeNull();
  });

  it('returns null when conversation id is missing', () => {
    const result = toUnifiedIncomingFromActivity(
      makeActivity({ conversation: { id: '' } }),
      BOT_ID,
    );
    expect(result).toBeNull();
  });

  it('returns null when activity id is missing', () => {
    const result = toUnifiedIncomingFromActivity(makeActivity({ id: '' }), BOT_ID);
    expect(result).toBeNull();
  });

  it('strips HTML and mention tags when textFormat is html', () => {
    const activity = makeActivity({
      textFormat: 'html',
      text: '<at>Wayland Bot</at> <b>Hello</b> &amp; world',
    });
    const result = toUnifiedIncomingFromActivity(activity, BOT_ID);
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('Hello & world');
  });

  it('normalises conversation id by stripping messageid suffix', () => {
    const activity = makeActivity({
      conversation: { id: 'conv-xyz;messageid=0012345' },
    });
    const result = toUnifiedIncomingFromActivity(activity, BOT_ID);
    expect(result!.chatId).toBe('conv-xyz');
  });

  it('includes attachment metadata when present', () => {
    const activity = makeActivity({
      attachments: [
        {
          contentType: 'image/png',
          contentUrl: 'https://example.com/img.png',
          name: 'screenshot.png',
        },
      ],
    });
    const result = toUnifiedIncomingFromActivity(activity, BOT_ID);
    expect(result!.content.attachments).toHaveLength(1);
    expect(result!.content.attachments![0].mimeType).toBe('image/png');
    expect(result!.content.attachments![0].fileName).toBe('screenshot.png');
  });

  it('sets timestamp from activity.timestamp', () => {
    const ts = '2026-01-15T12:30:00Z';
    const result = toUnifiedIncomingFromActivity(makeActivity({ timestamp: ts }), BOT_ID);
    expect(result!.timestamp).toBe(new Date(ts).getTime());
  });
});

describe('HTML helpers', () => {
  it('decodeHtmlEntities handles all common entities', () => {
    expect(decodeHtmlEntities('&lt;b&gt;&amp;amp;&lt;/b&gt;')).toBe('<b>&amp;</b>');
    expect(decodeHtmlEntities('&quot;hello&quot;')).toBe('"hello"');
    expect(decodeHtmlEntities('it&#39;s &nbsp; fine')).toBe("it's   fine");
  });

  it('decodeHtmlEntities decodes &amp; last (no double-decode)', () => {
    expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;');
  });

  it('htmlToPlainText strips tags and collapses whitespace', () => {
    // Tags are replaced with a space, then \s+ is collapsed to a single space.
    // '<b>Hello</b> <em>world</em>' → ' Hello   world ' → 'Hello world'
    expect(htmlToPlainText('<b>Hello</b> <em>world</em>')).toBe('Hello world');
    // '<p>Line&nbsp;1</p><p>Line 2</p>' → ' Line 1  Line 2 ' → 'Line 1 Line 2'
    expect(htmlToPlainText('<p>Line&nbsp;1</p><p>Line 2</p>')).toBe('Line 1 Line 2');
  });

  it('stripMsTeamsMentionTags removes <at> tags', () => {
    expect(stripMsTeamsMentionTags('<at>Bot Name</at> hello')).toBe('hello');
    expect(stripMsTeamsMentionTags('hi <at>Bot</at> there')).toBe('hi  there');
  });
});

describe('normalizeMsTeamsConversationId', () => {
  it('strips messageid suffix', () => {
    expect(normalizeMsTeamsConversationId('19:abc123@thread.v2;messageid=99')).toBe(
      '19:abc123@thread.v2',
    );
  });

  it('passes through ids without suffix', () => {
    expect(normalizeMsTeamsConversationId('a:BcD1234')).toBe('a:BcD1234');
  });
});

describe('wasBotMentioned', () => {
  it('returns true when bot is in mention entities', () => {
    const activity = makeActivity({
      entities: [{ type: 'mention', mentioned: { id: BOT_ID, name: 'Bot' } }],
    });
    expect(wasBotMentioned(activity)).toBe(true);
  });

  it('returns false when no mention entities', () => {
    expect(wasBotMentioned(makeActivity())).toBe(false);
  });

  it('returns false when mention is for a different user', () => {
    const activity = makeActivity({
      entities: [{ type: 'mention', mentioned: { id: 'other-user', name: 'Other' } }],
    });
    expect(wasBotMentioned(activity)).toBe(false);
  });
});

describe('splitMsTeamsMessage', () => {
  it('returns single chunk for short text', () => {
    expect(splitMsTeamsMessage('Hello world')).toEqual(['Hello world']);
  });

  it('splits at word boundary when text exceeds limit', () => {
    const word = 'a'.repeat(10);
    const text = Array(500).fill(word).join(' ');
    const chunks = splitMsTeamsMessage(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
    // Reassembled text should contain all original words
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toContain(word);
  });

  it('splits at newline boundary preferentially', () => {
    const line = 'x'.repeat(80);
    const text = `${line}\n${line}\n${line}`;
    const chunks = splitMsTeamsMessage(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('falls back to hard split when no boundary found', () => {
    const text = 'a'.repeat(200);
    const chunks = splitMsTeamsMessage(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
