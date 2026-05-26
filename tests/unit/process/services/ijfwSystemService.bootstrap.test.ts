/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwSystemService.bootstrap()` — env opt-out, setting opt-out,
 * no-op when current, install path, upgrade path (stage to .pending),
 * prelude transitions, and lockfile race short-circuit.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;
let tmpUserData: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => {
      if (key === 'userData') return tmpUserData;
      return `/tmp/wayland-test-${key}`;
    },
  },
}));

const emitSpy = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: { onStatusChanged: { emit: (payload: unknown) => emitSpy(payload) } },
  },
}));

const safeSpawnSpy = vi.fn();
vi.mock('@process/services/ijfw/safeSpawn', () => ({
  safeSpawn: (opts: unknown) => safeSpawnSpy(opts),
}));

const applyPreludeForStatusSpy = vi.fn();
const discoverTargetsSpy = vi.fn().mockResolvedValue([]);
vi.mock('@process/services/ijfw/preludeManager', () => ({
  applyPreludeForStatus: (...args: unknown[]) => applyPreludeForStatusSpy(...args),
  discoverTargets: (dirs: unknown) => discoverTargetsSpy(dirs),
}));

const refreshAllSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: { refreshAll: () => refreshAllSpy() },
}));

const processConfigGetSpy = vi.fn();
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: (key: string) => processConfigGetSpy(key) },
}));

const spawnSyncSpy = vi.fn().mockReturnValue({ status: 1, stdout: '', stderr: '' });
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return {
    ...actual,
    spawnSync: (...args: unknown[]) => spawnSyncSpy(...args),
  };
});

function queueFakeChild(exitCode = 0, stderrText = ''): Promise<EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: () => void;
}> {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  return Promise.resolve(child).then((c) => {
    setImmediate(() => {
      if (stderrText) c.stderr.emit('data', Buffer.from(stderrText));
      c.emit('exit', exitCode);
    });
    return c;
  });
}

/** Wait for the next setImmediate so emit/refresh callbacks fire. */
function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// eslint-disable-next-line import/first
import { ijfwSystemService, __resetCacheForTests } from '@process/services/ijfwSystemService';

describe('ijfwSystemService.bootstrap', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-boot-'));
    tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-boot-userdata-'));
    emitSpy.mockClear();
    safeSpawnSpy.mockReset();
    applyPreludeForStatusSpy.mockReset();
    discoverTargetsSpy.mockReset().mockResolvedValue([]);
    refreshAllSpy.mockReset().mockResolvedValue(undefined);
    processConfigGetSpy.mockReset();
    spawnSyncSpy.mockReset().mockReturnValue({ status: 1, stdout: '', stderr: '' });
    __resetCacheForTests();
    delete process.env.IJFW_AUTO_INSTALL;
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  });

  it('short-circuits when IJFW_AUTO_INSTALL=never', async () => {
    process.env.IJFW_AUTO_INSTALL = 'never';
    await ijfwSystemService.bootstrap();
    expect(safeSpawnSpy).not.toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'not_installed', reason: 'opt_out' }));
  });

  it('short-circuits when ijfw.skipSetup setting is truthy', async () => {
    processConfigGetSpy.mockResolvedValue(true);
    await ijfwSystemService.bootstrap();
    expect(safeSpawnSpy).not.toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'not_installed', reason: 'opt_out' }));
  });

  it('emits installed_current when local install is up to date', async () => {
    // Local install present with version >= latest.
    const mcp = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(mcp, { recursive: true });
    fs.writeFileSync(path.join(mcp, 'package.json'), JSON.stringify({ version: '1.5.4' }));
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild(0)).mockImplementation(() => queueFakeChild(0));
    // Inject latest = 1.5.4 via getLatestPublished call.
    // safeSpawn(npm view) child emits '1.5.4'.
    safeSpawnSpy.mockReset();
    safeSpawnSpy.mockImplementationOnce(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: () => void;
      };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('1.5.4\n'));
        child.emit('exit', 0);
      });
      return Promise.resolve(child);
    });

    await ijfwSystemService.bootstrap();
    await flush();

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installed_current', version: '1.5.4' }));
  });

  it('installs (no local) — emits installing then installed_current and triggers refreshAll', async () => {
    // No local install. getLatestPublished returns 1.5.4, then npx install exits 0.
    safeSpawnSpy.mockReset();
    // First call: npm view
    safeSpawnSpy.mockImplementationOnce(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: () => void;
      };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('1.5.4\n'));
        child.emit('exit', 0);
      });
      return Promise.resolve(child);
    });
    // Second call: npx install
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild(0));

    await ijfwSystemService.bootstrap();
    // Wait for install child's exit handler to fire (refreshAll + emit + release-lock).
    for (let i = 0; i < 8; i++) await flush();

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installing' }));
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installed_current', version: '1.5.4' }));
    expect(refreshAllSpy).toHaveBeenCalled();
  });

  it('upgrades — emits upgrading then installed_pending_activation, stages to .pending', async () => {
    // Local install at 1.4.0; latest 1.5.4 — should upgrade.
    const mcp = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(mcp, { recursive: true });
    fs.writeFileSync(path.join(mcp, 'package.json'), JSON.stringify({ version: '1.4.0' }));

    safeSpawnSpy.mockReset();
    safeSpawnSpy.mockImplementationOnce(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: () => void;
      };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('1.5.4\n'));
        child.emit('exit', 0);
      });
      return Promise.resolve(child);
    });
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild(0));

    await ijfwSystemService.bootstrap();
    // Walk the event loop until the install-exit handler completes its async work
    // (move-pending → emit → release-lock). 8 flushes covers writeCache + move.
    for (let i = 0; i < 8; i++) await flush();

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'upgrading' }));
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installed_pending_activation', version: '1.5.4' }));
    // The original directory should have been moved to .pending.
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server.pending'))).toBe(true);
    expect(fs.existsSync(mcp)).toBe(false);
  });

  it('emits install_failed when the install npx child exits non-zero', async () => {
    safeSpawnSpy.mockReset();
    safeSpawnSpy.mockImplementationOnce(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: () => void;
      };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('1.5.4\n'));
        child.emit('exit', 0);
      });
      return Promise.resolve(child);
    });
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild(1, 'boom'));

    await ijfwSystemService.bootstrap();
    for (let i = 0; i < 8; i++) await flush();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'install_failed', errorReason: 'install_exit_nonzero' }),
    );
  });
});
