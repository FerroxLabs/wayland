/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
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
 *      5 minutes — this catches replays without us needing the event id.
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

  const eventId =
    (payload as { event_id?: string }).event_id ?? (payload as { event?: { client_msg_id?: string } }).event?.client_msg_id;

  return { ok: true, payload, eventId, timestamp: tsNum * 1000 };
};

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
