/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * BluebubblesAdapter format tests - outgoing helpers: buildTapbackPayload
 * and normalizeTapbackName. Covers all six iMessage tapback types, alias
 * emoji variants, and invalid input rejection.
 */

import { describe, expect, it } from 'vitest';

import {
  buildTapbackPayload,
  normalizeTapbackName,
} from '@process/channels/plugins/tier3/bluebubbles/BluebubblesAdapter';

// ── normalizeTapbackName ──────────────────────────────────────────────────────

describe('normalizeTapbackName - supported emoji', () => {
  const cases: [string, string][] = [
    ['❤️', 'love'],
    ['❤', 'love'],
    ['👍', 'like'],
    ['👎', 'dislike'],
    ['😂', 'laugh'],
    ['‼️', 'emphasize'],
    ['‼', 'emphasize'],
    ['❓', 'question'],
  ];

  it.each(cases)('maps %s → %s', (emoji, expected) => {
    expect(normalizeTapbackName(emoji)).toBe(expected);
  });
});

describe('normalizeTapbackName - unsupported emoji', () => {
  it('throws for an unsupported emoji', () => {
    expect(() => normalizeTapbackName('🎉')).toThrow(/unsupported bluebubbles tapback/i);
  });

  it('throws for an empty string', () => {
    expect(() => normalizeTapbackName('')).toThrow(/unsupported bluebubbles tapback/i);
  });

  it('includes the bad emoji in the error message', () => {
    expect(() => normalizeTapbackName('🦄')).toThrow('🦄');
  });
});

// ── buildTapbackPayload ───────────────────────────────────────────────────────

describe('buildTapbackPayload', () => {
  it('builds the correct REST payload for a love reaction', () => {
    const payload = buildTapbackPayload(
      'iMessage;-;+14155550100',
      'msg-guid-abc',
      '❤️',
    );

    expect(payload).toEqual({
      chatGuid: 'iMessage;-;+14155550100',
      selectedMessageGuid: 'msg-guid-abc',
      reaction: 'love',
      partIndex: 0,
    });
  });

  it('builds the correct REST payload for a like reaction', () => {
    const payload = buildTapbackPayload('chat-guid', 'msg-guid', '👍');
    expect(payload).not.toBeNull();
    expect(payload!.reaction).toBe('like');
  });

  it('builds the correct REST payload for a question reaction', () => {
    const payload = buildTapbackPayload('chat-guid', 'msg-guid', '❓');
    expect(payload).not.toBeNull();
    expect(payload!.reaction).toBe('question');
  });

  it('always sets partIndex to 0', () => {
    const payload = buildTapbackPayload('chat-guid', 'msg-guid', '👍');
    expect(payload!.partIndex).toBe(0);
  });

  it('returns null for an unsupported emoji', () => {
    const payload = buildTapbackPayload('chat-guid', 'msg-guid', '🎉');
    expect(payload).toBeNull();
  });

  it('returns null for empty emoji string', () => {
    const payload = buildTapbackPayload('chat-guid', 'msg-guid', '');
    expect(payload).toBeNull();
  });
});
