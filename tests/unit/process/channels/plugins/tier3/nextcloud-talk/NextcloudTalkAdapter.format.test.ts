/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for NextcloudTalkAdapter - outgoing message formatting.
 * fromUnifiedOutgoingToNextcloudTalk: short text, chunked long text,
 * blank text, replyTo threading.
 * splitNextcloudTalkText: edge cases and chunk boundary behaviour.
 */

import { describe, expect, it } from 'vitest';

import {
  NC_MESSAGE_CHUNK_CHARS,
  fromUnifiedOutgoingToNextcloudTalk,
  splitNextcloudTalkText,
} from '@process/channels/plugins/tier3/nextcloud-talk/NextcloudTalkAdapter';

// ── splitNextcloudTalkText ────────────────────────────────────────────────────

describe('splitNextcloudTalkText', () => {
  it('returns the text as a single chunk when within limit', () => {
    const chunks = splitNextcloudTalkText('hello world');
    expect(chunks).toEqual(['hello world']);
  });

  it('returns [] for empty string', () => {
    expect(splitNextcloudTalkText('')).toEqual([]);
  });

  it('returns [] for whitespace-only string', () => {
    expect(splitNextcloudTalkText('   ')).toEqual([]);
  });

  it('splits a long string into chunks all within maxChars', () => {
    const longText = 'word '.repeat(Math.ceil((NC_MESSAGE_CHUNK_CHARS * 2) / 5)).trimEnd();
    const chunks = splitNextcloudTalkText(longText);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(NC_MESSAGE_CHUNK_CHARS);
    }
  });

  it('rejoined chunks match the original trimmed text (no word loss)', () => {
    const words = Array.from({ length: 1000 }, (_, i) => `word${i}`);
    const longText = words.join(' ');
    const chunks = splitNextcloudTalkText(longText);
    const rejoined = chunks.join(' ');
    expect(rejoined).toBe(longText.trim());
  });

  it('handles a string exactly at the limit as a single chunk', () => {
    const text = 'a'.repeat(NC_MESSAGE_CHUNK_CHARS);
    const chunks = splitNextcloudTalkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('handles a string one char over the limit by splitting', () => {
    // Use two equal-length words separated by a space, total > maxChars.
    const half = 'a'.repeat(Math.floor(NC_MESSAGE_CHUNK_CHARS / 2));
    const text = `${half} ${half} ${half}`;
    const chunks = splitNextcloudTalkText(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('respects a custom maxChars argument', () => {
    const chunks = splitNextcloudTalkText('hello world foo bar', 10);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(10);
    }
  });
});

// ── fromUnifiedOutgoingToNextcloudTalk ────────────────────────────────────────

describe('fromUnifiedOutgoingToNextcloudTalk', () => {
  it('returns a single chunk for short text', () => {
    const result = fromUnifiedOutgoingToNextcloudTalk({ type: 'text', text: 'hi there' });
    expect(result.chunks).toEqual(['hi there']);
    expect(result.replyTo).toBeUndefined();
  });

  it('returns multiple chunks for long text', () => {
    const longText = 'word '.repeat(Math.ceil((NC_MESSAGE_CHUNK_CHARS * 2) / 5)).trimEnd();
    const result = fromUnifiedOutgoingToNextcloudTalk({ type: 'text', text: longText });
    expect(result.chunks.length).toBeGreaterThan(1);
  });

  it('returns empty chunks array for blank text', () => {
    const result = fromUnifiedOutgoingToNextcloudTalk({ type: 'text', text: '' });
    expect(result.chunks).toEqual([]);
  });

  it('returns empty chunks array when text is undefined', () => {
    const result = fromUnifiedOutgoingToNextcloudTalk({ type: 'text' });
    expect(result.chunks).toEqual([]);
  });

  it('passes replyToMessageId through as replyTo', () => {
    const result = fromUnifiedOutgoingToNextcloudTalk({
      type: 'text',
      text: 'reply text',
      replyToMessageId: '99',
    });
    expect(result.replyTo).toBe('99');
  });

  it('leaves replyTo undefined when no replyToMessageId', () => {
    const result = fromUnifiedOutgoingToNextcloudTalk({ type: 'text', text: 'hi' });
    expect(result.replyTo).toBeUndefined();
  });
});
