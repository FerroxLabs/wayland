/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Update-on-quiesce quit-path coverage (#651/#632): electron-updater's own
 * install-on-quit is disabled and the install is driven explicitly, non-force,
 * as the last step of before-quit — but only when a download is staged AND it is
 * safe to apply (the #575/#286 block still wins).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let userDataDir: string;

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn(() => userDataDir),
    isInApplicationsFolder: vi.fn(() => true),
    isPackaged: true,
    exit: vi.fn(),
  },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    logger: null,
    autoDownload: true,
    autoInstallOnAppQuit: true,
    allowPrerelease: false,
    allowDowngrade: false,
    channel: null,
    on: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
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

import { app } from 'electron';
import { autoUpdater } from 'electron-updater';

const realPlatform = process.platform;
function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

async function freshService() {
  vi.resetModules();
  const mod = await import('@/process/services/autoUpdaterService');
  return mod.autoUpdaterService;
}

describe('autoUpdaterService update-on-quiesce (#651)', () => {
  let service: any;
  let broadcast: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-quiesce-'));
    autoUpdater.autoInstallOnAppQuit = true; // reset shared mock before ctor runs
    service = await freshService();
    broadcast = vi.fn();
    service.initialize(broadcast);
  });

  afterEach(() => {
    service?.resetForTest();
    setPlatform(realPlatform);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('disables electron-updater autoInstallOnAppQuit (we drive it in before-quit)', () => {
    expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
  });

  it('notifyDeferred broadcasts a deferred status carrying the downloaded version', () => {
    service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
    broadcast.mockClear();
    service.notifyDeferred();
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ status: 'deferred', version: '2.0.0' }));
  });

  describe('installOnQuitIfReady', () => {
    it('is a no-op when nothing was downloaded', () => {
      expect(service.installOnQuitIfReady()).toBe(false);
      expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    });

    it('installs and relaunches when a download is staged and safe', () => {
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
      const result = service.installOnQuitIfReady();
      expect(result).toBe(true);
      // isSilent=true, isForceRunAfter=true — install on quit AND relaunch,
      // matching the "Install and restart" promise (#651, 0.11.15).
      expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
      // No force-exit timer: we are already quitting.
      expect(app.exit).not.toHaveBeenCalled();
    });

    it('refuses to install when the staged update is blocked (macOS outside /Applications, #575)', () => {
      // Stage a download first.
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
      // Now a later check finds an update but the app is not in /Applications:
      // the block path disables install-on-quit.
      setPlatform('darwin');
      vi.mocked(app.isInApplicationsFolder!).mockReturnValue(false);
      service.triggerEventForTest('update-available', { version: '3.0.0' });

      const result = service.installOnQuitIfReady();
      expect(result).toBe(false);
      expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    });
  });
});
