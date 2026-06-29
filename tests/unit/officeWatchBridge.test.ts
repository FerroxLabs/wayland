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

const {
  wordStartHandler,
  wordStopHandler,
  excelStartHandler,
  excelStopHandler,
  wordStatusEmitMock,
  excelStatusEmitMock,
  spawnMock,
  installOfficecliMock,
  fakePort,
  portConnectSucceeds,
} = vi.hoisted(() => ({
  wordStartHandler: { fn: undefined as ((...args: any[]) => any) | undefined },
  wordStopHandler: { fn: undefined as ((...args: any[]) => any) | undefined },
  excelStartHandler: { fn: undefined as ((...args: any[]) => any) | undefined },
  excelStopHandler: { fn: undefined as ((...args: any[]) => any) | undefined },
  wordStatusEmitMock: vi.fn(),
  excelStatusEmitMock: vi.fn(),
  spawnMock: vi.fn(),
  installOfficecliMock: vi.fn(),
  fakePort: { value: 55555 },
  // Controls whether net.connect resolves (port ready) or rejects (port not ready).
  // Set to false in tests that expect the process to fail before the port opens.
  portConnectSucceeds: { value: true },
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: vi.fn(() => '/tmp') },
}));

vi.mock('../../src/common', () => ({
  ipcBridge: {
    wordPreview: {
      start: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          wordStartHandler.fn = fn;
        }),
      },
      stop: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          wordStopHandler.fn = fn;
        }),
      },
      status: {
        emit: wordStatusEmitMock,
      },
    },
    excelPreview: {
      start: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          excelStartHandler.fn = fn;
        }),
      },
      stop: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          excelStopHandler.fn = fn;
        }),
      },
      status: {
        emit: excelStatusEmitMock,
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
      if (portConnectSucceeds.value) {
        queueMicrotask(() => emitter.emit('connect'));
      } else {
        queueMicrotask(() => emitter.emit('error', new Error('ECONNREFUSED')));
      }
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
  // confinePath does several real async hops (realpath walk + optional DB
  // discovery) before spawn. A fixed-tick poll (the old 50x flush()) races and
  // gives up early on slow/loaded CI runners — the start promise then never
  // settles and the spec hits its 10s timeout (intermittent windows flake,
  // #292). vi.waitFor polls against a real 5s budget so it tolerates a slow
  // spawn deterministically without waiting when spawn is already done.
  await vi.waitFor(
    () => {
      if (spawnMock.mock.calls.length < target) throw new Error(`spawn ${spawnMock.mock.calls.length}/${target}`);
    },
    { timeout: 5000, interval: 5 }
  );
}

/**
 * The office watch bridge requires an identity handshake (RT-F5-04): the "Watch:"
 * marker must arrive on OUR spawned child's stdout pipe before it trusts whatever
 * answers the port. A port-race imposter can answer TCP but cannot forge the
 * marker on our child's stdout. After the marker, the mocked net.connect drives
 * port-readiness resolution. Wait for spawn, emit the marker, then let the
 * port-poll resolve.
 */
async function emitWatchReady(child: ReturnType<typeof createMockChildProcess>, spawnTarget = 1) {
  await waitForSpawn(spawnTarget);
  // Emit the identity marker on the child's stdout (proof the server is ours).
  child.stdout.emit('data', Buffer.from('Watch: http://localhost:55555\n'));
  // Let waitForPort's net.connect 'connect' event resolve.
  await flush();
}

// --- Tests ---

let initOfficeWatchBridge: typeof import('../../src/process/bridge/officeWatchBridge').initOfficeWatchBridge;
let stopAllOfficeWatchSessions: typeof import('../../src/process/bridge/officeWatchBridge').stopAllOfficeWatchSessions;
let isActiveOfficeWatchPort: typeof import('../../src/process/bridge/officeWatchBridge').isActiveOfficeWatchPort;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  fakePort.value = 55555;
  portConnectSucceeds.value = true;
  installOfficecliMock.mockReset();

  const mod = await import('../../src/process/bridge/officeWatchBridge');
  initOfficeWatchBridge = mod.initOfficeWatchBridge;
  stopAllOfficeWatchSessions = mod.stopAllOfficeWatchSessions;
  isActiveOfficeWatchPort = mod.isActiveOfficeWatchPort;
});

