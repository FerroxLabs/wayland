/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Main-process boot regression. `src/process/utils/initBridge.ts` registers
 * every IPC handler as a module side effect (`initAllBridges(...)`), and the
 * ONLY thing that loads it on the boot path is a bare import in
 * `src/process/index.ts`. #1277 folded that bare import into the Nano
 * activation import; deleting Nano deleted the import, and the app booted a
 * window with no IPC handlers ("No handler registered for 'onboarding:detect'",
 * "No chat history" with eleven chats in the database). The full unit suite was
 * green because nothing exercised the boot graph.
 *
 * initBridge itself constructs production services at load (it needs the
 * bundled Constitution FS binary), so it is replaced here; what this pins is
 * the module-graph edge: loading the process entry must load initBridge.
 */
import { describe, expect, it, vi } from 'vitest';

const { initBridgeLoaded } = vi.hoisted(() => ({ initBridgeLoaded: vi.fn() }));

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/wayland-boot-bridges-test',
    isPackaged: false,
    getVersion: () => '0.0.0',
    getName: () => 'Wayland-Test',
    setName: () => {},
    setPath: () => {},
    on: () => {},
    whenReady: () => new Promise(() => {}),
    commandLine: { appendSwitch: () => {}, hasSwitch: () => false },
  },
  ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
  safeStorage: { isEncryptionAvailable: () => false },
  shell: {},
  dialog: {},
  net: {},
  powerMonitor: { on: () => {} },
  nativeTheme: { on: () => {} },
}));
vi.mock('@process/utils/initBridge', () => {
  initBridgeLoaded();
  return {};
});

describe('main-process entry loads the IPC bridge module', () => {
  it('importing src/process/index.ts loads initBridge (the side-effect that registers every handler)', async () => {
    await import('@process/index');
    expect(initBridgeLoaded).toHaveBeenCalledTimes(1);
  });
});
