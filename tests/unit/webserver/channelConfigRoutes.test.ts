import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route resolves the channel singletons per-request, so the mocks are
// hoisted and expose stateful stubs we can assert against.
const {
  mockEnablePlugin,
  mockDisablePlugin,
  mockSyncChannelSettings,
  mockApprovePairing,
  mockTokenStore,
  mockProcessConfigSet,
  mockAppendAudit,
  mockRequireDestructive,
} = vi.hoisted(() => ({
  mockEnablePlugin: vi.fn(async (pluginId: string) =>
    pluginId === 'bad_plugin' ? { success: false, error: 'nope' } : { success: true }
  ),
  mockDisablePlugin: vi.fn(async (pluginId: string) =>
    pluginId === 'bad_plugin' ? { success: false, error: 'nope' } : { success: true }
  ),
  mockSyncChannelSettings: vi.fn(async (platform: string) =>
    platform === 'bad' ? { success: false, error: 'nope' } : { success: true }
  ),
  mockApprovePairing: vi.fn(async (code: string) =>
    code === 'bad-code' ? { success: false, error: 'nope' } : { success: true, user: { id: 'u9' } }
  ),
  mockTokenStore: {
    serialize: vi.fn(() => [] as Array<Record<string, unknown>>),
    revoke: vi.fn(),
    register: vi.fn((platform: string) => ({
      token: 'WHK-NEWSECRET999',
      platform,
      createdAt: 1700000000000,
    })),
  },
  mockProcessConfigSet: vi.fn(async () => undefined),
  mockAppendAudit: vi.fn(),
  mockRequireDestructive: vi.fn(),
}));

vi.mock('@process/channels/core/ChannelManager', () => ({
  getChannelManager: () => ({
    enablePlugin: mockEnablePlugin,
    disablePlugin: mockDisablePlugin,
    syncChannelSettings: mockSyncChannelSettings,
  }),
}));
vi.mock('@process/channels/pairing/PairingService', () => ({
  getPairingService: () => ({ approvePairing: mockApprovePairing }),
}));
vi.mock('@process/channels/webhook', () => ({
  getTokenStore: () => mockTokenStore,
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { set: mockProcessConfigSet },
}));
vi.mock('../../../src/process/webserver/audit/auditLog', () => ({
  appendAudit: mockAppendAudit,
}));
vi.mock('../../../src/process/webserver/middleware/security', () => ({
  apiRateLimiter: ((_req: Request, _res: Response, next: () => void) => next()) as RequestHandler,
}));
// approve-pairing enrols a new agent-driving principal -> AGENT-AUTHORITY,
// gated at requireDestructive (operator + step-up). The guard's full matrix is
// covered by configWriteGuards.test.ts; control it here to test the route's
// wiring. Other channel routes keep the real requireSecureConfigWrite.
vi.mock('@process/webserver/routes/configWriteGuards', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, requireDestructive: mockRequireDestructive };
});

import { registerChannelConfigRoutes } from '@process/webserver/routes/channelConfigRoutes';

type CapturedHandler = (req: Request, res: Response) => unknown;
const passAuth: RequestHandler = (_req, _res, next) => next();

