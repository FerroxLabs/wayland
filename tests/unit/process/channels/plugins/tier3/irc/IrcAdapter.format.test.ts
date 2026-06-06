/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for IrcAdapter outgoing helpers:
 * fromUnifiedOutgoingToIrc, splitIrcText, stripIrcControlChars.
 */

import { describe, expect, it } from 'vitest';

import {
  fromUnifiedOutgoingToIrc,
  IRC_MESSAGE_CHUNK_CHARS,
  splitIrcText,
  stripIrcControlChars,
} from '@process/channels/plugins/tier3/irc/IrcAdapter';

describe('stripIrcControlChars', () => {
  it('passes plain ASCII through unchanged', () => {
    expect(stripIrcControlChars('hello world')).toBe('hello world');
  });

  it('strips mIRC color codes with fg and bg components', () => {
    // \x0304,08 = red on yellow
    expect(stripIrcControlChars('\x0304,08colored\x03')).toBe('colored');
  });

  it('strips color codes with fg only', () => {
    expect(stripIrcControlChars('\x0302blue\x03')).toBe('blue');
  });

  it('strips bold (0x02), underline (0x1f), italic (0x1d), reset (0x0f)', () => {
    expect(stripIrcControlChars('\x02bold\x02')).toBe('bold');
    expect(stripIrcControlChars('\x1funderline\x1f')).toBe('underline');
    expect(stripIrcControlChars('\x1ditalic\x0f')).toBe('italic');
  });

  it('strips DEL (0x7f)', () => {
    expect(stripIrcControlChars('a\x7fb')).toBe('ab');
  });

  it('handles mixed control chars in a single string', () => {
    const dirty = '\x02\x0304Hello\x03 World\x0f\x1f!';
    expect(stripIrcControlChars(dirty)).toBe('Hello World!');
  });
});

describe('splitIrcText', () => {
  it('returns a single chunk for short text', () => {
    const chunks = splitIrcText('short message');
    expect(chunks).toEqual(['short message']);
  });

  it('returns [] for empty or whitespace-only text', () => {
    expect(splitIrcText('')).toEqual([]);
    expect(splitIrcText('   ')).toEqual([]);
  });

  it('strips control chars before splitting', () => {
    const chunks = splitIrcText('\x02bold message\x02');
    expect(chunks).toEqual(['bold message']);
  });

  it('splits long text at word boundaries', () => {
    // Build a string of 10 words * 45 chars = 450 chars > IRC_MESSAGE_CHUNK_CHARS (400)
    const word = 'a'.repeat(44) + ' '; // 45 chars each
    const text = word.repeat(10).trimEnd();
    const chunks = splitIrcText(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(IRC_MESSAGE_CHUNK_CHARS);
    }
    // Reassembled text should match the cleaned input.
    expect(chunks.join(' ')).toBe(text.replace(/\s+/g, ' ').trim());
  });

  it('hard-splits a single word longer than maxChars', () => {
    const longWord = 'x'.repeat(IRC_MESSAGE_CHUNK_CHARS + 50);
    const chunks = splitIrcText(longWord, IRC_MESSAGE_CHUNK_CHARS);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(IRC_MESSAGE_CHUNK_CHARS);
    }
  });

  it('collapses newlines to spaces before splitting', () => {
    const chunks = splitIrcText('line one\nline two\r\nline three');
    expect(chunks).toEqual(['line one line two line three']);
  });
});

describe('fromUnifiedOutgoingToIrc', () => {
  it('converts a short text message to a single line', () => {
    const result = fromUnifiedOutgoingToIrc({ type: 'text', text: 'hello' });
    expect(result.lines).toEqual(['hello']);
  });

  it('returns empty lines array for a message with no text', () => {
    const result = fromUnifiedOutgoingToIrc({ type: 'text', text: '' });
    expect(result.lines).toEqual([]);
  });

  it('returns empty lines array when text field is absent', () => {
    const result = fromUnifiedOutgoingToIrc({ type: 'text' });
    expect(result.lines).toEqual([]);
  });

  it('chunks long text into multiple lines each ≤ IRC_MESSAGE_CHUNK_CHARS', () => {
    const longText = 'word '.repeat(200).trimEnd();
    const result = fromUnifiedOutgoingToIrc({ type: 'text', text: longText });
    expect(result.lines.length).toBeGreaterThan(1);
    for (const line of result.lines) {
      expect(line.length).toBeLessThanOrEqual(IRC_MESSAGE_CHUNK_CHARS);
    }
  });
});
