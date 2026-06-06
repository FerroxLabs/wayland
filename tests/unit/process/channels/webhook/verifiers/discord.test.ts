/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { discordVerifier } from '@process/channels/webhook/verifiers/discord';

// Generate a fixed Ed25519 keypair once per test suite. The public key is
// surfaced as the connection secret (hex-encoded raw 32 bytes - Discord's
// format from the developer portal).
let publicKeyHex: string;
let privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];

beforeAll(() => {
  const kp = generateKeyPairSync('ed25519');
  privateKey = kp.privateKey;
  const rawPublic = kp.publicKey.export({ format: 'der', type: 'spki' });
  // Last 32 bytes of the SPKI DER are the raw Ed25519 public key.
  publicKeyHex = Buffer.from(rawPublic.subarray(rawPublic.length - 32)).toString('hex');
});

function signDiscord(timestamp: string, body: string): string {
  const message = Buffer.concat([Buffer.from(timestamp, 'utf8'), Buffer.from(body, 'utf8')]);
  return cryptoSign(null, message, privateKey).toString('hex');
}

// F-5: verifier enforces a ±5 min freshness window. Use `now` in the cases
// where we want signature validation to be the focus rather than staleness.
function freshTs(): string {
  return String(Math.floor(Date.now() / 1000));
}

describe('discordVerifier', () => {
  const url = 'https://example.com/webhooks/discord/abc123';
  const body = JSON.stringify({ id: 'interaction-1', type: 1 });

  it('accepts a request with a valid Ed25519 signature', () => {
    const ts = freshTs();
    const sig = signDiscord(ts, body);
    const result = discordVerifier(
      {
        headers: { 'x-signature-ed25519': sig, 'x-signature-timestamp': ts },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      publicKeyHex
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.eventId).toBe('interaction-1');
  });

  it('rejects a request signed with the wrong key', () => {
    const otherKp = generateKeyPairSync('ed25519');
    const ts = freshTs();
    const message = Buffer.concat([Buffer.from(ts, 'utf8'), Buffer.from(body, 'utf8')]);
    const badSig = cryptoSign(null, message, otherKp.privateKey).toString('hex');

    const result = discordVerifier(
      {
        headers: { 'x-signature-ed25519': badSig, 'x-signature-timestamp': ts },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      publicKeyHex
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-signature');
  });

  it('rejects a missing signature header', () => {
    const result = discordVerifier(
      {
        headers: { 'x-signature-timestamp': freshTs() },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      publicKeyHex
    );
    expect(result.ok).toBe(false);
  });

  it('rejects when body has been tampered after signing', () => {
    const ts = freshTs();
    const sig = signDiscord(ts, body);
    const tampered = JSON.stringify({ id: 'interaction-1', type: 99 });
    const result = discordVerifier(
      {
        headers: { 'x-signature-ed25519': sig, 'x-signature-timestamp': ts },
        rawBody: Buffer.from(tampered),
        query: {},
        url,
      },
      publicKeyHex
    );
    expect(result.ok).toBe(false);
  });

  // F-5: replay-window coverage (gap G-6 in REVIEW-discord.md).
  it('rejects a timestamp older than the ±5 min replay window', () => {
    const ts = String(Math.floor(Date.now() / 1000) - 600); // 10 min old
    const sig = signDiscord(ts, body);
    const result = discordVerifier(
      {
        headers: { 'x-signature-ed25519': sig, 'x-signature-timestamp': ts },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      publicKeyHex
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('stale-timestamp');
  });

  it('rejects a non-numeric timestamp (fail-closed)', () => {
    const ts = 'not-a-number';
    const sig = signDiscord(ts, body);
    const result = discordVerifier(
      {
        headers: { 'x-signature-ed25519': sig, 'x-signature-timestamp': ts },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      publicKeyHex
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-timestamp');
  });
});
