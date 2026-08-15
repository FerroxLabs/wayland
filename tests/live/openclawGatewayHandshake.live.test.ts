/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #907 - LIVE verification against a real OpenClaw gateway.
 *
 * Not part of the unit suite. It needs a gateway actually running, so it is
 * excluded from the default vitest project and run by hand:
 *
 *   npx openclaw@2026.7.1-2 --profile wlverify gateway run \
 *     --port 18999 --auth token --token wlverify-token-838 --allow-unconfigured
 *   npx vitest run --config vitest.live.config.ts
 *
 * The issue reported two defects, both fixed blind against the vendored source.
 * This is the pass that proves them on a real 2026.7 gateway rather than on a
 * reading of its code:
 *
 *   1. Wayland advertised protocol 3 as BOTH floor and ceiling. OpenClaw >= 2026.7
 *      admits general backend clients only at 4, so the handshake could never win.
 *   2. The auth reader ignored gateway.auth.token unless gateway.auth.mode was
 *      literally "token" - but mode is optional upstream and real configs omit it.
 *
 * The negative control matters more than the positive here: connecting with the
 * OLD protocol window must FAIL against this same gateway. Without that, a pass
 * proves only that some handshake works, not that the fix is what made it work.
 */

import { describe, it, expect } from 'vitest';
import { OpenClawGatewayConnection } from '../../src/process/agent/openclaw/OpenClawGatewayConnection';
import { OPENCLAW_PROTOCOL_VERSION, OPENCLAW_MIN_PROTOCOL_VERSION } from '../../src/process/agent/openclaw/types';

const GATEWAY_URL = process.env.WL_LIVE_GATEWAY_URL ?? 'ws://127.0.0.1:18999';
const GATEWAY_TOKEN = process.env.WL_LIVE_GATEWAY_TOKEN ?? 'wlverify-token-838';

type HandshakeResult = { ok: true; hello: unknown } | { ok: false; error: string };

/** Drive a real connect and resolve on whichever of hello-ok / error lands first. */
function handshake(overrides: Record<string, unknown> = {}, timeoutMs = 20000): Promise<HandshakeResult> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: HandshakeResult) => {
      if (settled) return;
      settled = true;
      try {
        conn.stop();
      } catch {
        // best effort - the assertion below is what matters
      }
      resolve(r);
    };

    const conn = new OpenClawGatewayConnection({
      url: GATEWAY_URL,
      token: GATEWAY_TOKEN,
      // Deliberately NOT overriding clientName. The gateway validates
      // client.id against an enum, so a test-only name is rejected on its own
      // merits and would prove nothing about what Wayland actually sends -
      // it reads as a product defect when it is a harness artifact.
      // Leaving it unset exercises the shipped GATEWAY_CLIENT_IDS.GATEWAY_CLIENT.
      onHelloOk: (hello) => done({ ok: true, hello }),
      onConnectError: (err) => done({ ok: false, error: err.message }),
      onClose: (code, reason) => done({ ok: false, error: `closed ${code} ${reason}` }),
      ...overrides,
    } as ConstructorParameters<typeof OpenClawGatewayConnection>[0]);

    setTimeout(() => done({ ok: false, error: 'timeout' }), timeoutMs).unref?.();

    try {
      conn.start();
    } catch (err) {
      done({ ok: false, error: String(err) });
    }
  });
}

describe('#907 live handshake against a real OpenClaw 2026.7 gateway', () => {
  it('the shipped protocol window is [3, 4]', () => {
    // Pinned so the two assertions below cannot silently stop meaning anything.
    expect(OPENCLAW_MIN_PROTOCOL_VERSION).toBe(3);
    expect(OPENCLAW_PROTOCOL_VERSION).toBe(4);
  });

  it('connects and completes the handshake', async () => {
    const result = await handshake();
    expect(result.ok, `handshake failed: ${result.ok ? '' : result.error}`).toBe(true);
  }, 30000);

  it('NEGATIVE CONTROL: the pre-fix window [3, 3] is rejected by the same gateway', async () => {
    // This is the state #907 reported. If this ALSO succeeds, the protocol change
    // was not the fix and the positive test above proves nothing.
    const result = await handshake({ minProtocol: 3, maxProtocol: 3 });
    expect(result.ok, 'pre-fix protocol window unexpectedly succeeded - the fix is not what made it work').toBe(false);
  }, 30000);
});
