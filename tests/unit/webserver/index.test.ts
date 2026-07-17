/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type AuthUser = {
  id: string;
  username: string;
  password_hash: string;
  jwt_secret: string | null;
  created_at: number;
  updated_at: number;
  last_login: number | null;
};

const {
  createServerMock,
  serverState,
  webSocketServerMock,
  handleUpgradeMock,
  netConnectMock,
  viteSocketMock,
  setupBasicMiddlewareMock,
  setupCorsMock,
  setupErrorHandlerMock,
  setupTrustProxyMock,
  getConfiguredOriginsMock,
  isRequestOriginTrustedMock,
  getCanonicalRequestOriginMock,
  getSingleRequestHeaderValueMock,
  hasRequestHeaderMock,
  registerAuthRoutesMock,
  registerApiRoutesMock,
  registerStaticRoutesMock,
  resolveRendererPathMock,
  initWebAdapterMock,
  extractWebSocketTokenMock,
  extractExplicitWebSocketTokenMock,
  validateWebSocketTokenMock,
  generateRandomPasswordMock,
  hashPasswordMock,
  getSystemUserMock,
  findByUsernameMock,
  setSystemUserCredentialsMock,
  updatePasswordMock,
  createUserMock,
} = vi.hoisted(() => {
  const serverStateValue = {
    upgradeListener: undefined as ((req: unknown, socket: unknown, head: Buffer) => unknown) | undefined,
  };
  const handleUpgradeValue = vi.fn();
  const webSocketEmitMock = vi.fn();
  const webSocketServer = {
    emit: webSocketEmitMock,
    handleUpgrade: handleUpgradeValue,
    options: {},
  };
  const server = {
    listen: vi.fn(),
    on: vi.fn(),
    close: vi.fn(),
  };

  server.listen.mockImplementation((_port: number, _host: string, callback?: () => void) => {
    callback?.();
    return server;
  });
  server.on.mockImplementation((event: string, listener: (...args: unknown[]) => unknown) => {
    if (event === 'upgrade') {
      serverStateValue.upgradeListener = listener as (req: unknown, socket: unknown, head: Buffer) => unknown;
    }
    return server;
  });

  const viteSocketValue = {
    destroy: vi.fn(),
    on: vi.fn(),
    pipe: vi.fn(),
    write: vi.fn(),
  };

  return {
    createServerMock: vi.fn(() => server),
    serverState: serverStateValue,
    webSocketServerMock: vi.fn(function MockWebSocketServer() {
      return webSocketServer;
    }),
    handleUpgradeMock: handleUpgradeValue,
    webSocketEmitMock,
    netConnectMock: vi.fn(() => viteSocketValue),
    viteSocketMock: viteSocketValue,
    setupBasicMiddlewareMock: vi.fn(),
    setupCorsMock: vi.fn(),
    setupErrorHandlerMock: vi.fn(),
    setupTrustProxyMock: vi.fn(),
    getConfiguredOriginsMock: vi.fn(() => new Set(['http://localhost:3000', 'http://127.0.0.1:3000'])),
    isRequestOriginTrustedMock: vi.fn(),
    getCanonicalRequestOriginMock: vi.fn(),
    getSingleRequestHeaderValueMock: vi.fn(),
    hasRequestHeaderMock: vi.fn(),
    registerAuthRoutesMock: vi.fn(),
    registerApiRoutesMock: vi.fn(),
    registerStaticRoutesMock: vi.fn(),
    resolveRendererPathMock: vi.fn(() => ({ staticRoot: '/mock/root', indexHtml: '/mock/root/index.html' })),
    initWebAdapterMock: vi.fn(),
    extractWebSocketTokenMock: vi.fn(),
    extractExplicitWebSocketTokenMock: vi.fn(),
    validateWebSocketTokenMock: vi.fn(),
    generateRandomPasswordMock: vi.fn(() => 'GeneratedPass123'),
    hashPasswordMock: vi.fn(async () => 'hashed-password'),
    getSystemUserMock: vi.fn(),
    findByUsernameMock: vi.fn(),
    setSystemUserCredentialsMock: vi.fn(async () => {}),
    updatePasswordMock: vi.fn(async () => {}),
    createUserMock: vi.fn(async () => {}),
  };
});

