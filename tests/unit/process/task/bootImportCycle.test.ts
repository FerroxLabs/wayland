/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Main-process boot regression. cronServiceSingleton constructs
 * `new WorkerTaskManagerJobExecutor(workerTaskManager, ...)` at module level, and
 * workerTaskManagerSingleton -> AcpAgentManager -> MessageMiddleware closes a
 * cycle back to it. Whichever module the bundle enters first decides whether
 * `workerTaskManager` is initialised when that constructor runs; once the Core
 * managers were deleted the bundle entered via MessageMiddleware and every dev
 * boot died with "Cannot access 'workerTaskManager' before initialization".
 *
 * Reproduces the fatal order: enter at workerTaskManagerSingleton (the way the
 * bundle did), whose import of AcpAgentManager reached MessageMiddleware and,
 * through its static import, cronServiceSingleton - which then read the
 * still-uninitialised `workerTaskManager`. That static edge is now a lazy
 * import, so the singleton is only constructed once the cycle has unwound.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/wayland-boot-cycle-test', isPackaged: false, getVersion: () => '0.0.0', on: () => {} },
  ipcMain: { handle: () => {}, on: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
  safeStorage: { isEncryptionAvailable: () => false },
  shell: {},
  dialog: {},
  net: {},
}));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn(async () => ({})) }));

describe('main-process import cycle: workerTaskManagerSingleton entered first', () => {
  it('the cron executor holds the real worker task manager, not a half-initialised hole', async () => {
    const { workerTaskManager } = await import('@process/task/workerTaskManagerSingleton');
    const { cronService } = await import('@process/services/cron/cronServiceSingleton');

    // Under the bundler the cycle throws (TDZ on the `const`); under vite-node
    // the half-initialised module hands back `undefined` instead. Either way
    // the executor must have been built with the real singleton, not a hole.
    const executor = (cronService as unknown as { executor: { taskManager: unknown } }).executor;
    expect(executor.taskManager).toBe(workerTaskManager);
    expect(workerTaskManager).toBeDefined();
  });
});
