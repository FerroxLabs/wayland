/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// #651 FIX-FIRST regression guard: the manual "Install" (non-force) path must
// route the actual install through Electron app.quit() — so the 12-step
// before-quit drain runs and installOnQuitIfReady() applies the update as the
// LAST step — and must NEVER call autoUpdaterService.quitAndInstall() directly,
// whose hard app.exit(0) would bypass the drain and orphan child processes /
// drop unflushed writes right after the busy flag clears (the #651 bug class).
// force:true is the one path that keeps the raw hard-exit (user-accepted).

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the registered ipcBridge providers so we can invoke the quitAndInstall
// handler directly (same buildProvider mock as the other updateBridge tests).
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
    buildEmitter: vi.fn(() => ({ emit: vi.fn(), on: vi.fn() })),
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
    quit: vi.fn(),
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn(() => '/tmp'),
    isPackaged: true,
  },
}));

vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/process/services/ijfwSystemService', () => ({
  ijfwSystemService: {
    detectLocalInstall: vi.fn(async () => ({ installed: false, detectedVia: 'none' })),
    getLatestPublished: vi.fn(async () => null),
  },
}));

// The raw auto-updater service — its quitAndInstall() is the hard-exit path that
// the non-force route must NOT touch.
const svc = vi.hoisted(() => ({ quitAndInstall: vi.fn(), notifyDeferred: vi.fn() }));
vi.mock('@/process/services/autoUpdaterService', () => ({ autoUpdaterService: svc }));

// Controllable update.deferWhileBusy for the REAL updateQuiesceGate.
let deferSetting: boolean | undefined;
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => (key === 'update.deferWhileBusy' ? deferSetting : undefined)),
    set: vi.fn(async () => {}),
  },
}));

import { app } from 'electron';
import { cronBusyGuard } from '@/process/services/cron/CronBusyGuard';
import { __resetForTest } from '@/process/services/updateQuiesceGate';
import { initUpdateBridge } from '@process/bridge/updateBridge';
import { ipcBridge } from '@/common';

// A deferred install fires on the next macrotask after the app goes idle (#651).
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const getQuitHandler = (): ((params?: { force?: boolean }) => Promise<void>) => {
  const provider = vi.mocked(ipcBridge.autoUpdate.quitAndInstall.provider);
  const call = provider.mock.calls.at(-1);
  if (!call) throw new Error('quitAndInstall handler not registered');
  return call[0] as (params?: { force?: boolean }) => Promise<void>;
};

describe('updateBridge quitAndInstall routing (#651 FIX-FIRST)', () => {
  beforeEach(() => {
    deferSetting = undefined; // default → defer while busy
    cronBusyGuard.clear();
    __resetForTest();
    vi.clearAllMocks();
    initUpdateBridge(); // re-register providers after clearAllMocks
  });

  it('force:true installs immediately via the raw hard-exit, not app.quit', async () => {
    const handler = getQuitHandler();
    await handler({ force: true });
    expect(svc.quitAndInstall).toHaveBeenCalledTimes(1);
    expect(app.quit).not.toHaveBeenCalled();
  });

  it('idle non-force routes through app.quit (before-quit drain), never the hard-exit', async () => {
    const handler = getQuitHandler();
    await handler(undefined);
    expect(app.quit).toHaveBeenCalledTimes(1);
    expect(svc.quitAndInstall).not.toHaveBeenCalled();
  });

  it('deferred-then-idle installs via app.quit on idle, never the hard-exit (the fixed bug)', async () => {
    cronBusyGuard.setProcessing('chat', true);
    const handler = getQuitHandler();
    await handler(undefined);

    // Deferred: nothing installed yet, work is NOT killed, user is notified.
    expect(app.quit).not.toHaveBeenCalled();
    expect(svc.quitAndInstall).not.toHaveBeenCalled();
    expect(svc.notifyDeferred).toHaveBeenCalledTimes(1);

    // Work finishes → the deferred install fires through the drain path
    // (app.quit → before-quit → installOnQuitIfReady), NOT the hard exit.
    cronBusyGuard.setProcessing('chat', false);
    await flush();
    expect(app.quit).toHaveBeenCalledTimes(1);
    expect(svc.quitAndInstall).not.toHaveBeenCalled();
  });
});
