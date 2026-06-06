/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the synology-chat webhook verifier:
 * token validation, body parsing, event-id extraction, fail-closed behavior.
 */

import { describe, expect, it } from 'vitest';

import {
  synologyChatVerifier,
  verifySynologyChatToken,
} from '@process/channels/webhook/verifiers/synology-chat';

const SECRET = 'my-secret-token';

function makeBody(inner: object): Buffer {
  return Buffer.from(`payload=${encodeURIComponent(JSON.stringify(inner))}`, 'utf8');
}

function makeInput(overrides: {
  token?: string;
  body?: Buffer;
  query?: Record<string, string | undefined>;
}) {
  return {
    headers: {} as Record<string, string | string[] | undefined>,
    rawBody: overrides.body ?? makeBody({ user_id: '1', text: 'hi', timestamp: '1700000000' }),
    query: overrides.query ?? { token: overrides.token ?? SECRET },
    url: '/webhook/synology-chat',
  };
}

// ── Token verification ────────────────────────────────────────────────────────

describe('synologyChatVerifier - token checks', () => {
  it('accepts a valid token', () => {
    const result = synologyChatVerifier(makeInput({ token: SECRET }), SECRET);
    expect(result.ok).toBe(true);
  });

  it('rejects when token query param is absent', () => {
    const result = synologyChatVerifier(makeInput({ query: {} }), SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing-token');
      expect(result.status).toBe(401);
    }
  });

  it('rejects a wrong token', () => {
    const result = synologyChatVerifier(makeInput({ token: 'wrong-token' }), SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-token');
      expect(result.status).toBe(401);
    }
  });

  it('rejects an empty token', () => {
    const result = synologyChatVerifier(makeInput({ query: { token: '' } }), SECRET);
    // Empty string !== SECRET, so fails timing-safe comparison.
    expect(result.ok).toBe(false);
  });
});

// ── Body parsing ──────────────────────────────────────────────────────────────

describe('synologyChatVerifier - body parsing', () => {
  it('returns the parsed payload object on success', () => {
    const inner = { user_id: '42', username: 'alice', text: 'hello', channel_id: '10' };
    const result = synologyChatVerifier(
      makeInput({ body: makeBody(inner) }),
      SECRET,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const p = result.payload as typeof inner;
      expect(p.user_id).toBe('42');
      expect(p.text).toBe('hello');
    }
  });

  it('rejects when body has no payload field', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.from('foo=bar', 'utf8') }),
      SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-payload');
      expect(result.status).toBe(400);
    }
  });

  it('rejects when payload JSON is malformed', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.from('payload=not-valid-json', 'utf8') }),
      SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it('rejects an empty body', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.alloc(0) }),
      SECRET,
    );
    expect(result.ok).toBe(false);
  });
});

// ── Non-object payload shapes (MED) ───────────────────────────────────────────
//
// `parseSynologyChatBody` must reject any payload that JSON.parses to
// something other than a plain object - downstream `toUnifiedIncomingFrom…`
// blindly dereferences `.user_id` and would throw `TypeError` on null / array /
// primitive payloads.

describe('synologyChatVerifier - non-object payload rejection (MED)', () => {
  it('rejects when payload JSON-parses to null', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.from('payload=null', 'utf8') }),
      SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-payload');
      expect(result.status).toBe(400);
    }
  });

  it('rejects when payload JSON-parses to a string', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.from(`payload=${encodeURIComponent('"just a string"')}`, 'utf8') }),
      SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it('rejects when payload JSON-parses to an array', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.from(`payload=${encodeURIComponent('[]')}`, 'utf8') }),
      SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it('rejects when payload JSON-parses to a number', () => {
    const result = synologyChatVerifier(
      makeInput({ body: Buffer.from('payload=42', 'utf8') }),
      SECRET,
    );
    expect(result.ok).toBe(false);
  });
});

// ── Event ID extraction ───────────────────────────────────────────────────────

describe('synologyChatVerifier - eventId', () => {
  it('produces eventId from user_id + timestamp when both present', () => {
    const result = synologyChatVerifier(
      makeInput({ body: makeBody({ user_id: '7', text: 'hi', timestamp: '1700000001' }) }),
      SECRET,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.eventId).toBe('7:1700000001');
    }
  });

  it('omits eventId when timestamp is absent', () => {
    const result = synologyChatVerifier(
      makeInput({ body: makeBody({ user_id: '7', text: 'hi' }) }),
      SECRET,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.eventId).toBeUndefined();
    }
  });

  it('omits eventId when user_id is absent', () => {
    const result = synologyChatVerifier(
      makeInput({ body: makeBody({ text: 'hi', timestamp: '1700000001' }) }),
      SECRET,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.eventId).toBeUndefined();
    }
  });
});

// ── verifySynologyChatToken helper ────────────────────────────────────────────

describe('verifySynologyChatToken', () => {
  it('returns true for equal tokens', () => {
    expect(verifySynologyChatToken('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different tokens', () => {
    expect(verifySynologyChatToken('abc123', 'xyz789')).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(verifySynologyChatToken('short', 'short-but-longer')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(verifySynologyChatToken('Token', 'token')).toBe(false);
  });

  it('returns true for tokens longer than padding target', () => {
    const long = 'a'.repeat(80);
    expect(verifySynologyChatToken(long, long)).toBe(true);
  });
});
