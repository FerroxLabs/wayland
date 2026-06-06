/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Bot Framework JWT verifier for Microsoft Teams inbound activities.
 *
 * Bot Framework POSTs a Bearer JWT signed by the Azure AD keys published at
 * https://login.botframework.com/v1/.well-known/openidconfiguration.
 *
 * Verification steps (per Microsoft Bot Framework authentication docs):
 *   1. Extract Bearer token from Authorization header.
 *   2. Fetch OpenID metadata to discover jwks_uri (cached 24h).
 *   3. Verify JWT signature against the JWKS (jose createRemoteJWKSet, cached
 *      and refreshed on kid miss).
 *   4. Verify iss === "https://api.botframework.com".
 *   5. Verify aud === creds.appId (the bot's Azure AD app registration ID).
 *   6. jwtVerify handles exp + iat automatically; clock skew ≤ 5 min.
 *
 * The `secret` field on the webhook connection token carries the bot's appId
 * (used as the expected `aud` claim). The operator sets this when enabling
 * the MS Teams plugin.
 *
 * JWKS is lazily built and shared across all verifier calls; a new instance
 * is created only on startup or when a new appId is encountered (multi-tenant
 * bot setups with different audiences are handled by building one JWKS per
 * call - the JWKS keys are the same; only the audience differs).
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { WebhookVerifier, WebhookVerificationResult } from '../types';

const BF_ISSUER = 'https://api.botframework.com';
const BF_OPENID_URL = 'https://login.botframework.com/v1/.well-known/openidconfiguration';

// Singleton JWKS set - Bot Framework keys rotate infrequently.
// jose's createRemoteJWKSet handles caching internally and will re-fetch on
// kid miss, so we build this once and share it for the process lifetime.
let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
// Track the resolved JWKS URI so we can detect config changes.
let resolvedJwksUri: string | null = null;

/**
 * Fetch the JWKS URI from Bot Framework's OpenID metadata document.
 * Result is cached in-module for 24 hours (the metadata rarely changes).
 */
let jwksUriCache: { uri: string; fetchedAt: number } | null = null;
const JWKS_URI_TTL_MS = 24 * 60 * 60 * 1000;

async function resolveJwksUri(): Promise<string> {
  if (jwksUriCache && Date.now() - jwksUriCache.fetchedAt < JWKS_URI_TTL_MS) {
    return jwksUriCache.uri;
  }

  const resp = await fetch(BF_OPENID_URL, {
    headers: { accept: 'application/json' },
    // 10-second timeout via AbortSignal is available in Node 18+
    signal: AbortSignal.timeout(10_000),
  });

  if (!resp.ok) {
    throw new Error(
      `Bot Framework OpenID metadata fetch failed (${resp.status}): ${BF_OPENID_URL}`,
    );
  }

  const meta = (await resp.json()) as { jwks_uri?: string };
  if (!meta.jwks_uri) {
    throw new Error('Bot Framework OpenID metadata missing jwks_uri');
  }

  jwksUriCache = { uri: meta.jwks_uri, fetchedAt: Date.now() };
  return meta.jwks_uri;
}

async function getRemoteJwks(): Promise<ReturnType<typeof createRemoteJWKSet>> {
  const jwksUri = await resolveJwksUri();

  // Rebuild if the URI changed (should never happen in practice, but be safe)
  if (!remoteJwks || resolvedJwksUri !== jwksUri) {
    remoteJwks = createRemoteJWKSet(new URL(jwksUri));
    resolvedJwksUri = jwksUri;
  }

  return remoteJwks;
}

function extractBearer(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const raw = headers['authorization'];
  const value = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  if (!value.toLowerCase().startsWith('bearer ')) return null;
  const token = value.slice('bearer '.length).trim();
  return token || null;
}

/**
 * Exported for unit testing - verifies a Bot Framework Bearer JWT.
 * `audience` is the bot's Azure AD appId (expected `aud` claim).
 */
export async function verifyMsTeamsJwt(
  token: string,
  audience: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!audience) {
    return { ok: false, reason: 'audience (appId) not configured' };
  }

  try {
    const jwks = await getRemoteJwks();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: BF_ISSUER,
      audience,
    });

    // jwtVerify already validates exp, iat, iss, aud.
    // Belt-and-suspenders: confirm the iss is exactly what we expect.
    if (payload.iss !== BF_ISSUER) {
      return { ok: false, reason: `unexpected issuer: ${String(payload.iss)}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'JWT verification failed',
    };
  }
}

/**
 * WebhookVerifier for ms-teams.
 *
 * The `secret` field on the connection token holds the bot's Azure AD appId
 * (used as the expected JWT audience). The operator sets this to the
 * MicrosoftAppId when enabling the plugin.
 */
export const msTeamsVerifier: WebhookVerifier = async (
  input,
  secret,
): Promise<WebhookVerificationResult> => {
  const bearer = extractBearer(input.headers);
  if (!bearer) {
    return { ok: false, reason: 'missing-bearer-token', status: 401 };
  }

  const audience = secret.trim();
  if (!audience) {
    return { ok: false, reason: 'appId-not-configured', status: 500 };
  }

  const result = await verifyMsTeamsJwt(bearer, audience);
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason ?? 'invalid-bot-framework-jwt',
      status: 401,
    };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    return { ok: false, reason: 'invalid-json-body', status: 400 };
  }

  // Use the Bot Framework activity ID as the dedup event ID when present.
  const eventId = (payload as { id?: string }).id;

  return { ok: true, payload, eventId: eventId ?? undefined };
};

/** Exported for tests - reset JWKS cache between test cases. */
export function _resetJwksCache(): void {
  remoteJwks = null;
  resolvedJwksUri = null;
  jwksUriCache = null;
}
