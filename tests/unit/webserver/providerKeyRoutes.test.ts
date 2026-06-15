import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

const { mockConnect, mockGetView, mockAppendAudit } = vi.hoisted(() => ({
  mockConnect: vi.fn(),
  mockGetView: vi.fn(),
  mockAppendAudit: vi.fn(),
}));

vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  connectModelRegistryProvider: mockConnect,
  getModelRegistryProviderView: mockGetView,
}));

vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));

// apiRateLimiter is a passthrough in the test (it is real Express middleware we
// do not want to exercise here - we test the handler logic, not the limiter).
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { registerProviderKeyRoutes } from '@process/webserver/routes/providerKeyRoutes';

type CapturedHandler = (req: Request, res: Response) => unknown;

const passAuth: RequestHandler = (_req, _res, next) => next();

/**
 * Capture the `/api/providers/connect` POST handler by handing
 * `registerProviderKeyRoutes` a stub Express app. The final middleware in the
 * chain is the route handler we want to drive.
 */
function captureHandler(): CapturedHandler {
  let handler: CapturedHandler | undefined;
  const app = {
    post(path: string, ...middleware: CapturedHandler[]) {
      if (path === '/api/providers/connect') handler = middleware[middleware.length - 1];
    },
  } as unknown as Express;
  registerProviderKeyRoutes(app, passAuth);
  if (!handler) throw new Error('handler not registered');
  return handler;
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

describe('POST /api/providers/connect (W1.A write-only provider key)', () => {
  beforeEach(() => {
    mockConnect.mockReset();
    mockGetView.mockReset();
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  it('persists a key and returns STATUS ONLY ({ state, modelCount }) - never the key', async () => {
    mockConnect.mockResolvedValue({ ok: true });
    mockGetView.mockResolvedValue({ providerId: 'openai', connectedVia: 'API key', state: 'connected', modelCount: 7 });

    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { providerId: 'openai', key: 'sk-live-SECRET123456' }, userId: 'u1' }), res);

    expect(mockConnect).toHaveBeenCalledWith('openai', { key: 'sk-live-SECRET123456' });
    expect(res._json).toEqual({ success: true, data: { state: 'connected', modelCount: 7 } });
    // The response body must never carry the key back to the caller.
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
  });

  it('passes baseUrl through to the connect when provided', async () => {
    mockConnect.mockResolvedValue({ ok: true });
    mockGetView.mockResolvedValue({ providerId: 'openai-compatible', connectedVia: 'API key', state: 'connected', modelCount: 1 });

    const handler = captureHandler();
    const res = makeRes();
    await handler(
      makeReq({ body: { providerId: 'openai-compatible', key: 'localkey', baseUrl: 'http://127.0.0.1:8000/v1' } }),
      res
    );

    expect(mockConnect).toHaveBeenCalledWith('openai-compatible', { key: 'localkey', baseUrl: 'http://127.0.0.1:8000/v1' });
  });

  it('audits the write with provider/action/ip/reachedVia and NEVER the key', async () => {
    mockConnect.mockResolvedValue({ ok: true });
    mockGetView.mockResolvedValue({ providerId: 'openai', connectedVia: 'API key', state: 'connected', modelCount: 2 });

    const handler = captureHandler();
    await handler(makeReq({ body: { providerId: 'openai', key: 'sk-live-SECRET123456' }, userId: 'u1', peer: '100.64.0.9' }), makeRes());

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    const entry = mockAppendAudit.mock.calls[0][0];
    expect(entry).toMatchObject({ userId: 'u1', action: 'provider.connect', target: 'openai', ip: '100.64.0.9', reachedVia: 'tailscale' });
    expect(JSON.stringify(entry)).not.toContain('SECRET123456');
  });

  it('refuses a plain-HTTP write from the public internet (403, before persisting)', async () => {
    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { providerId: 'openai', key: 'sk-live-x' }, peer: '203.0.113.5', secure: false }), res);

    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('allows a public-internet write over HTTPS (network-tier-agnostic)', async () => {
    process.env.WAYLAND_HTTPS = 'true';
    mockConnect.mockResolvedValue({ ok: true });
    mockGetView.mockResolvedValue({ providerId: 'openai', connectedVia: 'API key', state: 'connected', modelCount: 3 });

    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { providerId: 'openai', key: 'sk-live-x' }, peer: '203.0.113.5', secure: true }), res);

    expect(mockConnect).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true });
  });

  it('rejects a missing providerId (400) without persisting', async () => {
    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { key: 'sk-live-x' } }), res);
    expect(res._status).toBe(400);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('rejects a missing key (400) without persisting', async () => {
    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { providerId: 'openai' } }), res);
    expect(res._status).toBe(400);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('returns the ConnectError code on a failed connect, redacted, with no key leak', async () => {
    mockConnect.mockResolvedValue({ ok: false, error: 'unauthorized' });

    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { providerId: 'openai', key: 'sk-live-SECRET123456' } }), res);

    expect(res._status).toBe(400);
    expect(res._json).toEqual({ success: false, error: 'unauthorized' });
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(mockGetView).not.toHaveBeenCalled();
  });

  it('redacts any secret in an unexpected thrown error (500)', async () => {
    mockConnect.mockRejectedValue(new Error('boom sk-live-SECRET123456 fail'));

    const handler = captureHandler();
    const res = makeRes();
    await handler(makeReq({ body: { providerId: 'openai', key: 'sk-live-SECRET123456' } }), res);

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });
});
