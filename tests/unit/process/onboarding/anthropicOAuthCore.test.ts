/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  ANTHROPIC_OAUTH_CLIENT_ID_DEFAULT,
  ANTHROPIC_REDIRECT_URI,
  buildAuthorizeUrl,
  createPkce,
  isPinnedAnthropicTokenHttps,
  isTokenExpired,
  needsProactiveRefresh,
  normalizePlanType,
  parseTokenResponse,
  resolveClientId,
  s256Challenge,
  splitManualCode,
} from '@process/onboarding/anthropicOAuthCore';

describe('createPkce / s256Challenge', () => {
  it('produces a base64url verifier within the RFC 7636 43-128 range', () => {
    const { verifier } = createPkce();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('challenge is the S256 of the verifier, base64url, no padding', () => {
    const { verifier, challenge } = createPkce();
    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'));
    expect(challenge).not.toContain('=');
  });

  it('s256Challenge matches a known RFC 7636 vector', () => {
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
    expect(resolveClientId({})).toBe(ANTHROPIC_OAUTH_CLIENT_ID_DEFAULT);
  });

  it('prefers a non-empty WAYLAND_ANTHROPIC_OAUTH_CLIENT_ID override', () => {
    expect(resolveClientId({ WAYLAND_ANTHROPIC_OAUTH_CLIENT_ID: '  custom-id  ' })).toBe('custom-id');
  });

  it('ignores a blank override', () => {
    expect(resolveClientId({ WAYLAND_ANTHROPIC_OAUTH_CLIENT_ID: '   ' })).toBe(ANTHROPIC_OAUTH_CLIENT_ID_DEFAULT);
  });
});

describe('isPinnedAnthropicTokenHttps', () => {
  it('accepts https on console.anthropic.com', () => {
    expect(isPinnedAnthropicTokenHttps('https://console.anthropic.com/v1/oauth/token')).toBe(true);
  });

  it('rejects http, other hosts, and malformed urls', () => {
    expect(isPinnedAnthropicTokenHttps('http://console.anthropic.com/v1/oauth/token')).toBe(false);
    expect(isPinnedAnthropicTokenHttps('https://evil.example.com/v1/oauth/token')).toBe(false);
    expect(isPinnedAnthropicTokenHttps('https://api.anthropic.com/v1/oauth/token')).toBe(false);
    expect(isPinnedAnthropicTokenHttps('not a url')).toBe(false);
  });
});

describe('buildAuthorizeUrl', () => {
  it('sets the required PKCE + Anthropic params on the authorize URL', () => {
    const url = new URL(buildAuthorizeUrl({ clientId: 'cid', challenge: 'chal', state: 'st8' }));
    expect(url.origin + url.pathname).toBe('https://claude.ai/oauth/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('cid');
    expect(url.searchParams.get('code_challenge')).toBe('chal');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('st8');
    expect(url.searchParams.get('code')).toBe('true');
    expect(url.searchParams.get('redirect_uri')).toBe(ANTHROPIC_REDIRECT_URI);
  });
});

describe('splitManualCode', () => {
  it('splits a code#state paste into its parts', () => {
    expect(splitManualCode('  abc123#xyz789  ')).toEqual({ code: 'abc123', state: 'xyz789' });
  });

  it('treats a bare code (no #) as code with empty state', () => {
    expect(splitManualCode('justacode')).toEqual({ code: 'justacode', state: '' });
  });

  it('returns null for empty input', () => {
    expect(splitManualCode('   ')).toBeNull();
  });
});

describe('parseTokenResponse', () => {
  it('returns null when there is no access token', () => {
    expect(parseTokenResponse({})).toBeNull();
    expect(parseTokenResponse(null)).toBeNull();
    expect(parseTokenResponse({ access_token: '' })).toBeNull();
  });

  it('extracts tokens, converts expires_in to epoch ms, and keeps scope', () => {
    const now = 1_000_000;
    const tokens = parseTokenResponse(
      {
        access_token: 'sk-ant-oat01-x',
        refresh_token: 'sk-ant-ort01-y',
        expires_in: 3600,
        scope: 'user:inference user:profile',
      },
      now
    );
    expect(tokens).not.toBeNull();
    expect(tokens?.accessToken).toBe('sk-ant-oat01-x');
    expect(tokens?.refreshToken).toBe('sk-ant-ort01-y');
    expect(tokens?.expiresAt).toBe(now + 3600 * 1000);
    expect(tokens?.scope).toBe('user:inference user:profile');
  });

  it('pulls the plan tier from a nested account object', () => {
    const tokens = parseTokenResponse({
      access_token: 'sk-ant-oat01-x',
      account: { subscription_type: 'claude_max' },
    });
    expect(tokens?.planType).toBe('max');
  });
});

describe('normalizePlanType', () => {
  it('maps canonical tiers', () => {
    expect(normalizePlanType('pro')).toBe('pro');
    expect(normalizePlanType('MAX')).toBe('max');
    expect(normalizePlanType('enterprise')).toBe('enterprise');
  });

  it('maps prefixed vendor tiers onto the canonical set', () => {
    expect(normalizePlanType('max_5x')).toBe('max');
    expect(normalizePlanType('claude_pro')).toBe('pro');
  });

  it('returns unknown for anything unrecognized', () => {
    expect(normalizePlanType(42)).toBe('unknown');
    expect(normalizePlanType('mystery')).toBe('unknown');
  });
});

describe('isTokenExpired / needsProactiveRefresh', () => {
  it('treats a missing access token as expired', () => {
    expect(isTokenExpired({ expiresAt: Date.now() + 10_000 })).toBe(true);
  });

  it('treats an unknown expiry as usable', () => {
    expect(isTokenExpired({ accessToken: 'x' })).toBe(false);
  });

  it('compares expiry against now', () => {
    expect(isTokenExpired({ accessToken: 'x', expiresAt: 100 }, 200)).toBe(true);
    expect(isTokenExpired({ accessToken: 'x', expiresAt: 300 }, 200)).toBe(false);
  });

  it('flags a token inside the proactive skew window', () => {
    const now = 1_000_000;
    expect(needsProactiveRefresh(now + 60_000, now, 5 * 60_000)).toBe(true);
    expect(needsProactiveRefresh(now + 10 * 60_000, now, 5 * 60_000)).toBe(false);
    expect(needsProactiveRefresh(undefined, now)).toBe(false);
  });
});
