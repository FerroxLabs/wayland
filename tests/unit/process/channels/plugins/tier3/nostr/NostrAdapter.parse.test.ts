/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NostrAdapter parse tests: incoming Nostr events → IUnifiedIncomingMessage.
 * Also covers key validation and npub/hex round-trips.
 */

import { describe, expect, it } from 'vitest';

import {
  derivePublicKey,
  fromUnifiedOutgoingToNostr,
  hexToNpub,
  normalizePubkey,
  toUnifiedIncomingFromNostr,
  validatePrivateKey,
  type NostrEventLike,
} from '@process/channels/plugins/tier3/nostr/NostrAdapter';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const HEX_SK = 'b'.repeat(64);
const HEX_PK = 'a'.repeat(64);

function makeEvent(overrides: Partial<NostrEventLike> = {}): NostrEventLike {
  return {
    id: 'event-id-001',
    pubkey: HEX_PK,
    created_at: 1_700_000_000,
    kind: 4,
    tags: [['p', 'botpubkey' + '0'.repeat(55)]],
    content: 'encrypted-content',
    ...overrides,
  };
}

// ── validatePrivateKey ────────────────────────────────────────────────────────

describe('validatePrivateKey', () => {
  it('accepts a 64-char hex key and returns a 32-byte Uint8Array', () => {
    const sk = validatePrivateKey(HEX_SK);
    expect(sk).toBeInstanceOf(Uint8Array);
    expect(sk.length).toBe(32);
  });

  it('rejects a key that is too short', () => {
    expect(() => validatePrivateKey('abc')).toThrow(/64 hex/i);
  });

  it('rejects an nsec with wrong bech32 type', () => {
    // Simulate a decode that returns a non-nsec type by passing garbage nsec1 prefix.
    // real nostr-tools will throw on invalid bech32 - we just confirm the throw propagates.
    expect(() => validatePrivateKey('nsec1invaliddata')).toThrow();
  });

  it('trims whitespace before parsing', () => {
    const sk = validatePrivateKey(`  ${HEX_SK}  `);
    expect(sk.length).toBe(32);
  });
});

// ── derivePublicKey ───────────────────────────────────────────────────────────

describe('derivePublicKey', () => {
  it('returns a 64-char hex string', () => {
    const pk = derivePublicKey(HEX_SK);
    expect(typeof pk).toBe('string');
    expect(pk.length).toBe(64);
    expect(/^[0-9a-f]+$/i.test(pk)).toBe(true);
  });
});

// ── hexToNpub / normalizePubkey ───────────────────────────────────────────────

describe('hexToNpub', () => {
  it('encodes a hex pubkey as npub bech32', () => {
    const npub = hexToNpub(HEX_PK);
    expect(npub).toMatch(/^npub1/);
  });
});

describe('normalizePubkey', () => {
  it('returns lowercase hex unchanged when already hex', () => {
    const result = normalizePubkey(HEX_PK);
    expect(result).toBe(HEX_PK.toLowerCase());
  });

  it('throws on invalid input', () => {
    expect(() => normalizePubkey('not-a-pubkey')).toThrow(/pubkey/i);
  });
});

// ── toUnifiedIncomingFromNostr ────────────────────────────────────────────────

describe('toUnifiedIncomingFromNostr - text DM', () => {
  it('converts a kind:4 event to a unified incoming message', () => {
    const event = makeEvent();
    const unified = toUnifiedIncomingFromNostr(event, 'hello world');

    expect(unified.platform).toBe('nostr');
    expect(unified.chatId).toBe(HEX_PK);
    expect(unified.content.type).toBe('text');
    expect(unified.content.text).toBe('hello world');
    expect(unified.user.id).toBe(HEX_PK);
    expect(unified.user.username).toMatch(/^npub1/);
    expect(unified.timestamp).toBe(1_700_000_000 * 1000);
    expect(typeof unified.id).toBe('string');
    expect(unified.id.length).toBeGreaterThan(0);
  });

  it('preserves the raw event in the raw field', () => {
    const event = makeEvent();
    const unified = toUnifiedIncomingFromNostr(event, 'hi');
    expect(unified.raw).toBe(event);
  });

  it('assigns unique ids to distinct calls', () => {
    const event = makeEvent();
    const a = toUnifiedIncomingFromNostr(event, 'msg1');
    const b = toUnifiedIncomingFromNostr(event, 'msg2');
    expect(a.id).not.toBe(b.id);
  });
});

// ── fromUnifiedOutgoingToNostr ────────────────────────────────────────────────

describe('fromUnifiedOutgoingToNostr', () => {
  it('returns the text field trimmed', () => {
    expect(fromUnifiedOutgoingToNostr({ text: '  hello  ' })).toBe('hello');
  });

  it('returns empty string when text is undefined', () => {
    expect(fromUnifiedOutgoingToNostr({})).toBe('');
  });

  it('returns empty string when text is blank', () => {
    expect(fromUnifiedOutgoingToNostr({ text: '   ' })).toBe('');
  });
});
