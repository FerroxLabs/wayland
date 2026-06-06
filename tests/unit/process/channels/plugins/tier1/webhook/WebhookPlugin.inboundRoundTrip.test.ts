/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Round-trip integration test for the webhook bridge contract.
 *
 * Locks the symmetry between `signOutboundBody` (what Wayland-out sends) and
 * `genericVerifier` (what Wayland-in accepts) AND the registry alias so the
 * `webhook` platform key in the URL `/webhooks/webhook/<token>` resolves.
 *
 * This is the regression guard for the v0.4.0 CRIT (platform alias missing)
 * and the v0.4.1 MED (replay-window enforcement).
 */

import { describe, expect, it } from 'vitest';
import { signOutboundBody } from '@process/channels/plugins/tier1/webhook/WebhookAdapter';
import { VERIFIER_REGISTRY } from '@process/channels/webhook/verifiers';

describe('Webhook bridge - sign+verify round trip', () => {
  const secret = 'whsec_round_trip_test_secret';
  const bodyJson = JSON.stringify({
    chatId: 'room-1',
    message: 'hello from wayland-out',
    ts: 1700000000000,
  });

  it("'webhook' platform key resolves in VERIFIER_REGISTRY", () => {
    // The ConfigForm mints URLs at `/webhooks/webhook/<token>`. The registry
    // MUST carry a `webhook` alias or the receiver returns 404 unknown-platform.
    expect(VERIFIER_REGISTRY.webhook).toBeDefined();
    // And the alias must point at the same verifier as `generic` (single
    // source of truth - both URL shapes accept the same scheme).
    expect(VERIFIER_REGISTRY.webhook).toBe(VERIFIER_REGISTRY.generic);
  });

  it('signOutboundBody output verifies under the registered webhook verifier', async () => {
    const verifier = VERIFIER_REGISTRY.webhook;
    expect(verifier).toBeDefined();

    const ts = Date.now();
    const sig = signOutboundBody(bodyJson, secret, ts);
    expect(sig).not.toBeNull();

    const result = await verifier(
      {
        headers: {
          'x-webhook-signature': sig as string,
          'x-webhook-timestamp': String(ts),
        },
        rawBody: Buffer.from(bodyJson, 'utf8'),
        query: {},
        url: '/webhooks/webhook/token-abc',
      },
      secret
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toEqual({
        chatId: 'room-1',
        message: 'hello from wayland-out',
        ts: 1700000000000,
      });
    }
  });

  it('rejects when timestamp header is missing', async () => {
    const verifier = VERIFIER_REGISTRY.webhook;
    const ts = Date.now();
    const sig = signOutboundBody(bodyJson, secret, ts);

    const result = await verifier(
      {
        headers: { 'x-webhook-signature': sig as string },
        rawBody: Buffer.from(bodyJson, 'utf8'),
        query: {},
        url: '/webhooks/webhook/token-abc',
      },
      secret
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing-timestamp');
      expect(result.status).toBe(401);
    }
  });

  it('rejects stale timestamps outside the ±5min replay window', async () => {
    const verifier = VERIFIER_REGISTRY.webhook;
    const staleTs = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const sig = signOutboundBody(bodyJson, secret, staleTs);

    const result = await verifier(
      {
        headers: {
          'x-webhook-signature': sig as string,
          'x-webhook-timestamp': String(staleTs),
        },
        rawBody: Buffer.from(bodyJson, 'utf8'),
        query: {},
        url: '/webhooks/webhook/token-abc',
      },
      secret
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('stale-timestamp');
      expect(result.status).toBe(401);
    }
  });

  it('rejects when an attacker tampers with body bytes after signing', async () => {
    const verifier = VERIFIER_REGISTRY.webhook;
    const ts = Date.now();
    const sig = signOutboundBody(bodyJson, secret, ts);
    const tampered = bodyJson.replace('hello', 'evil ');

    const result = await verifier(
      {
        headers: {
          'x-webhook-signature': sig as string,
          'x-webhook-timestamp': String(ts),
        },
        rawBody: Buffer.from(tampered, 'utf8'),
        query: {},
        url: '/webhooks/webhook/token-abc',
      },
      secret
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-signature');
    }
  });
});
