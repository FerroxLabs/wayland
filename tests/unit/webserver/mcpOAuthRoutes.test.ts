import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The connect route loads servers via ProcessConfig (#283/#397: NOT the
// renderer-facing ConfigStorage, which hangs when called from the main-process
// webserver), starts the flow via the mcpOAuthService singleton, and captures
// the auth URL off the core feedback event. All hoisted mocks so the route runs
// in isolation.
const { mockLogin, mockGet, mockAppendAudit, emitter, servers } = vi.hoisted(() => {
  const { EventEmitter } = require('node:events');
  const feedbackEmitter = new EventEmitter();
  const serverList: Array<{ id: string; name: string }> = [{ id: 'srv-1', name: 'box' }];
  return {
    emitter: feedbackEmitter,
    servers: serverList,
    // login emits the upstream "copy this URL" feedback, then resolves success.
    mockLogin: vi.fn(async () => {
      feedbackEmitter.emit('user-feedback', {
        severity: 'info',
        message: 'Opening your browser...\nhttps://auth.box.com/authorize?client_id=abc&state=xyz',
      });
      return { success: true };
    }),
    mockGet: vi.fn(async () => serverList),
    mockAppendAudit: vi.fn(),
  };
});

vi.mock('@office-ai/aioncli-core/dist/src/utils/events.js', () => ({
  CoreEvent: { UserFeedback: 'user-feedback' },
  coreEvents: {
    on: (e: string, h: (...a: unknown[]) => void) => emitter.on(e, h),
    off: (e: string, h: (...a: unknown[]) => void) => emitter.off(e, h),
  },
}));
vi.mock('@process/services/mcpServices/McpOAuthService', () => ({
  mcpOAuthService: { login: mockLogin },
  WAYLAND_OAUTH_CALLBACK_PORT: '57000',
  WAYLAND_OAUTH_REDIRECT_URI: 'http://localhost:57000/oauth/callback',
}));
// #283/#397 regression guard: the route must read servers through ProcessConfig
// (direct main-process accessor), never the renderer-facing ConfigStorage.
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: mockGet },
}));
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { deriveRedirectUri, registerMcpOAuthRoutes } from '@process/webserver/routes/mcpOAuthRoutes';

type CapturedHandler = (req: Request, res: Response) => unknown;
const passAuth: RequestHandler = (_req, _res, next) => next();

/** Capture a route's final handler by handing register a stub Express app. */
function captureHandlers(): Record<string, CapturedHandler> {
  const handlers: Record<string, CapturedHandler> = {};
  const app = {
    post(path: string, ...middleware: CapturedHandler[]) {
      handlers[`POST ${path}`] = middleware[middleware.length - 1];
    },
    get(path: string, ...middleware: CapturedHandler[]) {
      handlers[`GET ${path}`] = middleware[middleware.length - 1];
    },
  } as unknown as Express;
  registerMcpOAuthRoutes(app, passAuth);
  return handlers;
}

type ReqOpts = { body?: Record<string, unknown>; peer?: string; secure?: boolean; userId?: string; hostname?: string };
function makeReq({ body, peer, secure, userId, hostname }: ReqOpts): Request {
  return {
    body: body ?? {},
    query: {},
    hostname: hostname ?? 'box.example.com',
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
    type() {
      return res;
    },
    send(body: unknown) {
      (res as { _json?: unknown })._json = body;
      return res;
    },
  } as unknown as Response & { _status?: number; _json?: unknown };
  return res;
}

describe('deriveRedirectUri (origin-aware DCR redirect)', () => {
  beforeEach(() => {
    delete process.env.SERVER_BASE_URL;
    delete process.env.WAYLAND_HTTPS;
  });

  it('keeps the desktop loopback default when NOT remote', () => {
    const uri = deriveRedirectUri(makeReq({ peer: '127.0.0.1' }));
    expect(uri).toBe('http://localhost:57000/oauth/callback');
  });

  it('derives the callback from the validated blessed origin (SERVER_BASE_URL) for a remote session', () => {
    process.env.SERVER_BASE_URL = 'https://box.example.com';
    const uri = deriveRedirectUri(makeReq({ peer: '100.64.0.9', hostname: 'box.example.com' }));
    expect(uri).toBe('https://box.example.com/api/mcp/oauth/callback');
  });

  it('falls back to the validated hostname + scheme when SERVER_BASE_URL is unset', () => {
    const uri = deriveRedirectUri(makeReq({ peer: '100.64.0.9', secure: true, hostname: 'remote.host' }));
    expect(uri).toBe('https://remote.host/api/mcp/oauth/callback');
  });
});

describe('MCP OAuth connect route (W4a write-only DCR connect)', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockGet.mockClear();
    mockGet.mockResolvedValue(servers);
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    emitter.removeAllListeners();
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    delete process.env.OAUTH_CALLBACK_PORT;
    process.env.NODE_ENV = 'test';
  });

  it('connect returns STATUS + authUrl ONLY - never a token', async () => {
    const res = makeRes();
    await captureHandlers()['POST /api/mcp/oauth/connect'](makeReq({ body: { serverId: 'srv-1' }, userId: 'u1' }), res);

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(res._json).toMatchObject({ success: true, data: { status: 'pending' } });
    const data = (res._json as { data: { authUrl: string } }).data;
    expect(data.authUrl).toContain('https://auth.box.com/authorize');
    // No token / access_token leaks back.
    expect(JSON.stringify(res._json)).not.toMatch(/access_token|"token"/i);
  });

  it('connect passes an origin-aware redirect derived from the validated origin', async () => {
    process.env.SERVER_BASE_URL = 'https://box.example.com';
    await captureHandlers()['POST /api/mcp/oauth/connect'](
      makeReq({ body: { serverId: 'srv-1' }, peer: '100.64.0.9', hostname: 'box.example.com' }),
      makeRes()
    );

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'srv-1' }),
      expect.objectContaining({ redirectUri: 'https://box.example.com/api/mcp/oauth/callback' })
    );
  });

  it('connect keeps the desktop loopback redirect unchanged for a loopback peer', async () => {
    await captureHandlers()['POST /api/mcp/oauth/connect'](
      makeReq({ body: { serverId: 'srv-1' }, peer: '127.0.0.1' }),
      makeRes()
    );

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'srv-1' }),
      expect.objectContaining({ redirectUri: 'http://localhost:57000/oauth/callback' })
    );
  });

  it('connect refuses a plain-HTTP start from the public internet (403, before login)', async () => {
    const res = makeRes();
    await captureHandlers()['POST /api/mcp/oauth/connect'](
      makeReq({ body: { serverId: 'srv-1' }, peer: '203.0.113.5', secure: false }),
      res
    );

    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('connect audits with action mcp.oauth-connect / target / ip / reachedVia', async () => {
    await captureHandlers()['POST /api/mcp/oauth/connect'](
      makeReq({ body: { serverId: 'srv-1' }, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      action: 'mcp.oauth-connect',
      target: 'srv-1',
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
    });
  });

  it('connect rejects a missing serverId (400) without login', async () => {
    const res = makeRes();
    await captureHandlers()['POST /api/mcp/oauth/connect'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('connect rejects an unknown serverId (400)', async () => {
    const res = makeRes();
    await captureHandlers()['POST /api/mcp/oauth/connect'](makeReq({ body: { serverId: 'nope' } }), res);
    expect(res._status).toBe(400);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('connect redacts any secret in an unexpected thrown error (500)', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await captureHandlers()['POST /api/mcp/oauth/connect'](makeReq({ body: { serverId: 'srv-1' } }), res);

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });
});
