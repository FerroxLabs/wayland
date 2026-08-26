/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #492 — Windows per-machine install cannot auto-update without admin.
 *
 * Wayland installs per-machine (UPD-04), so applying an update writes to
 * %ProgramFiles% and needs administrator rights. electron-updater launches the
 * installer through elevate.exe, which raises UAC. For an administrator that is
 * a consent prompt they can approve. For a standard account it is a *credential*
 * prompt they can never satisfy: the install no-ops, the version never advances,
 * and the same doomed update is re-offered on every launch.
 *
 * These tests pin the behaviour that ends that loop: when elevation is known to
 * be unavailable, the app says so up front (instead of burning a download on an
 * install that cannot succeed), and it never hands an unelevatable install to an
 * unattended on-quit apply. When elevation IS available, or the capability is
 * unknown, nothing changes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { WindowsElevationCapability } from '@/process/services/windowsUpdateElevation';

let userDataDir: string;
let capability: WindowsElevationCapability = 'unknown';

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

vi.mock('@/process/services/windowsUpdateElevation', () => ({
  assessWindowsElevation: vi.fn(() => capability),
  defaultWindowsElevationIO: vi.fn(() => ({
    platform: 'win32',
    installDir: 'C:\\Program Files\\Wayland',
    canWriteDir: () => false,
    readCurrentUserGroups: () => null,
  })),
}));

import { autoUpdater } from 'electron-updater';
import { assessWindowsElevation } from '@/process/services/windowsUpdateElevation';

const realPlatform = process.platform;
function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

async function freshService() {
  vi.resetModules();
  const mod = await import('@/process/services/autoUpdaterService');
  return mod.autoUpdaterService;
}

describe('autoUpdaterService Windows elevation guard (#492)', () => {
  let service: any;
  let broadcast: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    capability = 'unknown';
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-winelev-'));
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

  it('standard account on a per-machine install → needs-admin instead of a doomed offer', () => {
    setPlatform('win32');
    capability = 'unavailable';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    const s = lastStatus();
    expect(s.status).toBe('install-failed');
    expect(s.reason).toBe('needs-admin');
    expect(s.version).toBe('2.0.0');
    expect(statuses()).not.toContain('available');
  });

  it('the needs-admin message names administrator rights and gives a route', () => {
    setPlatform('win32');
    capability = 'unavailable';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    const message: string = lastStatus().error;
    expect(message).toMatch(/administrator/i);
    // It must not claim the user did something wrong (declined a prompt); a
    // standard account never gets a prompt it can approve in the first place.
    expect(message).not.toMatch(/declined/i);
  });

  it('an administrator still gets a normal offer (UAC consent is answerable)', () => {
    setPlatform('win32');
    capability = 'available';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    expect(lastStatus().status).toBe('available');
  });

  it('a per-user install needs no elevation and gets a normal offer', () => {
    setPlatform('win32');
    capability = 'not-required';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    expect(lastStatus().status).toBe('available');
  });

  it('an undeterminable capability changes nothing (offer as before)', () => {
    setPlatform('win32');
    capability = 'unknown';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    expect(lastStatus().status).toBe('available');
  });

  it('never consults the Windows probe on macOS', () => {
    setPlatform('darwin');
    capability = 'unavailable';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    expect(lastStatus().status).toBe('available');
    expect(assessWindowsElevation).not.toHaveBeenCalled();
  });

  it('never consults the Windows probe on Linux', () => {
    setPlatform('linux');
    capability = 'unavailable';

    service.triggerEventForTest('update-available', { version: '2.0.0' });

    expect(lastStatus().status).toBe('available');
    expect(assessWindowsElevation).not.toHaveBeenCalled();
  });

  it('probes at most once per session (the write probe touches disk)', () => {
    setPlatform('win32');
    capability = 'available';

    service.triggerEventForTest('update-available', { version: '2.0.0' });
    service.triggerEventForTest('update-available', { version: '3.0.0' });

    expect(assessWindowsElevation).toHaveBeenCalledTimes(1);
  });

  it('refuses the unattended on-quit apply when elevation is unavailable', () => {
    setPlatform('win32');
    capability = 'unavailable';

    service.triggerEventForTest('update-downloaded', { version: '2.0.0' });

    expect(service.installOnQuitIfReady()).toBe(false);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
  });

  it('still applies a staged update on quit when elevation is available', () => {
    setPlatform('win32');
    capability = 'available';

    service.triggerEventForTest('update-downloaded', { version: '2.0.0' });

    expect(service.installOnQuitIfReady()).toBe(true);
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
  });
});
