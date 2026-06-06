/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// All fixture paths must live under an authorized confinement root (the OS temp
// dir) so the SEC-IPC-07 path-confinement in startWatch accepts them. Paths
// outside every authorized root are refused (see the dedicated assertion below).
const ROOT = os.tmpdir();
const F = (name: string) => path.join(ROOT, name);

// --- Mocks (vi.hoisted so factories can reference them) ---

const { startHandler, stopHandler, statusEmitMock, spawnMock, installOfficecliMock, fakePort } = vi.hoisted(() => ({
  startHandler: { fn: undefined as ((...args: any[]) => any) | undefined },
  stopHandler: { fn: undefined as ((...args: any[]) => any) | undefined },
  statusEmitMock: vi.fn(),
  spawnMock: vi.fn(),
  installOfficecliMock: vi.fn(),
  fakePort: { value: 55555 },
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: vi.fn(() => '/tmp') },
}));

vi.mock('../../src/common', () => ({
  ipcBridge: {
    pptPreview: {
      start: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          startHandler.fn = fn;
        }),
      },
      stop: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          stopHandler.fn = fn;
        }),
      },
      status: {
        emit: statusEmitMock,
      },
    },
  },
}));

vi.mock('node:child_process', () => ({
  spawn: (...args: any[]) => spawnMock(...args),
}));

// Mock net - findFreePort and waitForPort both use this
vi.mock('node:net', () => ({
  default: {
    createServer: () => {
      const server = {
        listen: (_port: number, _host: string, cb: () => void) => {
          queueMicrotask(cb);
        },
        address: () => ({ port: fakePort.value }),
        close: (cb: () => void) => cb(),
        on: () => server,
      };
      return server;
    },
    connect: (_port: number, _host: string) => {
      const emitter = new EventEmitter();
      queueMicrotask(() => emitter.emit('connect'));
      return Object.assign(emitter, { destroy: () => {} });
    },
  },
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({ PATH: '/usr/bin' })),
}));

// pathConfinement reads its authorized roots from these path getters (which in
// the real app go through the platform-services layer registered at startup, but
// are not registered in unit tests). Point them at the OS temp dir so the
// fixtures under ROOT are confined-in, while arbitrary paths stay refused. The
// real confinePath is exercised (not mocked) so the security contract is tested.
vi.mock('@process/utils', () => ({
  getTempPath: () => os.tmpdir(),
  getConfigPath: () => path.join(os.tmpdir(), 'wayland-config'),
  getDataPath: () => path.join(os.tmpdir(), 'wayland-data'),
}));

// confinePath falls back to DB-discovered workspace roots on a miss; stub an
// empty conversation set so discovery is a no-op (no real DB in unit tests).
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({
    getUserConversations: () => ({ data: [], hasMore: false }),
  })),
}));

// The officecli auto-install path (consent dialog + pinned/checksummed remote
// script) is unit-tested in its own module. Here we mock it so the bridge's
// ENOENT-retry/decline behaviour can be driven deterministically.
vi.mock('../../src/process/bridge/officecliInstaller', () => ({
  installOfficecli: (...args: any[]) => installOfficecliMock(...args),
}));

// --- Helpers ---

function createMockChildProcess() {
  const emitter = new EventEmitter();
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  return Object.assign(emitter, {
    stdout,
    stderr,
    kill: vi.fn(),
    exitCode: null as number | null,
    pid: 12345,
  });
}

/** Flush the macrotask queue once so pending promises settle */
function flush() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

/**
 * Wait until spawnMock has been called. confinePath performs several async hops
 * (realpath walk, optional DB discovery) before spawn, so a single flush can
 * race the spawn; poll until the child process has actually been spawned.
 */
async function waitForSpawn(target: number) {
  for (let i = 0; i < 50 && spawnMock.mock.calls.length < target; i++) {
    await flush();
  }
}

