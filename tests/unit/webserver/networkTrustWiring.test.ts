/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WIRING guard for #529.
 *
 * `classifyClientTrust` only refuses a carrier-NAT stranger if its CALLERS actually
 * hand it `socket.localAddress` - the address the connection landed on. The classifier's
 * own tests cannot see that: revert both call sites to the 1-arg form and every
 * classifier test still passes, while every genuine tailnet operator silently loses
 * reset / restore / password-change.
 *
 * So these tests drive the two REAL call sites end to end, with the host's interfaces
 * mocked, and pin that the verdict changes with the arrival address:
 *   - routes/configWriteGuards.ts  -> requireDestructive
 *   - webserver/setup.ts           -> deriveTrustedProxyOrigin  (no password step-up!)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const { mockNetworkInterfaces, mockFindById, mockVerifyPassword } = vi.hoisted(() => ({
  mockNetworkInterfaces: vi.fn(),
  mockFindById: vi.fn(),
  mockVerifyPassword: vi.fn(),
}));

vi.mock('node:os', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:os')>()),
  networkInterfaces: mockNetworkInterfaces,
}));
vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: { findById: mockFindById },
}));
vi.mock('@process/webserver/auth/service/AuthService', () => ({
  AuthService: { verifyPassword: mockVerifyPassword },
}));

import { requireDestructive, _resetStepUpLockoutForTests } from '@process/webserver/routes/configWriteGuards';
import { deriveTrustedProxyOrigin } from '@process/webserver/setup';
import { resetNetworkTrustCache } from '@process/webserver/middleware/networkTrust';

/** A tailnet host: Tailscale on utun2 (macOS shape), physical uplink on en0. */
const TAILNET_HOST = {
  utun2: [
    { address: '100.79.121.109', family: 'IPv4', internal: false },
    { address: 'fd7a:115c:a1e0::4d3b:796d', family: 'IPv6', internal: false },
  ],
  en0: [{ address: '100.71.4.9', family: 'IPv4', internal: false }], // carrier-NAT uplink
};

const TAILNET_LOCAL = '100.79.121.109'; // connection arrived over the tailnet
const CARRIER_LOCAL = '100.71.4.9'; // connection arrived on the carrier segment
const CGNAT_PEER = '100.64.0.1'; // a 100.64/10 peer - could be either

function makeReq(localAddress: string | undefined): Request {
  return {
    hostname: 'box.example.com',
    secure: true,
    socket: { remoteAddress: CGNAT_PEER, localAddress },
    headers: { 'x-forwarded-host': 'box.example.com', 'x-forwarded-proto': 'https' },
    user: { id: 'u1', username: 'admin' },
  } as unknown as Request;
}

function makeRes(): Response & { statusCode: number } {
  const res = {
    statusCode: 0,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json: vi.fn(() => res),
    setHeader: vi.fn(),
  };
  return res as unknown as Response & { statusCode: number };
}

describe('#529 wiring: the callers must pass socket.localAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetStepUpLockoutForTests();
    resetNetworkTrustCache();
    mockNetworkInterfaces.mockReturnValue(TAILNET_HOST as never);
    mockFindById.mockReturnValue({ id: 'u1', username: 'admin', password: 'hash' });
    mockVerifyPassword.mockReturnValue(true);
  });

  describe('requireDestructive (configWriteGuards)', () => {
    it('ALLOWS a CGNAT peer that arrived over the tailnet', async () => {
      const res = makeRes();
      await expect(requireDestructive(makeReq(TAILNET_LOCAL), res, 'right')).resolves.toBe(true);
    });

    it('REFUSES the same CGNAT peer when it arrived on the carrier segment', async () => {
      const res = makeRes();
      // Identical peer, correct password, host genuinely on a tailnet - the ONLY
      // difference is where the connection landed. If the caller drops localAddress,
      // this test fails and #529 is back.
      await expect(requireDestructive(makeReq(CARRIER_LOCAL), res, 'right')).resolves.toBe(false);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('deriveTrustedProxyOrigin (setup) - no password step-up guards this one', () => {
    it('trusts the forwarded origin only when the connection arrived over the tailnet', () => {
      expect(deriveTrustedProxyOrigin(makeReq(TAILNET_LOCAL))).not.toBeNull();
    });

    it('does NOT believe X-Forwarded-Host from the carrier segment', () => {
      // This path has NO password. A misclassified peer here gets an attacker-chosen
      // origin CORS-allowlisted, so the wiring matters even more than above.
      expect(deriveTrustedProxyOrigin(makeReq(CARRIER_LOCAL))).toBeNull();
    });
  });
});
