import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route calls the shared in-process constitution helpers. Hoist stateful
// stubs so we can assert against them.
const { mockWrite, mockReset, mockWriteSpecialist, mockDeleteSpecialist, mockRead, mockAppendAudit, mockRequireDestructive } =
  vi.hoisted(() => ({
    mockWrite: vi.fn((content: string) => content.length <= 100),
    mockReset: vi.fn(() => '# Default Constitution\n'),
    mockWriteSpecialist: vi.fn((id: string, _content: string) => id !== 'bad-id'),
    mockDeleteSpecialist: vi.fn((id: string) => id !== 'missing'),
    mockRead: vi.fn(() => '# Current Constitution\n'),
    mockAppendAudit: vi.fn(),
    mockRequireDestructive: vi.fn(),
  }));

vi.mock('@process/bridge/constitutionBridge', () => ({
  writeConstitution: mockWrite,
  resetConstitution: mockReset,
  writeConstitutionSpecialist: mockWriteSpecialist,
  deleteConstitutionSpecialist: mockDeleteSpecialist,
  readConstitution: mockRead,
}));
// Constitution writes are AGENT-AUTHORITY -> requireDestructive (operator +
// step-up). The guard's own security matrix (public/operator/stepup/lockout) is
// covered by configWriteGuards.test.ts; here we control it to test the route's
// wiring (calls the gate, bails on deny, mutates + audits on allow). Keep the
// real requireSecureConfigWrite (reset stays config-write) + redactSecrets.
vi.mock('@process/webserver/routes/configWriteGuards', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, requireDestructive: mockRequireDestructive };
});
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { registerConstitutionRoutes } from '@process/webserver/routes/constitutionRoutes';

type CapturedHandler = (req: Request, res: Response) => unknown;
const passAuth: RequestHandler = (_req, _res, next) => next();