/** Capture each route's final handler by handing register a stub Express app. */
function captureHandlers(): Record<string, CapturedHandler> {
  const handlers: Record<string, CapturedHandler> = {};
  const app = {
    post(path: string, ...middleware: CapturedHandler[]) {
      handlers[path] = middleware[middleware.length - 1];
    },
  } as unknown as Express;
  registerChannelConfigRoutes(app, passAuth);
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

describe('channel config routes (W3.E write-only channel config)', () => {
  beforeEach(() => {
    mockEnablePlugin.mockClear();
    mockDisablePlugin.mockClear();
    mockSyncChannelSettings.mockClear();
    mockApprovePairing.mockClear();
    mockTokenStore.serialize.mockClear();
    mockTokenStore.serialize.mockReturnValue([]);
    mockTokenStore.revoke.mockClear();
    mockTokenStore.register.mockClear();
    mockProcessConfigSet.mockClear();
    mockAppendAudit.mockReset();
    mockAppendAudit.mockResolvedValue(true);
    mockRequireDestructive.mockReset();
    mockRequireDestructive.mockResolvedValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  // ---- enable-plugin ----

  it('enable-plugin enables and returns STATUS ONLY ({ enabled: true })', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/enable-plugin'](
      makeReq({ body: { pluginId: 'telegram_default', config: { token: 'bot-SECRET123456' } }, userId: 'u1' }),
      res
    );

    expect(mockEnablePlugin).toHaveBeenCalledWith('telegram_default', { token: 'bot-SECRET123456' });
    expect(res._json).toEqual({ success: true, data: { enabled: true } });
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
  });

  it('enable-plugin audits with action/target/ip/reachedVia', async () => {
    await captureHandlers()['/api/channels/enable-plugin'](
      makeReq({ body: { pluginId: 'telegram_default' }, userId: 'u1', peer: '100.64.0.9' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      action: 'channel.enable',
      target: 'telegram_default',
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
    });
  });

  it('enable-plugin refuses a plain-HTTP write from the public internet (403, before mutating)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/enable-plugin'](
      makeReq({ body: { pluginId: 'telegram_default' }, peer: '203.0.113.5', secure: false }),
      res
    );

    expect(res._status).toBe(403);
    expect(JSON.stringify(res._json)).toMatch(/HTTPS required/i);
    expect(mockEnablePlugin).not.toHaveBeenCalled();
  });

  it('enable-plugin allows a public-internet write over HTTPS (network-tier-agnostic)', async () => {
    process.env.WAYLAND_HTTPS = 'true';
    const res = makeRes();
    await captureHandlers()['/api/channels/enable-plugin'](
      makeReq({ body: { pluginId: 'telegram_default' }, peer: '203.0.113.5', secure: true }),
      res
    );

    expect(mockEnablePlugin).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true });
  });

  it('enable-plugin rejects a missing pluginId (400) without mutating', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/enable-plugin'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockEnablePlugin).not.toHaveBeenCalled();
  });

  it('enable-plugin returns 400 when the manager rejects', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/enable-plugin'](makeReq({ body: { pluginId: 'bad_plugin' } }), res);
    expect(res._status).toBe(400);
  });

  it('enable-plugin redacts any secret in an unexpected thrown error (500)', async () => {
    mockEnablePlugin.mockRejectedValueOnce(new Error('boom sk-live-SECRET123456 fail'));
    const res = makeRes();
    await captureHandlers()['/api/channels/enable-plugin'](makeReq({ body: { pluginId: 'telegram_default' } }), res);

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  // ---- disable-plugin ----

  it('disable-plugin disables and returns { enabled: false }', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/disable-plugin'](
      makeReq({ body: { pluginId: 'telegram_default' }, userId: 'u1' }),
      res
    );

    expect(mockDisablePlugin).toHaveBeenCalledWith('telegram_default');
    expect(res._json).toEqual({ success: true, data: { enabled: false } });
  });

  it('disable-plugin refuses a plain-HTTP write from the public internet (403)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/disable-plugin'](
      makeReq({ body: { pluginId: 'telegram_default' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockDisablePlugin).not.toHaveBeenCalled();
  });

  // ---- sync-settings ----

  it('sync-settings re-binds agent/model and returns { ok: true }', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/sync-settings'](
      makeReq({
        body: { platform: 'telegram', agent: { backend: 'gemini' }, model: { id: 'p1', useModel: 'm1' } },
        userId: 'u1',
      }),
      res
    );

    expect(mockSyncChannelSettings).toHaveBeenCalledWith('telegram', { backend: 'gemini' }, { id: 'p1', useModel: 'm1' });
    expect(res._json).toEqual({ success: true, data: { ok: true } });
  });

  it('sync-settings rejects a missing agent.backend (400) without mutating', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/sync-settings'](makeReq({ body: { platform: 'telegram' } }), res);
    expect(res._status).toBe(400);
    expect(mockSyncChannelSettings).not.toHaveBeenCalled();
  });

  it('sync-settings refuses a plain-HTTP write from the public internet (403)', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/sync-settings'](
      makeReq({ body: { platform: 'telegram', agent: { backend: 'gemini' } }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockSyncChannelSettings).not.toHaveBeenCalled();
  });

  // ---- rotate-webhook-token (shown-once secret) ----

  it('rotate-webhook-token mints and returns the NEW token EXACTLY ONCE', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/rotate-webhook-token'](
      makeReq({ body: { platform: 'sms-twilio', pluginInstanceId: 'inst1', agentId: 'a1' }, userId: 'u1' }),
      res
    );

    expect(mockTokenStore.register).toHaveBeenCalledWith('sms-twilio', 'inst1', 'a1', '');
    expect(res._json).toEqual({
      success: true,
      data: { token: 'WHK-NEWSECRET999', platform: 'sms-twilio', createdAt: 1700000000000 },
    });
  });

  it('rotate-webhook-token NEVER writes the minted token to the audit log', async () => {
    await captureHandlers()['/api/channels/rotate-webhook-token'](
      makeReq({ body: { platform: 'sms-twilio', pluginInstanceId: 'inst1', agentId: 'a1' }, userId: 'u1' }),
      makeRes()
    );

    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    const entry = mockAppendAudit.mock.calls[0][0];
    expect(entry).toMatchObject({ action: 'channel.rotate-webhook', target: 'sms-twilio/inst1' });
    expect(JSON.stringify(entry)).not.toContain('WHK-NEWSECRET999');
  });

  it('rotate-webhook-token revokes the prior token for the same tuple before minting', async () => {
    mockTokenStore.serialize.mockReturnValueOnce([
      { token: 'OLD-TOKEN', platform: 'sms-twilio', pluginInstanceId: 'inst1', agentId: 'a1', revokedAt: undefined },
    ]);
    await captureHandlers()['/api/channels/rotate-webhook-token'](
      makeReq({ body: { platform: 'sms-twilio', pluginInstanceId: 'inst1', agentId: 'a1' } }),
      makeRes()
    );

    expect(mockTokenStore.revoke).toHaveBeenCalledWith('OLD-TOKEN');
  });

  it('rotate-webhook-token rejects a missing tuple (400) without minting', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/rotate-webhook-token'](
      makeReq({ body: { platform: 'sms-twilio' } }),
      res
    );
    expect(res._status).toBe(400);
    expect(mockTokenStore.register).not.toHaveBeenCalled();
  });

  it('rotate-webhook-token redacts any secret in an unexpected thrown error (500)', async () => {
    mockTokenStore.register.mockImplementationOnce(() => {
      throw new Error('boom sk-live-SECRET123456 fail');
    });
    const res = makeRes();
    await captureHandlers()['/api/channels/rotate-webhook-token'](
      makeReq({ body: { platform: 'sms-twilio', pluginInstanceId: 'inst1', agentId: 'a1' } }),
      res
    );

    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  // ---- approve-pairing ----

  it('approve-pairing approves and returns STATUS ONLY ({ ok }) - never the user record', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/approve-pairing'](
      makeReq({ body: { code: 'ABC123' }, userId: 'u1' }),
      res
    );

    expect(mockApprovePairing).toHaveBeenCalledWith('ABC123');
    expect(res._json).toEqual({ success: true, data: { ok: true } });
    expect(JSON.stringify(res._json)).not.toContain('u9');
  });

  it('approve-pairing rejects a missing code (400) without mutating', async () => {
    const res = makeRes();
    await captureHandlers()['/api/channels/approve-pairing'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockApprovePairing).not.toHaveBeenCalled();
  });

  it('approve-pairing is DESTRUCTIVE: when the gate refuses, no pairing is enrolled', async () => {
    // Enrolling a new external command principal must not be reachable from a
    // stolen public-internet session - it is gated at operator + step-up.
    mockRequireDestructive.mockImplementation(async (_req: Request, res: Response) => {
      (res as unknown as { status: (c: number) => Response }).status(403);
      (res as unknown as { json: (b: unknown) => Response }).json({ success: false });
      return false;
    });
    const res = makeRes();
    await captureHandlers()['/api/channels/approve-pairing'](
      makeReq({ body: { code: 'ABC123' }, peer: '203.0.113.5', secure: false }),
      res
    );
    expect(res._status).toBe(403);
    expect(mockApprovePairing).not.toHaveBeenCalled();
  });

  it('approve-pairing passes the step-up password through to the destructive gate', async () => {
    await captureHandlers()['/api/channels/approve-pairing'](
      makeReq({ body: { code: 'ABC123', password: 'hunter2' }, userId: 'u1' }),
      makeRes()
    );
    expect(mockRequireDestructive).toHaveBeenCalledTimes(1);
    expect(mockRequireDestructive.mock.calls[0][2]).toBe('hunter2');
  });
});
