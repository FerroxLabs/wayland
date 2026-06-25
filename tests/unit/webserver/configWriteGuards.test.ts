import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const { mockFindById, mockVerifyPassword } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockVerifyPassword: vi.fn(),
}));

vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: { findById: mockFindById },
}));

vi.mock('@process/webserver/auth/service/AuthService', () => ({
  AuthService: { verifyPassword: mockVerifyPassword },
}));

import {
  redactSecrets,
  requireSecureConfigWrite,
  requireDestructive,
  verifyStepUp,
  _resetStepUpLockoutForTests,
} from '@process/webserver/routes/configWriteGuards';

type ReqOpts = { hostname?: string; peer?: string; secure?: boolean; userId?: string };

function makeReq({ hostname, peer, secure, userId }: ReqOpts): Request {
  return {
    hostname: hostname ?? 'box.example.com',
    secure: secure ?? false,
    socket: { remoteAddress: peer },
    user: userId ? { id: userId, username: 'admin' } : undefined,
  } as unknown as Request;
}

function makeRes(): Response & { _status?: number; _json?: unknown } {
  const res = {
    setHeader() {
      return res;
    },
    status(code: number) {
      (res as { _status?: number })._status = code;
      return res;
    },
    json(body: unknown) {
      (res as { _json?: unknown })._json = body;
      return res;
    },
  } as unknown as Response & { _status?: number; _json?: unknown };
  return res;
}

describe('redactSecrets', () => {
  it('masks standalone sk- keys, Bearer tokens, and provider-prefixed tokens', () => {
    expect(redactSecrets('rejected key sk-live-ABCDEFGH12345678 here')).toContain('sk-[redacted]');
    expect(redactSecrets('Authorization: Bearer abcDEF123.tok-en_value')).toContain('Bearer [redacted]');
    expect(redactSecrets('key xai-ABCDEFGH12345678 rejected')).toContain('xai-[redacted]');
    expect(redactSecrets('token xoxb-ABCDEFGH12345678')).toContain('xox-[redacted]');
  });

  it('redacts a key even when it follows the word bearer (no leak either way)', () => {
    const out = redactSecrets('Invalid bearer sk-live-ABCDEFGH12345678');
    expect(out).not.toContain('sk-live-ABCDEFGH12345678');
  });

  it('does not alter text with no secrets and tolerates empty', () => {
    expect(redactSecrets('plain message')).toBe('plain message');
    expect(redactSecrets('')).toBe('');
  });

  it('never leaves the original secret in the output', () => {
    const out = redactSecrets('failed: sk-live-SECRETKEY9999');
    expect(out).not.toContain('SECRETKEY9999');
  });
});

describe('requireSecureConfigWrite (CONFIG-WRITE floor)', () => {
  const savedHttps = process.env.WAYLAND_HTTPS;
  beforeEach(() => {
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });
  afterEach(() => {
    if (savedHttps === undefined) delete process.env.WAYLAND_HTTPS;
    else process.env.WAYLAND_HTTPS = savedHttps;
  });

  it('refuses plain-HTTP from the public internet (403 HTTPS required)', () => {
    const res = makeRes();
    const ok = requireSecureConfigWrite(makeReq({ peer: '203.0.113.5', secure: false }), res);
    expect(ok).toBe(false);
    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
  });

  it('allows a public-internet write when HTTPS (network-tier-agnostic)', () => {
    process.env.WAYLAND_HTTPS = 'true';
    const res = makeRes();
    const ok = requireSecureConfigWrite(makeReq({ peer: '203.0.113.5', secure: true }), res);
    expect(ok).toBe(true);
    expect(res._status).toBeUndefined();
  });

  it('allows a loopback write over plain HTTP (locally confined)', () => {
    const res = makeRes();
    const ok = requireSecureConfigWrite(makeReq({ hostname: 'localhost', peer: '127.0.0.1' }), res);
    expect(ok).toBe(true);
  });

  it('allows a Tailscale (CGNAT) write over plain HTTP', () => {
    const res = makeRes();
    const ok = requireSecureConfigWrite(makeReq({ peer: '100.64.0.9' }), res);
    expect(ok).toBe(true);
  });
});

