/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── hoisted mocks ─────────────────────────────────────────────────────────────
const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockCreateRemoteJWKSet = vi.hoisted(() => vi.fn(() => 'mock-jwks-set'));
const mockFetch = vi.hoisted(() => vi.fn<typeof fetch>());

vi.mock('jose', () => ({
  createRemoteJWKSet: mockCreateRemoteJWKSet,
  jwtVerify: mockJwtVerify,
}));

vi.stubGlobal('fetch', mockFetch);

import {
  _resetJwksCache,
  msTeamsVerifier,
  verifyMsTeamsJwt,
} from '@process/channels/webhook/verifiers/ms-teams';

const VALID_APP_ID = 'my-azure-app-id';
const VALID_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.valid.sig';

function makeInput(overrides: {
  headers?: Record<string, string | string[] | undefined>;
  body?: string;
} = {}) {
  return {
    headers: {
      authorization: `Bearer ${VALID_TOKEN}`,
      ...overrides.headers,
    },
    rawBody: Buffer.from(
      overrides.body ?? JSON.stringify({ type: 'message', id: 'evt-001' }),
    ),
    query: {},
    url: '/webhook/ms-teams',
  };
}

function mockOpenIdFetch() {
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ jwks_uri: 'https://login.botframework.com/v1/.well-known/keys' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
}

describe('verifyMsTeamsJwt', () => {
  beforeEach(() => {
    mockJwtVerify.mockReset();
    mockFetch.mockReset();
    _resetJwksCache();
  });

  it('returns ok=true for a valid JWT', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockResolvedValue({
      payload: { iss: 'https://api.botframework.com', aud: VALID_APP_ID },
    });

    const result = await verifyMsTeamsJwt(VALID_TOKEN, VALID_APP_ID);
    expect(result.ok).toBe(true);
  });

  it('returns ok=false when audience is empty', async () => {
    const result = await verifyMsTeamsJwt(VALID_TOKEN, '');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/audience/i);
  });

  it('returns ok=false when jwtVerify throws (expired token)', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockRejectedValue(new Error('JWTExpired: token is expired'));

    const result = await verifyMsTeamsJwt(VALID_TOKEN, VALID_APP_ID);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/expired/i);
  });

  it('returns ok=false when issuer does not match', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockResolvedValue({
      payload: { iss: 'https://wrong-issuer.com', aud: VALID_APP_ID },
    });

    const result = await verifyMsTeamsJwt(VALID_TOKEN, VALID_APP_ID);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/issuer/i);
  });

  it('returns ok=false when OpenID metadata fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 503 }));

    const result = await verifyMsTeamsJwt(VALID_TOKEN, VALID_APP_ID);
    expect(result.ok).toBe(false);
  });
});

describe('msTeamsVerifier (WebhookVerifier)', () => {
  beforeEach(() => {
    mockJwtVerify.mockReset();
    mockFetch.mockReset();
    _resetJwksCache();
  });

  it('returns ok=false when Authorization header is missing', async () => {
    const result = await msTeamsVerifier(
      makeInput({ headers: { authorization: undefined } }),
      VALID_APP_ID,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/missing-bearer/i);
  });

  it('returns ok=false when Authorization is not a Bearer token', async () => {
    const result = await msTeamsVerifier(
      makeInput({ headers: { authorization: 'Basic xyz' } }),
      VALID_APP_ID,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/missing-bearer/i);
  });

  it('returns ok=false when secret (appId) is empty', async () => {
    const result = await msTeamsVerifier(makeInput(), '');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
  });

  it('returns ok=true with parsed payload and eventId on valid JWT', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockResolvedValue({
      payload: { iss: 'https://api.botframework.com', aud: VALID_APP_ID },
    });

    const result = await msTeamsVerifier(makeInput(), VALID_APP_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.payload as { type?: string }).type).toBe('message');
      expect(result.eventId).toBe('evt-001');
    }
  });

  it('returns ok=false with status 401 on invalid JWT', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockRejectedValue(new Error('JWTInvalid'));

    const result = await msTeamsVerifier(makeInput(), VALID_APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it('returns ok=false with status 400 on invalid JSON body', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockResolvedValue({
      payload: { iss: 'https://api.botframework.com', aud: VALID_APP_ID },
    });

    const result = await msTeamsVerifier(makeInput({ body: 'not-json' }), VALID_APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('reuses cached JWKS on second call without re-fetching metadata', async () => {
    mockOpenIdFetch();
    mockJwtVerify.mockResolvedValue({
      payload: { iss: 'https://api.botframework.com', aud: VALID_APP_ID },
    });

    await msTeamsVerifier(makeInput(), VALID_APP_ID);

    mockJwtVerify.mockResolvedValue({
      payload: { iss: 'https://api.botframework.com', aud: VALID_APP_ID },
    });

    await msTeamsVerifier(makeInput(), VALID_APP_ID);

    // OpenID metadata fetch should only happen once (cache hit on second call)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
