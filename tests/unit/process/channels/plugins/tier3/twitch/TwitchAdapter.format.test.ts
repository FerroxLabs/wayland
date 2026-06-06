/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TwitchAdapter outgoing message formatting tests.
 * Pure functions - no mocks required.
 */

import { describe, expect, it } from 'vitest';

import {
  TWITCH_MESSAGE_CHUNK_CHARS,
  chunkTextForTwitch,
  fromUnifiedOutgoingToTwitch,
  normalizeTwitchChannel,
  normalizeTwitchToken,
  stripMarkdownForTwitch,
} from '@process/channels/plugins/tier3/twitch/TwitchAdapter';

import type { IUnifiedOutgoingMessage } from '@process/channels/types';

// ── stripMarkdownForTwitch ────────────────────────────────────────────────────

describe('stripMarkdownForTwitch', () => {
  it('returns plain text unchanged', () => {
    expect(stripMarkdownForTwitch('Hello world')).toBe('Hello world');
  });

  it('strips bold **text**', () => {
    expect(stripMarkdownForTwitch('**bold**')).toBe('bold');
  });

  it('strips italic *text*', () => {
    expect(stripMarkdownForTwitch('*italic*')).toBe('italic');
  });

  it('strips inline code', () => {
    expect(stripMarkdownForTwitch('`code`')).toBe('code');
  });

  it('strips markdown links and keeps display text', () => {
    expect(stripMarkdownForTwitch('[click here](https://example.com)')).toBe('click here');
  });

  it('strips images entirely', () => {
    expect(stripMarkdownForTwitch('![alt](https://example.com/img.png)')).toBe('');
  });

  it('collapses newlines to spaces (Twitch is single-line)', () => {
    expect(stripMarkdownForTwitch('line one\nline two')).toBe('line one line two');
  });

  it('preserves emote words', () => {
    // Emote words like "Kappa" are just text - stripping markdown must not remove them.
    expect(stripMarkdownForTwitch('Hello Kappa PogChamp')).toBe('Hello Kappa PogChamp');
  });

  it('returns empty string for blank input', () => {
    expect(stripMarkdownForTwitch('')).toBe('');
    expect(stripMarkdownForTwitch('   ')).toBe('');
  });
});

// ── chunkTextForTwitch ────────────────────────────────────────────────────────

describe('chunkTextForTwitch', () => {
  it('returns empty array for blank input', () => {
    expect(chunkTextForTwitch('')).toEqual([]);
    expect(chunkTextForTwitch('   ')).toEqual([]);
  });

  it('returns single chunk when text fits within limit', () => {
    const short = 'Hello chat!';
    expect(chunkTextForTwitch(short, 500)).toEqual([short]);
  });

  it('splits at word boundary when text exceeds limit', () => {
    // Build a string that is slightly over 20 chars with a word boundary.
    const text = 'word1 word2 word3 word4 word5';
    const chunks = chunkTextForTwitch(text, 20);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
    // Rejoining should reconstruct the original (whitespace may differ at boundaries).
    expect(chunks.join(' ')).toBe(text);
  });

  it('hard-splits a word longer than limit', () => {
    const longWord = 'a'.repeat(30);
    const chunks = chunkTextForTwitch(longWord, 20);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(20);
    expect(chunks[1].length).toBe(10);
  });

  it('uses TWITCH_MESSAGE_CHUNK_CHARS=500 as default', () => {
    const long = 'word '.repeat(120); // 600 chars
    const chunks = chunkTextForTwitch(long);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(TWITCH_MESSAGE_CHUNK_CHARS);
    }
  });

  it('strips markdown before chunking', () => {
    const chunks = chunkTextForTwitch('**bold** text');
    expect(chunks).toEqual(['bold text']);
  });
});

// ── fromUnifiedOutgoingToTwitch ───────────────────────────────────────────────

describe('fromUnifiedOutgoingToTwitch', () => {
  function msg(text: string): IUnifiedOutgoingMessage {
    return { type: 'text', text };
  }

  it('returns single line for short text', () => {
    const { lines } = fromUnifiedOutgoingToTwitch(msg('Hello Twitch!'));
    expect(lines).toEqual(['Hello Twitch!']);
  });

  it('returns empty lines array for blank text', () => {
    const { lines } = fromUnifiedOutgoingToTwitch(msg(''));
    expect(lines).toEqual([]);
  });

  it('chunks long text into multiple lines each ≤ 500 chars', () => {
    const longText = 'word '.repeat(150); // ~750 chars
    const { lines } = fromUnifiedOutgoingToTwitch(msg(longText));
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(500);
    }
  });

  it('strips markdown from outgoing text', () => {
    const { lines } = fromUnifiedOutgoingToTwitch(msg('**bold** and *italic*'));
    expect(lines).toEqual(['bold and italic']);
  });

  it('handles undefined text gracefully', () => {
    const { lines } = fromUnifiedOutgoingToTwitch({ type: 'text' });
    expect(lines).toEqual([]);
  });
});

// ── normalizeTwitchChannel ────────────────────────────────────────────────────

describe('normalizeTwitchChannel', () => {
  it('strips leading # and lowercases', () => {
    expect(normalizeTwitchChannel('#StreamerName')).toBe('streamername');
  });

  it('lowercases without # prefix', () => {
    expect(normalizeTwitchChannel('MyChannel')).toBe('mychannel');
  });

  it('trims whitespace', () => {
    expect(normalizeTwitchChannel('  #chan  ')).toBe('chan');
  });
});

// ── normalizeTwitchToken ──────────────────────────────────────────────────────

describe('normalizeTwitchToken', () => {
  it('strips oauth: prefix', () => {
    expect(normalizeTwitchToken('oauth:abc123')).toBe('abc123');
  });

  it('returns bare token unchanged', () => {
    expect(normalizeTwitchToken('abc123')).toBe('abc123');
  });
});
