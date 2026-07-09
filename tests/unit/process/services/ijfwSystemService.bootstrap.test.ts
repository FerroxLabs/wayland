/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwSystemService.bootstrap()` - env opt-out, setting opt-out,
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

// #716: getActiveProjectDirs lazily reads persisted project workspaces.
// Mocked so unit tests never open a real SQLite database.
vi.mock('@process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    listProjects() {
      return Promise.resolve([]);
    }
  },
}));

const refreshAllSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: {
    refreshAll: () => refreshAllSpy(),
    getDetectedAgents: () => [],
  },
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

function queueFakeChild(
  exitCode = 0,
  stderrText = ''
): Promise<
  EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  }
> {
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

// Wait until `pred()` holds, on a REAL-TIME budget rather than a fixed flush
// count. The async install-exit handler chain (move-pending → emit →
// release-lock) can exceed any fixed tick count on the ~2.7x-slower windows
// runners, so the old 200-flush loop returned with the condition still false and
// the following assertion saw 0 calls — the #292 windows flake. vi.waitFor
// re-evaluates pred against a 5s deadline (polling every 5ms, which yields to
// the event loop so the setImmediate callbacks fire), deterministic on every
// platform with no arbitrary sleeps.
async function flushUntil(pred: () => boolean): Promise<void> {
  await vi.waitFor(
    () => {
      if (!pred()) throw new Error('flushUntil: condition not met yet');
    },
    { timeout: 5000, interval: 5 }
  );
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

  it('installs (no local) - emits installing then installed_current and triggers refreshAll', async () => {
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
    await flushUntil(() =>
      emitSpy.mock.calls.some((c) => (c[0] as { status?: string })?.status === 'installed_current')
    );

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installing' }));
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installed_current', version: '1.5.4' }));
    expect(refreshAllSpy).toHaveBeenCalled();

    // Regression guard (BUG-0): @ijfw/install exposes three bins and none is
    // named `install`, so a bare `npx @ijfw/install` fails with "could not
    // determine executable to run". The install call MUST name the bin via
    // --package and run non-interactively (--yes) under our piped stdio.
    const installCall = safeSpawnSpy.mock.calls
      .map((c) => c[0] as { cmd?: string; args?: string[] })
      .find((opts) => opts?.cmd === 'npx');
    expect(installCall?.args).toEqual(['-y', '--package', '@ijfw/install@1.5.4', 'ijfw-install', '--yes']);
  });

  // The upgrade path stages the new tree to `.pending` via moveWithExdevFallback
  // (fs.rename + copy fallback). The fixtures use path.join throughout, so this
  // runs on windows too - NO skip. If the staging assertions fail on the windows
  // CI shard, that is a real prod finding in moveWithExdevFallback's win32 rename
  // semantics to fix in prod, not re-skip.
  it('upgrades - emits upgrading then installed_pending_activation, stages to .pending', async () => {
    // Local install at 1.4.0; latest 1.5.4 - should upgrade.
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
    // Wait until the async install-exit handler has emitted the terminal
    // status (move-pending → emit → release-lock) - condition-based, not a
    // fixed flush count, so it is deterministic on every platform.
    await flushUntil(() =>
      emitSpy.mock.calls.some((c) => (c[0] as { status?: string })?.status === 'installed_pending_activation')
    );

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'upgrading' }));
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'installed_pending_activation', version: '1.5.4' })
    );
    // The original directory should have been moved to .pending.
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server.pending'))).toBe(true);
    expect(fs.existsSync(mcp)).toBe(false);
  });

  it('Checkpoint B H1: install_failed emitted once when both error and exit fire', async () => {
    // child_process can fire BOTH `error` and `exit` for a single failed
    // spawn. The settle latch must ensure we emit install_failed only once
    // and release the lock only once.
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
    safeSpawnSpy.mockImplementationOnce(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: () => void;
      };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      // Fire BOTH error and exit back-to-back - Node really does this for some
      // spawn failures. Before H1 each handler would emit independently.
      setImmediate(() => {
        child.emit('error', new Error('ENOENT'));
        child.emit('exit', 1);
      });
      return Promise.resolve(child);
    });

    await ijfwSystemService.bootstrap();
    await flushUntil(() => emitSpy.mock.calls.some((c) => (c[0] as { status?: string })?.status === 'install_failed'));

    const failedEmits = emitSpy.mock.calls.filter((c) => (c[0] as { status?: string }).status === 'install_failed');
    expect(failedEmits.length).toBe(1);
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
    await flushUntil(() => emitSpy.mock.calls.some((c) => (c[0] as { status?: string })?.status === 'install_failed'));

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'install_failed', errorReason: 'install_exit_nonzero' })
    );
  });
});
