/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalAdapter.format - outgoing IUnifiedOutgoingMessage → signal-cli RPC params,
 * plus text chunking behaviour.
 */

import { describe, expect, it } from 'vitest';

import {
  chunkSignalText,
  unifiedToSignalSend,
  SIGNAL_TEXT_CHUNK_LIMIT,
} from '@process/channels/plugins/tier1/signal/SignalAdapter';
import type { IUnifiedOutgoingMessage } from '@process/channels/types';

const ACCOUNT = '+14155551234';

function msg(text: string): IUnifiedOutgoingMessage {
  return { type: 'text', text };
}

// ── chunkSignalText ───────────────────────────────────────────────────────────

describe('chunkSignalText', () => {
  it('returns empty array for empty / whitespace-only input', () => {
    expect(chunkSignalText('')).toEqual([]);
    expect(chunkSignalText('   ')).toEqual([]);
  });

  it('returns single chunk when text is within limit', () => {
    const text = 'Hello, Signal!';
    expect(chunkSignalText(text)).toEqual([text]);
  });

  it('splits on paragraph boundary (\\n\\n) when possible', () => {
    const para1 = 'A'.repeat(1_500);
    const para2 = 'B'.repeat(1_500);
    const text = `${para1}\n\n${para2}`;
    const chunks = chunkSignalText(text, SIGNAL_TEXT_CHUNK_LIMIT);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk must be within the limit.
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(SIGNAL_TEXT_CHUNK_LIMIT);
    }
    // Reassembled chunks must cover the whole text (minus leading/trailing whitespace).
    const joined = chunks.join('\n\n');
    expect(joined.replace(/\s+/g, '')).toBe(text.replace(/\s+/g, ''));
  });

  it('falls back to word boundary when no paragraph break fits', () => {
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
    const chunks = chunkSignalText(words, 500);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }
    // No chunk should start with a space.
    for (const chunk of chunks) {
      expect(chunk.startsWith(' ')).toBe(false);
    }
  });

  it('hard-splits when no whitespace separator is available within limit', () => {
    const solid = 'X'.repeat(3_000);
    const chunks = chunkSignalText(solid, 1_000);
    expect(chunks.length).toBe(3);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1_000);
    }
  });

  it('uses the default limit constant when no limit arg given', () => {
    const short = 'Hi';
    expect(chunkSignalText(short)).toEqual(['Hi']);
  });
});

// ── unifiedToSignalSend ───────────────────────────────────────────────────────

describe('unifiedToSignalSend', () => {
  it('routes E.164 phone number to recipient array', () => {
    const params = unifiedToSignalSend('+12125550100', msg('Hello'), ACCOUNT);
    expect(params.recipient).toEqual(['+12125550100']);
    expect(params.groupId).toBeUndefined();
    expect(params.message).toBe('Hello');
    expect(params.account).toBe(ACCOUNT);
  });

  it('routes UUID chat-id to recipient array (lowercased)', () => {
    const uuid = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';
    const params = unifiedToSignalSend(uuid, msg('Hello'), ACCOUNT);
    expect(params.recipient).toEqual([uuid.toLowerCase()]);
    expect(params.groupId).toBeUndefined();
  });

  it('routes group: chat-id to groupId field', () => {
    const params = unifiedToSignalSend('group:abc123==', msg('Hello group'), ACCOUNT);
    expect(params.groupId).toBe('abc123==');
    expect(params.recipient).toBeUndefined();
    expect(params.message).toBe('Hello group');
  });

  it('trims leading/trailing whitespace from message text', () => {
    const params = unifiedToSignalSend('+12125550100', msg('  trimmed  '), ACCOUNT);
    expect(params.message).toBe('trimmed');
  });

  it('produces empty string when message has no text', () => {
    const params = unifiedToSignalSend('+12125550100', { type: 'text' }, ACCOUNT);
    expect(params.message).toBe('');
  });
});