afterEach(() => {
  stopAllOfficeWatchSessions();
});

describe('officeWatchBridge', () => {
  describe('initOfficeWatchBridge', () => {
    it('registers word and excel start/stop providers', () => {
      initOfficeWatchBridge();
      expect(wordStartHandler.fn).toBeDefined();
      expect(wordStopHandler.fn).toBeDefined();
      expect(excelStartHandler.fn).toBeDefined();
      expect(excelStopHandler.fn).toBeDefined();
    });
  });

  describe('word start (startWatch)', () => {
    it('emits starting status and resolves with url for word', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await emitWatchReady(child);

      const result = await promise;
      expect(wordStatusEmitMock).toHaveBeenCalledWith({ state: 'starting' });
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('refuses to preview a file outside the authorized roots (SEC-IPC-07)', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      // A path outside every authorized confinement root must be rejected before
      // officecli is ever spawned against it.
      const result = await wordStartHandler.fn!({ filePath: '/etc/passwd' });

      expect(spawnMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        url: '',
        error: 'Refused to preview a file outside the allowed directories',
      });
    });

    it('spawns officecli with the confined path for word', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await waitForSpawn(1);

      expect(spawnMock).toHaveBeenCalledWith(
        'officecli',
        ['watch', expect.stringContaining('file.docx'), '--port', '55555'],
        expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] })
      );

      child.stdout.emit('data', Buffer.from('Watch: http://localhost:55555\n'));
      await flush();
      await promise;
    });

    it('reuses existing alive session for word', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise1 = wordStartHandler.fn!({ filePath: F('file.docx') });
      await emitWatchReady(child);
      const url1 = await promise1;

      const result2 = await wordStartHandler.fn!({ filePath: F('file.docx') });

      expect(spawnMock).toHaveBeenCalledTimes(1);
      expect(url1).toEqual(result2);
    });

    it('returns error result when word process exits with non-zero code', async () => {
      portConnectSucceeds.value = false; // port never opens; process exit settles first
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await waitForSpawn(1);
      child.emit('exit', 1, null);

      const result = await promise;
      expect(result).toEqual({ url: '', error: 'officecli exited with code 1' });
    });
  });

  describe('excel start (startWatch)', () => {
    it('emits starting status and resolves with url for excel', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await emitWatchReady(child);

      const result = await promise;
      expect(excelStatusEmitMock).toHaveBeenCalledWith({ state: 'starting' });
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('spawns officecli with the confined path for excel', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await waitForSpawn(1);

      expect(spawnMock).toHaveBeenCalledWith(
        'officecli',
        ['watch', expect.stringContaining('file.xlsx'), '--port', '55555'],
        expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] })
      );

      child.stdout.emit('data', Buffer.from('Watch: http://localhost:55555\n'));
      await flush();
      await promise;
    });

    it('reuses existing alive session for excel', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise1 = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await emitWatchReady(child);
      const url1 = await promise1;

      const result2 = await excelStartHandler.fn!({ filePath: F('file.xlsx') });

      expect(spawnMock).toHaveBeenCalledTimes(1);
      expect(url1).toEqual(result2);
    });

    it('returns error result when excel process is killed by signal', async () => {
      portConnectSucceeds.value = false; // port never opens; process exit settles first
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await waitForSpawn(1);
      child.emit('exit', null, 'SIGKILL');

      const result = await promise;
      expect(result).toEqual({ url: '', error: 'officecli exited with signal SIGKILL' });
    });
  });

  describe('word stop', () => {
    it('uses delayed kill for Strict Mode tolerance (word)', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await emitWatchReady(child);
      await promise;

      await wordStopHandler.fn!({ filePath: F('file.docx') });
      // confinePath inside stop is async; let it resolve and register the timer.
      await flush();

      expect(child.kill).not.toHaveBeenCalled();

      // The kill is delayed 500ms; wait past it.
      await new Promise<void>((r) => setTimeout(r, 600));
      expect(child.kill).toHaveBeenCalled();
    });
  });

  describe('excel stop', () => {
    it('uses delayed kill for Strict Mode tolerance (excel)', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await emitWatchReady(child);
      await promise;

      await excelStopHandler.fn!({ filePath: F('file.xlsx') });
      await flush();

      expect(child.kill).not.toHaveBeenCalled();

      await new Promise<void>((r) => setTimeout(r, 600));
      expect(child.kill).toHaveBeenCalled();
    });
  });

  describe('stopAllOfficeWatchSessions', () => {
    it('kills all running word and excel sessions', async () => {
      initOfficeWatchBridge();

      const wordChild = createMockChildProcess();
      spawnMock.mockReturnValueOnce(wordChild);
      fakePort.value = 55555;
      const p1 = wordStartHandler.fn!({ filePath: F('a.docx') });
      await emitWatchReady(wordChild);
      await p1;

      const excelChild = createMockChildProcess();
      spawnMock.mockReturnValueOnce(excelChild);
      fakePort.value = 55556;
      const p2 = excelStartHandler.fn!({ filePath: F('b.xlsx') });
      await emitWatchReady(excelChild, 2);
      await p2;

      stopAllOfficeWatchSessions();

      expect(wordChild.kill).toHaveBeenCalled();
      expect(excelChild.kill).toHaveBeenCalled();
    });
  });

  describe('isActiveOfficeWatchPort', () => {
    it('returns false for an unknown port', () => {
      initOfficeWatchBridge();
      expect(isActiveOfficeWatchPort(9999)).toBe(false);
    });

    it('returns true for an active word session port', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await emitWatchReady(child);
      await promise;

      expect(isActiveOfficeWatchPort(55555)).toBe(true);
    });

    it('returns true for an active excel session port', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await emitWatchReady(child);
      await promise;

      expect(isActiveOfficeWatchPort(55555)).toBe(true);
    });

    it('returns false after word session process exits', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await emitWatchReady(child);
      await promise;

      child.exitCode = 0;
      expect(isActiveOfficeWatchPort(55555)).toBe(false);
    });

    it('word and excel session maps are independent - same file path does not collide', async () => {
      initOfficeWatchBridge();
      const wordChild = createMockChildProcess();
      const excelChild = createMockChildProcess();
      spawnMock.mockReturnValueOnce(wordChild).mockReturnValueOnce(excelChild);
      fakePort.value = 55555;

      const wordPromise = wordStartHandler.fn!({ filePath: F('shared') });
      await emitWatchReady(wordChild);
      await wordPromise;

      fakePort.value = 55556;
      const excelPromise = excelStartHandler.fn!({ filePath: F('shared') });
      await emitWatchReady(excelChild, 2);
      await excelPromise;

      expect(isActiveOfficeWatchPort(55555)).toBe(true);
      expect(isActiveOfficeWatchPort(55556)).toBe(true);

      // Killing word session does not affect excel session
      wordChild.exitCode = 0;
      expect(isActiveOfficeWatchPort(55555)).toBe(false);
      expect(isActiveOfficeWatchPort(55556)).toBe(true);
    });

    it('returns false after word session is stopped', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await emitWatchReady(child);
      await promise;

      await wordStopHandler.fn!({ filePath: F('file.docx') });
      await flush();
      await new Promise<void>((r) => setTimeout(r, 600));

      expect(isActiveOfficeWatchPort(55555)).toBe(false);
    });
  });

  describe('identity handshake (RT-F5-04 - port-race TOCTOU)', () => {
    it('does NOT resolve from a responding port alone - requires the Watch: marker (word)', async () => {
      // Simulates a port-race imposter: something answers TCP on the port
      // (portConnectSucceeds=true) but our spawned child never emits the
      // "Watch:" marker on its stdout. The start must NOT resolve, because a
      // responding-but-unverified server could be an attacker who won the
      // findFreePort() bind race, not our officecli.
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      let settled = false;
      const promise = wordStartHandler.fn!({ filePath: F('file.docx') }).then((r: unknown) => {
        settled = true;
        return r;
      });

      await waitForSpawn(1);
      // Let many turns elapse with the port "responding" but NO marker emitted.
      for (let i = 0; i < 10; i++) await flush();

      expect(settled).toBe(false);

      // Now the real child proves identity with the marker → start completes.
      child.stdout.emit('data', Buffer.from('Watch: http://localhost:55555\n'));
      await flush();
      const result = await promise;
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('does NOT resolve from a responding port alone - requires the Watch: marker (excel)', async () => {
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      let settled = false;
      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') }).then((r: unknown) => {
        settled = true;
        return r;
      });

      await waitForSpawn(1);
      for (let i = 0; i < 10; i++) await flush();
      expect(settled).toBe(false);

      child.stdout.emit('data', Buffer.from('Watch: http://localhost:55555\n'));
      await flush();
      const result = await promise;
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('ignores non-marker stdout chatter from the port responder (word)', async () => {
      // A responder that emits arbitrary stdout WITHOUT the "Watch:" marker must
      // not satisfy the handshake - only the exact identity marker counts.
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      let settled = false;
      const promise = wordStartHandler.fn!({ filePath: F('file.docx') }).then((r: unknown) => {
        settled = true;
        return r;
      });

      await waitForSpawn(1);
      child.stdout.emit('data', Buffer.from('Listening on some port\n'));
      child.stdout.emit('data', Buffer.from('Ready.\n'));
      for (let i = 0; i < 5; i++) await flush();
      expect(settled).toBe(false);

      child.stdout.emit('data', Buffer.from('Watch: http://localhost:55555\n'));
      await flush();
      const result = await promise;
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });
  });

  describe('auto-install on ENOENT', () => {
    it('attempts consent-gated auto-install on ENOENT for word and retries once', async () => {
      initOfficeWatchBridge();

      const child1 = createMockChildProcess();
      spawnMock.mockReturnValueOnce(child1);

      const child2 = createMockChildProcess();
      spawnMock.mockReturnValueOnce(child2);

      // Install succeeds (consent granted, checksum verified).
      installOfficecliMock.mockResolvedValue(true);

      const promise = wordStartHandler.fn!({ filePath: F('file.docx') });
      await waitForSpawn(1);

      const enoentErr = Object.assign(new Error('spawn officecli ENOENT'), { code: 'ENOENT' });
      child1.emit('error', enoentErr);

      await flush(); // let install resolve + retry kick off
      expect(installOfficecliMock).toHaveBeenCalledTimes(1);

      await emitWatchReady(child2, 2);
      const result = await promise;
      expect(result).toEqual({ url: 'http://localhost:55555' });
    });

    it('rejects if auto-install is declined or fails for excel', async () => {
      portConnectSucceeds.value = false; // port never opens; the ENOENT error path settles
      initOfficeWatchBridge();
      const child = createMockChildProcess();
      spawnMock.mockReturnValue(child);

      // Install declined/failed (no consent, or unverifiable script - fail closed).
      installOfficecliMock.mockResolvedValue(false);

      const promise = excelStartHandler.fn!({ filePath: F('file.xlsx') });
      await waitForSpawn(1);

      const enoentErr = Object.assign(new Error('spawn officecli ENOENT'), { code: 'ENOENT' });
      child.emit('error', enoentErr);

      const result = await promise;
      expect(result).toEqual({
        url: '',
        error: 'officecli is not installed and auto-install was declined or failed',
      });
    });
  });
});
