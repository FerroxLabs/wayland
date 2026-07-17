import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express, Request, RequestHandler, Response } from 'express';

// The route calls the shared in-process constitution helpers. Hoist stateful
// stubs so we can assert against them.
const {
  mockWrite,
  mockReset,
  mockWriteSpecialist,
  mockDeleteSpecialist,
  mockRead,
  mockAppendAudit,
  mockRequireDestructive,
  mockVerifyStepUp,
  mockAuthorizeGrant,
  mockIssueGrant,
  mockRevokeGrant,
} = vi.hoisted(() => ({
  mockWrite: vi.fn((content: string) => content.length <= 100),
  mockReset: vi.fn(() => '# Default Constitution\n'),
  mockWriteSpecialist: vi.fn((id: string, _content: string) => id !== 'bad-id'),
  mockDeleteSpecialist: vi.fn((id: string) => id !== 'missing'),
  mockRead: vi.fn(() => '# Current Constitution\n'),
  mockAppendAudit: vi.fn(),
  mockRequireDestructive: vi.fn(),
  mockVerifyStepUp: vi.fn(),
  mockAuthorizeGrant: vi.fn(),
  mockIssueGrant: vi.fn(),
  mockRevokeGrant: vi.fn(),
}));

vi.mock('@/common/constitutionDefault', () => ({
  DEFAULT_CONSTITUTION: '# Default Constitution\n',
}));
vi.mock('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => ({
    readConstitution: () => ({ status: 'present', content: mockRead(), revision: 'rev:v1:current-main' }),
    listSpecialists: () => [],
    readSpecialist: () => ({ status: 'absent', revision: 'rev:v1:internal-absent' }),
    writeConstitution: (content: string, revision: string | null, requestId: string) => {
      const ok =
        content === '# Default Constitution\n'
          ? (mockReset(content, revision, requestId), true)
          : mockWrite(content, revision, requestId);
      if (!ok)
        throw Object.assign(new Error('invalid Constitution write'), { code: 'CONSTITUTION_FS_INVALID_REQUEST' });
      return {
        status: 'committed',
        revision: 'rev:v1:next-main',
        transactionId: requestId,
        receiptId: 'receipt-main',
        requestFingerprint: `sha256:${'1'.repeat(64)}`,
      };
    },
    writeSpecialist: (id: string, content: string, revision: string | null, requestId: string) => {
      if (!mockWriteSpecialist(id, content, revision, requestId))
        throw Object.assign(new Error('invalid specialist write'), { code: 'CONSTITUTION_FS_INVALID_REQUEST' });
      return {
        status: 'committed',
        revision: 'rev:v1:next-specialist',
        transactionId: requestId,
        receiptId: 'receipt-specialist',
        requestFingerprint: `sha256:${'2'.repeat(64)}`,
      };
    },
    deleteSpecialist: (id: string, revision: string, requestId: string) => {
      if (!mockDeleteSpecialist(id, revision, requestId)) throw new Error('invalid specialist delete');
      return {
        status: 'committed',
        revision: 'rev:v1:absent-specialist',
        transactionId: requestId,
        receiptId: 'receipt-delete',
        requestFingerprint: `sha256:${'3'.repeat(64)}`,
      };
    },
  }),
}));
// Constitution writes are AGENT-AUTHORITY -> requireDestructive (operator +
// step-up). The guard's own security matrix (public/operator/stepup/lockout) is
// covered by configWriteGuards.test.ts; here we control it to test the route's
// wiring (calls the gate, bails on deny, mutates + audits on allow). Keep the
// real requireSecureConfigWrite (reset stays config-write) + redactSecrets.
vi.mock('@process/webserver/routes/configWriteGuards', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, requireDestructive: mockRequireDestructive, verifyStepUp: mockVerifyStepUp };
});
vi.mock('@process/webserver/routes/constitutionEditGrant', () => ({
  CONSTITUTION_EDIT_GRANT_HEADER: 'x-wayland-constitution-edit-grant',
  authorizeConstitutionEditGrant: mockAuthorizeGrant,
  issueConstitutionEditGrant: mockIssueGrant,
  revokeConstitutionEditGrant: mockRevokeGrant,
  isConstitutionEditScope: (scope: unknown) =>
    scope === 'constitution.write' || (typeof scope === 'string' && /^specialist\.write:[A-Za-z0-9_-]+$/.test(scope)),
}));
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
function captureHandlers(owner?: unknown): {
  get: Record<string, CapturedHandler>;
  post: Record<string, CapturedHandler>;
} {
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
  registerConstitutionRoutes(app, passAuth, owner as never);
  return { get, post };
}

