/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the `pathHealthy` field computed in `getIjfwUpdateStatus` (#179).
 *
 * pathHealthy must be:
 *   - true  when detectedVia='directory', even if cliOnPath is undefined
 *   - true  when detectedVia='symlink',   even if cliOnPath is undefined
 *   - true  when cliOnPath=true  (any detectedVia)
 *   - false when detectedVia='none' / not installed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IjfwDetectionResult } from '@process/services/ijfwSystemService';

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
    isPackaged: false,
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

const detectLocalInstallMock = vi.fn<[], Promise<IjfwDetectionResult>>();

vi.mock('@/process/services/ijfwSystemService', () => ({
  ijfwSystemService: {
    detectLocalInstall: detectLocalInstallMock,
    getLatestPublished: vi.fn(async () => '1.6.0'),
  },
}));

const makeDetectionResult = (overrides: Partial<IjfwDetectionResult>): IjfwDetectionResult => ({
  installed: false,
  detectedVia: 'none',
  pathProbe: { homebrew: false, usrLocal: false, standardPath: false },
  ...overrides,
});

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

const getPathHealthy = async (detection: IjfwDetectionResult): Promise<boolean> => {
  detectLocalInstallMock.mockResolvedValueOnce(detection);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  );
  try {
    const handler = await getCheckHandler();
    const result = await handler({ includePrerelease: false });
    if (!result.success || !result.data?.ijfw) throw new Error('handler returned no ijfw data');
    return result.data.ijfw.pathHealthy ?? false;
  } finally {
    vi.unstubAllGlobals();
  }
};

describe('updateBridge pathHealthy (#179)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is true for a directory install even when cliOnPath is undefined', async () => {
    const healthy = await getPathHealthy(
      makeDetectionResult({
        installed: true,
        detectedVia: 'directory',
        mcpServerPath: '/home/user/.ijfw/mcp-server',
        version: '1.5.4',
        // cliOnPath intentionally absent
      })
    );
    expect(healthy).toBe(true);
  });

  it('is true for a symlink install even when cliOnPath is undefined', async () => {
    const healthy = await getPathHealthy(
      makeDetectionResult({
        installed: true,
        detectedVia: 'symlink',
        mcpServerPath: '/home/user/.ijfw/mcp-server',
        version: '1.5.4',
        // cliOnPath intentionally absent
      })
    );
    expect(healthy).toBe(true);
  });

  it('is true for a cli-only install (cliOnPath=true)', async () => {
    const healthy = await getPathHealthy(
      makeDetectionResult({
        installed: true,
        detectedVia: 'cli',
        cliOnPath: true,
      })
    );
    expect(healthy).toBe(true);
  });

  it('is false when not installed (detectedVia=none)', async () => {
    const healthy = await getPathHealthy(
      makeDetectionResult({
        installed: false,
        detectedVia: 'none',
      })
    );
    expect(healthy).toBe(false);
  });
});
