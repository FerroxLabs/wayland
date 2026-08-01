import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockWrite, mockReset, mockWriteSpecialist, mockDeleteSpecialist, mockAppendAudit } = vi.hoisted(() => ({
  mockWrite: vi.fn(() => true),
  mockReset: vi.fn(() => '# Default Constitution\n'),
  mockWriteSpecialist: vi.fn(() => true),
  mockDeleteSpecialist: vi.fn(() => true),
  mockAppendAudit: vi.fn(async () => true),
}));

vi.mock('@/common/constitutionDefault', () => ({
  DEFAULT_CONSTITUTION: '# Default Constitution\n',
}));
vi.mock('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => ({
    readConstitution: () => ({
      status: 'present',
      content: '# Current Constitution\n',
      revision: 'rev:v1:current-main',
    }),
    listSpecialists: () => [],
    readSpecialist: () => ({ status: 'absent', revision: 'rev:v1:internal-absent' }),
    writeConstitution: (content: string, revision: string | null, requestId: string) => {
      if (content === '# Default Constitution\n') mockReset(content, revision, requestId);
      else mockWrite(content, revision, requestId);
      return { status: 'committed', revision: 'rev:v1:next-main', transactionId: 'tx-main', receiptId: 'receipt-main' };
    },
    writeSpecialist: (id: string, content: string, revision: string | null, requestId: string) => {
      mockWriteSpecialist(id, content, revision, requestId);
      return {
        status: 'committed',
        revision: 'rev:v1:next-specialist',
        transactionId: 'tx-specialist',
        receiptId: 'receipt-specialist',
      };
    },
    deleteSpecialist: (id: string, revision: string, requestId: string) => {
      mockDeleteSpecialist(id, revision, requestId);
      return {
        status: 'committed',
        revision: 'rev:v1:absent-specialist',
        transactionId: 'tx-delete',
        receiptId: 'receipt-delete',
      };
    },
  }),
}));

vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: {
    findById: vi.fn(async (id: string) =>
      id === 'user-1'
        ? { id: 'user-1', username: 'admin', password_hash: 'stored-hash' }
        : id === 'user-2'
          ? { id: 'user-2', username: 'other', password_hash: 'stored-hash-2' }
          : null
    ),
  },
}));

vi.mock('@process/webserver/auth/service/AuthService', () => ({
  AuthService: {
    verifyToken: vi.fn(async (token: string) =>
      token === 'valid-session'
        ? { userId: 'user-1', username: 'admin' }
        : token === 'other-session'
          ? { userId: 'user-2', username: 'other' }
          : null
    ),
    verifyPassword: vi.fn(
      async (password: string, hash: string) =>
        (password === 'correct-password' && hash === 'stored-hash') ||
        (password === 'other-password' && hash === 'stored-hash-2')
    ),
  },
}));

vi.mock('@process/webserver/audit/auditLog', () => ({ appendAudit: mockAppendAudit }));

import { setupBasicMiddleware } from '@process/webserver/setup';
import { errorHandler } from '@process/webserver/middleware/errorHandler';
import { TokenMiddleware } from '@process/webserver/auth/middleware/TokenMiddleware';
import { registerConstitutionRoutes } from '@process/webserver/routes/constitutionRoutes';
import { __test__ as grantTestApi } from '@process/webserver/routes/constitutionEditGrant';
import { _resetStepUpLockoutForTests } from '@process/webserver/routes/configWriteGuards';

type HttpResult = { status: number; headers: Record<string, string>; body: Record<string, unknown> };

function request(
  port: number,
  method: 'GET' | 'POST',
  path: string,
  headers: Record<string, string> = {},
  body?: Record<string, unknown>
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const encoded = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path,
        headers: {
          connection: 'close',
          ...headers,
          ...(encoded ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(encoded) } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const flatHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (Array.isArray(value)) flatHeaders[key] = value.join('; ');
            else if (typeof value === 'string') flatHeaders[key] = value;
          }
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode ?? 0,
            headers: flatHeaders,
            body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
          });
        });
      }
    );
    req.on('error', reject);
    if (encoded) req.write(encoded);
    req.end();
  });
}

