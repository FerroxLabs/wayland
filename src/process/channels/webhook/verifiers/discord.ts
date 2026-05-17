/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
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
export const discordVerifier: WebhookVerifier = (input, secret) => {
  const signature = pickHeader(input.headers['x-signature-ed25519']);
  const timestamp = pickHeader(input.headers['x-signature-timestamp']);

  if (!signature || !timestamp) {
    return { ok: false, reason: 'missing-signature', status: 401 };
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
