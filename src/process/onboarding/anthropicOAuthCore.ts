/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure, dependency-light building blocks for the native "Sign in with Claude"
 * OAuth flow. Kept apart from the Electron/`http`-bound flow driver
 * (`anthropicOAuth.ts`) so the cryptographic + parsing logic is unit-testable
 * without opening a browser or hitting the network.
 *
 * This signs a user in with their Claude Pro / Max subscription via the SAME
 * public OAuth client Claude Code uses (`claude.ai/oauth/authorize`, token
 * exchange at `console.anthropic.com/v1/oauth/token`). It does NOT require the
 * `claude` CLI or an API key. Anthropic may change or restrict this path at any
 * time, and actively blocks subscription-OAuth logins used inside third-party
 * tools - a sign-in can succeed while later inference is rejected.
 *
 * Nothing here performs I/O except `createPkce` (Node `crypto`). The token POST
 * and registry persistence all live in `anthropicOAuth.ts`.
 *
 * NOTE: unlike the ChatGPT/xAI flows, Anthropic's public client is NOT
 * registered for a loopback redirect - it only accepts the console callback
 * (`console.anthropic.com/oauth/code/callback`), which renders a `code#state`
 * pair for the user to copy. So this flow is manual-paste only (mirroring xAI's
 * `submitCode` path, minus the loopback server).
 */

import { createHash, randomBytes } from 'node:crypto';

// ─── Pinned constants ─────────────────────────────────────────────────────────

/** Anthropic's OAuth authorize endpoint (Claude Pro / Max accounts on claude.ai). */
export const ANTHROPIC_AUTHORIZE_URL = 'https://claude.ai/oauth/authorize';

/** Anthropic's OAuth token endpoint (host-pinned before any bearer-bearing POST). */
export const ANTHROPIC_TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';

/**
 * The console callback the authorize page redirects to. This client is NOT
 * registered for a loopback URL, so the redirect_uri MUST be this exact value
 * both in the authorize request and the token exchange. The page renders a
 * `code#state` string for the user to copy back into the app.
 */
export const ANTHROPIC_REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';

/**
 * The public OAuth client_id for the Claude Code desktop PKCE flow. Public
 * metadata (a PKCE public client has no secret). Override at runtime with
 * `WAYLAND_ANTHROPIC_OAUTH_CLIENT_ID` so a corrected value needs no rebuild.
 */
export const ANTHROPIC_OAUTH_CLIENT_ID_DEFAULT = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';

/**
 * OAuth scopes requested. `user:inference` is REQUIRED for the subscription to
 * drive chat; `user:profile` surfaces the plan tier; `org:create_api_key` is the
 * standard Claude Code scope set (kept for parity so the consent screen matches
 * what users see from the CLI).
 */
export const ANTHROPIC_SCOPES = 'org:create_api_key user:profile user:inference';

/**
 * The Anthropic API a subscription access token is used against. Pinned only for
 * documentation + the credential file's base; in-app inference is delegated to
 * the Claude Code ACP agent (which reads `~/.claude/.credentials.json`), NOT a
 * direct API call from the desktop.
 */
export const ANTHROPIC_API_BASE = 'https://api.anthropic.com';

/** Resolve the client_id: env override wins over the pinned default. */
export function resolveClientId(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.WAYLAND_ANTHROPIC_OAUTH_CLIENT_ID;
  return typeof override === 'string' && override.trim().length > 0
    ? override.trim()
    : ANTHROPIC_OAUTH_CLIENT_ID_DEFAULT;
}

// ─── PKCE ─────────────────────────────────────────────────────────────────────

/** PKCE material for one flow (RFC 7636, S256). */
export type Pkce = { verifier: string; challenge: string; state: string };

/**
 * Generate a PKCE verifier, its S256 challenge, and a CSRF `state`. A 64-byte
 * verifier (base64url, no pad) sits well inside the RFC 7636 43-128 range.
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

/** True when `url` is HTTPS on `console.anthropic.com` (the pinned token host). */
export function isPinnedAnthropicTokenHttps(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === 'console.anthropic.com';
}

// ─── Authorize URL ────────────────────────────────────────────────────────────

/**
 * Build the authorize URL with the standard OAuth 2.0 + PKCE query params. The
 * `code=true` param tells Anthropic to render the copyable `code#state` page
 * (the manual-paste flow) rather than attempting an automatic redirect.
 */