vi.mock('express', () => ({
  // express() builds the app (now registers a webhook route directly via
  // app.post + express.raw()); express.raw/json/... are static body-parser
  // factories. Give the app the chainable route methods the server uses.
  default: Object.assign(
    vi.fn(() => ({
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      set: vi.fn(),
      listen: vi.fn(),
    })),
    {
      raw: vi.fn(() => vi.fn()),
      json: vi.fn(() => vi.fn()),
      urlencoded: vi.fn(() => vi.fn()),
      static: vi.fn(() => vi.fn()),
    }
  ),
}));

vi.mock('http', () => ({
  createServer: (...args: Parameters<typeof createServerMock>) => createServerMock(...args),
}));

vi.mock('net', () => ({
  default: { connect: netConnectMock },
}));

vi.mock('ws', () => ({
  WebSocketServer: webSocketServerMock,
}));

vi.mock('@process/webserver/setup', () => ({
  getCanonicalRequestOrigin: getCanonicalRequestOriginMock,
  getConfiguredOrigins: getConfiguredOriginsMock,
  getSingleRequestHeaderValue: getSingleRequestHeaderValueMock,
  hasRequestHeader: hasRequestHeaderMock,
  isRequestOriginTrusted: isRequestOriginTrustedMock,
  setupBasicMiddleware: setupBasicMiddlewareMock,
  setupCors: setupCorsMock,
  setupErrorHandler: setupErrorHandlerMock,
  setupTrustProxy: setupTrustProxyMock,
}));

vi.mock('@process/webserver/routes/authRoutes', () => ({
  registerAuthRoutes: registerAuthRoutesMock,
}));

vi.mock('@process/webserver/routes/apiRoutes', () => ({
  registerApiRoutes: registerApiRoutesMock,
}));

vi.mock('@process/webserver/routes/staticRoutes', () => ({
  registerStaticRoutes: registerStaticRoutesMock,
  resolveRendererPath: resolveRendererPathMock,
  VITE_DEV_PORT: 5173,
}));

vi.mock('@process/webserver/adapter', () => ({
  initWebAdapter: initWebAdapterMock,
}));

vi.mock('@process/bridge/webuiQR', () => ({
  generateQRLoginUrlDirect: vi.fn(() => ({ qrUrl: 'http://localhost:3000/qr' })),
}));

vi.mock('@process/webserver/auth/service/AuthService', () => ({
  AuthService: {
    generateRandomPassword: generateRandomPasswordMock,
    hashPassword: hashPasswordMock,
    hydrateBlacklist: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@process/webserver/auth/middleware/TokenMiddleware', () => ({
  TokenMiddleware: {
    extractExplicitWebSocketToken: extractExplicitWebSocketTokenMock,
    extractWebSocketToken: extractWebSocketTokenMock,
    validateWebSocketToken: validateWebSocketTokenMock,
  },
}));

vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: {
    getSystemUser: getSystemUserMock,
    findByUsername: findByUsernameMock,
    setSystemUserCredentials: setSystemUserCredentialsMock,
    updatePassword: updatePasswordMock,
    createUser: createUserMock,
  },
}));

vi.mock('@process/bridge/lanAddress', () => ({
  getLanIP: vi.fn(() => null),
}));

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'system_default_user',
    username: 'system_default_user',
    password_hash: '',
    jwt_secret: null,
    created_at: 0,
    updated_at: 0,
    last_login: null,
    ...overrides,
  };
}

type UpgradeHeaderValue = string | string[] | undefined;

