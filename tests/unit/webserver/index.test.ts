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
  webSocketServerMock,
  setupBasicMiddlewareMock,
  setupCorsMock,
  setupErrorHandlerMock,
  setupTrustProxyMock,
  registerAuthRoutesMock,
  registerApiRoutesMock,
  registerStaticRoutesMock,
  initWebAdapterMock,
  generateRandomPasswordMock,
  hashPasswordMock,
  getSystemUserMock,
  findByUsernameMock,
  setSystemUserCredentialsMock,
  updatePasswordMock,
  createUserMock,
} = vi.hoisted(() => {
  const server = {
    listen: vi.fn(),
    on: vi.fn(),
    close: vi.fn(),
  };

  server.listen.mockImplementation((_port: number, _host: string, callback?: () => void) => {
    callback?.();
    return server;
  });
  server.on.mockImplementation(() => server);

  return {
    createServerMock: vi.fn(() => server),
    webSocketServerMock: vi.fn(function MockWebSocketServer() {
      return {};
    }),
    setupBasicMiddlewareMock: vi.fn(),
    setupCorsMock: vi.fn(),
    setupErrorHandlerMock: vi.fn(),
    setupTrustProxyMock: vi.fn(),
    registerAuthRoutesMock: vi.fn(),
    registerApiRoutesMock: vi.fn(),
    registerStaticRoutesMock: vi.fn(),
    initWebAdapterMock: vi.fn(),
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

vi.mock('ws', () => ({
  WebSocketServer: webSocketServerMock,
}));

vi.mock('@process/webserver/setup', () => ({
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
  resolveRendererPath: vi.fn(() => ({ staticRoot: '/mock/root', indexHtml: '/mock/root/index.html' })),
  VITE_DEV_PORT: 5173,
}));

vi.mock('@process/webserver/adapter', () => ({
  initWebAdapter: initWebAdapterMock,
}));

const showNotificationMock = vi.fn(async () => {});
vi.mock('@process/bridge/notificationBridge', () => ({
  showNotification: (...a: unknown[]) => showNotificationMock(...a),
}));

vi.mock('@process/services/i18n', () => ({
  default: {
    // Mirror i18next: return the key, with {{url}} interpolated, so the test can assert
    // the URL actually reaches the user without depending on real translations.
    t: (key: string, opts?: { url?: string }) => (opts?.url ? `${key}|${opts.url}` : key),
  },
}));

vi.mock('@process/bridge/lanAddress', () => ({
  getLanIP: () => '192.168.1.42',
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

vi.mock('@process/webserver/auth/repository/UserRepository', () => ({
  UserRepository: {
    getSystemUser: getSystemUserMock,
    findByUsername: findByUsernameMock,
    setSystemUserCredentials: setSystemUserCredentialsMock,
    updatePassword: updatePasswordMock,
    createUser: createUserMock,
  },
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

describe('startWebServerWithInstance default admin initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
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

/**
 * #722: a LAN-exposed WebUI must announce itself.
 *
 * The notice lives here, at the bind, and NOT in the settings toggle or the
 * preference-restore path - because those are only two of the doors. `resolveRemoteAccess`
 * also arms 0.0.0.0 from WAYLAND_ALLOW_REMOTE / WAYLAND_HOST / --remote / webui.config.json,
 * and the desktop preference itself is writable over the config-storage bridge (which is
 * NOT remote-denied). Every one of those paths ends up in server.listen(), so this is the
 * only place a "you are exposed" guarantee can actually hold.
 */
describe('#722: every LAN bind announces itself', () => {
  let priorDisplay: string | undefined;

  beforeEach(() => {
    // getServerIP() treats Linux-without-DISPLAY as headless and makes a REAL HTTPS call
    // to api.ipify.org for a public IP. That is live on an ubuntu CI runner (and dead on
    // a mac), so the URL under assertion would differ by platform. Pin the desktop branch
    // so this test measures OUR announcement, not the runner's network.
    priorDisplay = process.env.DISPLAY;
    process.env.DISPLAY = ':0';

    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getSystemUserMock.mockResolvedValue(makeUser({ password_hash: 'already-set' }));
    findByUsernameMock.mockResolvedValue(null);
  });

  afterEach(() => {
    if (priorDisplay === undefined) delete process.env.DISPLAY;
    else process.env.DISPLAY = priorDisplay;
    vi.restoreAllMocks();
  });

  it('notifies the user, naming the LAN URL, when the server binds 0.0.0.0', async () => {
    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(25808, true);
    await vi.waitFor(() => expect(showNotificationMock).toHaveBeenCalledTimes(1));

    const { title, body } = showNotificationMock.mock.calls[0][0] as { title: string; body: string };
    expect(title).toBe('settings.webui.lanExposureNoticeTitle');
    // Translated, not hardcoded English - and carrying the real address.
    expect(body).toBe('settings.webui.lanExposureNoticeBody|http://192.168.1.42:25808');
  });

  it('also warns on the console, the only channel a headless bind has', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(25808, true);

    expect(warn.mock.calls.some((c) => String(c[0]).includes('SECURITY'))).toBe(true);
  });

  it('says NOTHING for a localhost-only bind — that exposes no one', async () => {
    const { startWebServerWithInstance } = await import('@process/webserver/index');

    await startWebServerWithInstance(25808, false);
    await new Promise((r) => setTimeout(r, 20));

    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  it('a failed notice must NOT take the server down with it', async () => {
    showNotificationMock.mockRejectedValueOnce(new Error('notifications unavailable'));
    const { startWebServerWithInstance } = await import('@process/webserver/index');

    // The listener is already up by this point. A warning that fails to render must not
    // look like a failed start, or we would trade a missing notice for a broken WebUI.
    const instance = await startWebServerWithInstance(25808, true);
    expect(instance.port).toBe(25808);
    expect(instance.allowRemote).toBe(true);
  });
});