describe('requireDestructive (operator + step-up)', () => {
  beforeEach(() => {
    delete process.env.WAYLAND_HTTPS;
    delete process.env.WAYLAND_OPERATOR_CIDRS;
    process.env.NODE_ENV = 'test';
    mockFindById.mockReset();
    mockVerifyPassword.mockReset();
    _resetStepUpLockoutForTests();
  });

  it('refuses a restricted (public) peer with 403 before checking the password', async () => {
    process.env.WAYLAND_HTTPS = 'true'; // pass the floor so we isolate the operator check
    const res = makeRes();
    const ok = await requireDestructive(makeReq({ peer: '203.0.113.5', secure: true, userId: 'u1' }), res, 'pw');
    expect(ok).toBe(false);
    expect(res._status).toBe(403);
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('refuses an operator peer with a wrong password (401)', async () => {
    mockFindById.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    mockVerifyPassword.mockResolvedValue(false);
    const res = makeRes();
    const ok = await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), res, 'wrong');
    expect(ok).toBe(false);
    expect(res._status).toBe(401);
  });

  it('allows an operator peer with the correct password', async () => {
    mockFindById.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    mockVerifyPassword.mockResolvedValue(true);
    const res = makeRes();
    const ok = await requireDestructive(makeReq({ peer: '100.64.0.9', userId: 'u1' }), res, 'right');
    expect(ok).toBe(true);
    expect(res._status).toBeUndefined();
  });

  it('refuses plain-HTTP-public even with operator-looking creds (floor first)', async () => {
    // public peer, no HTTPS -> floor refuses with 403, never reaches operator/pw.
    const res = makeRes();
    const ok = await requireDestructive(makeReq({ peer: '203.0.113.5', secure: false, userId: 'u1' }), res, 'pw');
    expect(ok).toBe(false);
    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
  });

  it('locks out the caller after repeated wrong passwords (429) regardless of route limiter (R7)', async () => {
    mockFindById.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    mockVerifyPassword.mockResolvedValue(false);

    // First 5 wrong attempts from the same operator peer all reach the password
    // check and are rejected with 401 (verifyPassword IS called).
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      // Sequential by design: the lockout counter is stateful, so attempts must
      // be ordered - running them in parallel would defeat what we are testing.
      // eslint-disable-next-line no-await-in-loop
      const ok = await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), res, 'wrong');
      expect(ok).toBe(false);
      expect(res._status).toBe(401);
    }
    expect(mockVerifyPassword).toHaveBeenCalledTimes(5);

    // The 6th attempt is locked out BEFORE the password is checked: 429, and
    // verifyPassword must NOT be invoked again (no oracle to brute-force).
    mockVerifyPassword.mockClear();
    const locked = makeRes();
    const ok = await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), locked, 'wrong');
    expect(ok).toBe(false);
    expect(locked._status).toBe(429);
    expect(JSON.stringify(locked._json)).toMatch(/too many/i);
    expect(mockVerifyPassword).not.toHaveBeenCalled();

    // Even the CORRECT password is refused while the lockout window is active.
    mockVerifyPassword.mockResolvedValue(true);
    const stillLocked = makeRes();
    const ok2 = await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), stillLocked, 'right');
    expect(ok2).toBe(false);
    expect(stillLocked._status).toBe(429);
  });

  it('does not lock out a different caller (key = user + peer)', async () => {
    mockFindById.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    mockVerifyPassword.mockResolvedValue(false);
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop -- stateful counter; order matters.
      await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), makeRes(), 'wrong');
    }
    // Different user from a different operator peer is unaffected.
    mockVerifyPassword.mockResolvedValue(true);
    const res = makeRes();
    const ok = await requireDestructive(makeReq({ peer: '100.64.0.9', userId: 'u2' }), res, 'right');
    expect(ok).toBe(true);
    expect(res._status).toBeUndefined();
  });

  it('clears the failure counter after a correct password', async () => {
    mockFindById.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    // 4 failures (one short of lockout), then a success resets the counter.
    mockVerifyPassword.mockResolvedValue(false);
    for (let i = 0; i < 4; i++) {
      // eslint-disable-next-line no-await-in-loop -- stateful counter; order matters.
      await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), makeRes(), 'wrong');
    }
    mockVerifyPassword.mockResolvedValue(true);
    const okRes = makeRes();
    expect(await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), okRes, 'right')).toBe(true);

    // After the reset, 4 fresh failures still do NOT lock out (counter was cleared).
    mockVerifyPassword.mockResolvedValue(false);
    let lastStatus: number | undefined;
    for (let i = 0; i < 4; i++) {
      const res = makeRes();
      // eslint-disable-next-line no-await-in-loop -- stateful counter; order matters.
      await requireDestructive(makeReq({ peer: '127.0.0.1', userId: 'u1' }), res, 'wrong');
      lastStatus = res._status;
    }
    expect(lastStatus).toBe(401);
  });
});

describe('verifyStepUp', () => {
  beforeEach(() => {
    mockFindById.mockReset();
    mockVerifyPassword.mockReset();
  });

  it('returns false with no password or no user', async () => {
    expect(await verifyStepUp(makeReq({ userId: 'u1' }), '')).toBe(false);
    expect(await verifyStepUp(makeReq({}), 'pw')).toBe(false);
  });

  it('returns false when the user is not found', async () => {
    mockFindById.mockResolvedValue(null);
    expect(await verifyStepUp(makeReq({ userId: 'u1' }), 'pw')).toBe(false);
  });

  it('delegates to AuthService.verifyPassword for the found user', async () => {
    mockFindById.mockResolvedValue({ id: 'u1', password_hash: 'hash' });
    mockVerifyPassword.mockResolvedValue(true);
    expect(await verifyStepUp(makeReq({ userId: 'u1' }), 'pw')).toBe(true);
    expect(mockVerifyPassword).toHaveBeenCalledWith('pw', 'hash');
  });
});
