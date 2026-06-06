/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Synology Chat webhook verifier.
 *
 * Synology Chat authenticates outgoing webhook deliveries with a static `token`
 * query-string parameter. The operator copies this token from the Synology Chat
 * admin panel and stores it as `credentials.incomingToken` in Wayland.
 *
 * Security properties:
 *   1. Token comparison is timing-safe (fixed-width padding prevents length leaks).
 *   2. Missing or empty tokens are rejected with 401 before any body parsing.
 *   3. The body is form-encoded; we extract and JSON-parse the `payload` field.
 *   4. Payloads missing `payload` or with unparseable JSON are rejected 400.
 */

import { timingSafeEqual } from 'node:crypto';

import { parseSynologyChatBody } from '../../plugins/tier3/synology-chat/SynologyChatAdapter';
import type { WebhookVerifier } from '../types';

export const synologyChatVerifier: WebhookVerifier = (input, secret) => {
  // 1. Extract token from query string.
  const providedToken = input.query['token'];
  if (!providedToken) {
    return { ok: false, reason: 'missing-token', status: 401 };
  }

  // 2. Timing-safe comparison against the stored incomingToken (= secret).
  if (!safeEqual(providedToken, secret)) {
    return { ok: false, reason: 'invalid-token', status: 401 };
  }

  // 3. Parse the form-encoded body and extract the JSON payload field.
  const rawBody = input.rawBody.toString('utf8');
  const payload = parseSynologyChatBody(rawBody);
  if (!payload) {
    return { ok: false, reason: 'invalid-payload', status: 400 };
  }

  // 4. Use user_id + timestamp as a best-effort event id for replay prevention.
  const userId = payload.user_id !== undefined ? String(payload.user_id) : '';
  const ts = payload.timestamp !== undefined ? String(payload.timestamp) : '';
  const eventId = userId && ts ? `${userId}:${ts}` : undefined;

  return { ok: true, payload, eventId };
};

/**
 * Exposed for unit testing - returns true iff `provided` matches `expected`
 * via timing-safe comparison (fixed-width padded to prevent length leaks).
 */
export function verifySynologyChatToken(provided: string, expected: string): boolean {
  return safeEqual(provided, expected);
}

/**
 * Constant-time string equality with fixed-width padding to prevent timing
 * side-channels that would leak the expected token length.
 *
 * Tokens are padded to TARGET_LEN before comparison; the true length check
 * runs after the constant-time work to avoid short-circuiting.
 */
function safeEqual(a: string, b: string): boolean {
  // 64 chars - generous upper bound for Synology-generated tokens.
  const TARGET_LEN = 64;
  const pad = (s: string): string => s.padEnd(TARGET_LEN, '\0').slice(0, TARGET_LEN);
  const result = timingSafeEqual(Buffer.from(pad(a)), Buffer.from(pad(b)));
  return result && a.length === b.length;
}
