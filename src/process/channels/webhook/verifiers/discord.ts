/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { verify as cryptoVerify, createPublicKey } from 'node:crypto';
import type { WebhookVerifier } from '../types';

/**
 * Discord interactions verifier.
 *
 * Reference:
 *   https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
 *
 * Scheme: Ed25519 over `X-Signature-Timestamp + rawBody`. Public key is the
 * application's hex-encoded Ed25519 public key (from Discord developer
 * portal), supplied as the connection secret.
 */
/**
 * Max age (seconds) of an interaction timestamp before it's rejected as a
 * replay. Discord's docs recommend ±5 minutes; we match that window. Without
 * this, a captured (signature, timestamp, body) triple stays valid forever
 * because Ed25519 alone has no notion of freshness.
 */
const DISCORD_REPLAY_WINDOW_SECONDS = 300;

export const discordVerifier: WebhookVerifier = (input, secret) => {
  const signature = pickHeader(input.headers['x-signature-ed25519']);
  const timestamp = pickHeader(input.headers['x-signature-timestamp']);

  if (!signature || !timestamp) {
    return { ok: false, reason: 'missing-signature', status: 401 };
  }

  // F-5: enforce ±5 min freshness window. Non-numeric timestamps fail closed.
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds)) {
    return { ok: false, reason: 'invalid-timestamp', status: 401 };
  }
  const nowSeconds = Date.now() / 1000;
  if (Math.abs(nowSeconds - tsSeconds) > DISCORD_REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: 'stale-timestamp', status: 401 };
  }

  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature, 'hex');
  } catch {
    return { ok: false, reason: 'invalid-signature-encoding', status: 401 };
  }
  if (sigBuf.length === 0) {
    return { ok: false, reason: 'invalid-signature-encoding', status: 401 };
  }

  const message = Buffer.concat([Buffer.from(timestamp, 'utf8'), input.rawBody]);

  let pubKey: ReturnType<typeof createPublicKey>;
  try {
    pubKey = createPublicKey({
      // DER-encoded Ed25519 SPKI: 0x302a300506032b6570032100 + 32 raw key bytes
      key: Buffer.concat([
        Buffer.from('302a300506032b6570032100', 'hex'),
        Buffer.from(secret, 'hex'),
      ]),
      format: 'der',
      type: 'spki',
    });
  } catch {
    return { ok: false, reason: 'invalid-public-key', status: 500 };
  }

  let valid = false;
  try {
    valid = cryptoVerify(null, message, pubKey, sigBuf);
  } catch {
    valid = false;
  }

  if (!valid) {
    return { ok: false, reason: 'invalid-signature', status: 401 };
  }

  let payload: object;
  try {
    payload = JSON.parse(input.rawBody.toString('utf8')) as object;
  } catch {
    return { ok: false, reason: 'invalid-json', status: 400 };
  }

  const eventId = (payload as { id?: string }).id;
  return { ok: true, payload, eventId };
};

function pickHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}
