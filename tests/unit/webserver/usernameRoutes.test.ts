import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route resolves the admin user + verifies the current password through
// UserRepository + AuthService, so those are mocked with stateful stubs we can
// assert against. validateUsername mirrors the real charset/length rules.
const {
  mockFindById,
  mockFindByUsername,
  mockUpdateUsername,
  mockVerifyPassword,
  mockInvalidateAllTokens,
  mockRevokeAllFamilies,
  mockAppendAudit,
  adminUser,
} = vi.hoisted(() => {
  const adminUser = { id: 'u1', username: 'admin', password_hash: 'HASH' };
  return {
    adminUser,
    mockFindById: vi.fn(async (id: string) => (id === adminUser.id ? adminUser : null)),
    mockFindByUsername: vi.fn(async (_username: string) => null as { id: string; username: string } | null),
    mockUpdateUsername: vi.fn(async (_id: string, _username: string) => undefined),
    mockVerifyPassword: vi.fn(async (password: string, _hash: string) => password === 'correct-pass'),
    mockInvalidateAllTokens: vi.fn(async () => undefined),
    mockRevokeAllFamilies: vi.fn(async (_id: string) => undefined),
    mockAppendAudit: vi.fn(),
  };
});

vi.mock('../../../src/process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: {
    findById: mockFindById,
    findByUsername: mockFindByUsername,
    updateUsername: mockUpdateUsername,
  },
}));
vi.mock('../../../src/process/webserver/auth/service/AuthService', () => ({
  AuthService: {
    verifyPassword: mockVerifyPassword,
    invalidateAllTokens: mockInvalidateAllTokens,
    revokeAllFamiliesForUser: mockRevokeAllFamilies,
    validateUsername: (username: string) => {
      const errors: string[] = [];
      if (username.length < 3) errors.push('Username must be at least 3 characters long');
      if (username.length > 32) errors.push('Username must be less than 32 characters long');
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) errors.push('Username can only contain letters, numbers, hyphens, and underscores');
      if (/^[_-]|[_-]$/.test(username)) errors.push('Username cannot start or end with hyphen or underscore');
      return { isValid: errors.length === 0, errors };
    },
  },
}));
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { registerUsernameRoutes } from '@process/webserver/routes/usernameRoutes';

type CapturedHandler = (req: Request, res: Response) => unknown;
const passAuth: RequestHandler = (_req, _res, next) => next();

/** Capture a route's final handler by handing register a stub Express app. */
function captureHandlers(): Record<string, CapturedHandler> {
  const handlers: Record<string, CapturedHandler> = {};
  const app = {
    post(path: string, ...middleware: CapturedHandler[]) {
      handlers[path] = middleware[middleware.length - 1];
    },
  } as unknown as Express;
  registerUsernameRoutes(app, passAuth);
  return handlers;
}

type ReqOpts = { body?: Record<string, unknown>; peer?: string; secure?: boolean; userId?: string };
function makeReq({ body, peer, secure, userId }: ReqOpts): Request {
  return {
    body: body ?? {},
    hostname: 'box.example.com',
    secure: secure ?? false,
    socket: { remoteAddress: peer ?? '127.0.0.1' },
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

const ROUTE = '/api/auth/change-username';

describe('username routes (W3 H write-only change-username)', () => {
  beforeEach(() => {
    adminUser.username = 'admin';
    mockFindById.mockClear();
    mockFindByUsername.mockReset();
    mockFindByUsername.mockResolvedValue(null);
    mockUpdateUsername.mockClear();
    mockVerifyPassword.mockClear();
    mockVerifyPassword.mockImplementation(async (password: string) => password === 'correct-pass');
    mockInvalidateAllTokens.mockClear();
    mockRevokeAllFamilies.mockClear();
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  it('renames the admin and returns STATUS ONLY ({ username }) - never a password', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, userId: 'u1' }),
      res
    );

    expect(mockVerifyPassword).toHaveBeenCalledWith('correct-pass', 'HASH');
    expect(mockUpdateUsername).toHaveBeenCalledWith('u1', 'newname');
    expect(res._json).toEqual({ success: true, data: { username: 'newname' } });
    expect(JSON.stringify(res._json)).not.toContain('correct-pass');
    expect(JSON.stringify(res._json)).not.toContain('HASH');
  });

  it('rotates auth (invalidate tokens + revoke families) on a real rename', async () => {
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, userId: 'u1' }),
      makeRes()
    );
    expect(mockInvalidateAllTokens).toHaveBeenCalledTimes(1);
    expect(mockRevokeAllFamilies).toHaveBeenCalledWith('u1');
  });

  it('ENFORCES the current password: a wrong password is a 401 before persisting', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'wrong-pass', newUsername: 'newname' }, userId: 'u1' }),
      res
    );

    expect(res._status).toBe(401);
    expect(mockUpdateUsername).not.toHaveBeenCalled();
    expect(mockInvalidateAllTokens).not.toHaveBeenCalled();
  });

  it('audits with action/target/ip/reachedVia and NEVER the password', async () => {
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    const entry = mockAppendAudit.mock.calls[0][0];
    expect(entry).toMatchObject({
      userId: 'u1',
      action: 'webui.change-username',
      target: 'newname',
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
    });
    expect(JSON.stringify(entry)).not.toContain('correct-pass');
  });

  it('refuses a plain-HTTP write from the public internet (403, before persisting)', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, peer: '203.0.113.5', secure: false, userId: 'u1' }),
      res
    );

    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockUpdateUsername).not.toHaveBeenCalled();
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('allows a public-internet write over HTTPS (network-tier-agnostic)', async () => {
    process.env.WAYLAND_HTTPS = 'true';
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, peer: '203.0.113.5', secure: true, userId: 'u1' }),
      res
    );

    expect(mockUpdateUsername).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true });
  });

  it('rejects a missing newUsername (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](makeReq({ body: { currentPassword: 'correct-pass' }, userId: 'u1' }), res);
    expect(res._status).toBe(400);
    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });

  it('rejects a missing currentPassword (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](makeReq({ body: { newUsername: 'newname' }, userId: 'u1' }), res);
    expect(res._status).toBe(400);
    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });

  it('rejects an invalid username shape (400) without verifying the password', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'a b!' }, userId: 'u1' }),
      res
    );
    expect(res._status).toBe(400);
    expect(mockVerifyPassword).not.toHaveBeenCalled();
    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });

  it('rejects a username already taken by another account (409)', async () => {
    mockFindByUsername.mockResolvedValueOnce({ id: 'other-user', username: 'taken' });
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'taken' }, userId: 'u1' }),
      res
    );
    expect(res._status).toBe(409);
    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });

  it('accepts a no-op rename (same name) without persisting but still 200s', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'admin' }, userId: 'u1' }),
      res
    );
    expect(mockUpdateUsername).not.toHaveBeenCalled();
    expect(mockInvalidateAllTokens).not.toHaveBeenCalled();
    expect(res._json).toEqual({ success: true, data: { username: 'admin' } });
  });

  it('returns 404 when the authenticated user cannot be resolved', async () => {
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, userId: 'ghost' }),
      res
    );
    expect(res._status).toBe(404);
    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });

  it('redacts any secret in an unexpected thrown error (500)', async () => {
    mockUpdateUsername.mockRejectedValueOnce(new Error('db boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await captureHandlers()[ROUTE](
      makeReq({ body: { currentPassword: 'correct-pass', newUsername: 'newname' }, userId: 'u1' }),
      res
    );

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });
});
