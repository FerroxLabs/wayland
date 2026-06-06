/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookVerifier } from '../types';

/** Replay-protection window: reject timestamps more than 5 minutes from now. */
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Generic webhook verifier for user-configured "generic webhook" channels.
 *
 * Scheme: HMAC-SHA256 over `<timestamp>.<rawBody>`, keyed by the user's webhook
 * secret. Signature is delivered as `X-Webhook-Signature: sha256=<hex>` and the
 * sender-supplied unix-millisecond timestamp as `X-Webhook-Timestamp`. The
 * timestamp is rejected when it falls outside ±5min of server time, mirroring
 * the Slack/Stripe replay-protection convention. Timing-safe compare.
 */
export const genericVerifier: WebhookVerifier = (input, secret) => {
  const headerSig = pickHeader(input.headers['x-webhook-signature']);
  if (!headerSig || !headerSig.startsWith('sha256=')) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const headerTs = pickHeader(input.headers['x-webhook-timestamp']);
  if (!headerTs) {
    return { ok: false, reason: 'missing-timestamp', status: 401 };
  }
  const ts = Number.parseInt(headerTs, 10);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: 'invalid-timestamp', status: 401 };
  }
  if (Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) {
    return { ok: false, reason: 'stale-timestamp', status: 401 };
  }

  const signedPayload = Buffer.concat([
    Buffer.from(`${headerTs}.`, 'utf8'),
    input.rawBody,
  ]);
  const expected = 'sha256=' + createHmac('sha256', secret).update(signedPayload).digest('hex');
  if (!safeEqual(expected, headerSig)) {
    return { ok: false, reason: 'invalid-signature', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    // Generic webhooks may also POST non-JSON bodies. Surface the raw text so
    // downstream consumers can decide what to do.
    payload = { __raw: input.rawBody.toString('utf8') };
  }

  const eventId =
    pickHeader(input.headers['x-webhook-event-id']) ?? (payload as { id?: string }).id ?? undefined;

  return { ok: true, payload, eventId: eventId === null ? undefined : eventId };
};

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

function safeEqual(a: string, b: string): boolean {
  // Always compare a FIXED-LENGTH window even when inputs differ, so the
  // duration of `timingSafeEqual` does not leak the expected signature length
  // through timing. 'sha256=' (7) + 64 hex chars = 71. Pad both sides, then
  // assert equal length AFTER the constant-time work has already run.
  // Aligns with the padded pattern in verifiers/agentmail.ts (audit fix
  // HIGH8 2026-05-18 - re-applied after first edit silently failed to land).
  const TARGET_LEN = 71;
  const pad = (s: string): string => s.padEnd(TARGET_LEN, '0').slice(0, TARGET_LEN);
  const result = timingSafeEqual(Buffer.from(pad(a)), Buffer.from(pad(b)));
  return result && a.length === b.length;
}