type UpgradeRequestDouble = {
  headers: Record<string, UpgradeHeaderValue>;
  httpVersion: string;
  method: string;
  rawHeaders?: string[];
  socket: { remoteAddress?: string };
  url: string;
};

type UpgradeSocketDouble = {
  destroyed: boolean;
  destroy: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  pipe: ReturnType<typeof vi.fn>;
  writable: boolean;
  write: ReturnType<typeof vi.fn>;
};

function makeUpgradeRequest(
  headers: Record<string, UpgradeHeaderValue> = {},
  remoteAddress = '127.0.0.1',
  rawHeaders?: string[]
): UpgradeRequestDouble {
  return {
    headers,
    httpVersion: '1.1',
    method: 'GET',
    rawHeaders,
    socket: { remoteAddress },
    url: '/',
  };
}

function makeViteUpgradeRequest(
  protocol: string,
  origin: string,
  remoteAddress: string,
  url: string,
  method = 'GET'
): UpgradeRequestDouble {
  const req = makeUpgradeRequest({ origin, 'sec-websocket-protocol': protocol }, remoteAddress);
  req.method = method;
  req.url = url;
  return req;
}

function makeUpgradeSocket(): UpgradeSocketDouble {
  const socket: UpgradeSocketDouble = {
    destroyed: false,
    destroy: vi.fn(),
    on: vi.fn(),
    pipe: vi.fn(),
    writable: true,
    write: vi.fn(),
  };
  socket.destroy.mockImplementation(() => {
    socket.destroyed = true;
    socket.writable = false;
  });
  return socket;
}

function canonicalOriginFromRequest(req: UpgradeRequestDouble): string | null {
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || origin === '' || origin.includes(',')) return null;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.origin !== origin || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    return origin;
  } catch {
    return null;
  }
}

async function startServerAndGetUpgradeListener(devMode = false) {
  getSystemUserMock.mockResolvedValue(makeUser({ username: 'alice', password_hash: 'existing-hash' }));
  findByUsernameMock.mockResolvedValue(null);
  resolveRendererPathMock.mockReturnValue(
    devMode ? null : { staticRoot: '/mock/root', indexHtml: '/mock/root/index.html' }
  );

  const { startWebServerWithInstance } = await import('@process/webserver/index');
  await startWebServerWithInstance(3000, false);
  expect(serverState.upgradeListener).toBeTypeOf('function');
  return serverState.upgradeListener!;
}

async function runUpgrade(
  listener: NonNullable<typeof serverState.upgradeListener>,
  req: UpgradeRequestDouble,
  socket = makeUpgradeSocket()
): Promise<UpgradeSocketDouble> {
  await listener(req, socket, Buffer.alloc(0));
  return socket;
}

