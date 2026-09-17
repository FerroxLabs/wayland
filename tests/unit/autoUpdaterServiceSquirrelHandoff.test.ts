/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * macOS auto-update never installed: the quit raced Squirrel.Mac.
 *
 * Wayland sets electron-updater's autoInstallOnAppQuit to false (#651), and with
 * that flag MacUpdater never asks Squirrel.Mac to fetch the downloaded zip at
 * download time. Squirrel is only asked inside quitAndInstall(), and it has to
 * re-read the whole zip from MacUpdater's loopback proxy, unpack it and verify
 * it before a quit can install anything. The install path then let the process
 * exit within ~150 ms (0.12.16 log: quit at 23:43:42.005, Squirrel's zip request
 * at 23:43:42.037), killing the transfer. ShipIt never launched and every Mac
 * update ended in the #286 "silently failed" report.
 *
 * These tests pin the ordering: no quitAndInstall and no exit until Squirrel
 * holds the update, a bounded wait, and a failure the user can see.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
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

vi.mock('electron-updater', async () => {
  const { EventEmitter } = await import('node:events');
  const nativeUpdater = Object.assign(new EventEmitter(), { checkForUpdates: vi.fn() });
  const autoUpdater = {
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
    nativeUpdater,
    squirrelDownloadedUpdate: false,
  };
  // Mirrors MacUpdater's constructor: Squirrel's update-downloaded flips the flag,
  // and this listener is registered before anything the service adds.
  nativeUpdater.on('update-downloaded', () => {
    autoUpdater.squirrelDownloadedUpdate = true;
  });
  return { autoUpdater };
});

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
import log from 'electron-log';
import { SQUIRREL_HANDOFF_TIMEOUT_MS, SQUIRREL_RELAUNCH_TIMEOUT_MS } from '@/process/services/autoUpdaterService';

type MockNative = EventEmitter & { checkForUpdates: ReturnType<typeof vi.fn> };
const mac = autoUpdater as unknown as { nativeUpdater: MockNative; squirrelDownloadedUpdate: boolean };
const native = mac.nativeUpdater;
const appEmitter = app as unknown as EventEmitter;

const realPlatform = process.platform;
function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

/** Let pending promise continuations run (setImmediate is not faked below). */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

async function freshService() {
  vi.resetModules();
  const mod = await import('@/process/services/autoUpdaterService');
  return mod.autoUpdaterService;
}

