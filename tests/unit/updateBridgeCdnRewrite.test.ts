/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@office-ai/platform', () => ({
  bridge: {
    buildProvider: vi.fn(() => {
      const handlerMap = new Map<string, Function>();
      return {
        provider: vi.fn((handler: Function) => {
          handlerMap.set('handler', handler);
          return vi.fn();
        }),
        invoke: vi.fn(),
        _getHandler: () => handlerMap.get('handler'),
      };
    }),
    buildEmitter: vi.fn(() => ({
      emit: vi.fn(),
      on: vi.fn(),
    })),
  },
  storage: {
    buildStorage: () => ({
      getSync: () => undefined,
      setSync: () => {},
      get: () => Promise.resolve(undefined),
      set: () => Promise.resolve(),
    }),
  },
}));

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn(() => '/test/path'),
    isPackaged: true,
  },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    logger: null,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    allowPrerelease: false,
    allowDowngrade: false,
    on: vi.fn(),
    removeListener: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    checkForUpdatesAndNotify: vi.fn(),
  },
}));

vi.mock('electron-log', () => ({
  default: {
    transports: { file: { level: 'info' } },
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/process/services/ijfwSystemService', () => ({
  ijfwSystemService: {
    detectLocalInstall: vi.fn(async () => ({
      installed: true,
      version: '1.5.6',
      mcpServerPath: '/Users/test/.ijfw/mcp-server',
      detectedVia: 'directory',
      pathProbe: { homebrew: false, usrLocal: false, standardPath: false },
    })),
    getLatestPublished: vi.fn(async () => '1.6.0'),
  },
}));

const makeGitHubReleaseResponse = () => [
  {
    tag_name: 'v1.9.22',
    name: 'v1.9.22',
    body: 'release notes',
    html_url: 'https://github.com/FerroxLabs/wayland/releases/tag/v1.9.22',
    published_at: '2026-04-29T00:00:00Z',
    prerelease: false,
    draft: false,
    assets: [
      {
        name: 'Wayland-1.9.22-mac-arm64.dmg',
        browser_download_url:
          'https://github.com/FerroxLabs/wayland/releases/download/v1.9.22/Wayland-1.9.22-mac-arm64.dmg',
        size: 123,
        content_type: 'application/x-apple-diskimage',
      },
      {
        name: 'Wayland-1.9.22-win-x64.exe',
        browser_download_url:
          'https://github.com/FerroxLabs/wayland/releases/download/v1.9.22/Wayland-1.9.22-win-x64.exe',
        size: 456,
        content_type: 'application/vnd.microsoft.portable-executable',
      },
      {
        name: 'Wayland-1.9.22-linux-amd64.deb',
        browser_download_url:
          'https://github.com/FerroxLabs/wayland/releases/download/v1.9.22/Wayland-1.9.22-linux-amd64.deb',
        size: 789,
      },
    ],
  },
];

const getCheckHandler = async () => {
  vi.resetModules();
  const { initUpdateBridge } = await import('@process/bridge/updateBridge');
  const { ipcBridge } = await import('@/common');

  initUpdateBridge();

  const provider = vi.mocked(ipcBridge.update.check.provider);
  const lastCall = provider.mock.calls.at(-1);
  if (!lastCall) throw new Error('update.check handler not registered');
  return lastCall[0];
};

describe('updateBridge GitHub asset URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the GitHub release download URL directly for asset.url (no CDN rewrite)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeGitHubReleaseResponse(),
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const handler = await getCheckHandler();
      const result = await handler({ repo: 'FerroxLabs/wayland' });

      expect(result.success).toBe(true);
      expect(result.data?.ijfw).toMatchObject({
        installed: true,
        currentVersion: '1.5.6',
        latestVersion: '1.6.0',
        updateAvailable: true,
        // #179: a directory install is healthy (cliOnPath need not be separately set).
        pathHealthy: true,
      });
      const assets = result.data?.latest?.assets ?? [];
      expect(assets.length).toBe(3);

      const macGithubUrl =
        'https://github.com/FerroxLabs/wayland/releases/download/v1.9.22/Wayland-1.9.22-mac-arm64.dmg';
      const macAsset = assets.find((a: { name: string }) => a.name === 'Wayland-1.9.22-mac-arm64.dmg');
      expect(macAsset).toBeDefined();
      expect(macAsset?.url).toBe(macGithubUrl);
      expect(macAsset?.fallbackUrl).toBe(macGithubUrl);

      const linuxAsset = assets.find((a: { name: string }) => a.name === 'Wayland-1.9.22-linux-amd64.deb');
      expect(linuxAsset?.url).toBe(
        'https://github.com/FerroxLabs/wayland/releases/download/v1.9.22/Wayland-1.9.22-linux-amd64.deb'
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('updateBridge download allowlist', () => {
  it('accepts github.com release URLs for download', async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-length': '0' }),
      body: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
        }),
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const { initUpdateBridge } = await import('@process/bridge/updateBridge');
      const { ipcBridge } = await import('@/common');

      initUpdateBridge();

      const provider = vi.mocked(ipcBridge.update.download.provider);
      const lastCall = provider.mock.calls.at(-1);
      if (!lastCall) throw new Error('update.download handler not registered');
      const handler = lastCall[0];

      // UPD-02: the secure download path requires `tagName` so the downloaded
      // bytes can be sha512-verified against the signed GitHub release metadata
      // before the file is openable. Without it the handler fails closed.
      const result = await handler({
        url: 'https://github.com/FerroxLabs/wayland/releases/download/v1.9.22/Wayland-1.9.22-mac-arm64.dmg',
        fileName: 'Wayland-1.9.22-mac-arm64.dmg',
        tagName: 'v1.9.22',
        repo: 'FerroxLabs/wayland',
      });

      expect(result.success).toBe(true);
      expect(result.data?.downloadId).toBeTruthy();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('rejects non-allowlisted hosts', async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const { initUpdateBridge } = await import('@process/bridge/updateBridge');
    const { ipcBridge } = await import('@/common');

    initUpdateBridge();

    const provider = vi.mocked(ipcBridge.update.download.provider);
    const lastCall = provider.mock.calls.at(-1);
    if (!lastCall) throw new Error('update.download handler not registered');
    const handler = lastCall[0];

    const result = await handler({
      url: 'https://evil.example.com/fake.dmg',
      fileName: 'fake.dmg',
    });

    // Download is refused before any network I/O; exact error text comes from i18n and isn't asserted here.
    expect(result.success).toBe(false);
  });
});
