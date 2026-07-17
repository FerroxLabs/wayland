/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure, dependency-light building blocks for the native "Sign in with ChatGPT"
 * OAuth flow. Kept apart from the Electron/`http`-bound flow driver
 * (`chatgptOAuth.ts`) so the cryptographic + parsing logic is unit-testable
 * without spinning up a loopback server or the browser.
 *
 * This signs a user in with their ChatGPT subscription via the SAME OAuth path
 * the Codex CLI uses (`auth.openai.com`, the `codex_cli_rs` originator). It does
 * NOT require the `codex` CLI to be installed. OpenAI may change or restrict
 * this path at any time.
 *
 * Nothing here performs I/O except `createPkce` (Node `crypto`). The loopback
 * listener, the token POST, and registry persistence all live in
 * `chatgptOAuth.ts`.
 */

import { createHash, randomBytes } from 'node:crypto';

// ─── Pinned constants ─────────────────────────────────────────────────────────

/** OpenAI's OAuth issuer. */
export const CHATGPT_ISSUER = 'https://auth.openai.com';

/** Authorize endpoint (verified). */
export const CHATGPT_AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';

/** Token endpoint (verified). */
export const CHATGPT_TOKEN_URL = 'https://auth.openai.com/oauth/token';

/**
 * The public OAuth client_id for the Codex CLI desktop PKCE flow. Public
 * metadata (a PKCE public client has no secret). Override at runtime with
 * `WAYLAND_CHATGPT_OAUTH_CLIENT_ID` so a corrected value needs no rebuild.
 */
export const CHATGPT_OAUTH_CLIENT_ID_DEFAULT = 'app_EMoamEEZ73f0CkXaXp7hrann';

/**
 * OAuth scopes requested. `offline_access` is REQUIRED to receive a
 * `refresh_token`; `openid`/`profile`/`email` are standard.
 */
export const CHATGPT_SCOPES = 'openid profile email offline_access';

/**
 * The ChatGPT backend a subscription access token is used against. A
 * subscription token is REJECTED by `api.openai.com`; inference must route here.
 * Pinned for the safety guard that refuses to send the token anywhere else.
 */
export const CHATGPT_BACKEND_BASE = 'https://chatgpt.com/backend-api';

/** The Responses-style inference path on the ChatGPT backend. */
export const CHATGPT_RESPONSES_PATH = '/codex/responses';

/**
 * The loopback port the Codex flow registers as its redirect target. The
 * redirect_uri is part of the registered OAuth client, so it must match
 * exactly. We bind `127.0.0.1:1455`; if busy we fall back to `1457` and use
 * that port in the redirect_uri (both are registered for this client).
 */
export const CHATGPT_REDIRECT_PORT = 1455;
export const CHATGPT_REDIRECT_PORT_FALLBACK = 1457;
export const CHATGPT_REDIRECT_PATH = '/auth/callback';

/** The nested claim key in the id_token holding the ChatGPT auth metadata. */
export const CHATGPT_AUTH_CLAIM = 'https://api.openai.com/auth';

/** Resolve the client_id: env override wins over the pinned default. */
export function resolveClientId(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.WAYLAND_CHATGPT_OAUTH_CLIENT_ID;
  return typeof override === 'string' && override.trim().length > 0 ? override.trim() : CHATGPT_OAUTH_CLIENT_ID_DEFAULT;
}

/** Build the exact redirect_uri for a given loopback port. */
export function buildRedirectUri(port: number): string {
  return `http://localhost:${port}${CHATGPT_REDIRECT_PATH}`;
}

// ─── PKCE ─────────────────────────────────────────────────────────────────────

/** PKCE material for one flow (RFC 7636, S256). */
export type Pkce = { verifier: string; challenge: string; state: string };

/**
 * Generate a PKCE verifier, its S256 challenge, and a CSRF `state`. The Codex
 * flow uses a 64-byte verifier (base64url, no pad), well inside the RFC 7636
 * 43-128 range.
 */
export function createPkce(): Pkce {
  const verifier = randomBytes(64).toString('base64url');
  const challenge = s256Challenge(verifier);
  const state = randomBytes(16).toString('hex');
  return { verifier, challenge, state };
}

/** Compute the S256 challenge for a given verifier (exposed for tests). */
export function s256Challenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/** True when `url` is HTTPS on `auth.openai.com`. */
export function isPinnedOpenAiAuthHttps(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === 'auth.openai.com';
}

// ─── Authorize URL ────────────────────────────────────────────────────────────

/**
 * Build the authorize URL with the standard OAuth 2.0 + PKCE query params plus
 * the Codex-specific params (all required for the simplified ChatGPT flow):
 * `id_token_add_organizations`, `codex_cli_simplified_flow`, `originator`.
 */
export function buildAuthorizeUrl(params: {
  clientId: string;
  challenge: string;
  state: string;
  redirectUri: string;
}): string {
  const url = new URL(CHATGPT_AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', CHATGPT_SCOPES);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', params.state);
  url.searchParams.set('id_token_add_organizations', 'true');
  url.searchParams.set('codex_cli_simplified_flow', 'true');
  url.searchParams.set('originator', 'codex_cli_rs');
  return url.toString();
}

