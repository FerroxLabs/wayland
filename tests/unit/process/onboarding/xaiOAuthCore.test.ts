/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  buildAuthorizeUrl,
  createPkce,
  isPinnedXaiHttps,
  isTokenExpired,
  parseDiscovery,
  parseGrokAuthJson,
  parseTokenResponse,
  resolveClientId,
  s256Challenge,
  XAI_OAUTH_CLIENT_ID_DEFAULT,
  XAI_SCOPES,
} from '@process/onboarding/xaiOAuthCore';

describe('createPkce / s256Challenge', () => {
  it('produces a base64url verifier within the RFC 7636 43-128 range', () => {
    const { verifier } = createPkce();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet, no padding
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('challenge is the S256 of the verifier, base64url, no padding', () => {
    const { verifier, challenge } = createPkce();
    const expected = createHash('sha256').update(verifier).digest('base64url');
    expect(challenge).toBe(expected);
    expect(challenge).not.toContain('=');
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('s256Challenge matches a known RFC 7636 vector', () => {
    // RFC 7636 Appendix B reference verifier → challenge.
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    expect(s256Challenge(verifier)).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('generates distinct state + verifier per call', () => {
    const a = createPkce();
    const b = createPkce();
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.state).not.toBe(b.state);
  });
});

describe('resolveClientId', () => {
  it('uses the pinned default when no env override is set', () => {
    expect(resolveClientId({})).toBe(XAI_OAUTH_CLIENT_ID_DEFAULT);
  });

  it('prefers a non-empty WAYLAND_XAI_OAUTH_CLIENT_ID override', () => {
    expect(resolveClientId({ WAYLAND_XAI_OAUTH_CLIENT_ID: 'custom-id' })).toBe('custom-id');
  });

  it('ignores a blank override', () => {
    expect(resolveClientId({ WAYLAND_XAI_OAUTH_CLIENT_ID: '   ' })).toBe(XAI_OAUTH_CLIENT_ID_DEFAULT);
  });
});

describe('isPinnedXaiHttps', () => {
  it('accepts https x.ai and *.x.ai hosts', () => {
    expect(isPinnedXaiHttps('https://auth.x.ai/oauth2/token')).toBe(true);
    expect(isPinnedXaiHttps('https://x.ai/foo')).toBe(true);
    expect(isPinnedXaiHttps('https://accounts.x.ai/authorize')).toBe(true);
  });

  it('rejects http, foreign hosts, and look-alike suffixes', () => {
    expect(isPinnedXaiHttps('http://auth.x.ai/oauth2/token')).toBe(false);
    expect(isPinnedXaiHttps('https://evil.com/token')).toBe(false);
    expect(isPinnedXaiHttps('https://x.ai.evil.com/token')).toBe(false);
    expect(isPinnedXaiHttps('https://notx.ai/token')).toBe(false);
    expect(isPinnedXaiHttps('not a url')).toBe(false);
  });
});

describe('parseDiscovery', () => {
  it('extracts authorize + token endpoints from a valid discovery doc', () => {
    const doc = {
      authorization_endpoint: 'https://auth.x.ai/oauth2/authorize',
      token_endpoint: 'https://auth.x.ai/oauth2/token',
    };
    expect(parseDiscovery(doc)).toEqual({
      authorizeUrl: 'https://auth.x.ai/oauth2/authorize',
      tokenUrl: 'https://auth.x.ai/oauth2/token',
    });
  });

  it('rejects a doc whose endpoints are not pinned to *.x.ai https', () => {
    expect(
      parseDiscovery({
        authorization_endpoint: 'https://evil.com/authorize',
        token_endpoint: 'https://auth.x.ai/oauth2/token',
      })
    ).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(parseDiscovery(null)).toBeNull();
    expect(parseDiscovery({})).toBeNull();
    expect(parseDiscovery({ authorization_endpoint: 5, token_endpoint: 6 })).toBeNull();
  });
});

describe('buildAuthorizeUrl', () => {
  it('builds a standard OAuth 2.0 + PKCE authorize URL', () => {
    const url = new URL(
      buildAuthorizeUrl('https://auth.x.ai/oauth2/authorize', {
        clientId: 'cid',
        challenge: 'chal',
        state: 'st',
        redirectUri: 'http://127.0.0.1:5000/callback',
      })
    );
    expect(url.origin + url.pathname).toBe('https://auth.x.ai/oauth2/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('cid');
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5000/callback');
    expect(url.searchParams.get('scope')).toBe(XAI_SCOPES);
    expect(url.searchParams.get('code_challenge')).toBe('chal');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('st');
  });
});

describe('parseTokenResponse', () => {
  it('normalizes access/refresh tokens and derives expiresAt from expires_in', () => {
    const now = 1_000_000;
    const tokens = parseTokenResponse(
      { access_token: 'at', refresh_token: 'rt', expires_in: 3600, token_type: 'Bearer' },
      now
    );
    expect(tokens).toEqual({ accessToken: 'at', refreshToken: 'rt', expiresAt: now + 3600 * 1000 });
  });

  it('returns access-token-only when no refresh/expiry present', () => {
    expect(parseTokenResponse({ access_token: 'at' })).toEqual({ accessToken: 'at' });
  });

  it('returns null without a usable access token', () => {
    expect(parseTokenResponse({ refresh_token: 'rt' })).toBeNull();
    expect(parseTokenResponse({ access_token: '' })).toBeNull();
    expect(parseTokenResponse(null)).toBeNull();
  });
});

describe('parseGrokAuthJson (~/.grok/auth.json reuse)', () => {
  it('reads snake_case OAuth fields', () => {
    const tokens = parseGrokAuthJson({
      access_token: 'AT',
      refresh_token: 'RT',
      expires_at: 1_900_000_000_000,
    });
    expect(tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT', expiresAt: 1_900_000_000_000 });
  });

  it('reads camelCase token fields', () => {
    const tokens = parseGrokAuthJson({ accessToken: 'AT', refreshToken: 'RT' });
    expect(tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
  });

  it('upscales epoch-seconds expiry to milliseconds', () => {
    const tokens = parseGrokAuthJson({ access_token: 'AT', expires_at: 1_900_000_000 });
    expect(tokens?.expiresAt).toBe(1_900_000_000 * 1000);
  });

  it('parses an ISO expiry string', () => {
    const tokens = parseGrokAuthJson({ access_token: 'AT', expiry: '2030-01-01T00:00:00Z' });
    expect(tokens?.expiresAt).toBe(Date.parse('2030-01-01T00:00:00Z'));
  });

  it('unwraps a nested credential record', () => {
    const tokens = parseGrokAuthJson({ xai: { access_token: 'AT', refresh_token: 'RT' } });
    expect(tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
  });

  it('falls back to an api_key field when no access_token is present', () => {
    expect(parseGrokAuthJson({ api_key: 'KEY' })).toEqual({ accessToken: 'KEY' });
  });

  it('returns null for a file with no usable token', () => {
    expect(parseGrokAuthJson({})).toBeNull();
    expect(parseGrokAuthJson(null)).toBeNull();
    expect(parseGrokAuthJson({ unrelated: true })).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('treats an unknown expiry as still usable', () => {
    expect(isTokenExpired({ accessToken: 'at' })).toBe(false);
  });

  it('is expired when expiresAt is at or before now', () => {
    expect(isTokenExpired({ accessToken: 'at', expiresAt: 100 }, 100)).toBe(true);
    expect(isTokenExpired({ accessToken: 'at', expiresAt: 99 }, 100)).toBe(true);
  });

  it('is not expired when expiresAt is in the future', () => {
    expect(isTokenExpired({ accessToken: 'at', expiresAt: 200 }, 100)).toBe(false);
  });

  it('is expired when the access token is missing', () => {
    expect(isTokenExpired({ accessToken: '', expiresAt: 999 }, 100)).toBe(true);
  });
});
