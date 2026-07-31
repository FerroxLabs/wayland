/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { OpenClawGatewayConnection } from '@process/agent/openclaw/OpenClawGatewayConnection';
import { OPENCLAW_MIN_PROTOCOL_VERSION, OPENCLAW_PROTOCOL_VERSION } from '@process/agent/openclaw/types';

/**
 * #907 — Wayland could not connect to a current OpenClaw gateway, for two
 * independent reasons.
 *
 * 1. The client advertised protocol 3 as BOTH minProtocol and maxProtocol, so it
 *    pinned itself to exactly 3. OpenClaw >= 2026.7 admits general backend
 *    clients only at 4. The gateway range-tests the advertised window, so the
 *    fix is to advertise [3, 4] — not to swap one pin for another, which would
 *    just break older gateways instead.
 *
 * 2. `auth.token` was ignored unless `auth.mode === 'token'`, but that
 *    discriminator is optional upstream, so a valid config that omitted it
 *    authenticated with nothing.
 *
 * These assertions read the constructed options rather than mocking `ws`. The
 * defaults are what the connect frame is built from, and mocking a default
 * import whose static `OPEN` the code compares against is a known way to write
 * a test that fails on fixed and unfixed code alike — proving nothing.
 */

const FAKE_IDENTITY = {
  deviceId: 'test-device',
  publicKeyPem: 'pub',
  privateKeyPem: 'priv',
};

describe('#907 protocol window', () => {
  it('advertises a range, not a single pinned version', () => {
    const conn = new OpenClawGatewayConnection({ deviceIdentity: FAKE_IDENTITY });
    const opts = (conn as unknown as { opts: { minProtocol?: number; maxProtocol?: number } }).opts;

    // Negative control: pre-fix both were 3, so min === max and this fails.
    expect(opts.maxProtocol).toBeGreaterThan(opts.minProtocol as number);
    expect(opts).toMatchObject({ minProtocol: 3, maxProtocol: 4 });
  });

  it('still accepts a gateway on the older protocol', () => {
    // The point of the range: fixing #907 must not strand gateways on v3.
    expect(OPENCLAW_MIN_PROTOCOL_VERSION).toBe(3);
    expect(OPENCLAW_PROTOCOL_VERSION).toBe(4);
  });

  it('an explicit caller override still wins', () => {
    const conn = new OpenClawGatewayConnection({ deviceIdentity: FAKE_IDENTITY, minProtocol: 4, maxProtocol: 4 });
    const opts = (conn as unknown as { opts: { minProtocol?: number; maxProtocol?: number } }).opts;
    expect(opts).toMatchObject({ minProtocol: 4, maxProtocol: 4 });
  });
});

describe('#907 gateway auth reader honours an omitted mode', () => {
  let auth: Record<string, unknown> | undefined;

  beforeEach(() => {
    vi.resetModules();
    auth = undefined;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  async function readers() {
    // openclawConfig.ts uses `import fs from 'node:fs'`, so the DEFAULT export is
    // what it calls. Mocking only the named exports leaves it reading the real
    // ~/.openclaw/openclaw.json — which silently passed a live credential into
    // the assertion on the first run of this file.
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      const stub = {
        ...actual,
        existsSync: () => true,
        readFileSync: () => JSON.stringify(auth === undefined ? {} : { gateway: { auth } }),
      };
      return { ...stub, default: stub };
    });
    return await import('@process/agent/openclaw/openclawConfig');
  }

  it('returns a token when mode is omitted', async () => {
    auth = { token: 'tok-abc' };
    const { getGatewayAuthToken } = await readers();
    // Negative control: pre-fix this required mode === 'token' and returned null.
    expect(getGatewayAuthToken()).toBe('tok-abc');
  });

  it('still returns a token when mode is set explicitly', async () => {
    auth = { mode: 'token', token: 'tok-abc' };
    const { getGatewayAuthToken } = await readers();
    expect(getGatewayAuthToken()).toBe('tok-abc');
  });

  it('returns a password when mode is omitted', async () => {
    auth = { password: 'pw-abc' };
    const { getGatewayAuthPassword } = await readers();
    expect(getGatewayAuthPassword()).toBe('pw-abc');
  });

  it('stays silent on an ambiguous mode-unset config carrying both', async () => {
    // Policy, stated so it is not mistaken for a derivation: with no
    // discriminator and two secrets we send neither, which is what today does.
    auth = { token: 'tok-abc', password: 'pw-abc' };
    const { getGatewayAuthToken, getGatewayAuthPassword } = await readers();
    expect(getGatewayAuthToken()).toBeNull();
    expect(getGatewayAuthPassword()).toBeNull();
  });

  it('treats a SecretRef as absent rather than returning an object', async () => {
    // Upstream types these SecretInput = string | SecretRef. Returning the ref
    // would put an object in a field the gateway validates as a string, which
    // fails connect-param validation before negotiation — one opaque failure
    // traded for another.
    auth = { token: { source: 'env', provider: 'default', id: 'OPENCLAW_TOKEN' } };
    const { getGatewayAuthToken } = await readers();
    expect(getGatewayAuthToken()).toBeNull();
  });

  it('mode: none yields no credential', async () => {
    auth = { mode: 'none', token: 'tok-abc' };
    const { getGatewayAuthToken } = await readers();
    expect(getGatewayAuthToken()).toBeNull();
  });
});
