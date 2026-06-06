/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookVerifier } from '../types';

/**
 * Slack webhook verifier.
 *
 * Reference: https://api.slack.com/authentication/verifying-requests-from-slack
 *
 * Scheme:
 *   1. Take `X-Slack-Request-Timestamp` (epoch seconds). Reject if older than
 *      5 minutes - this catches replays without us needing the event id.
 *   2. Compute `HMAC-SHA256(signing_secret, "v0:" + timestamp + ":" + rawBody)`.
 *   3. Hex-encode and compare against `X-Slack-Signature` (which is the form
 *      `v0=<hex>`) using a timing-safe compare.
 */
const SLACK_REPLAY_WINDOW_SECONDS = 5 * 60;

export const slackVerifier: WebhookVerifier = (input, secret) => {
  const signature = pickHeader(input.headers['x-slack-signature']);
  const timestamp = pickHeader(input.headers['x-slack-request-timestamp']);

  if (!signature || !timestamp) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  const tsNum = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsNum)) {
    return { ok: false, reason: 'invalid-timestamp', status: 401 };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > SLACK_REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: 'stale-timestamp', status: 401 };
  }

  // Slack reserves the signature version prefix (`v0=`) for forward
  // compatibility. Reject any other scheme up front rather than letting it
  // fall through to a constant-time compare against a nonsense pad. F1 HIGH.
  if (!signature.startsWith('v0=')) {
    return { ok: false, reason: 'invalid-scheme', status: 401 };
  }

  const basestring = `v0:${timestamp}:${input.rawBody.toString('utf8')}`;
  const expected = 'v0=' + createHmac('sha256', secret).update(basestring).digest('hex');

  if (!safeEqual(expected, signature)) {
    return { ok: false, reason: 'invalid-signature', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    // Slack also sends `application/x-www-form-urlencoded` interactive
    // payloads (with a `payload` field that contains JSON). Surface the raw
    // form values; the dispatcher can decode further if needed.
    const params = new URLSearchParams(input.rawBody.toString('utf8'));
    const formObj: Record<string, string> = {};
    for (const [k, v] of params.entries()) formObj[k] = v;
    payload = formObj;
  }

  // F15 (v0.4.3): url_verification handshake - Slack POSTs a signed
  //   `{ type: 'url_verification', challenge: '...' }`
  // and requires a 200 reply with the challenge echoed in the body within 3 s.
  // We surface `__challenge` so the shared WebhookReceiver short-circuits to a
  // 200 + plain-text body (same path WhatsApp uses for its GET handshake).
  // Without this, Slack saw 202 Accepted and refused to enable the endpoint.
  const typed = payload as { type?: string; challenge?: string };
  if (typed.type === 'url_verification' && typeof typed.challenge === 'string') {
    return {
      ok: true,
      payload: { ...payload, __challenge: typed.challenge },
      timestamp: tsNum * 1000,
    };
  }

  const eventId =
    (payload as { event_id?: string }).event_id ?? (payload as { event?: { client_msg_id?: string } }).event?.client_msg_id;

  return { ok: true, payload, eventId, timestamp: tsNum * 1000 };
};

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

function safeEqual(a: string, b: string): boolean {
  // Always compare a FIXED-LENGTH window even when inputs differ, so the
  // duration of `timingSafeEqual` does not leak the expected signature length
  // through timing. Slack signature format: `v0=<64 hex chars>` = 67 chars.
  // Pad both sides, then assert equal length AFTER the constant-time work
  // has already run. Aligns with verifiers/agentmail.ts (audit fix gemini MED2
  // 2026-05-18).
  const TARGET_LEN = 67;
  const pad = (s: string): string => s.padEnd(TARGET_LEN, '0').slice(0, TARGET_LEN);
  const result = timingSafeEqual(Buffer.from(pad(a)), Buffer.from(pad(b)));
  return result && a.length === b.length;
}
