import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route reads the stored server record + detected agents server-side and
// delegates persistence to mcpService / persistMcpByoOAuthCredentials, so each
// of those is hoisted to a stateful stub we can assert against.
const { mockSync, mockRemove, mockPersistByo, mockGet, mockDetected, mockAppendAudit } = vi.hoisted(() => ({
  mockSync: vi.fn(async () => ({
    success: true,
    results: [{ agent: 'claude', success: true }],
  })),
  mockRemove: vi.fn(async () => ({
    success: true,
    results: [{ agent: 'claude', success: true }],
  })),
  mockPersistByo: vi.fn(async ({ serverId }: { serverId: string }) =>
    serverId === 'missing' ? { ok: false, msg: 'MCP server not found: missing' } : { ok: true }
  ),
  mockGet: vi.fn(async () => [{ id: 'srv-1', name: 'raindrop', enabled: true }]),
  mockDetected: vi.fn(() => [{ backend: 'claude', name: 'Claude', cliPath: '/usr/bin/claude' }]),
  mockAppendAudit: vi.fn(),
}));

vi.mock('../../../src/process/services/mcpServices/McpService', () => ({
  mcpService: { syncMcpToAgents: mockSync, removeMcpFromAgents: mockRemove },
}));
vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: { getDetectedAgents: mockDetected },
}));
vi.mock('@process/bridge/mcpBridge', () => ({
  persistMcpByoOAuthCredentials: mockPersistByo,
}));
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: mockGet },
}));
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));

import { registerMcpConfigRoutes } from '@process/webserver/routes/mcpConfigRoutes';

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
  registerMcpConfigRoutes(app, passAuth);
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

describe('mcp config routes (W3.D write-only MCP config)', () => {
  beforeEach(() => {
    mockSync.mockClear();
    mockRemove.mockClear();
    mockPersistByo.mockClear();
    mockGet.mockClear();
    mockGet.mockResolvedValue([{ id: 'srv-1', name: 'raindrop', enabled: true }]);
    mockDetected.mockClear();
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  // ---- sync-to-agents ----

  it('sync resolves the stored server + detected agents and returns STATUS ONLY (results)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/sync-to-agents'](makeReq({ body: { serverId: 'srv-1' }, userId: 'u1' }), res);

    expect(mockSync).toHaveBeenCalledWith(
      [{ id: 'srv-1', name: 'raindrop', enabled: true }],
      [{ backend: 'claude', name: 'Claude', cliPath: '/usr/bin/claude' }]
    );
    expect(res._json).toEqual({ success: true, data: { results: [{ agent: 'claude', success: true }] } });
  });

  it('sync audits with action mcp.sync / target / ip / reachedVia', async () => {
    await captureHandlers()['/api/mcp/sync-to-agents'](
      makeReq({ body: { serverId: 'srv-1' }, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      action: 'mcp.sync',
      target: 'srv-1',
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
    });
  });

  it('sync refuses a plain-HTTP write from the public internet (403, before persisting)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/sync-to-agents'](
      makeReq({ body: { serverId: 'srv-1' }, peer: '203.0.113.5', secure: false }),
      res
    );

    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('sync allows a public-internet write over HTTPS (network-tier-agnostic)', async () => {
    process.env.WAYLAND_HTTPS = 'true';
    const res = makeRes();
    await captureHandlers()['/api/mcp/sync-to-agents'](
      makeReq({ body: { serverId: 'srv-1' }, peer: '203.0.113.5', secure: true }),
      res
    );

    expect(mockSync).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true });
  });

  it('sync rejects a missing serverId (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/sync-to-agents'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('sync returns 400 when the server id is unknown', async () => {
    mockGet.mockResolvedValueOnce([]);
    const res = makeRes();
    await captureHandlers()['/api/mcp/sync-to-agents'](makeReq({ body: { serverId: 'nope' } }), res);
    expect(res._status).toBe(400);
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('sync redacts any secret in an unexpected thrown error (500)', async () => {
    mockSync.mockRejectedValueOnce(new Error('boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await captureHandlers()['/api/mcp/sync-to-agents'](makeReq({ body: { serverId: 'srv-1' } }), res);

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  // ---- remove-from-agents ----

  it('remove resolves detected agents and returns STATUS ONLY (results)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/remove-from-agents'](makeReq({ body: { name: 'raindrop' }, userId: 'u1' }), res);

    expect(mockRemove).toHaveBeenCalledWith('raindrop', [
      { backend: 'claude', name: 'Claude', cliPath: '/usr/bin/claude' },
    ]);
    expect(res._json).toEqual({ success: true, data: { results: [{ agent: 'claude', success: true }] } });
  });

  it('remove audits with action mcp.remove', async () => {
    await captureHandlers()['/api/mcp/remove-from-agents'](makeReq({ body: { name: 'raindrop' }, userId: 'u1' }), makeRes());
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({ action: 'mcp.remove', target: 'raindrop' });
  });

  it('remove refuses a plain-HTTP write from the public internet (403)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/remove-from-agents'](
      makeReq({ body: { name: 'raindrop' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('remove rejects a missing name (400)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/remove-from-agents'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  // ---- set-byo-oauth-credentials ----

  it('byo persists credentials and returns { ok } only - NEVER the clientSecret', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](
      makeReq({ body: { serverId: 'srv-1', clientId: 'cid', clientSecret: 'shh-SECRET123456' }, userId: 'u1' }),
      res
    );

    expect(mockPersistByo).toHaveBeenCalledWith({
      serverId: 'srv-1',
      clientId: 'cid',
      clientSecret: 'shh-SECRET123456',
    });
    expect(res._json).toEqual({ success: true, data: { ok: true } });
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
  });

  it('byo audits with action mcp.byo-oauth and NEVER the clientSecret', async () => {
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](
      makeReq({ body: { serverId: 'srv-1', clientId: 'cid', clientSecret: 'shh-SECRET123456' }, userId: 'u1' }),
      makeRes()
    );

    const entry = mockAppendAudit.mock.calls[0][0];
    expect(entry).toMatchObject({ action: 'mcp.byo-oauth', target: 'srv-1' });
    expect(JSON.stringify(entry)).not.toContain('SECRET123456');
    expect(JSON.stringify(entry)).not.toContain('cid');
  });

  it('byo refuses a plain-HTTP write from the public internet (403, before persisting)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](
      makeReq({ body: { serverId: 'srv-1', clientId: 'cid' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockPersistByo).not.toHaveBeenCalled();
  });

  it('byo rejects a missing serverId (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](makeReq({ body: { clientId: 'cid' } }), res);
    expect(res._status).toBe(400);
    expect(mockPersistByo).not.toHaveBeenCalled();
  });

  it('byo rejects a missing clientId (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](makeReq({ body: { serverId: 'srv-1' } }), res);
    expect(res._status).toBe(400);
    expect(mockPersistByo).not.toHaveBeenCalled();
  });

  it('byo returns 400 when the handler reports an unknown server', async () => {
    const res = makeRes();
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](
      makeReq({ body: { serverId: 'missing', clientId: 'cid' } }),
      res
    );
    expect(res._status).toBe(400);
  });

  it('byo redacts any secret in an unexpected thrown error (500)', async () => {
    mockPersistByo.mockRejectedValueOnce(new Error('boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await captureHandlers()['/api/mcp/set-byo-oauth-credentials'](
      makeReq({ body: { serverId: 'srv-1', clientId: 'cid', clientSecret: 'sk-live-SECRET123456' } }),
      res
    );

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });
});
