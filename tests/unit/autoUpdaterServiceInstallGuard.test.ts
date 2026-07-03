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

  it('writes a pending-install marker on quitAndInstall after a download', () => {
    service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
    service.quitAndInstall();

    expect(fs.existsSync(markerPath())).toBe(true);
    expect(JSON.parse(fs.readFileSync(markerPath(), 'utf8')).version).toBe('2.0.0');
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
  });

  it('does not write a marker if nothing was downloaded', () => {
    service.quitAndInstall();
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

  // #575: a bundle ShipIt can't apply in place must never auto-install on quit,
  // or ShipIt relaunches the old version → re-stages → endless respawn loop
  // (Dock spam + focus theft). The loop-breaker is autoInstallOnAppQuit=false
  // the moment any block/apply-failure is detected.
  describe('autoInstallOnAppQuit loop-breaker (#575)', () => {
    it('constructor leaves autoInstallOnAppQuit enabled (normal auto-update default)', () => {
      // freshService() re-ran the constructor in beforeEach.
      expect(autoUpdater.autoInstallOnAppQuit).toBe(true);
    });

    it('macOS block (outside /Applications) → autoInstallOnAppQuit disabled', () => {
      setPlatform('darwin');
      (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(false);

      service.triggerEventForTest('update-available', { version: '2.0.0' });

      expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
    });

    it('happy path (macOS inside /Applications, no block) → autoInstallOnAppQuit stays true', () => {
      setPlatform('darwin');
      (app.isInApplicationsFolder as ReturnType<typeof vi.fn>).mockReturnValue(true);

      service.triggerEventForTest('update-available', { version: '2.0.0' });

      expect(lastStatus().status).toBe('available');
      expect(autoUpdater.autoInstallOnAppQuit).toBe(true);
    });

    it('non-macOS offer → autoInstallOnAppQuit stays true (loop is macOS-only)', () => {
      setPlatform('win32');
      service.triggerEventForTest('update-available', { version: '2.0.0' });

      expect(lastStatus().status).toBe('available');
      expect(autoUpdater.autoInstallOnAppQuit).toBe(true);
    });

    it('silent apply failure on reconcile → autoInstallOnAppQuit disabled at startup', () => {
      fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
      (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');

      service.reconcilePendingInstall();

      expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
    });

    it('successful reconcile (version advanced) → autoInstallOnAppQuit stays true', () => {
      fs.writeFileSync(markerPath(), JSON.stringify({ version: '1.0.0', attemptedAt: 1 }));
      (app.getVersion as ReturnType<typeof vi.fn>).mockReturnValue('1.0.0');

      service.reconcilePendingInstall();

      expect(autoUpdater.autoInstallOnAppQuit).toBe(true);
    });

    it('re-offer of a silently-failed version → autoInstallOnAppQuit disabled', () => {
      fs.writeFileSync(markerPath(), JSON.stringify({ version: '2.0.0', attemptedAt: 1 }));
      service.reconcilePendingInstall();
      // reconcile already disabled it; re-enable to prove the re-offer path also disables.
      autoUpdater.autoInstallOnAppQuit = true;

      service.triggerEventForTest('update-available', { version: '2.0.0' });

      expect(lastStatus().status).toBe('install-failed');
      expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
    });
  });
});
