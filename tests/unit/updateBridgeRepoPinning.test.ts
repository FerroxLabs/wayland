/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// RT-B6-04: a renderer-supplied `repo` (or WAYLAND_GITHUB_REPO in a packaged
// build) must NOT redirect the update-metadata / integrity-verification source.
// The repo used for the GitHub API calls that yield the signed SHA-512 metadata
// must stay pinned to the canonical build-time constant.

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
      installed: false,
      detectedVia: 'none',
      pathProbe: { homebrew: false, usrLocal: false, standardPath: false },
    })),
    getLatestPublished: vi.fn(async () => '1.6.0'),
  },
}));

const CANONICAL_REPO = 'FerroxLabs/wayland';

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

/** Extract every distinct GitHub API repo slug the handler fetched. */
const githubReposHit = (fetchMock: ReturnType<typeof vi.fn>): string[] => {
  const slugs = new Set<string>();
  for (const call of fetchMock.mock.calls) {
    const url = String(call[0]);
    const m = url.match(/^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\//);
    if (m) slugs.add(m[1]);
  }
  return [...slugs];
};

describe('updateBridge RT-B6-04 repo pinning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WAYLAND_GITHUB_REPO;
  });

  it('ignores a renderer-supplied repo and queries the canonical repo for update metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const handler = await getCheckHandler();
      const result = await handler({ repo: 'attacker/evil', includePrerelease: false });

      expect(result.success).toBe(true);

      const repos = githubReposHit(fetchMock);
      expect(repos).toEqual([CANONICAL_REPO]);
      expect(repos).not.toContain('attacker/evil');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ignores WAYLAND_GITHUB_REPO in a packaged build', async () => {
    process.env.WAYLAND_GITHUB_REPO = 'attacker/evil';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const handler = await getCheckHandler();
      await handler({ includePrerelease: false });

      const repos = githubReposHit(fetchMock);
      expect(repos).toEqual([CANONICAL_REPO]);
    } finally {
      vi.unstubAllGlobals();
      delete process.env.WAYLAND_GITHUB_REPO;
    }
  });
});
