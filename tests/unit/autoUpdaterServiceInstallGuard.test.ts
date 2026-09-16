/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Defensive coverage for #286: surface a silent macOS install failure
 * (downloaded + attempted but version unchanged) and guard against offering an
 * in-place update the app can't apply (running outside /Applications), instead
 * of silently re-offering forever.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let userDataDir: string;

vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events');
  return {
    app: Object.assign(new EventEmitter(), {
      getVersion: vi.fn(() => '1.0.0'),
      getPath: vi.fn(() => userDataDir),
      isInApplicationsFolder: vi.fn(() => true),
      isPackaged: true,
      exit: vi.fn(),
      hide: vi.fn(),
    }),
  };
});

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
    // MacUpdater state: whether Squirrel.Mac already holds the update.
    squirrelDownloadedUpdate: false,
  },
}));

/** Let pending promise continuations run. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

// These tests fake process.platform, and atomicWrite picks its flush flags from
// the fake: on a Windows host the POSIX O_RDONLY fsync and the directory fsync
// both fail with EPERM, the marker write is swallowed, and the marker
// assertions fail. Plain writes here; atomic durability has its own tests
// under tests/unit/process/utils/.
vi.mock('@process/utils/atomicWrite', async () => {
  const fs = await import('node:fs');
  return {
    writeFileSyncAtomic: (target: string, data: string | Buffer, opts?: fs.WriteFileOptions) =>
      fs.writeFileSync(target, data, opts),
  };
});

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

function markerPath(): string {
  return path.join(userDataDir, 'pending-update.json');
}

async function freshService() {
  vi.resetModules();
  const mod = await import('@/process/services/autoUpdaterService');
  return mod.autoUpdaterService;
}

describe('autoUpdaterService install guard (#286)', () => {
  let service: any;
  let broadcast: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-updater-'));
    (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');
    (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (autoUpdater as unknown as { squirrelDownloadedUpdate: boolean }).squirrelDownloadedUpdate = false;
    broadcast = vi.fn();
    service = await freshService();
    service.initialize(broadcast);
  });

  afterEach(() => {
    service?.resetForTest();
    setPlatform(realPlatform);
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  function lastStatus() {
    return broadcast.mock.calls.at(-1)?.[0];
  }
  function statuses() {
    return broadcast.mock.calls.map((c) => c[0].status);
  }

  it('writes a pending-install marker on quitAndInstall after a download', async () => {
    setPlatform('linux');
    service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
    await service.quitAndInstall();

    expect(fs.existsSync(markerPath())).toBe(true);
    expect(JSON.parse(fs.readFileSync(markerPath(), 'utf8')).version).toBe('2.0.0');
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
  });

  it('does not write a marker if nothing was downloaded', async () => {
    setPlatform('linux');
    await service.quitAndInstall();
    expect(fs.existsSync(markerPath())).toBe(false);
  });

  it('reconcile: version advanced → success, marker removed, no failure surfaced', () => {
    fs.writeFileSync(markerPath(), JSON.stringify({ version: '1.0.0', attemptedAt: 1 }));
    (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');

    service.reconcilePendingInstall();

    expect(fs.existsSync(markerPath())).toBe(false);
    expect(statuses()).not.toContain('install-failed');
  });

  it('reconcile: version did NOT advance → install-failed surfaced + marker removed', () => {
    fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
    (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');

    service.reconcilePendingInstall();

    expect(fs.existsSync(markerPath())).toBe(false);
    const s = lastStatus();
    expect(s.status).toBe('install-failed');
    expect(s.reason).toBe('silent-noop');
    expect(s.version).toBe('2.0.0');
    expect(s.error).toMatch(/manually/i);
  });

  it('Windows silent-noop failure names the actual blocker: administrator approval (#492)', () => {
    setPlatform('win32');
    fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
    (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');

    service.reconcilePendingInstall();

    const s = lastStatus();
    expect(s.status).toBe('install-failed');
    expect(s.reason).toBe('silent-noop');
    expect(s.error).toMatch(/administrator/i);
  });

  it('suppresses a re-offer of the version whose install silently failed', () => {
    fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
    service.reconcilePendingInstall();
    broadcast.mockClear();

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    const s = lastStatus();
    expect(s.status).toBe('install-failed');
    expect(s.reason).toBe('silent-noop');
    expect(statuses()).not.toContain('available');
  });

  it('still offers a genuinely newer version after a prior failure', () => {
    fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
    service.reconcilePendingInstall();
    broadcast.mockClear();

    service.triggerEventForTest('update-available', { version: '3.0.0' });

    expect(lastStatus().status).toBe('available');
  });

  it('macOS outside /Applications → install-failed (not-in-applications), not an offer', () => {
    setPlatform('darwin');
    (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(false);

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    const s = lastStatus();
    expect(s.status).toBe('install-failed');
    expect(s.reason).toBe('not-in-applications');
    expect(s.error).toMatch(/Applications/);
    expect(statuses()).not.toContain('available');
  });

  it('macOS inside /Applications → normal offer', () => {
    setPlatform('darwin');
    (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(true);

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    expect(lastStatus().status).toBe('available');
  });

  it('non-macOS never runs the Applications guard', () => {
    setPlatform('win32');
    service.triggerEventForTest('update-available', { version: '2.0.0' });
    expect(lastStatus().status).toBe('available');
    expect(app.isInApplicationsFolder).not.toHaveBeenCalled();
  });

  // #575: a bundle ShipIt can't apply in place must never install on quit, or
  // ShipIt relaunches the old version → re-stages → endless respawn loop (Dock
  // spam + focus theft). Since #651/#632 disables electron-updater's own
  // autoInstallOnAppQuit and drives the on-quit install explicitly via
  // installOnQuitIfReady(), the loop-breaker is now: installOnQuitIfReady()
  // REFUSES to install (returns false, no quitAndInstall) the moment any
  // block/apply-failure is detected, and only installs a safe, staged update.
  describe('on-quit install safety (#575/#651)', () => {
    it('constructor disables electron-updater autoInstallOnAppQuit (we drive it explicitly)', () => {
      // freshService() re-ran the constructor in beforeEach.
      expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
    });

    it('macOS block (outside /Applications) → refuses on-quit install even with a staged download', async () => {
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
      setPlatform('darwin');
      (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(false);
      service.triggerEventForTest('update-available', { version: '3.0.0' });

      await expect(service.installOnQuitIfReady()).resolves.toBe(false);
      expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    });

    it('happy path (macOS inside /Applications, no block) → installs the staged update on quit', async () => {
      setPlatform('darwin');
      (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(true);
      service.triggerEventForTest('update-available', { version: '2.0.0' });
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
      // Squirrel.Mac already holds it (the wait for it is covered in
      // autoUpdaterServiceSquirrelHandoff.test.ts); Squirrel then asks to quit.
      (autoUpdater as unknown as { squirrelDownloadedUpdate: boolean }).squirrelDownloadedUpdate = true;

      const result = service.installOnQuitIfReady();
      await flush();
      (app as unknown as NodeJS.EventEmitter).emit('before-quit');
      await expect(result).resolves.toBe(true);
      expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
    });

    it('non-macOS offer → installs the staged update on quit (loop is macOS-only)', async () => {
      setPlatform('win32');
      service.triggerEventForTest('update-available', { version: '2.0.0' });
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });

      await expect(service.installOnQuitIfReady()).resolves.toBe(true);
      expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
    });

    it('silent apply failure on reconcile → refuses on-quit install', async () => {
      fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
      (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');
      service.reconcilePendingInstall();
      // Even if a download is later staged, the sticky block wins.
      service.triggerEventForTest('update-downloaded', { version: '3.0.0' });

      await expect(service.installOnQuitIfReady()).resolves.toBe(false);
      expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    });

    it('successful reconcile (version advanced) → still installs a safe staged update on quit', async () => {
      setPlatform('linux');
      fs.writeFileSync(markerPath(), JSON.stringify({ version: '1.0.0', attemptedAt: 1 }));
      (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');
      service.reconcilePendingInstall();
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });

      await expect(service.installOnQuitIfReady()).resolves.toBe(true);
      expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
    });

    it('re-offer of a silently-failed version → refuses on-quit install', async () => {
      fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
      service.reconcilePendingInstall();
      service.triggerEventForTest('update-available', { version: '2.0.0' });
      service.triggerEventForTest('update-downloaded', { version: '2.0.0' });

      expect(lastStatus().status).not.toBe('available');
      await expect(service.installOnQuitIfReady()).resolves.toBe(false);
      expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    });
  });
});
