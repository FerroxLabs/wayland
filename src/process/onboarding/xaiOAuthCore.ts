/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure, dependency-light building blocks for the native xAI "Sign in with X
 * (Grok)" OAuth flow. Kept apart from the Electron/`http`-bound flow driver
 * (`xaiOAuth.ts`) so the cryptographic + parsing logic is unit-testable without
 * spinning up a loopback server or the browser.
 *
 * Nothing here performs I/O except `createPkce` (Node `crypto`). Endpoint
 * discovery, the loopback listener, the token POST, and registry persistence
 * all live in `xaiOAuth.ts`.
 */

import { createHash, randomBytes } from 'node:crypto';

// ─── Pinned constants ─────────────────────────────────────────────────────────

/**
 * xAI OIDC discovery document. The authorize/token endpoints are READ from here
 * at runtime (`fetchXaiEndpoints` in the flow), so they are never hardcoded -
 * the constants below are only the fallback used when discovery is unreachable.
 * Confirmed live from `https://auth.x.ai/.well-known/openid-configuration`.
 */
export const XAI_DISCOVERY_URL = 'https://auth.x.ai/.well-known/openid-configuration';

/** Fallback authorize endpoint (used only if discovery fails). */
export const XAI_AUTHORIZE_URL_FALLBACK = 'https://auth.x.ai/oauth2/authorize';

/** Fallback token endpoint (used only if discovery fails). */
export const XAI_TOKEN_URL_FALLBACK = 'https://auth.x.ai/oauth2/token';

/**
 * The general xAI inference API the obtained bearer token is used against. The
 * registry's `xai` provider already targets this host; pinned here only for the
 * safety guard that refuses to send the token anywhere else.
 */
export const XAI_API_BASE = 'https://api.x.ai/v1';

/**
 * OAuth scopes requested. `grok-cli:access` + `api:access` are the entitlements
 * the SuperGrok / X Premium subscription exposes to third-party agents;
 * `offline_access` requests a refresh token; `openid`/`profile` are standard.
 * Confirmed present in the xAI discovery `scopes_supported`.
 */
export const XAI_SCOPES = 'openid profile offline_access grok-cli:access api:access';

/**
 * The public OAuth client_id for the desktop/CLI PKCE flow.
 *
 * TODO(confirm-live): This is the one value that is not authoritatively
 * published by xAI as a single canonical constant. The value below is the
 * public desktop client_id used by the reference open-source implementations
 * (NousResearch Hermes Agent / `pi-xai-oauth`) for the `accounts.x.ai` PKCE
 * login. It is public metadata (a PKCE public client has no secret), NOT a
 * fabricated value - but it MUST be confirmed against a live SuperGrok sign-in
 * before shipping. Override at runtime with `WAYLAND_XAI_OAUTH_CLIENT_ID` so a
 * corrected value needs no rebuild.
 */
export const XAI_OAUTH_CLIENT_ID_DEFAULT = 'b1a00492-073a-47ea-816f-4c329264a828';

/** Resolve the client_id: env override wins over the pinned default. */
export function resolveClientId(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.WAYLAND_XAI_OAUTH_CLIENT_ID;
  return typeof override === 'string' && override.trim().length > 0 ? override.trim() : XAI_OAUTH_CLIENT_ID_DEFAULT;
}

// ─── PKCE ─────────────────────────────────────────────────────────────────────

/** PKCE material for one flow (RFC 7636, S256). */
export type Pkce = { verifier: string; challenge: string; state: string };

/**
 * Generate a PKCE verifier (43-char base64url), its S256 challenge, and a CSRF
 * `state`. The verifier length sits inside the RFC 7636 43-128 range.
 */
export function createPkce(): Pkce {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(16).toString('base64url');
  return { verifier, challenge, state };
}

/** Compute the S256 challenge for a given verifier (exposed for tests). */
export function s256Challenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

// ─── Endpoint discovery ───────────────────────────────────────────────────────

/** Authorize + token endpoints resolved from OIDC discovery (or fallback). */
export type XaiEndpoints = { authorizeUrl: string; tokenUrl: string };

/**
 * Parse a fetched OIDC discovery document into the two endpoints we need.
 * Pins both to HTTPS on an `x.ai` (or `*.x.ai`) host - a discovery doc that
 * tried to redirect the OAuth flow to an attacker host is rejected and the
 * caller falls back to the pinned constants.
 *
 * Returns `null` when the doc is malformed or fails the host pin.
 */
export function parseDiscovery(doc: unknown): XaiEndpoints | null {
  if (typeof doc !== 'object' || doc === null) return null;
  const record = doc as Record<string, unknown>;
  const authorizeUrl = record.authorization_endpoint;
  const tokenUrl = record.token_endpoint;
  if (typeof authorizeUrl !== 'string' || typeof tokenUrl !== 'string') return null;
  if (!isPinnedXaiHttps(authorizeUrl) || !isPinnedXaiHttps(tokenUrl)) return null;
  return { authorizeUrl, tokenUrl };
}

