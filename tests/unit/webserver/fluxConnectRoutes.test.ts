import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route reuses the desktop connectFlux core; mock the exchange + PKCE so we
// can drive deterministic outcomes and assert the redirect_uri that flows in.
const { mockExchange, mockBuildAuthorizeUrl, mockCreatePkce, mockAppendAudit } = vi.hoisted(() => ({
  mockExchange: vi.fn(async (_input: { code: string; verifier: string; redirectUri: string }) => ({ ok: true })),
  // Echo the redirect_uri into the authorize URL so a test can inspect which
  // origin the server derived (blessed vs attacker Host).
  mockBuildAuthorizeUrl: vi.fn(
    (_challenge: string, state: string, redirectUri: string) =>
      `https://fluxrouter.ai/desktop/authorize?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`
  ),
  mockCreatePkce: vi.fn(() => ({ verifier: 'VERIFIER-SECRET', challenge: 'CHAL', state: 'state-123' })),
  mockAppendAudit: vi.fn(),
}));

vi.mock('@process/onboarding/connectFlux', () => ({
  createPkce: mockCreatePkce,
  buildAuthorizeUrl: mockBuildAuthorizeUrl,
  connectFluxRemoteExchange: mockExchange,
  FLUX_PROVIDER_ID: 'flux-router',
}));
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { registerFluxConnectRoutes, _resetPendingFlowsForTests } from '@process/webserver/routes/fluxConnectRoutes';

type CapturedHandler = (req: Request, res: Response) => unknown;
const passAuth: RequestHandler = (_req, _res, next) => next();

/** Capture each route's final handler by handing register a stub Express app. */
function captureHandlers(): { post: Record<string, CapturedHandler>; get: Record<string, CapturedHandler> } {
  const post: Record<string, CapturedHandler> = {};
  const get: Record<string, CapturedHandler> = {};
  const app = {
    post(path: string, ...middleware: CapturedHandler[]) {
      post[path] = middleware[middleware.length - 1];
    },
    get(path: string, ...middleware: CapturedHandler[]) {
      get[path] = middleware[middleware.length - 1];
    },
  } as unknown as Express;
  registerFluxConnectRoutes(app, passAuth);
  return { post, get };
}

type ReqOpts = { body?: Record<string, unknown>; query?: Record<string, string>; peer?: string; secure?: boolean; hostname?: string; userId?: string };
function makeReq({ body, query, peer, secure, hostname, userId }: ReqOpts): Request {
  return {
    body: body ?? {},
    query: query ?? {},
    hostname: hostname ?? 'box.example.com',
    secure: secure ?? false,
    socket: { remoteAddress: peer ?? '127.0.0.1' },
    user: userId ? { id: userId, username: 'admin' } : undefined,
  } as unknown as Request;
}
function makeRes(): Response & { _status?: number; _json?: unknown; _redirect?: string } {
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
    redirect(url: string) {
      (res as { _redirect?: string })._redirect = url;
      return res;
    },
  } as unknown as Response & { _status?: number; _json?: unknown; _redirect?: string };
  return res;
}