/** Wait until spawn has happened, then emit stdout data and let waitForPort resolve */
async function emitWatchReady(child: ReturnType<typeof createMockChildProcess>, spawnTarget = 1) {
  await waitForSpawn(spawnTarget);
  child.stdout.emit('data', Buffer.from('Watch: started'));
  // Wait for waitForPort to resolve
  await flush();
}

// --- Tests ---

let initPptPreviewBridge: typeof import('../../src/process/bridge/pptPreviewBridge').initPptPreviewBridge;
let stopAllWatchSessions: typeof import('../../src/process/bridge/pptPreviewBridge').stopAllWatchSessions;
let isActivePreviewPort: typeof import('../../src/process/bridge/pptPreviewBridge').isActivePreviewPort;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  fakePort.value = 55555;
  installOfficecliMock.mockReset();

  const mod = await import('../../src/process/bridge/pptPreviewBridge');
  initPptPreviewBridge = mod.initPptPreviewBridge;
  stopAllWatchSessions = mod.stopAllWatchSessions;
  isActivePreviewPort = mod.isActivePreviewPort;
});

afterEach(() => {
  stopAllWatchSessions();
});

describe('pptPreviewBridge', () => {
  describe('initPptPreviewBridge', () => {
    it('registers start and stop providers', () => {
      initPptPreviewBridge();
      expect(startHandler.fn).toBeDefined();
      expect(stopHandler.fn).toBeDefined();
    });
  });

  describe('start (startWatch)', () => {
    it('emits starting status and resolves with url', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await emitWatchReady(child);

      const result = await promise;
      expect(statusEmitMock).toHaveBeenCalledWith({ state: 'starting' });
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('refuses to preview a file outside the authorized roots (SEC-IPC-07)', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      // A path outside every authorized confinement root must be rejected before
      // officecli is ever spawned against it.
      const result = await startHandler.fn!({ filePath: '/etc/passwd' });

      expect(spawnMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        url: '',
        error: 'Refused to preview a file outside the allowed directories',
      });
    });

    it('spawns officecli with the confined path', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await waitForSpawn(1); // wait for confinePath + findFreePort + spawn

      expect(spawnMock).toHaveBeenCalledWith(
        'officecli',
        ['watch', expect.stringContaining('file.pptx'), '--port', '55555'],
        expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] })
      );

      // Emit Watch: to resolve
      child.stdout.emit('data', Buffer.from('Watch: started'));
      await flush();
      await promise;
    });

    it('rejects when process exits with non-zero code', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await waitForSpawn(1); // wait for spawn
      child.emit('exit', 1, null);

      const result = await promise;
      expect(result).toEqual({ url: '', error: 'officecli exited with code 1' });
    });

    it('returns error result when process is killed by signal', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await waitForSpawn(1);
      child.emit('exit', null, 'SIGKILL');

      const result = await promise;
      expect(result).toEqual({ url: '', error: 'officecli exited with signal SIGKILL' });
    });

    it('attempts consent-gated auto-install on ENOENT and retries once', async () => {
      initPptPreviewBridge();

      const child1 = createMockChildProcess();
      spawnMock.mockReturnValueOnce(child1);

      const child2 = createMockChildProcess();
      spawnMock.mockReturnValueOnce(child2);

      // Install succeeds (consent granted, checksum verified).
      installOfficecliMock.mockResolvedValue(true);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await waitForSpawn(1);

      const enoentErr = Object.assign(new Error('spawn officecli ENOENT'), { code: 'ENOENT' });
      child1.emit('error', enoentErr);

      // installOfficecli runs, then the retry calls startWatch again.
      await flush(); // let install resolve + retry kick off
      expect(installOfficecliMock).toHaveBeenCalledTimes(1);

      await emitWatchReady(child2, 2);
      const result = await promise;
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('rejects if auto-install is declined or fails', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      // Install declined/failed (no consent, or unverifiable script - fail closed).
      installOfficecliMock.mockResolvedValue(false);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await waitForSpawn(1);

      const enoentErr = Object.assign(new Error('spawn officecli ENOENT'), { code: 'ENOENT' });
      child.emit('error', enoentErr);

      const result = await promise;
      expect(result).toEqual({
        url: '',
        error: 'officecli is not installed and auto-install was declined or failed',
      });
    });

    it('does not produce unhandled rejection when auto-install fails (ELECTRON-CW)', async () => {
      const unhandled = vi.fn();
      process.on('unhandledRejection', unhandled);

      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      installOfficecliMock.mockResolvedValue(false);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await waitForSpawn(1);

      const enoentErr = Object.assign(new Error('spawn officecli ENOENT'), { code: 'ENOENT' });
      child.emit('error', enoentErr);

      // Also emit exit (real child processes emit both error and exit for ENOENT)
      child.emit('exit', null, null);

      const result = await promise;
      expect(result.url).toBe('');
      expect(result.error).toContain('officecli is not installed');

      // Allow microtask queue to flush for unhandled rejection detection
      await flush();
      expect(unhandled).not.toHaveBeenCalled();
      process.removeListener('unhandledRejection', unhandled);
    });

    it('reuses existing alive session', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise1 = startHandler.fn!({ filePath: F('file.pptx') });
      await emitWatchReady(child);
      const url1 = await promise1;

      // Second call should reuse (process still alive: exitCode === null)
      const result2 = await startHandler.fn!({ filePath: F('file.pptx') });

      expect(spawnMock).toHaveBeenCalledTimes(1);
      expect(url1).toEqual(result2);
    });
  });

  describe('stop', () => {
    it('uses delayed kill for Strict Mode tolerance', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await emitWatchReady(child);
      await promise;

      await stopHandler.fn!({ filePath: F('file.pptx') });
      // confinePath inside stop is async; let it resolve and register the timer.
      await flush();

      expect(child.kill).not.toHaveBeenCalled();

      // The kill is delayed 500ms; wait past it.
      await new Promise<void>((r) => setTimeout(r, 600));
      expect(child.kill).toHaveBeenCalled();
    });
  });

  describe('stopAllWatchSessions', () => {
    it('kills all running sessions', async () => {
      initPptPreviewBridge();

      const child1 = createMockChildProcess();
      spawnMock.mockReturnValueOnce(child1);
      fakePort.value = 55555;
      const p1 = startHandler.fn!({ filePath: F('a.pptx') });
      await emitWatchReady(child1);
      await p1;

      const child2 = createMockChildProcess();
      spawnMock.mockReturnValueOnce(child2);
      fakePort.value = 55556;
      const p2 = startHandler.fn!({ filePath: F('b.pptx') });
      await emitWatchReady(child2, 2);
      await p2;

      stopAllWatchSessions();

      expect(child1.kill).toHaveBeenCalled();
      expect(child2.kill).toHaveBeenCalled();
    });
  });

  describe('isActivePreviewPort', () => {
    it('returns false for an unknown port', () => {
      initPptPreviewBridge();
      expect(isActivePreviewPort(9999)).toBe(false);
    });

    it('returns true for an active session port', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await emitWatchReady(child);
      await promise;

      expect(isActivePreviewPort(55555)).toBe(true);
    });

    it('returns false after the session process exits', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await emitWatchReady(child);
      await promise;

      child.exitCode = 0;
      expect(isActivePreviewPort(55555)).toBe(false);
    });

    it('returns false after the session is stopped', async () => {
      initPptPreviewBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = startHandler.fn!({ filePath: F('file.pptx') });
      await emitWatchReady(child);
      await promise;

      await stopHandler.fn!({ filePath: F('file.pptx') });
      await flush();
      await new Promise<void>((r) => setTimeout(r, 600));

      expect(isActivePreviewPort(55555)).toBe(false);
    });
  });
});