export function buildAuthorizeUrl(params: { clientId: string; challenge: string; state: string }): string {
  const url = new URL(ANTHROPIC_AUTHORIZE_URL);
  url.searchParams.set('code', 'true');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', ANTHROPIC_REDIRECT_URI);
  url.searchParams.set('scope', ANTHROPIC_SCOPES);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', params.state);
  return url.toString();
}

// ─── Manual code parsing ──────────────────────────────────────────────────────

/**
 * The Anthropic console callback renders the authorization result as
 * `<code>#<state>` for the user to copy. Split it back into its parts so the
 * flow driver can validate `state` (CSRF) and exchange `code`. A value with no
 * `#` is treated as a bare code (the `state` comes back empty and the caller
 * decides whether to enforce it). Trims surrounding whitespace. Returns `null`
 * for an empty input.
 */
export function splitManualCode(pasted: string): { code: string; state: string } | null {
  const trimmed = pasted.trim();
  if (trimmed.length === 0) return null;
  const hash = trimmed.indexOf('#');
  if (hash === -1) return { code: trimmed, state: '' };
  return { code: trimmed.slice(0, hash), state: trimmed.slice(hash + 1) };
}

// ─── Token response ───────────────────────────────────────────────────────────

/** Free | Pro | Max | Team | Enterprise, surfaced in the UI. */
export type AnthropicPlanType = 'free' | 'pro' | 'max' | 'team' | 'enterprise' | 'unknown';

/** Normalized OAuth token bundle extracted from a token-endpoint response. */
export type AnthropicTokens = {
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms the access token expires. */
  expiresAt?: number;
  /** The Claude subscription tier when Anthropic reports it. */
  planType?: AnthropicPlanType;
  /** The granted scope string, echoed to the credential file. */
  scope?: string;
};

/**
 * Parse an Anthropic token-endpoint JSON body into our normalized bundle.
 * Returns `null` when no usable access token is present. `now` is injectable so
 * `expires_in` -> `expiresAt` is deterministic in tests.
 *
 * Anthropic returns a plain JSON body (`access_token`, `refresh_token`,
 * `expires_in`, `scope`, and sometimes an `account`/`organization` object) - no
 * id_token, so the plan tier is read from the account object when present.
 */
export function parseTokenResponse(body: unknown, now: number = Date.now()): AnthropicTokens | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  const accessToken = record.access_token;
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;

  const tokens: AnthropicTokens = { accessToken };
  if (typeof record.refresh_token === 'string' && record.refresh_token.length > 0) {
    tokens.refreshToken = record.refresh_token;
  }
  if (typeof record.expires_in === 'number' && Number.isFinite(record.expires_in)) {
    tokens.expiresAt = now + record.expires_in * 1000;
  }
  if (typeof record.scope === 'string' && record.scope.length > 0) {
    tokens.scope = record.scope;
  }

  const plan = extractPlanType(record);
  if (plan) tokens.planType = plan;

  return tokens;
}

/**
 * Pull the subscription tier out of a token-endpoint body. Anthropic nests it
 * under an `account` (or `organization`) object as `subscription_type` /
 * `plan_type` / `tier` depending on the surface; check the known shapes and
 * normalize. Returns `undefined` when nothing usable is present.
 */
function extractPlanType(record: Record<string, unknown>): AnthropicPlanType | undefined {
  const candidates: unknown[] = [];
  for (const key of ['account', 'organization']) {
    const obj = record[key];
    if (typeof obj === 'object' && obj !== null) {
      const o = obj as Record<string, unknown>;
      candidates.push(o.subscription_type, o.plan_type, o.plan, o.tier);
    }
  }
  candidates.push(record.subscription_type, record.plan_type);
  for (const c of candidates) {
    const normalized = normalizePlanType(c);
    if (normalized !== 'unknown') return normalized;
  }
  return undefined;
}

/** Coerce a raw plan-type value into the known set. */
export function normalizePlanType(value: unknown): AnthropicPlanType {
  if (typeof value !== 'string') return 'unknown';
  const v = value.toLowerCase();
  if (v === 'free' || v === 'pro' || v === 'max' || v === 'team' || v === 'enterprise') return v;
  // Anthropic sometimes reports tiers like `claude_max` / `max_5x`; map the
  // common prefixes onto the canonical tier.
  if (v.includes('max')) return 'max';
  if (v.includes('pro')) return 'pro';
  if (v.includes('enterprise')) return 'enterprise';
  if (v.includes('team')) return 'team';
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
