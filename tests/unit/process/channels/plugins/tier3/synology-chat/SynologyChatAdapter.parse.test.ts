/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for SynologyChatAdapter incoming helpers:
 * parseSynologyChatBody + toUnifiedIncomingFromSynologyChat.
 */

import { describe, expect, it } from 'vitest';

import {
  parseSynologyChatBody,
  toUnifiedIncomingFromSynologyChat,
  type SynologyChatInboundPayload,
} from '@process/channels/plugins/tier3/synology-chat/SynologyChatAdapter';

// ── parseSynologyChatBody ─────────────────────────────────────────────────────

describe('parseSynologyChatBody', () => {
  function makeBody(payload: object): string {
    return `payload=${encodeURIComponent(JSON.stringify(payload))}`;
  }

  it('parses a well-formed form-encoded body', () => {
    const inner = { user_id: '42', username: 'alice', text: 'hello', channel_id: '1' };
    const result = parseSynologyChatBody(makeBody(inner));
    expect(result).not.toBeNull();
    expect(result!.user_id).toBe('42');
    expect(result!.username).toBe('alice');
    expect(result!.text).toBe('hello');
  });

  it('returns null when payload field is absent', () => {
    expect(parseSynologyChatBody('foo=bar&baz=qux')).toBeNull();
  });

  it('returns null when payload JSON is malformed', () => {
    expect(parseSynologyChatBody('payload=not-valid-json')).toBeNull();
  });

  it('returns null for an empty body', () => {
    expect(parseSynologyChatBody('')).toBeNull();
  });

  it('preserves numeric user_id', () => {
    const result = parseSynologyChatBody(makeBody({ user_id: 7, text: 'hi' }));
    expect(result).not.toBeNull();
    expect(result!.user_id).toBe(7);
  });
});

// ── toUnifiedIncomingFromSynologyChat ────────────────────────────────────────

function payload(overrides: Partial<SynologyChatInboundPayload> = {}): SynologyChatInboundPayload {
  return {
    user_id: '42',
    username: 'alice',
    channel_id: '10',
    text: 'hello world',
    timestamp: 1_700_000_000,
    ...overrides,
  };
}

describe('toUnifiedIncomingFromSynologyChat - happy paths', () => {
  it('converts a standard payload to a unified message', () => {
    const result = toUnifiedIncomingFromSynologyChat(payload());
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('synology-chat');
    expect(result!.chatId).toBe('10');
    expect(result!.content.text).toBe('hello world');
    expect(result!.content.type).toBe('text');
    expect(result!.user.id).toBe('42');
    expect(result!.user.username).toBe('alice');
    expect(result!.user.displayName).toBe('alice');
  });

  it('assigns each message a unique id', () => {
    const a = toUnifiedIncomingFromSynologyChat(payload());
    const b = toUnifiedIncomingFromSynologyChat(payload());
    expect(a!.id).not.toBe(b!.id);
  });

  it('converts Unix-second timestamp to milliseconds', () => {
    const result = toUnifiedIncomingFromSynologyChat(payload({ timestamp: 1_700_000_000 }));
    expect(result!.timestamp).toBe(1_700_000_000_000);
  });

  it('passes through ms-range timestamps unchanged', () => {
    const ts = 1_700_000_000_000;
    const result = toUnifiedIncomingFromSynologyChat(payload({ timestamp: ts }));
    expect(result!.timestamp).toBe(ts);
  });

  it('parses string timestamps', () => {
    const result = toUnifiedIncomingFromSynologyChat(payload({ timestamp: '1700000000' }));
    expect(result!.timestamp).toBe(1_700_000_000_000);
  });

  it('falls back to user_id as chatId when channel_id is absent', () => {
    const result = toUnifiedIncomingFromSynologyChat(
      payload({ channel_id: undefined }),
    );
    expect(result!.chatId).toBe('42');
  });

  it('uses user_id as username when username is absent', () => {
    const result = toUnifiedIncomingFromSynologyChat(
      payload({ username: undefined }),
    );
    expect(result!.user.username).toBe('42');
    expect(result!.user.displayName).toBe('42');
  });

  it('preserves the raw payload', () => {
    const p = payload();
    const result = toUnifiedIncomingFromSynologyChat(p);
    expect(result!.raw).toBe(p);
  });

  it('handles numeric user_id', () => {
    const result = toUnifiedIncomingFromSynologyChat(payload({ user_id: 99 }));
    expect(result!.user.id).toBe('99');
  });
});

describe('toUnifiedIncomingFromSynologyChat - trigger_word stripping', () => {
  it('strips trigger_word prefix from text', () => {
    const result = toUnifiedIncomingFromSynologyChat(
      payload({ trigger_word: '/bot', text: '/bot hello' }),
    );
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('hello');
  });

  it('leaves text unchanged when trigger_word is not a prefix', () => {
    const result = toUnifiedIncomingFromSynologyChat(
      payload({ trigger_word: '/bot', text: 'say /bot now' }),
    );
    expect(result!.content.text).toBe('say /bot now');
  });

  it('returns null when text is only the trigger_word', () => {
    expect(
      toUnifiedIncomingFromSynologyChat(
        payload({ trigger_word: '/bot', text: '/bot' }),
      ),
    ).toBeNull();
  });
});

describe('toUnifiedIncomingFromSynologyChat - skip conditions', () => {
  it('returns null when user_id is absent', () => {
    expect(toUnifiedIncomingFromSynologyChat(payload({ user_id: undefined }))).toBeNull();
  });

  it('returns null when text is absent', () => {
    expect(toUnifiedIncomingFromSynologyChat(payload({ text: undefined }))).toBeNull();
  });

  it('returns null when text is whitespace-only', () => {
    expect(toUnifiedIncomingFromSynologyChat(payload({ text: '   ' }))).toBeNull();
  });

  it('returns null when user_id is empty string', () => {
    expect(toUnifiedIncomingFromSynologyChat(payload({ user_id: '' }))).toBeNull();
  });
});