/** True when `url` is HTTPS on `x.ai` or a `*.x.ai` subdomain. */
export function isPinnedXaiHttps(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return host === 'x.ai' || host.endsWith('.x.ai');
}

// ─── Authorize URL ────────────────────────────────────────────────────────────

/** Build the authorize URL with the standard OAuth 2.0 + PKCE query params. */
export function buildAuthorizeUrl(
  authorizeUrl: string,
  params: { clientId: string; challenge: string; state: string; redirectUri: string }
): string {
  const url = new URL(authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', XAI_SCOPES);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', params.state);
  return url.toString();
}

// ─── Token response ───────────────────────────────────────────────────────────

/** Normalized OAuth token bundle extracted from a token-endpoint response. */
export type XaiTokens = {
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms the access token expires, derived from `expires_in` when present. */
  expiresAt?: number;
};

/**
 * Parse a token-endpoint JSON body into our normalized bundle. Accepts the
 * standard RFC 6749 fields (`access_token`, `refresh_token`, `expires_in`).
 * `now` is injectable so `expires_in` → `expiresAt` is deterministic in tests.
 *
 * Returns `null` when no usable access token is present.
 */
export function parseTokenResponse(body: unknown, now: number = Date.now()): XaiTokens | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  const accessToken = record.access_token;
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;

  const tokens: XaiTokens = { accessToken };
  if (typeof record.refresh_token === 'string' && record.refresh_token.length > 0) {
    tokens.refreshToken = record.refresh_token;
  }
  if (typeof record.expires_in === 'number' && Number.isFinite(record.expires_in)) {
    tokens.expiresAt = now + record.expires_in * 1000;
  }
  return tokens;
}

// ─── Grok CLI auth.json reuse ─────────────────────────────────────────────────

/**
 * Parse the official Grok CLI credential file (`~/.grok/auth.json`) into our
 * normalized bundle. The CLI's exact schema is not publicly pinned, so this is
 * deliberately tolerant: it accepts both snake_case and camelCase token field
 * names and several common expiry encodings (`expires_at` epoch ms or seconds,
 * `expiry` ISO string). A file with no usable access token yields `null`.
 *
 * @param json The parsed JSON value read from `~/.grok/auth.json`.
 */
export function parseGrokAuthJson(json: unknown): XaiTokens | null {
  if (typeof json !== 'object' || json === null) return null;
  // Some CLIs nest the token bundle under a top-level key (e.g. `{ "xai": {…} }`
  // or `{ "oauth": {…} }`). Unwrap one such level when the top level carries no
  // token field directly.
  const record = unwrapAuthRecord(json as Record<string, unknown>);

  const accessToken = firstString(record, ['access_token', 'accessToken', 'token', 'api_key', 'apiKey']);
  if (!accessToken) return null;

  const tokens: XaiTokens = { accessToken };
  const refreshToken = firstString(record, ['refresh_token', 'refreshToken']);
  if (refreshToken) tokens.refreshToken = refreshToken;

  const expiresAt = readExpiry(record);
  if (expiresAt !== undefined) tokens.expiresAt = expiresAt;

  return tokens;
}

/** True when the stored access token is absent or past its expiry. */
export function isTokenExpired(tokens: XaiTokens, now: number = Date.now()): boolean {
  if (!tokens.accessToken) return true;
  if (typeof tokens.expiresAt !== 'number') return false; // unknown expiry → assume usable
  return tokens.expiresAt <= now;
}

// ─── Local helpers ────────────────────────────────────────────────────────────

/** Unwrap a single nesting level when the top level has no direct token field. */
function unwrapAuthRecord(record: Record<string, unknown>): Record<string, unknown> {
  const hasDirectToken = ['access_token', 'accessToken', 'token', 'api_key', 'apiKey'].some(
    (k) => typeof record[k] === 'string'
  );
  if (hasDirectToken) return record;
  for (const key of ['xai', 'grok', 'oauth', 'credentials']) {
    const nested = record[key];
    if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return record;
}

/** First non-empty string value among the candidate keys. */
function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

/**
 * Read an expiry into epoch ms from the common encodings: a numeric `expires_at`
 * (epoch seconds < 1e12 are upscaled to ms), or an ISO `expiry` / `expires_at`
 * string. Returns `undefined` when no usable expiry is present.
 */
function readExpiry(record: Record<string, unknown>): number | undefined {
  for (const key of ['expires_at', 'expiresAt', 'expiry', 'expires']) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      // Heuristic: a value below ~1e12 is epoch seconds, not ms.
      return value < 1e12 ? value * 1000 : value;
    }
    if (typeof value === 'string' && value.length > 0) {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}
