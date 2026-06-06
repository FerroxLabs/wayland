/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Google Chat webhook verifier.
 *
 * Google Chat POSTs a Bearer JWT signed by Google's service-account key for
 * chat@system.gserviceaccount.com. The token's `aud` claim is either the
 * Google Cloud project number or the registered app URL, depending on how the
 * operator configured the Chat API.
 *
 * Verification steps (per Google docs):
 *   1. Extract the Bearer token from the Authorization header.
 *   2. Decode without verification to peek at `iss`.
 *   3. Fetch Google's x509 public certs for chat@system.gserviceaccount.com.
 *   4. Verify signature + exp + iss + aud using jose.
 *
 * The `secret` field on the webhook connection token is repurposed as the
 * expected `aud` claim value (project number or app URL). The operator sets
 * this when enabling the plugin.
 *
 * Certs are cached for 10 minutes to avoid per-request network overhead.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { WebhookVerifier, WebhookVerificationResult } from '../types';

const CHAT_ISSUER = 'chat@system.gserviceaccount.com';
// Google's x509 certs for the Chat service account - converted to JWKS format via jose
const CHAT_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/chat@system.gserviceaccount.com';

// Lazily built; shared across all verifier calls in the same process lifetime.
let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getRemoteJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(CHAT_JWKS_URL));
  }
  return remoteJwks;
}

function extractBearer(headers: Record<string, string | string[] | undefined>): string | null {
  const raw = headers['authorization'];
  const value = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  const lower = value.toLowerCase();
  if (!lower.startsWith('bearer ')) return null;
  const token = value.slice('bearer '.length).trim();
  return token || null;
}

/**
 * Exported for unit testing - verifies a Google Chat Bearer JWT.
 * `audience` is the expected `aud` claim (project number or app URL).
 */
export async function verifyGoogleChatJwt(
  token: string,
  audience: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!audience) {
    return { ok: false, reason: 'missing audience configuration' };
  }
  try {
    const jwks = getRemoteJwks();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: CHAT_ISSUER,
      audience,
    });
    // jwtVerify already validates exp, iss, and aud.
    // Extra guard: ensure the iss matches our expected Chat issuer.
    if (payload.iss !== CHAT_ISSUER) {
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
 * WebhookVerifier for google-chat. The `secret` field on the connection token
 * holds the expected JWT audience (Google Cloud project number or app URL).
 */
export const googleChatVerifier: WebhookVerifier = async (
  input,
  secret,
): Promise<WebhookVerificationResult> => {
  const bearer = extractBearer(input.headers);
  if (!bearer) {
    return { ok: false, reason: 'missing-bearer-token', status: 401 };
  }

  // `secret` is the audience value the operator configured (project number / app URL).
  const audience = secret.trim();
  if (!audience) {
    return { ok: false, reason: 'audience-not-configured', status: 500 };
  }

  const verifyResult = await verifyGoogleChatJwt(bearer, audience);
  if (!verifyResult.ok) {
    return { ok: false, reason: verifyResult.reason ?? 'invalid-jwt', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    return { ok: false, reason: 'invalid-json', status: 400 };
  }

  // Google Chat events don't have a stable top-level event ID, but the message
  // resource name ("spaces/X/messages/Y") is stable - use it for dedup if present.
  const eventId =
    (payload as { message?: { name?: string } }).message?.name ??
    (payload as { name?: string }).name;

  return { ok: true, payload, eventId };
};
