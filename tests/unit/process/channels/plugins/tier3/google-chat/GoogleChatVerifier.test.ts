/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock jose at module top level - vi.mock is hoisted above all imports.
const { mockJwtVerify } = vi.hoisted(() => ({
  mockJwtVerify: vi.fn(),
}));

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    // createRemoteJWKSet returns a function; we don't need real network calls.
    createRemoteJWKSet: vi.fn(() => 'mock-jwks-keyset'),
    jwtVerify: mockJwtVerify,
  };
});

import {
  googleChatVerifier,
  verifyGoogleChatJwt,
} from '@process/channels/webhook/verifiers/google-chat';

const AUDIENCE = '123456789012';
const FAKE_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.fake.token';

function makeInput(overrides: {
  authHeader?: string;
  body?: string;
} = {}) {
  const body = overrides.body ?? JSON.stringify({
    type: 'MESSAGE',
    space: { name: 'spaces/AAA' },
    message: { name: 'spaces/AAA/messages/M1', text: 'hi' },
  });
  return {
    headers: overrides.authHeader !== undefined
      ? { authorization: overrides.authHeader }
      : { authorization: `Bearer ${FAKE_TOKEN}` },
    rawBody: Buffer.from(body, 'utf8'),
    query: {},
    url: '/webhooks/google-chat/tok',
  };
}

describe('verifyGoogleChatJwt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok=true when jwtVerify succeeds with correct issuer', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'chat@system.gserviceaccount.com', aud: AUDIENCE },
    });
    const result = await verifyGoogleChatJwt(FAKE_TOKEN, AUDIENCE);
    expect(result.ok).toBe(true);
  });

  it('returns ok=false when audience is empty', async () => {
    const result = await verifyGoogleChatJwt(FAKE_TOKEN, '');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/missing audience/i);
  });

  it('returns ok=false when jwtVerify throws (expired token)', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('"exp" claim timestamp check failed'));
    const result = await verifyGoogleChatJwt(FAKE_TOKEN, AUDIENCE);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/exp.*claim/i);
  });

  it('returns ok=false when jwtVerify throws (wrong issuer)', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('unexpected "iss" claim value'));
    const result = await verifyGoogleChatJwt(FAKE_TOKEN, AUDIENCE);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/iss/i);
  });

  it('returns ok=false when payload.iss does not match Chat issuer', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'evil@attacker.com', aud: AUDIENCE },
    });
    const result = await verifyGoogleChatJwt(FAKE_TOKEN, AUDIENCE);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/unexpected issuer/i);
  });
});

describe('googleChatVerifier', () => {
  beforeEach(() => {
    mockJwtVerify.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok=true with parsed payload and eventId for a valid request', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'chat@system.gserviceaccount.com', aud: AUDIENCE },
    });

    const body = JSON.stringify({
      type: 'MESSAGE',
      space: { name: 'spaces/AAA' },
      message: { name: 'spaces/AAA/messages/M1', text: 'hello' },
    });
    const result = await googleChatVerifier(makeInput({ body }), AUDIENCE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.eventId).toBe('spaces/AAA/messages/M1');
      expect((result.payload as { type: string }).type).toBe('MESSAGE');
    }
  });

  it('returns ok=false (missing-bearer-token) when Authorization header is absent', async () => {
    const result = await googleChatVerifier(
      makeInput({ authHeader: undefined }),
      AUDIENCE,
    );
    // The input helper always sets a header; override to truly missing:
    const inputNoAuth = {
      headers: {} as Record<string, string | string[] | undefined>,
      rawBody: Buffer.from('{}'),
      query: {},
      url: '/webhooks/google-chat/tok',
    };
    const r2 = await googleChatVerifier(inputNoAuth, AUDIENCE);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.reason).toBe('missing-bearer-token');
  });

  it('returns ok=false (missing-bearer-token) when Authorization header is not Bearer', async () => {
    const inputBasic = {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
      rawBody: Buffer.from('{}'),
      query: {},
      url: '/test',
    };
    const result = await googleChatVerifier(inputBasic, AUDIENCE);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('missing-bearer-token');
  });

  it('returns ok=false (audience-not-configured) when secret is empty', async () => {
    const result = await googleChatVerifier(makeInput(), '');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('audience-not-configured');
  });

  it('returns ok=false (invalid-jwt) when JWT verification fails', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('signature verification failed'));
    const result = await googleChatVerifier(makeInput(), AUDIENCE);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/signature/i);
  });

  it('returns ok=false (invalid-json) when body is not valid JSON', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'chat@system.gserviceaccount.com', aud: AUDIENCE },
    });
    const result = await googleChatVerifier(
      makeInput({ body: 'not-json' }),
      AUDIENCE,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-json');
  });

  it('returns ok=true with no eventId when message.name is absent', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'chat@system.gserviceaccount.com', aud: AUDIENCE },
    });
    const body = JSON.stringify({ type: 'ADDED_TO_SPACE', space: { name: 'spaces/X' } });
    const result = await googleChatVerifier(makeInput({ body }), AUDIENCE);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.eventId).toBeUndefined();
  });

  it('accepts array-valued Authorization header', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'chat@system.gserviceaccount.com', aud: AUDIENCE },
    });
    const body = JSON.stringify({ type: 'MESSAGE', message: { name: 'spaces/A/messages/B' } });
    const result = await googleChatVerifier(
      {
        headers: { authorization: [`Bearer ${FAKE_TOKEN}`, 'extra'] },
        rawBody: Buffer.from(body),
        query: {},
        url: '/test',
      },
      AUDIENCE,
    );
    expect(result.ok).toBe(true);
  });
});