describe('flux connect routes (W4a write-only remote Flux OAuth)', () => {
  beforeEach(() => {
    _resetPendingFlowsForTests();
    mockExchange.mockClear();
    mockExchange.mockResolvedValue({ ok: true });
    mockBuildAuthorizeUrl.mockClear();
    mockCreatePkce.mockClear();
    mockCreatePkce.mockReturnValue({ verifier: 'VERIFIER-SECRET', challenge: 'CHAL', state: 'state-123' });
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    delete process.env.WAYLAND_ALLOWED_ORIGINS;
    process.env.NODE_ENV = 'test';
  });

  it('start derives the redirect_uri from the blessed origin (SERVER_BASE_URL), NOT an attacker Host', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const res = makeRes();
    // The request carries an attacker-controlled Host; it must be ignored.
    await captureHandlers().post['/api/flux/connect/start'](
      makeReq({ hostname: 'attacker.evil.com', secure: true, userId: 'u1' }),
      res
    );

    const data = (res._json as { success: boolean; data: { authorizeUrl: string; state: string } }).data;
    expect(data.state).toBe('state-123');
    // redirect_uri (echoed into the authorize URL by the mock) must be the
    // blessed origin's callback, never the attacker Host.
    expect(data.authorizeUrl).toContain(encodeURIComponent('https://phone.example.com/api/flux/connect/callback'));
    expect(data.authorizeUrl).not.toContain('attacker.evil.com');
  });

  it('start returns STATUS ONLY (authorize url + state) and NEVER the PKCE verifier', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const res = makeRes();
    await captureHandlers().post['/api/flux/connect/start'](makeReq({ secure: true }), res);
    expect(JSON.stringify(res._json)).not.toContain('VERIFIER-SECRET');
  });

  it('start refuses a plain-HTTP request from the public internet (403, before minting)', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/flux/connect/start'](
      makeReq({ peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockCreatePkce).not.toHaveBeenCalled();
  });

  it('full round-trip: start → complete exchanges SERVER-SIDE and returns { connected: true } only', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const handlers = captureHandlers();

    await handlers.post['/api/flux/connect/start'](makeReq({ secure: true }), makeRes());

    const res = makeRes();
    await handlers.post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'auth-code-1', state: 'state-123' }, secure: true, userId: 'u1' }),
      res
    );

    // The exchange got the stashed verifier + the blessed-origin redirect_uri.
    expect(mockExchange).toHaveBeenCalledWith({
      code: 'auth-code-1',
      verifier: 'VERIFIER-SECRET',
      redirectUri: 'https://phone.example.com/api/flux/connect/callback',
    });
    expect(res._json).toEqual({ success: true, data: { connected: true } });
    expect(JSON.stringify(res._json)).not.toContain('VERIFIER-SECRET');
  });

  it('complete audits action=flux.connect with the DIRECT socket peer and reachedVia', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const handlers = captureHandlers();
    await handlers.post['/api/flux/connect/start'](makeReq({ secure: true }), makeRes());

    await handlers.post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'auth-code-1', state: 'state-123' }, secure: true, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    const entry = mockAppendAudit.mock.calls[0][0];
    expect(entry).toMatchObject({
      userId: 'u1',
      action: 'flux.connect',
      target: 'flux-router',
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
    });
  });

  it('complete rejects a state with no pending flow (forged / replayed) without exchanging', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const res = makeRes();
    await captureHandlers().post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'x', state: 'never-issued' }, secure: true }),
      res
    );
    expect(res._status).toBe(400);
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it('complete is single-use: a second complete with the same state is rejected', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const handlers = captureHandlers();
    await handlers.post['/api/flux/connect/start'](makeReq({ secure: true }), makeRes());

    await handlers.post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'c', state: 'state-123' }, secure: true }),
      makeRes()
    );
    const res = makeRes();
    await handlers.post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'c', state: 'state-123' }, secure: true }),
      res
    );
    expect(res._status).toBe(400);
    expect(mockExchange).toHaveBeenCalledTimes(1);
  });

  it('complete rejects a missing code (400) and a missing state (400)', async () => {
    const handlers = captureHandlers();
    const r1 = makeRes();
    await handlers.post['/api/flux/connect/complete'](makeReq({ body: { state: 's' }, secure: true }), r1);
    expect(r1._status).toBe(400);
    const r2 = makeRes();
    await handlers.post['/api/flux/connect/complete'](makeReq({ body: { code: 'c' }, secure: true }), r2);
    expect(r2._status).toBe(400);
  });

  it('complete refuses a plain-HTTP write from the public internet (403)', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'c', state: 's' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it('complete redacts any secret in an unexpected thrown error (500)', async () => {
    process.env.SERVER_BASE_URL = 'https://phone.example.com';
    const handlers = captureHandlers();
    await handlers.post['/api/flux/connect/start'](makeReq({ secure: true }), makeRes());

    mockExchange.mockRejectedValueOnce(new Error('boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await handlers.post['/api/flux/connect/complete'](
      makeReq({ body: { code: 'c', state: 'state-123' }, secure: true }),
      res
    );
    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  it('callback bounces the browser to the SPA with the code+state (never serves a key)', () => {
    const res = makeRes();
    captureHandlers().get['/api/flux/connect/callback'](
      makeReq({ query: { code: 'abc', state: 'state-123' } }),
      res
    );
    expect(res._redirect).toContain('/settings/models');
    expect(res._redirect).toContain('fluxCode=abc');
    expect(res._redirect).toContain('fluxState=state-123');
  });
});