function expectUpgradeRejected(socket: UpgradeSocketDouble, status: 401 | 403): void {
  const reason = status === 403 ? 'Forbidden' : 'Unauthorized';
  expect(socket.write).toHaveBeenCalledWith(
    `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
  );
  expect(socket.destroy).toHaveBeenCalledOnce();
  expect(handleUpgradeMock).not.toHaveBeenCalled();
}

describe('startWebServerWithInstance default admin initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    serverState.upgradeListener = undefined;
    getConfiguredOriginsMock.mockReturnValue(new Set(['http://localhost:3000', 'http://127.0.0.1:3000']));
    getCanonicalRequestOriginMock.mockImplementation((req: UpgradeRequestDouble) => canonicalOriginFromRequest(req));
    getSingleRequestHeaderValueMock.mockImplementation((req: UpgradeRequestDouble, headerName: string) => {
      const value = req.headers[headerName];
      if (typeof value !== 'string' || value === '' || value !== value.trim() || value.includes(',')) return null;
      return value;
    });
    hasRequestHeaderMock.mockImplementation(
      (req: UpgradeRequestDouble, headerName: string) => req.headers[headerName] !== undefined
    );
    isRequestOriginTrustedMock.mockImplementation(
      (req: UpgradeRequestDouble, allowedOrigins: Set<string>) =>
        canonicalOriginFromRequest(req) !== null && allowedOrigins.has(canonicalOriginFromRequest(req)!)
    );
    resolveRendererPathMock.mockReturnValue({ staticRoot: '/mock/root', indexHtml: '/mock/root/index.html' });
    extractWebSocketTokenMock.mockReturnValue(null);
    extractExplicitWebSocketTokenMock.mockReturnValue(null);
    validateWebSocketTokenMock.mockResolvedValue(true);
    handleUpgradeMock.mockImplementation(() => {});
    netConnectMock.mockReturnValue(viteSocketMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps a custom system username when repairing a missing password', async () => {
    getSystemUserMock.mockResolvedValue(makeUser({ username: 'alice', password_hash: '' }));
    findByUsernameMock.mockResolvedValue(null);

    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(3000, false);

    expect(setSystemUserCredentialsMock).toHaveBeenCalledWith('alice', 'hashed-password');
    expect(updatePasswordMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it('repairs the placeholder system user with the default admin username', async () => {
    getSystemUserMock.mockResolvedValue(makeUser());
    findByUsernameMock.mockResolvedValue(null);

    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(3000, false);

    expect(setSystemUserCredentialsMock).toHaveBeenCalledWith('admin', 'hashed-password');
    expect(updatePasswordMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it('falls back to the default admin username when the system username is empty', async () => {
    getSystemUserMock.mockResolvedValue(makeUser({ username: '' }));
    findByUsernameMock.mockResolvedValue(null);

    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(3000, false);

    expect(setSystemUserCredentialsMock).toHaveBeenCalledWith('admin', 'hashed-password');
    expect(updatePasswordMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it('skips reinitialization when the custom system user already has credentials', async () => {
    getSystemUserMock.mockResolvedValue(makeUser({ username: 'alice', password_hash: 'existing-hash' }));
    findByUsernameMock.mockResolvedValue(null);

    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(3000, true);

    expect(generateRandomPasswordMock).not.toHaveBeenCalled();
    expect(hashPasswordMock).not.toHaveBeenCalled();
    expect(setSystemUserCredentialsMock).not.toHaveBeenCalled();
    expect(updatePasswordMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
    expect(setupCorsMock).toHaveBeenCalledWith(expect.anything(), 3000, true);
  });

  it('falls back to the legacy admin row without rewriting the placeholder user', async () => {
    getSystemUserMock.mockResolvedValue(makeUser());
    findByUsernameMock.mockResolvedValue(
      makeUser({
        id: 'user_legacy_admin',
        username: 'admin',
        password_hash: 'legacy-hash',
      })
    );

    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(3000, false);

    expect(generateRandomPasswordMock).not.toHaveBeenCalled();
    expect(setSystemUserCredentialsMock).not.toHaveBeenCalled();
    expect(updatePasswordMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
    expect(initWebAdapterMock).toHaveBeenCalled();
  });

  it('repairs a legacy admin row when no system user exists', async () => {
    getSystemUserMock.mockResolvedValue(null);
    findByUsernameMock.mockResolvedValue(
      makeUser({
        id: 'legacy-admin',
        username: 'admin',
        password_hash: '',
      })
    );

    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(3000, false);

    expect(setSystemUserCredentialsMock).not.toHaveBeenCalled();
    expect(updatePasswordMock).toHaveBeenCalledWith('legacy-admin', 'hashed-password');
    expect(createUserMock).not.toHaveBeenCalled();
  });
});

describe('startWebServerWithInstance WebSocket pre-upgrade policy', () => {
  const savedNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
    serverState.upgradeListener = undefined;
    getConfiguredOriginsMock.mockReturnValue(new Set(['http://localhost:3000', 'http://127.0.0.1:3000']));
    getCanonicalRequestOriginMock.mockImplementation((req: UpgradeRequestDouble) => canonicalOriginFromRequest(req));
    getSingleRequestHeaderValueMock.mockImplementation((req: UpgradeRequestDouble, headerName: string) => {
      const value = req.headers[headerName];
      if (typeof value !== 'string' || value === '' || value !== value.trim() || value.includes(',')) return null;
      return value;
    });
    hasRequestHeaderMock.mockImplementation(
      (req: UpgradeRequestDouble, headerName: string) => req.headers[headerName] !== undefined
    );
    isRequestOriginTrustedMock.mockImplementation(
      (req: UpgradeRequestDouble, allowedOrigins: Set<string>) =>
        canonicalOriginFromRequest(req) !== null && allowedOrigins.has(canonicalOriginFromRequest(req)!)
    );
    resolveRendererPathMock.mockReturnValue({ staticRoot: '/mock/root', indexHtml: '/mock/root/index.html' });
    extractWebSocketTokenMock.mockReturnValue(null);
    extractExplicitWebSocketTokenMock.mockReturnValue(null);
    validateWebSocketTokenMock.mockResolvedValue(true);
    handleUpgradeMock.mockImplementation(() => {});
    netConnectMock.mockReturnValue(viteSocketMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedNodeEnv;
    vi.restoreAllMocks();
  });

  it('validates a trusted browser session cookie before upgrading', async () => {
    extractWebSocketTokenMock.mockReturnValue('session-token');
    const listener = await startServerAndGetUpgradeListener();
    const req = makeUpgradeRequest({
      cookie: 'wayland-session=session-token',
      origin: 'http://localhost:3000',
    });

    await runUpgrade(listener, req);

    expect(extractWebSocketTokenMock).toHaveBeenCalledWith(req);
    expect(extractExplicitWebSocketTokenMock).not.toHaveBeenCalled();
    expect(validateWebSocketTokenMock).toHaveBeenCalledWith('session-token');
    expect(handleUpgradeMock).toHaveBeenCalledOnce();
  });

  it.each([
    ['missing', undefined],
    ['foreign', 'https://foreign.example'],
    ['opaque', 'null'],
    ['empty', ''],
    ['malformed', 'not-an-origin'],
    ['repeated', ['http://localhost:3000', 'http://localhost:3000']],
  ])('rejects a cookie-authenticated request with a %s Origin', async (_label, origin) => {
    const listener = await startServerAndGetUpgradeListener();
    const headers: Record<string, UpgradeHeaderValue> = { cookie: 'wayland-session=session-token' };
    if (origin !== undefined) headers.origin = origin;

    const socket = await runUpgrade(listener, makeUpgradeRequest(headers));

    expectUpgradeRejected(socket, 403);
    expect(validateWebSocketTokenMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty Cookie plus bearer token', '', { authorization: 'Bearer explicit-token' }],
    [
      'a session Cookie plus token subprotocol',
      'wayland-session=session-token',
      { 'sec-websocket-protocol': 'explicit-token' },
    ],
    [
      'a session Cookie plus valid-looking token subprotocol',
      'wayland-session=session-token',
      { 'sec-websocket-protocol': 'header.payload.signature' },
    ],
  ])('rejects an Origin-less request carrying %s', async (_label, cookie, otherHeaders) => {
    extractExplicitWebSocketTokenMock.mockReturnValue('explicit-token');
    const listener = await startServerAndGetUpgradeListener();
    const socket = await runUpgrade(listener, makeUpgradeRequest({ cookie, ...otherHeaders }));

    expectUpgradeRejected(socket, 403);
    expect(extractExplicitWebSocketTokenMock).not.toHaveBeenCalled();
    expect(validateWebSocketTokenMock).not.toHaveBeenCalled();
  });

  it.each([
    ['bearer', { authorization: 'Bearer bearer-token' }, 'bearer-token'],
    ['subprotocol', { 'sec-websocket-protocol': 'paired-device-token' }, 'paired-device-token'],
  ])('validates the exact Origin-less %s credential before upgrading', async (_label, headers, token) => {
    extractExplicitWebSocketTokenMock.mockReturnValue(token);
    const listener = await startServerAndGetUpgradeListener();
    const req = makeUpgradeRequest(headers);

    await runUpgrade(listener, req);

    expect(extractExplicitWebSocketTokenMock).toHaveBeenCalledWith(req);
    expect(extractWebSocketTokenMock).not.toHaveBeenCalled();
    expect(validateWebSocketTokenMock).toHaveBeenCalledWith(token);
    expect(handleUpgradeMock).toHaveBeenCalledOnce();
  });

  it('returns a minimal 401 response when an Origin-less request has no explicit credential', async () => {
    const listener = await startServerAndGetUpgradeListener();
    const socket = await runUpgrade(listener, makeUpgradeRequest());

    expectUpgradeRejected(socket, 401);
    const response = String(socket.write.mock.calls[0]?.[0]);
    expect(response).not.toContain('token');
    expect(response).not.toContain('validation');
  });

  it('returns 401 and destroys the socket when token validation rejects', async () => {
    extractExplicitWebSocketTokenMock.mockReturnValue('rejected-token');
    validateWebSocketTokenMock.mockResolvedValue(false);
    const listener = await startServerAndGetUpgradeListener();

    const socket = await runUpgrade(listener, makeUpgradeRequest({ authorization: 'Bearer rejected-token' }));

    expectUpgradeRejected(socket, 401);
    expect(validateWebSocketTokenMock).toHaveBeenCalledWith('rejected-token');
  });

  it('returns 401 and destroys the socket when token validation throws', async () => {
    extractExplicitWebSocketTokenMock.mockReturnValue('throwing-token');
    validateWebSocketTokenMock.mockRejectedValue(new Error('sensitive validation detail'));
    const listener = await startServerAndGetUpgradeListener();

    const socket = await runUpgrade(listener, makeUpgradeRequest({ authorization: 'Bearer throwing-token' }));

    expectUpgradeRejected(socket, 401);
    expect(String(socket.write.mock.calls[0]?.[0])).not.toContain('sensitive validation detail');
  });

  it('destroys the socket even when writing the rejection response throws', async () => {
    const listener = await startServerAndGetUpgradeListener();
    const socket = makeUpgradeSocket();
    socket.write.mockImplementation(() => {
      throw new Error('write failed');
    });

    await runUpgrade(listener, makeUpgradeRequest(), socket);

    expect(socket.destroy).toHaveBeenCalledOnce();
    expect(handleUpgradeMock).not.toHaveBeenCalled();
  });

  it('waits for token validation to finish before calling handleUpgrade', async () => {
    let resolveValidation!: (valid: boolean) => void;
    const validation = new Promise<boolean>((resolve) => {
      resolveValidation = resolve;
    });
    extractExplicitWebSocketTokenMock.mockReturnValue('pending-token');
    validateWebSocketTokenMock.mockReturnValue(validation);
    const listener = await startServerAndGetUpgradeListener();

    const pendingUpgrade = runUpgrade(listener, makeUpgradeRequest({ authorization: 'Bearer pending-token' }));
    expect(validateWebSocketTokenMock).toHaveBeenCalledWith('pending-token');
    expect(handleUpgradeMock).not.toHaveBeenCalled();

    resolveValidation(true);
    await pendingUpgrade;
    expect(handleUpgradeMock).toHaveBeenCalledOnce();
  });

  it('does not upgrade a socket that closes during asynchronous validation', async () => {
    let resolveValidation!: (valid: boolean) => void;
    const validation = new Promise<boolean>((resolve) => {
      resolveValidation = resolve;
    });
    extractExplicitWebSocketTokenMock.mockReturnValue('pending-token');
    validateWebSocketTokenMock.mockReturnValue(validation);
    const listener = await startServerAndGetUpgradeListener();
    const socket = makeUpgradeSocket();

    const pendingUpgrade = runUpgrade(listener, makeUpgradeRequest({ authorization: 'Bearer pending-token' }), socket);
    expect(validateWebSocketTokenMock).toHaveBeenCalledOnce();
    socket.destroyed = true;
    socket.writable = false;
    resolveValidation(true);
    await pendingUpgrade;

    expect(handleUpgradeMock).not.toHaveBeenCalled();
  });

  it.each([
    ['vite-hmr', 'http://localhost:5173', '127.0.0.1', '/?token=vite-client-token'],
    ['vite-ping', 'http://127.0.0.1:5173', '::ffff:127.0.0.1', '/'],
    ['vite-hmr', 'http://[::1]:5173', '::1', '/?token=ipv6-vite-token'],
  ])('tunnels exact local development %s handshakes', async (protocol, origin, remoteAddress, url) => {
    const listener = await startServerAndGetUpgradeListener(true);

    await runUpgrade(listener, makeViteUpgradeRequest(protocol, origin, remoteAddress, url));

    expect(netConnectMock).toHaveBeenCalledWith(5173, 'localhost', expect.any(Function));
    expect(handleUpgradeMock).not.toHaveBeenCalled();
  });

  it('does not tunnel when built renderer assets are missing outside explicit development mode', async () => {
    process.env.NODE_ENV = 'production';
    const listener = await startServerAndGetUpgradeListener(true);

    const socket = await runUpgrade(
      listener,
      makeViteUpgradeRequest('vite-hmr', 'http://localhost:5173', '127.0.0.1', '/?token=vite-client-token')
    );

    expect(netConnectMock).not.toHaveBeenCalled();
    expectUpgradeRejected(socket, 403);
  });

  it.each([
    ['a non-GET method', 'vite-hmr', '/?token=vite-client-token', 'POST'],
    ['a non-root pathname', 'vite-hmr', '/hmr?token=vite-client-token', 'GET'],
    ['a missing HMR token', 'vite-hmr', '/', 'GET'],
    ['an empty HMR token', 'vite-hmr', '/?token=', 'GET'],
    ['a repeated HMR token', 'vite-hmr', '/?token=first&token=second', 'GET'],
    ['an extra HMR query key', 'vite-hmr', '/?token=vite-client-token&extra=value', 'GET'],
    ['a ping carrying an HMR token', 'vite-ping', '/?token=vite-client-token', 'GET'],
    ['a ping on a non-root pathname', 'vite-ping', '/ping', 'GET'],
  ])('does not enter the Vite tunnel for %s', async (_label, protocol, url, method) => {
    const listener = await startServerAndGetUpgradeListener(true);

    const socket = await runUpgrade(
      listener,
      makeViteUpgradeRequest(protocol, 'http://localhost:5173', '127.0.0.1', url, method)
    );

    expect(netConnectMock).not.toHaveBeenCalled();
    expectUpgradeRejected(socket, 403);
  });

  it.each([
    ['mixed HMR and token protocols', true, '127.0.0.1', 'http://localhost:5173', 'vite-hmr, paired-device-token'],
    ['a foreign Origin', true, '127.0.0.1', 'https://foreign.example', 'vite-hmr'],
    ['a non-loopback peer', true, '203.0.113.7', 'http://localhost:5173', 'vite-hmr'],
    ['built renderer assets', false, '127.0.0.1', 'http://localhost:5173', 'vite-hmr'],
  ])('does not enter the Vite tunnel for %s', async (_label, devMode, remoteAddress, origin, protocol) => {
    const listener = await startServerAndGetUpgradeListener(devMode);

    const socket = await runUpgrade(
      listener,
      makeViteUpgradeRequest(protocol, origin, remoteAddress, '/?token=vite-client-token')
    );

    expect(netConnectMock).not.toHaveBeenCalled();
    expectUpgradeRejected(socket, 403);
  });
});