type ReqOpts = {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  peer?: string;
  secure?: boolean;
  userId?: string;
};
function makeReq({ body, headers, query, peer, secure, userId }: ReqOpts): Request {
  return {
    body: body ?? {},
    headers: headers ?? {},
    query: query ?? {},
    hostname: 'box.example.com',
    secure: secure ?? false,
    socket: { remoteAddress: peer ?? '127.0.0.1' },
    user: userId ? { id: userId, username: 'admin' } : undefined,
  } as unknown as Request;
}
function makeRes(): Response & { _status?: number; _json?: unknown; _headers?: Record<string, string> } {
  const res = {
    _headers: {} as Record<string, string>,
    set(name: string, value: string) {
      res._headers[name] = value;
      return res;
    },
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
  } as unknown as Response & { _status?: number; _json?: unknown; _headers?: Record<string, string> };
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
    mockVerifyStepUp.mockReset();
    mockVerifyStepUp.mockResolvedValue(true);
    mockAuthorizeGrant.mockReset();
    mockAuthorizeGrant.mockReturnValue({ authorized: true, expiresAt: Date.now() + 60_000 });
    mockIssueGrant.mockReset();
    mockIssueGrant.mockReturnValue({ token: 'A'.repeat(43), expiresAt: Date.now() + 60_000 });
    mockRevokeGrant.mockReset();
    mockRevokeGrant.mockReturnValue(true);
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    process.env.NODE_ENV = 'test';
  });

  it('returns exact opaque-revision envelopes for main, specialist list, and absent specialist reads', () => {
    const handlers = captureHandlers().get;
    const main = makeRes();
    handlers['/api/constitution'](makeReq({}), main);
    expect(main._json).toEqual({
      success: true,
      data: { state: 'present', content: '# Current Constitution\n', revision: 'rev:v1:current-main' },
    });

    const list = makeRes();
    handlers['/api/constitution/specialists'](makeReq({}), list);
    expect(list._json).toEqual({ success: true, data: { items: [] } });

    const specialist = makeRes();
    handlers['/api/constitution/specialist'](makeReq({ query: { id: 'copy' } }), specialist);
    expect(specialist._json).toEqual({
      success: true,
      data: { state: 'absent', revision: 'rev:v1:internal-absent' },
    });
  });

  it('reports unsupported packaged authority as an honest unavailable capability', async () => {
    const unavailable = Object.assign(new Error('No packaged authority for win32-x64.'), {
      code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
    });
    const owner = {
      readConstitution: () => {
        throw unavailable;
      },
      writeConstitution: () => {
        throw unavailable;
      },
    };
    const handlers = captureHandlers(owner);

    const read = makeRes();
    handlers.get['/api/constitution'](makeReq({}), read);
    expect(read._status).toBe(503);
    expect(read._json).toEqual({
      success: false,
      code: 'CONSTITUTION_UNAVAILABLE',
      msg: 'Constitution editing is unavailable on this platform.',
    });

    const write = makeRes();
    await handlers.post['/api/constitution/write'](
      makeReq({
        body: {
          content: '# blocked',
          expectedRevision: 'rev:v1:unavailable',
          requestId: '77777777-7777-4777-8777-777777777777',
        },
        userId: 'u1',
      }),
      write
    );
    expect(write._status).toBe(503);
    expect(write._json).toEqual({
      success: false,
      code: 'CONSTITUTION_UNAVAILABLE',
      msg: 'Constitution editing is unavailable on this platform.',
    });
  });

  it('maps native CAS conflicts to the exact reloadable 409 contract', async () => {
    mockWrite.mockImplementationOnce(() => {
      throw Object.assign(new Error('stale'), { code: 'CONSTITUTION_FS_CONFLICT' });
    });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({
        body: {
          content: '# stale',
          expectedRevision: 'rev:v1:stale',
          requestId: '11111111-1111-4111-8111-111111111111',
        },
        userId: 'u1',
      }),
      res
    );
    expect(res._status).toBe(409);
    expect(res._json).toEqual({
      success: false,
      code: 'CONSTITUTION_REVISION_CONFLICT',
      msg: 'Reload before retrying.',
    });
  });

  it('rejects missing or malformed mutation identities before persistence', async () => {
    const handlers = captureHandlers().post;
    const cases: Array<[string, Record<string, unknown>]> = [
      ['/api/constitution/write', { content: '# missing id', expectedRevision: 'rev:v1:main' }],
      ['/api/constitution/reset', { password: 'correct', expectedRevision: 'rev:v1:main', requestId: 'not-a-uuid' }],
      [
        '/api/constitution/write-specialist',
        { id: 'copy', content: '# copy', expectedRevision: 'rev:v1:copy', requestId: '' },
      ],
      ['/api/constitution/delete-specialist', { id: 'copy', password: 'correct', expectedRevision: 'rev:v1:copy' }],
    ];

    await Promise.all(
      cases.map(async ([route, body]) => {
        const res = makeRes();
        await handlers[route](makeReq({ body, userId: 'u1' }), res);
        expect(res._status).toBe(400);
        expect(res._json).toEqual({
          success: false,
          code: 'CONSTITUTION_REQUEST_ID_REQUIRED',
          msg: 'A valid mutation request id is required.',
        });
      })
    );
    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockWriteSpecialist).not.toHaveBeenCalled();
    expect(mockDeleteSpecialist).not.toHaveBeenCalled();
  });

  it('GET /api/constitution returns the current prose (read allowed - not a secret)', () => {
    const res = makeRes();
    captureHandlers().get['/api/constitution'](makeReq({}), res);
    expect(mockRead).toHaveBeenCalled();
    expect(res._json).toEqual({
      success: true,
      data: { state: 'present', content: '# Current Constitution\n', revision: 'rev:v1:current-main' },
    });
  });

  it('write persists and returns STATUS ONLY ({ ok }) - never echoes the body', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({
        body: {
          content: '# My rules',
          expectedRevision: 'rev:v1:current-main',
          requestId: '22222222-2222-4222-8222-222222222222',
        },
        userId: 'u1',
      }),
      res
    );
    expect(mockWrite).toHaveBeenCalledWith('# My rules', 'rev:v1:current-main', '22222222-2222-4222-8222-222222222222');
    expect(res._json).toEqual({
      success: true,
      data: {
        ok: true,
        revision: 'rev:v1:next-main',
        receiptId: 'receipt-main',
        requestId: '22222222-2222-4222-8222-222222222222',
        requestFingerprint: `sha256:${'1'.repeat(64)}`,
      },
    });
    expect(JSON.stringify(res._json)).not.toContain('My rules');
  });

  it('issues a digest-backed scoped edit grant only after destructive step-up', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/edit-grant'](
      makeReq({
        body: { password: 'hunter2', scopes: ['constitution.write', 'specialist.write:copy'] },
        userId: 'u1',
      }),
      res
    );
    expect(mockRequireDestructive).toHaveBeenCalledTimes(1);
    expect(mockRequireDestructive.mock.calls[0][2]).toBe('hunter2');
    expect(mockIssueGrant).toHaveBeenCalledWith(expect.anything(), ['constitution.write', 'specialist.write:copy']);
    expect(res._json).toMatchObject({
      success: true,
      data: { grant: 'A'.repeat(43), expiresAt: expect.any(Number) },
    });
    expect(res._headers).toMatchObject({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
    expect(JSON.stringify(mockAppendAudit.mock.calls)).not.toContain('hunter2');
    expect(JSON.stringify(mockAppendAudit.mock.calls)).not.toContain('A'.repeat(43));
  });

  it('rejects destructive or malformed grant scopes before step-up', async () => {
    const responses = await Promise.all(
      [[], ['constitution.reset'], ['specialist.write:../copy']].map(async (scopes) => {
        const res = makeRes();
        await captureHandlers().post['/api/constitution/edit-grant'](
          makeReq({ body: { password: 'hunter2', scopes }, userId: 'u1' }),
          res
        );
        return res;
      })
    );
    expect(responses.every((res) => res._status === 400)).toBe(true);
    expect(mockRequireDestructive).not.toHaveBeenCalled();
    expect(mockIssueGrant).not.toHaveBeenCalled();
  });

  it('revokes an edit grant idempotently without exposing grant state', () => {
    const res = makeRes();
    captureHandlers().post['/api/constitution/edit-grant/revoke'](
      makeReq({ headers: { 'x-wayland-constitution-edit-grant': 'A'.repeat(43) }, userId: 'u1' }),
      res
    );
    expect(mockRevokeGrant).toHaveBeenCalledWith(expect.anything(), 'A'.repeat(43));
    expect(res._json).toEqual({ success: true, data: { ok: true } });
  });

  it('write audits with action/target/ip/reachedVia', async () => {
    await captureHandlers().post['/api/constitution/write'](
      makeReq({
        body: {
          content: '# rules',
          expectedRevision: 'rev:v1:current-main',
          requestId: '33333333-3333-4333-8333-333333333333',
        },
        userId: 'u1',
        peer: '100.64.0.9',
      }),
      makeRes()
    );
    expect(mockAppendAudit).toHaveBeenCalledTimes(1);
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      userId: 'u1',
      action: 'constitution.write',
      target: null,
      ip: '100.64.0.9',
      reachedVia: 'tailscale',
      result: 'success',
    });
  });

  it('write fails closed when its exact edit grant is missing or invalid', async () => {
    mockAuthorizeGrant.mockReturnValue({ authorized: false, reason: 'missing' });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({ body: { content: '# rules' }, peer: '203.0.113.5', secure: true }),
      res
    );
    expect(res._status).toBe(401);
    expect(res._json).toMatchObject({ code: 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED' });
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('write requires the Constitution scope and passes the opaque header to the grant verifier', async () => {
    await captureHandlers().post['/api/constitution/write'](
      makeReq({
        body: {
          content: '# rules',
          expectedRevision: 'rev:v1:current-main',
          requestId: '44444444-4444-4444-8444-444444444444',
        },
        headers: { 'x-wayland-constitution-edit-grant': 'A'.repeat(43) },
        userId: 'u1',
      }),
      makeRes()
    );
    expect(mockAuthorizeGrant).toHaveBeenCalledWith(expect.anything(), 'A'.repeat(43), 'constitution.write');
    expect(mockRequireDestructive).not.toHaveBeenCalled();
  });

  it('write rejects a missing content (400) without persisting', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](makeReq({ body: {} }), res);
    expect(res._status).toBe(400);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('write returns 400 when the helper rejects (oversized / invalid)', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({
        body: {
          content: 'x'.repeat(200),
          expectedRevision: 'rev:v1:current-main',
          requestId: '55555555-5555-4555-8555-555555555555',
        },
      }),
      res
    );
    expect(res._status).toBe(400);
    expect(mockAppendAudit).toHaveBeenCalledWith(expect.objectContaining({ result: 'failure' }));
  });

  it('write redacts any secret in an unexpected thrown error (500)', async () => {
    mockWrite.mockImplementationOnce(() => {
      throw new Error('boom sk-live-SECRET123456 fail');
    });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write'](
      makeReq({
        body: {
          content: '# rules',
          expectedRevision: 'rev:v1:current-main',
          requestId: '66666666-6666-4666-8666-666666666666',
        },
      }),
      res
    );
    expect(res._status).toBe(500);
    expect(JSON.stringify(res._json)).not.toContain('SECRET123456');
    expect(JSON.stringify(res._json)).toContain('sk-[redacted]');
  });

  it('reset restores the default and returns { ok } only - never the default body', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/reset'](
      makeReq({
        body: {
          password: 'hunter2',
          expectedRevision: 'rev:v1:current-main',
          requestId: '77777777-7777-4777-8777-777777777777',
        },
        userId: 'u1',
      }),
      res
    );
    expect(mockRequireDestructive.mock.calls[0][2]).toBe('hunter2');
    expect(mockReset).toHaveBeenCalledWith(
      expect.any(String),
      'rev:v1:current-main',
      '77777777-7777-4777-8777-777777777777'
    );
    expect(res._json).toEqual({
      success: true,
      data: {
        ok: true,
        revision: 'rev:v1:next-main',
        receiptId: 'receipt-main',
        requestId: '77777777-7777-4777-8777-777777777777',
        requestFingerprint: `sha256:${'1'.repeat(64)}`,
      },
    });
    expect(JSON.stringify(res._json)).not.toContain('Default Constitution');
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({ action: 'constitution.reset', result: 'success' });
  });

  it('reset refuses a plain-HTTP write from the public internet (403)', async () => {
    mockRequireDestructive.mockImplementation(async (_req: Request, res: Response) => {
      res.status(403).json({ success: false, msg: 'trusted local network required' });
      return false;
    });
    const res = makeRes();
    await captureHandlers().post['/api/constitution/reset'](makeReq({ peer: '203.0.113.5', secure: false }), res);
    expect(res._status).toBe(403);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('write-specialist persists and returns { ok } only', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/write-specialist'](
      makeReq({
        body: {
          id: 'copy',
          content: '# copy rules',
          expectedRevision: 'rev:v1:absent-specialist',
          requestId: '88888888-8888-4888-8888-888888888888',
        },
        userId: 'u1',
      }),
      res
    );
    expect(mockWriteSpecialist).toHaveBeenCalledWith(
      'copy',
      '# copy rules',
      'rev:v1:absent-specialist',
      '88888888-8888-4888-8888-888888888888'
    );
    expect(mockAuthorizeGrant).toHaveBeenCalledWith(expect.anything(), '', 'specialist.write:copy');
    expect(res._json).toEqual({
      success: true,
      data: {
        ok: true,
        revision: 'rev:v1:next-specialist',
        receiptId: 'receipt-specialist',
        requestId: '88888888-8888-4888-8888-888888888888',
        requestFingerprint: `sha256:${'2'.repeat(64)}`,
      },
    });
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      action: 'constitution.writeSpecialist',
      target: 'copy',
      result: 'success',
    });
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
      makeReq({
        body: {
          id: 'bad-id',
          content: 'x',
          expectedRevision: 'rev:v1:absent-specialist',
          requestId: '99999999-9999-4999-8999-999999999999',
        },
      }),
      res
    );
    expect(res._status).toBe(400);
    expect(mockAppendAudit).toHaveBeenCalledWith(expect.objectContaining({ result: 'failure' }));
  });

  it('delete-specialist removes and returns { ok } only', async () => {
    const res = makeRes();
    await captureHandlers().post['/api/constitution/delete-specialist'](
      makeReq({
        body: {
          id: 'copy',
          expectedRevision: 'rev:v1:current-specialist',
          requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        },
        userId: 'u1',
      }),
      res
    );
    expect(mockDeleteSpecialist).toHaveBeenCalledWith(
      'copy',
      'rev:v1:current-specialist',
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
    );
    expect(res._json).toEqual({
      success: true,
      data: {
        ok: true,
        revision: 'rev:v1:absent-specialist',
        receiptId: 'receipt-delete',
        requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        requestFingerprint: `sha256:${'3'.repeat(64)}`,
      },
    });
    expect(mockAppendAudit.mock.calls[0][0]).toMatchObject({
      action: 'constitution.deleteSpecialist',
      target: 'copy',
      result: 'success',
    });
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
