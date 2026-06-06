/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookVerifier } from '../types';

/**
 * Meta Cloud API (WhatsApp) webhook verifier.
 *
 * Reference:
 *   https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 *
 * Per Meta's spec the GET handshake and the POST delivery use TWO different
 * secrets:
 *   - GET subscription challenge: operator-chosen `verify_token` echoed back.
 *   - POST event delivery: HMAC-SHA256(rawBody) keyed by the App Secret;
 *     header `X-Hub-Signature-256: sha256=<hex>`.
 *
 * The WebhookVerifier contract gives us one `secret` string. To carry both
 * values without breaking peer verifiers we JSON-encode `{appSecret,
 * verifyToken}` at registration time. Legacy single-string secrets are still
 * accepted and used for BOTH paths (the broken pre-W-2 behaviour) so existing
 * deployments don't 500 mid-rollout.
 */
type WhatsAppSecrets = { appSecret: string; verifyToken: string };
function parseSecret(secret: string): WhatsAppSecrets {
  if (secret.startsWith('{')) {
    try {
      const parsed = JSON.parse(secret) as Partial<WhatsAppSecrets>;
      const appSecret = typeof parsed.appSecret === 'string' ? parsed.appSecret : '';
      const verifyToken = typeof parsed.verifyToken === 'string' ? parsed.verifyToken : '';
      if (appSecret || verifyToken) {
        return { appSecret: appSecret || secret, verifyToken: verifyToken || secret };
      }
    } catch {
      // fall through to legacy single-string handling.
    }
  }
  return { appSecret: secret, verifyToken: secret };
}

export const whatsappVerifier: WebhookVerifier = (input, secret) => {
  const { appSecret, verifyToken: expectedVerifyToken } = parseSecret(secret);

  // GET subscription challenge - no signature; verified via verify_token.
  if (isGetChallenge(input.query)) {
    const mode = input.query['hub.mode'];
    const verifyToken = input.query['hub.verify_token'];
    const challenge = input.query['hub.challenge'];

    if (mode !== 'subscribe') {
      return { ok: false, reason: 'invalid-mode', status: 400 };
    }
    if (verifyToken !== expectedVerifyToken) {
      return { ok: false, reason: 'invalid-verify-token', status: 403 };
    }
    if (typeof challenge !== 'string' || challenge.length === 0) {
      return { ok: false, reason: 'missing-challenge', status: 400 };
    }

    return { ok: true, payload: { __challenge: challenge } };
  }

  // POST event delivery - HMAC-SHA256 keyed by App Secret.
  const headerSig = pickHeader(input.headers['x-hub-signature-256']);
  if (!headerSig || !headerSig.startsWith('sha256=')) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(input.rawBody).digest('hex');
  if (!safeEqual(expected, headerSig)) {
    return { ok: false, reason: 'invalid-signature', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    return { ok: false, reason: 'invalid-json', status: 400 };
  }

  // Meta delivery payloads include an `entry[].id` and per-message `id`s.
  const entry = (payload as { entry?: Array<{ id?: string }> }).entry;
  const eventId = entry && entry[0]?.id;
  return { ok: true, payload, eventId };
};

function isGetChallenge(query: Record<string, string | undefined>): boolean {
  return query['hub.mode'] !== undefined || query['hub.challenge'] !== undefined;
}

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