/** Capture each route's final handler by handing register a stub Express app. */
function captureHandlers(): { get: Record<string, CapturedHandler>; post: Record<string, CapturedHandler> } {
  const get: Record<string, CapturedHandler> = {};
  const post: Record<string, CapturedHandler> = {};
  const app = {
    get(path: string, ...middleware: CapturedHandler[]) {
      get[path] = middleware[middleware.length - 1];
    },
    post(path: string, ...middleware: CapturedHandler[]) {
      post[path] = middleware[middleware.length - 1];
    },
  } as unknown as Express;
  registerConstitutionRoutes(app, passAuth);
  return { get, post };
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

describe('constitution routes (Wave 3 G - write-only constitution + overlays)', () => {
  beforeEach(() => {
    mockWrite.mockClear();
    mockReset.mockClear();
    mockWriteSpecialist.mockClear();
    mockDeleteSpecialist.mockClear();
    mockRead.mockClear();
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    // Default: the destructive gate ALLOWS (operator + valid step-up). Individual
    // deny tests override with a refusal that writes the 403/401 itself.
    mockRequireDestructive.mockReset();
    mockRequireDestructive.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  it('GET /api/constitution returns the current prose (read allowed - not a secret)', () => {
    const res = makeRes();
    captureHandlers().get['/api/constitution'](makeReq({}), res);
    expect(mockRead).toHaveBeenCalled();
    expect(res._json).toEqual({ success: true, data: { content: '# Current Constitution\n' } });
  });

  it('write persists and returns STATUS ONLY ({ ok }) - never echoes the body', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({ body: { content: '# My rules' }, userId: 'u1' }),
      res
    );
    expect(mockWrite).toHaveBeenCalledWith('# My rules');
    expect(res._json).toEqual({ success: true, data: { ok: true } });
    expect(JSON.stringify(res._json)).not.toContain('My rules');
  });

  it('write audits with action/target/ip/reachedVia', async () => {
    await captureHandlers().post['/api/constitution/write'](
      makeReq({ body: { content: '# rules' }, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );
    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      action: 'constitution.write',
      target: null,
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
    });
  });

  it('write is DESTRUCTIVE: when the gate refuses (non-operator / no step-up), nothing is written', async () => {
    // The Constitution rewrites the agent's brain, so it is gated at the
    // destructive bar - a stolen public-internet session must not reach it.
    mockRequireDestructive.mockImplementation(async (_req: Request, res: Response) => {
      (res as unknown as { status: (c: number) => Response }).status(403);
      (res as unknown as { json: (b: unknown) => Response }).json({ success: false, msg: 'trusted local network required' });
      return false;
    });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({ body: { content: '# rules' }, peer: '203.0.113.5', secure: true }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('write passes the step-up password through to the destructive gate', async () => {
    await captureHandlers().post['/api/constitution/write'](
      makeReq({ body: { content: '# rules', password: 'hunter2' }, userId: 'u1' }),
      makeRes()
    );
    expect(mockRequireDestructive).toHaveBeenCalledTimes(1);
    expect(mockRequireDestructive.mock.calls[0][2]).toBe('hunter2');
  });

  it('write rejects a missing content (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('write returns 400 when the helper rejects (oversized / invalid)', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](makeReq({ body: { content: 'x'.repeat(200) } }), res);
    expect(res._status).toBe(400);
  });

  it('write redacts any secret in an unexpected thrown error (500)', async () => {
    mockWrite.mockImplementationOnce(() => {
      throw new Error('boom sk-live-SECRET123456 fail');
    });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](makeReq({ body: { content: '# rules' } }), res);
    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  it('reset restores the default and returns { ok } only - never the default body', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/reset'](makeReq({ userId: 'u1' }), res);
    expect(mockReset).toHaveBeenCalled();
    expect(res._json).toEqual({ success: true, data: { ok: true } });
    expect(JSON.stringify(res._json)).not.toContain('Default Constitution');
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({ action: 'constitution.reset' });
  });

  it('reset refuses a plain-HTTP write from the public internet (403)', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/reset'](makeReq({ peer: '203.0.113.5', secure: false }), res);
    expect(res._status).toBe(403);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('write-specialist persists and returns { ok } only', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write-specialist'](
      makeReq({ body: { id: 'copy', content: '# copy rules' }, userId: 'u1' }),
      res
    );
    expect(mockWriteSpecialist).toHaveBeenCalledWith('copy', '# copy rules');
    expect(res._json).toEqual({ success: true, data: { ok: true } });
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({ action: 'constitution.writeSpecialist', target: 'copy' });
  });

  it('write-specialist rejects a missing id (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write-specialist'](makeReq({ body: { content: 'x' } }), res);
    expect(res._status).toBe(400);
    expect(mockWriteSpecialist).not.toHaveBeenCalled();
  });

  it('write-specialist returns 400 when the helper rejects a bad id', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write-specialist'](
      makeReq({ body: { id: 'bad-id', content: 'x' } }),
      res
    );
    expect(res._status).toBe(400);
  });

  it('delete-specialist removes and returns { ok } only', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/delete-specialist'](
      makeReq({ body: { id: 'copy' }, userId: 'u1' }),
      res
    );
    expect(mockDeleteSpecialist).toHaveBeenCalledWith('copy');
    expect(res._json).toEqual({ success: true, data: { ok: true } });
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({ action: 'constitution.deleteSpecialist', target: 'copy' });
  });

  it('delete-specialist is DESTRUCTIVE: when the gate refuses, nothing is deleted', async () => {
    mockRequireDestructive.mockImplementation(async (_req: Request, res: Response) => {
      (res as unknown as { status: (c: number) => Response }).status(403);
      (res as unknown as { json: (b: unknown) => Response }).json({ success: false });
      return false;
    });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/delete-specialist'](
      makeReq({ body: { id: 'copy' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockDeleteSpecialist).not.toHaveBeenCalled();
  });
});
