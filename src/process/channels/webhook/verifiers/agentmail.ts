/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookVerifier } from '../types';

/**
 * AgentMail webhook verifier.
 *
 * Reference: https://docs.agentmail.com/webhooks
 *
 * Signature scheme:
 *   1. AgentMail signs each delivery with HMAC-SHA256(webhook_secret, rawBody).
 *   2. The hex digest is sent in the `X-AgentMail-Signature` header. Common
 *      variants observed in similar SaaS APIs prefix the hex with `sha256=`;
 *      we accept both `<hex>` and `sha256=<hex>` to stay robust against
 *      formatting drift.
 *   3. Comparison is timing-safe.
 *
 * The verifier accepts the request as long as the signature matches. Replay
 * prevention is delegated to the WebhookReceiver's event-id cache, keyed off
 * `message.id` when present in the JSON payload.
 */
export const agentMailVerifier: WebhookVerifier = (input, secret) => {
  const headerSig = pickHeader(input.headers['x-agentmail-signature']);
  if (!headerSig) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const provided = normalizeSignature(headerSig);
  if (!provided) {
    return { ok: false, reason: 'invalid-signature-encoding', status: 401 };
  }

  const expected = createHmac('sha256', secret).update(input.rawBody).digest('hex');

  if (!safeEqual(expected, provided)) {
    return { ok: false, reason: 'invalid-signature', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    return { ok: false, reason: 'invalid-json', status: 400 };
  }

  const eventId =
    (payload as { message?: { id?: string; message_id?: string } }).message?.id ??
    (payload as { message?: { id?: string; message_id?: string } }).message?.message_id ??
    (payload as { id?: string }).id;

  return { ok: true, payload, eventId };
};

/**
 * Exposed for unit testing - returns true iff the HMAC-SHA256 of `rawBody`
 * under `secret` matches `providedSignature` (case-insensitive hex, with or
 * without a `sha256=` prefix).
 */
export function verifyAgentMailSignature(
  rawBody: Buffer | string,
  providedSignature: string,
  secret: string
): boolean {
  const provided = normalizeSignature(providedSignature);
  if (!provided) return false;
  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return safeEqual(expected, provided);
}

function normalizeSignature(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const stripped = trimmed.startsWith('sha256=') ? trimmed.slice('sha256='.length) : trimmed;
  // Reject non-hex content to avoid passing arbitrary bytes to timingSafeEqual.
  if (!/^[0-9a-fA-F]+$/.test(stripped)) return null;
  return stripped.toLowerCase();
}

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

function safeEqual(a: string, b: string): boolean {
  // Always compare a FIXED-LENGTH window even if inputs differ, so the
  // duration of `timingSafeEqual` doesn't leak the expected signature length
  // through timing. SHA256 hex = 64 chars; pad both sides to that target,
  // then assert equal length AFTER the constant-time work has already run.
  const TARGET_LEN = 64;
  const pad = (s: string): string => s.padEnd(TARGET_LEN, '0').slice(0, TARGET_LEN);
  const result = timingSafeEqual(Buffer.from(pad(a)), Buffer.from(pad(b)));
  return result && a.length === b.length;
}
