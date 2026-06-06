/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LINE Messaging API webhook verifier.
 *
 * Signature scheme (https://developers.line.biz/en/reference/messaging-api/#signature-validation):
 *   1. LINE signs each delivery with HMAC-SHA256(channelSecret, rawBody).
 *   2. The Base64-encoded digest is sent in the `x-line-signature` header.
 *   3. Comparison is timing-safe with fixed-width padding to prevent
 *      length-leaking side channels.
 *
 * The verifier accepts the request when the signature matches. Replay
 * prevention is delegated to the WebhookReceiver's event-id cache, keyed
 * off the first event's `webhookEventId` when present in the JSON payload.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookVerifier } from '../types';

export const lineVerifier: WebhookVerifier = (input, secret) => {
  const headerSig = pickHeader(input.headers['x-line-signature']);
  if (!headerSig) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const provided = normalizeSignature(headerSig);
  if (!provided) {
    return { ok: false, reason: 'invalid-signature-encoding', status: 401 };
  }

  const expected = createHmac('sha256', secret).update(input.rawBody).digest('base64');

  if (!safeEqualBase64(expected, provided)) {
    return { ok: false, reason: 'invalid-signature', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    return { ok: false, reason: 'invalid-json', status: 400 };
  }

  // Extract first event id for replay cache.
  const events = (payload as { events?: Array<{ webhookEventId?: string; message?: { id?: string } }> }).events;
  const firstEvent = Array.isArray(events) ? events[0] : undefined;
  const eventId =
    firstEvent?.webhookEventId?.trim() ??
    firstEvent?.message?.id?.trim() ??
    undefined;

  return { ok: true, payload, eventId };
};

/**
 * Exposed for unit testing - returns true iff HMAC-SHA256 of `rawBody` under
 * `secret` (Base64-encoded) matches `providedSignature`.
 */
export function verifyLineSignature(
  rawBody: Buffer | string,
  providedSignature: string,
  secret: string,
): boolean {
  const provided = normalizeSignature(providedSignature);
  if (!provided) return false;
  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const expected = createHmac('sha256', secret).update(body).digest('base64');
  return safeEqualBase64(expected, provided);
}

function normalizeSignature(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  // Accept with or without a spurious sha256= prefix (defensive).
  return trimmed.startsWith('sha256=') ? trimmed.slice('sha256='.length) : trimmed;
}

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

/**
 * Timing-safe Base64 string comparison. Pads both sides to the expected
 * SHA-256 Base64 length (44 chars) before the constant-time compare, then
 * asserts exact length equality after - this prevents the timing oracle from
 * leaking the expected signature length.
 */
function safeEqualBase64(a: string, b: string): boolean {
  const TARGET_LEN = 44; // ceil(32 bytes * 4/3) rounded to next multiple of 4
  const pad = (s: string): string => s.padEnd(TARGET_LEN, '=').slice(0, TARGET_LEN);
  const result = timingSafeEqual(Buffer.from(pad(a)), Buffer.from(pad(b)));
  return result && a.length === b.length;
}
