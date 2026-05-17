/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
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
 * Two paths:
 *   - GET subscription challenge: when Meta first registers the webhook URL
 *     it issues `GET ?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<n>`.
 *     We accept iff `hub.verify_token` matches the connection secret and
 *     surface the challenge as the payload so the route handler can echo it.
 *   - POST event delivery: HMAC-SHA256(rawBody) keyed by the app secret;
 *     header `X-Hub-Signature-256: sha256=<hex>`. Timing-safe compare.
 *
 * The verifier returns a payload shape the receiver can recognize: GET
 * challenges set `__challenge` so the dispatcher / route can short-circuit.
 */
export const whatsappVerifier: WebhookVerifier = (input, secret) => {
  // GET subscription challenge — no signature; verified via shared token.
  if (isGetChallenge(input.query)) {
    const mode = input.query['hub.mode'];
    const verifyToken = input.query['hub.verify_token'];
    const challenge = input.query['hub.challenge'];

    if (mode !== 'subscribe') {
      return { ok: false, reason: 'invalid-mode', status: 400 };
    }
    if (verifyToken !== secret) {
      return { ok: false, reason: 'invalid-verify-token', status: 403 };
    }
    if (typeof challenge !== 'string' || challenge.length === 0) {
      return { ok: false, reason: 'missing-challenge', status: 400 };
    }

    return { ok: true, payload: { __challenge: challenge } };
  }

  // POST event delivery — HMAC-SHA256.
  const headerSig = pickHeader(input.headers['x-hub-signature-256']);
  if (!headerSig || !headerSig.startsWith('sha256=')) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const expected = 'sha256=' + createHmac('sha256', secret).update(input.rawBody).digest('hex');
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