describe('Constitution hosted security journey', () => {
  let server: http.Server;
  let port: number;
  let csrfToken: string;
  let cookie: string;

  beforeAll(async () => {
    const app = express();
    setupBasicMiddleware(app);
    // Exercise the real network guards through HTTP while controlling only the
    // socket facts that a loopback-bound test server cannot naturally produce.
    app.use((req, _res, next) => {
      const peer = req.get('x-test-direct-peer');
      if (peer) Object.defineProperty(req.socket, 'remoteAddress', { configurable: true, value: peer });
      if (req.get('x-test-secure') === 'true') {
        Object.defineProperty(req.socket, 'encrypted', { configurable: true, value: true });
      }
      next();
    });
    app.get('/csrf-seed', (_req, res) => res.json({ success: true }));
    registerConstitutionRoutes(app, TokenMiddleware.validateToken({ responseType: 'json' }));
    app.use(errorHandler);
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  beforeEach(async () => {
    grantTestApi.clear();
    _resetStepUpLockoutForTests();
    vi.clearAllMocks();
    const seed = await request(port, 'GET', '/csrf-seed');
    csrfToken = seed.headers['x-csrf-token'];
    cookie = seed.headers['set-cookie'];
    expect(csrfToken).toBeTruthy();
    expect(cookie).toBeTruthy();
  });

  const authenticatedHeaders = (): Record<string, string> => ({
    authorization: 'Bearer valid-session',
    cookie,
  });

  const post = (
    path: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {}
  ): Promise<HttpResult> =>
    request(port, 'POST', path, { ...authenticatedHeaders(), ...headers }, { ...body, _csrf: csrfToken });

  async function issueGrant(scopes: string[]): Promise<string> {
    const response = await post('/api/constitution/edit-grant', { password: 'correct-password', scopes });
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    return (response.body.data as { grant: string }).grant;
  }

  it('enforces real CSRF and token middleware before the route', async () => {
    const withoutAuth = await request(
      port,
      'POST',
      '/api/constitution/edit-grant',
      { cookie, 'content-type': 'application/json' },
      { password: 'correct-password', scopes: ['constitution.write'], _csrf: csrfToken }
    );
    expect(withoutAuth.status).toBe(403);

    const withoutCsrf = await request(port, 'POST', '/api/constitution/edit-grant', authenticatedHeaders(), {
      password: 'correct-password',
      scopes: ['constitution.write'],
    });
    expect(withoutCsrf.status).toBe(403);
    expect(withoutCsrf.body.code).toBe('csrf_invalid');
  });

  it('requires step-up once, then authorizes only the exact non-destructive scope', async () => {
    const grant = await issueGrant(['constitution.write']);
    const write = await post(
      '/api/constitution/write',
      {
        content: '# changed',
        expectedRevision: 'rev:v1:current-main',
        requestId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      },
      { 'x-wayland-constitution-edit-grant': grant }
    );
    expect(write.status).toBe(200);
    expect(mockWrite).toHaveBeenCalledWith('# changed', 'rev:v1:current-main', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

    const wrongScope = await post(
      '/api/constitution/write-specialist',
      { id: 'copy', content: '# copy' },
      { 'x-wayland-constitution-edit-grant': grant }
    );
    expect(wrongScope.status).toBe(401);
    expect(mockWriteSpecialist).not.toHaveBeenCalled();

    const resetWithGrantOnly = await post(
      '/api/constitution/reset',
      {},
      { 'x-wayland-constitution-edit-grant': grant }
    );
    expect(resetWithGrantOnly.status).toBe(401);
    expect(mockReset).not.toHaveBeenCalled();

    const deleteWithGrantOnly = await post(
      '/api/constitution/delete-specialist',
      { id: 'copy' },
      { 'x-wayland-constitution-edit-grant': grant }
    );
    expect(deleteWithGrantOnly.status).toBe(401);
    expect(mockDeleteSpecialist).not.toHaveBeenCalled();

    const resetWithFreshStepUp = await post('/api/constitution/reset', {
      password: 'correct-password',
      expectedRevision: 'rev:v1:current-main',
      requestId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });
    expect(resetWithFreshStepUp.status).toBe(200);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('enforces secure transport and operator-network trust from real socket facts', async () => {
    const publicHttp = await post(
      '/api/constitution/edit-grant',
      { password: 'correct-password', scopes: ['constitution.write'] },
      { 'x-test-direct-peer': '203.0.113.9' }
    );
    expect(publicHttp.status).toBe(403);
    expect(publicHttp.body.msg).toContain('HTTPS required');

    const publicHttps = await post(
      '/api/constitution/edit-grant',
      { password: 'correct-password', scopes: ['constitution.write'] },
      { 'x-test-direct-peer': '203.0.113.9', 'x-test-secure': 'true' }
    );
    expect(publicHttps.status).toBe(403);
    expect(publicHttps.body.msg).toContain('trusted local network');
    expect(grantTestApi.snapshot().size).toBe(0);
  });

  it('stores only the grant digest and rejects user or direct-peer mismatch through the route', async () => {
    const grant = await issueGrant(['constitution.write']);
    const snapshot = grantTestApi.snapshot();
    expect(snapshot.size).toBe(1);
    expect(snapshot.has(grant)).toBe(false);
    expect(snapshot.has(grantTestApi.digestGrant(grant))).toBe(true);
    expect(JSON.stringify([...snapshot])).not.toContain(grant);

    const wrongUser = await post(
      '/api/constitution/write',
      { content: '# wrong user' },
      { authorization: 'Bearer other-session', 'x-wayland-constitution-edit-grant': grant }
    );
    expect(wrongUser.status).toBe(401);

    const wrongPeer = await post(
      '/api/constitution/write',
      { content: '# wrong peer' },
      { 'x-test-direct-peer': '127.0.0.2', 'x-wayland-constitution-edit-grant': grant }
    );
    expect(wrongPeer.status).toBe(401);
    expect(mockWrite).not.toHaveBeenCalledWith('# wrong user');
    expect(mockWrite).not.toHaveBeenCalledWith('# wrong peer');
  });

  it('revocation and expiry invalidate an otherwise valid grant', async () => {
    const revoked = await issueGrant(['constitution.write']);
    expect(
      (await post('/api/constitution/edit-grant/revoke', {}, { 'x-wayland-constitution-edit-grant': revoked })).status
    ).toBe(200);
    expect(
      (
        await post(
          '/api/constitution/write',
          { content: '# rejected' },
          { 'x-wayland-constitution-edit-grant': revoked }
        )
      ).status
    ).toBe(401);

    const expired = await issueGrant(['constitution.write']);
    grantTestApi.expireAll();
    expect(
      (
        await post(
          '/api/constitution/write',
          { content: '# expired' },
          { 'x-wayland-constitution-edit-grant': expired }
        )
      ).status
    ).toBe(401);
  });

  it('locks repeated password failures before allowing another step-up attempt', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      // Lockout state is deliberately sequential; parallel attempts would not
      // prove the per-request failure transition.
      // oxlint-disable-next-line no-await-in-loop
      const failed = await post('/api/constitution/edit-grant', {
        password: 'wrong-password',
        scopes: ['constitution.write'],
      });
      expect(failed.status).toBe(401);
    }
    const locked = await post('/api/constitution/edit-grant', {
      password: 'correct-password',
      scopes: ['constitution.write'],
    });
    expect(locked.status).toBe(429);
    expect(locked.headers['retry-after']).toBeTruthy();
  });
});