describe('macOS install waits for Squirrel.Mac to hold the update', () => {
  let service: any;
  let broadcast: ReturnType<typeof vi.fn>;
  /** squirrelDownloadedUpdate as MacUpdater.quitAndInstall() would see it, per call. */
  let squirrelReadyAtQuitAndInstall: boolean[];

  const markerPath = () => path.join(userDataDir, 'pending-update.json');

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    setPlatform('darwin');
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-squirrel-'));
    mac.squirrelDownloadedUpdate = false;
    squirrelReadyAtQuitAndInstall = [];
    vi.mocked(autoUpdater.quitAndInstall).mockImplementation(() => {
      squirrelReadyAtQuitAndInstall.push(mac.squirrelDownloadedUpdate);
    });
    vi.mocked(app.isInApplicationsFolder!).mockReturnValue(true);
    service = await freshService();
    broadcast = vi.fn();
    service.initialize(broadcast);
    // electron-updater has the zip and its proxy is serving it: the state the
    // 0.12.16 log was in at "Update downloaded".
    service.triggerEventForTest('update-downloaded', { version: '2.0.0' });
  });

  afterEach(() => {
    service?.resetForTest();
    vi.useRealTimers();
    setPlatform(realPlatform);
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  it('on-quit install neither calls quitAndInstall nor lets the quit continue until Squirrel holds the update', async () => {
    const settled = vi.fn();
    void Promise.resolve(service.installOnQuitIfReady()).then(settled);
    await flush();

    // Squirrel was asked to take the update, and the quit is held open for it.
    expect(native.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    expect(settled).not.toHaveBeenCalled();
    expect(app.hide).toHaveBeenCalled();

    native.emit('update-downloaded');
    await flush();

    // quitAndInstall ran only once MacUpdater takes its "Squirrel already has it" branch.
    expect(squirrelReadyAtQuitAndInstall).toEqual([true]);
    // Still held: Squirrel has not yet written the relaunch request and asked to quit.
    expect(settled).not.toHaveBeenCalled();

    appEmitter.emit('before-quit');
    await flush();
    expect(settled).toHaveBeenCalledWith(true);

    // Nothing the service attached is left behind.
    expect(native.listenerCount('update-downloaded')).toBe(1);
    expect(native.listenerCount('update-not-available')).toBe(0);
    expect(native.listenerCount('error')).toBe(0);
    expect(appEmitter.listenerCount('before-quit')).toBe(0);
  });

  it('on-quit install quits without installing when Squirrel errors, and leaves the #286 marker for next launch', async () => {
    const result = service.installOnQuitIfReady();
    await flush();
    native.emit('error', new Error('Code signature did not pass validation'));

    await expect(result).resolves.toBe(false);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    expect(JSON.parse(fs.readFileSync(markerPath(), 'utf8')).version).toBe('2.0.0');
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('Code signature did not pass validation'));
  });

  it('on-quit install gives up after the time limit instead of holding the quit open forever', async () => {
    const settled = vi.fn();
    void service.installOnQuitIfReady().then(settled);
    await flush();

    vi.advanceTimersByTime(SQUIRREL_HANDOFF_TIMEOUT_MS - 1);
    await flush();
    expect(settled).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await flush();
    expect(settled).toHaveBeenCalledWith(false);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
  });

  it('quits anyway if Squirrel never asks to relaunch after taking the update', async () => {
    mac.squirrelDownloadedUpdate = true;
    const settled = vi.fn();
    void service.installOnQuitIfReady().then(settled);
    await flush();
    expect(squirrelReadyAtQuitAndInstall).toEqual([true]);
    expect(settled).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SQUIRREL_RELAUNCH_TIMEOUT_MS);
    await flush();
    expect(settled).toHaveBeenCalledWith(true);
    expect(appEmitter.listenerCount('before-quit')).toBe(0);
  });

  it('"Install now anyway" does not call quitAndInstall or arm the force-exit until Squirrel holds the update', async () => {
    const done = service.quitAndInstall();
    await flush();
    expect(native.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(app.exit).not.toHaveBeenCalled();

    native.emit('update-downloaded');
    await flush();
    expect(squirrelReadyAtQuitAndInstall).toEqual([true]);
    appEmitter.emit('before-quit');
    await done;

    expect(app.exit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(app.exit).toHaveBeenCalledWith(0);
  });

  it('the Install button keeps the app running and says why when Squirrel fails', async () => {
    const ready = service.prepareInstall();
    await flush();
    native.emit('error', new Error('Squirrel exploded'));

    await expect(ready).resolves.toBe(false);
    expect(broadcast).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'install-failed',
        version: '2.0.0',
        error: expect.stringContaining('Squirrel exploded'),
      })
    );
    // Nothing was attempted, so there is nothing for the next launch to reconcile.
    expect(fs.existsSync(markerPath())).toBe(false);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
  });

  it('Squirrel reporting no update is a failure, not a wait for the time limit', async () => {
    const ready = service.prepareInstall();
    await flush();
    native.emit('update-not-available');
    await expect(ready).resolves.toBe(false);
  });

  it('an Install click followed by Cmd+Q asks Squirrel once and both complete', async () => {
    const ready = service.prepareInstall();
    const onQuit = service.installOnQuitIfReady();
    await flush();
    expect(native.checkForUpdates).toHaveBeenCalledTimes(1);

    native.emit('update-downloaded');
    await expect(ready).resolves.toBe(true);
    await flush();
    appEmitter.emit('before-quit');
    await expect(onQuit).resolves.toBe(true);
    expect(squirrelReadyAtQuitAndInstall).toEqual([true]);
  });

  it('does not re-ask Squirrel when it already holds the update', async () => {
    mac.squirrelDownloadedUpdate = true;
    await expect(service.prepareInstall()).resolves.toBe(true);
    expect(native.checkForUpdates).not.toHaveBeenCalled();
  });

  it('the #575 block still wins: a blocked update is never handed to Squirrel', async () => {
    vi.mocked(app.isInApplicationsFolder!).mockReturnValue(false);
    service.triggerEventForTest('update-available', { version: '3.0.0' });

    await expect(service.installOnQuitIfReady()).resolves.toBe(false);
    expect(native.checkForUpdates).not.toHaveBeenCalled();
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
  });
});

describe('electron-updater MacUpdater still behaves the way the macOS install path assumes', () => {
  const require = createRequire(import.meta.url);
  const source = fs.readFileSync(
    path.join(path.dirname(require.resolve('electron-updater/package.json')), 'out', 'MacUpdater.js'),
    'utf8'
  );

  it('exposes the Squirrel.Mac updater and flips squirrelDownloadedUpdate on its update-downloaded', () => {
    expect(source).toContain('this.nativeUpdater = require("electron").autoUpdater');
    expect(source).toMatch(
      /nativeUpdater\.on\("update-downloaded", \(\) => \{\s*this\.squirrelDownloadedUpdate = true;/
    );
  });

  it('only asks Squirrel to fetch at download time when autoInstallOnAppQuit is true (the root cause)', () => {
    expect(source).toMatch(/if \(this\.autoInstallOnAppQuit\) \{[^}]*this\.nativeUpdater\.checkForUpdates\(\);/);
  });

  it('quitAndInstall installs immediately only when Squirrel already holds the update', () => {
    expect(source).toMatch(/quitAndInstall\(\) \{\s*if \(this\.squirrelDownloadedUpdate\) \{/);
  });
});
