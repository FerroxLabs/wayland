/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookVerifier } from '../types';

/**
 * Twilio webhook verifier.
 *
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Signature scheme:
 *   1. Take the full request URL.
 *   2. For application/x-www-form-urlencoded POSTs, append each key/value pair
 *      sorted alphabetically by key with NO separator between pairs.
 *   3. Compute HMAC-SHA1 keyed by the Twilio auth token.
 *   4. Base64-encode the digest and compare against `X-Twilio-Signature`.
 */
export const twilioVerifier: WebhookVerifier = (input, secret) => {
  const headerSig = pickHeader(input.headers['x-twilio-signature']);
  if (!headerSig) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const params = parseFormBody(input.rawBody);
  const sorted = Object.keys(params).toSorted();
  let data = input.url;
  for (const key of sorted) {
    data += key + params[key];
  }

  const expected = createHmac('sha1', secret).update(data).digest('base64');

  if (!safeEqual(expected, headerSig)) {
    // F5: surface the URL we hashed so operators can debug tunnel URL
    // mismatches (most common: tunnel does not preserve x-forwarded-host,
    // so we hash `localhost:port` while Twilio signed the public host).
    console.warn(`[twilioVerifier] signature mismatch; signing-url=${input.url}`);
    return { ok: false, reason: 'invalid-signature', status: 401, signingUrl: input.url };
  }

  return { ok: true, payload: params };
};

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

/**
 * Parse a Twilio form-encoded body to a plain string-map. Twilio webhooks are
 * always `application/x-www-form-urlencoded`; arrays / repeated keys collapse
 * to the last value.
 */
function parseFormBody(body: Buffer): Record<string, string> {
  const out: Record<string, string> = {};
  const text = body.toString('utf8');
  if (text.length === 0) return out;
  const params = new URLSearchParams(text);
  for (const [k, v] of params.entries()) {
    out[k] = v;
  }
  return out;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