// ─── Token response ───────────────────────────────────────────────────────────

/** Free | Plus | Pro | Team | Enterprise, surfaced in the UI. */
export type ChatGptPlanType = 'free' | 'plus' | 'pro' | 'team' | 'enterprise' | 'unknown';

/** Normalized OAuth token bundle extracted from a token-endpoint response. */
export type ChatGptTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** Epoch ms the access token expires. */
  expiresAt?: number;
  /** REQUIRED for inference - becomes the `chatgpt-account-id` header. */
  accountId?: string;
  planType?: ChatGptPlanType;
  userId?: string;
};

/**
 * Identity extracted from the id_token's nested `https://api.openai.com/auth`
 * claim plus the top-level `exp`.
 */
export type ChatGptIdentity = {
  accountId?: string;
  planType?: ChatGptPlanType;
  userId?: string;
  /** Epoch ms derived from the JWT `exp` claim (seconds). */
  expiresAt?: number;
};

/**
 * Parse a token-endpoint JSON body into our normalized bundle, merging the
 * id_token identity in. Returns `null` when no usable access token is present.
 * `now` is injectable so `expires_in` -> `expiresAt` is deterministic in tests.
 */
export function parseTokenResponse(body: unknown, now: number = Date.now()): ChatGptTokens | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  const accessToken = record.access_token;
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;

  const tokens: ChatGptTokens = { accessToken };
  if (typeof record.refresh_token === 'string' && record.refresh_token.length > 0) {
    tokens.refreshToken = record.refresh_token;
  }
  if (typeof record.id_token === 'string' && record.id_token.length > 0) {
    tokens.idToken = record.id_token;
  }
  if (typeof record.expires_in === 'number' && Number.isFinite(record.expires_in)) {
    tokens.expiresAt = now + record.expires_in * 1000;
  }

  // The id_token carries the authoritative identity + the real expiry; it wins
  // over `expires_in` when present.
  if (tokens.idToken) {
    const identity = parseIdToken(tokens.idToken);
    if (identity) {
      if (identity.accountId) tokens.accountId = identity.accountId;
      if (identity.planType) tokens.planType = identity.planType;
      if (identity.userId) tokens.userId = identity.userId;
      if (typeof identity.expiresAt === 'number') tokens.expiresAt = identity.expiresAt;
    }
  }
  return tokens;
}

// ─── id_token parsing ─────────────────────────────────────────────────────────

/**
 * Decode the JWT id_token payload (base64url, no signature verification - the
 * token came straight from the pinned token endpoint over TLS) and extract the
 * ChatGPT account id, plan type, user id, and `exp`.
 *
 * Returns `null` when the token is malformed.
 */
export function parseIdToken(idToken: string): ChatGptIdentity | null {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return null;

  const identity: ChatGptIdentity = {};

  const exp = payload.exp;
  if (typeof exp === 'number' && Number.isFinite(exp)) {
    identity.expiresAt = exp * 1000;
  }

  const authClaim = payload[CHATGPT_AUTH_CLAIM];
  if (typeof authClaim === 'object' && authClaim !== null) {
    const auth = authClaim as Record<string, unknown>;
    if (typeof auth.chatgpt_account_id === 'string' && auth.chatgpt_account_id.length > 0) {
      identity.accountId = auth.chatgpt_account_id;
    }
    identity.planType = normalizePlanType(auth.chatgpt_plan_type);
    const userId = auth.chatgpt_user_id ?? auth.user_id;
    if (typeof userId === 'string' && userId.length > 0) identity.userId = userId;
  }
  return identity;
}

/** Base64url-decode a JWT's payload (the middle segment). `null` on malformed. */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Coerce a raw plan-type value into the known set. */
function normalizePlanType(value: unknown): ChatGptPlanType {
  if (typeof value !== 'string') return 'unknown';
  const v = value.toLowerCase();
  if (v === 'free' || v === 'plus' || v === 'pro' || v === 'team' || v === 'enterprise') return v;
  return 'unknown';
}

/** True when the stored access token is absent or past its expiry. */
export function isTokenExpired(
  tokens: { accessToken?: string; expiresAt?: number },
  now: number = Date.now()
): boolean {
  if (!tokens.accessToken) return true;
  if (typeof tokens.expiresAt !== 'number') return false; // unknown expiry -> assume usable
  return tokens.expiresAt <= now;
}

/** True when the access token is within `skewMs` of expiry (proactive refresh). */
export function needsProactiveRefresh(
  expiresAt: number | undefined,
  now: number = Date.now(),
  skewMs: number = 5 * 60 * 1000
): boolean {
  if (typeof expiresAt !== 'number') return false;
  return now > expiresAt - skewMs;
}

/**
 * Whether this host can't complete the browser PKCE flow because it's headless.
 * Only Linux is affected: macOS/Windows always have a window server. With no X11
 * (`DISPLAY`) and no Wayland (`WAYLAND_DISPLAY`) there is no browser to open, and
 * the 127.0.0.1 loopback callback is unreachable from the user's remote machine
 * anyway. Pure (params injectable) so it's unit-testable. (#525)
 */
export function isHeadlessEnvironment(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (platform !== 'linux') return false;
  return !env.DISPLAY && !env.WAYLAND_DISPLAY;
}
