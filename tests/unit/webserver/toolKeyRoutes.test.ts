import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route builds its handler set at module load via createWcoreToolKeyHandlers,
// so the mock is hoisted and exposes a stateful stub we can assert against.
const { mockSet, mockDelete, mockList, mockAppendAudit, present } = vi.hoisted(() => {
  const present = new Set<string>();
  return {
    present,
    mockSet: vi.fn(async ({ id, key }: { id: string; key: string }) => {
      if (id === 'unknown-tool' || !key) return { ok: false };
      present.add(id);
      return { ok: true };
    }),
    mockDelete: vi.fn(async ({ id }: { id: string }) => {
      if (id === 'unknown-tool') return { ok: false };
      present.delete(id);
      return { ok: true };
    }),
    mockList: vi.fn(async () => [...present].map((id) => ({ id, hasKey: true }))),
    mockAppendAudit: vi.fn(),
  };
});

vi.mock('@process/agent/wcore/toolKeyIpc', () => ({
  createWcoreToolKeyHandlers: () => ({ set: mockSet, delete: mockDelete, list: mockList }),
}));
vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: vi.fn(async () => ({})),
}));
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { registerToolKeyRoutes } from '@process/webserver/routes/toolKeyRoutes';

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
  registerToolKeyRoutes(app, passAuth);
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

describe('tool key routes (W1.B write-only tool/service key)', () => {
  beforeEach(() => {
    present.clear();
    mockSet.mockClear();
    mockDelete.mockClear();
    mockList.mockClear();
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  it('set persists a key and returns STATUS ONLY ({ hasKey }) - never the key', async () => {
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](
      makeReq({ body: { id: 'tavily', key: 'tvly-SECRET123456' }, userId: 'u1' }),
      res
    );

    expect(mockSet).toHaveBeenCalledWith({ id: 'tavily', key: 'tvly-SECRET123456' });
    expect(res._json).toEqual({ success: true, data: { hasKey: true } });
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
  });

  it('set audits with action/target/ip/reachedVia and NEVER the key', async () => {
    await captureHandlers()['/api/tools/keys/set'](
      makeReq({ body: { id: 'tavily', key: 'tvly-SECRET123456' }, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    const entry = mockAppendAudit.mock.calls[0][0];
    expect(entry).toMatchObject({ userId: 'u1', action: 'tool.key.set', target: 'tavily', ip: '100.64.0.9', reachedVia: 'tailscale' });
    expect(JSON.stringify(entry)).not.toContain('SECRET123456');
  });

  it('set refuses a plain-HTTP write from the public internet (403, before persisting)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](
      makeReq({ body: { id: 'tavily', key: 'tvly-x' }, peer: '203.0.113.5', secure: false }),
      res
    );

    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('set allows a public-internet write over HTTPS (network-tier-agnostic)', async () => {
    process.env.WAYLAND_HTTPS = 'true';
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](
      makeReq({ body: { id: 'tavily', key: 'tvly-x' }, peer: '203.0.113.5', secure: true }),
      res
    );

    expect(mockSet).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true });
  });

  it('set rejects a missing id (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](makeReq({ body: { key: 'tvly-x' } }), res);
    expect(res._status).toBe(400);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('set rejects a missing key (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](makeReq({ body: { id: 'tavily' } }), res);
    expect(res._status).toBe(400);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('set returns 400 when the handler rejects an unknown tool id', async () => {
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](makeReq({ body: { id: 'unknown-tool', key: 'x' } }), res);
    expect(res._status).toBe(400);
  });

  it('set redacts any secret in an unexpected thrown error (500)', async () => {
    mockSet.mockRejectedValueOnce(new Error('boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/set'](makeReq({ body: { id: 'tavily', key: 'sk-live-SECRET123456' } }), res);

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  it('delete clears the key and returns { hasKey: false }', async () => {
    present.add('tavily');
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/delete'](makeReq({ body: { id: 'tavily' }, userId: 'u1' }), res);

    expect(mockDelete).toHaveBeenCalledWith({ id: 'tavily' });
    expect(res._json).toEqual({ success: true, data: { hasKey: false } });
  });

  it('delete refuses a plain-HTTP write from the public internet (403)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/tools/keys/delete'](
      makeReq({ body: { id: 'tavily' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
