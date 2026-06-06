/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwSystemService.applyPendingUpgrade()` - the boot-time
 * activator that swaps `.pending` → live, runs a full JSON-RPC envelope
 * spawn-test, and rolls back to `.prev` on failure.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => `/tmp/wayland-test-${key}`,
  },
}));

const emitSpy = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: { onStatusChanged: { emit: (payload: unknown) => emitSpy(payload) } },
  },
}));

const applyPreludeForStatusSpy = vi.fn();
const discoverTargetsSpy = vi.fn().mockResolvedValue([]);
vi.mock('@process/services/ijfw/preludeManager', () => ({
  applyPreludeForStatus: (...args: unknown[]) => applyPreludeForStatusSpy(...args),
  discoverTargets: (dirs: unknown) => discoverTargetsSpy(dirs),
}));

const mcpShutdownSpy = vi.fn().mockResolvedValue(undefined);
const mcpWaitSpy = vi.fn().mockResolvedValue(true);
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: {
    shutdown: () => mcpShutdownSpy(),
    waitForExit: (ms: number) => mcpWaitSpy(ms),
    getMode: () => 'degraded',
    invoke: () => Promise.resolve({ ok: false, errorReason: 'unavailable' }),
  },
}));

// Checkpoint B H4: tests inject a moveWithExdevFallback that simulates the
// TOCTOU - the rename appears to succeed but the post-swap directory is an
// attacker-controlled symlink. Default impl delegates to the real one.
let moveWithExdevFallbackImpl: ((src: string, dst: string) => Promise<void>) | null = null;
vi.mock('@process/services/ijfw/atomicFile', async () => {
  const actual = await vi.importActual<typeof import('@process/services/ijfw/atomicFile')>(
    '@process/services/ijfw/atomicFile'
  );
  return {
    ...actual,
    moveWithExdevFallback: (src: string, dst: string) =>
      moveWithExdevFallbackImpl ? moveWithExdevFallbackImpl(src, dst) : actual.moveWithExdevFallback(src, dst),
  };
});

const spawnSpy = vi.fn();
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return {
    ...actual,
    spawn: (...args: unknown[]) => spawnSpy(...args),
  };
});

// On the spawn-test-success path the activator awaits `agentRegistry.refreshAll()`.
// The real registry probes agent backends (spawn/`where`), which hangs under the
// Windows CI runner and times the test out before its assertions run. Keep the
// real singleton (other methods like getDetectedAgents stay intact) and only
// neutralize that one slow call so the activation path completes promptly.
const agentRefreshAllSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@process/agent/AgentRegistry', async () => {
  const actual = await vi.importActual<typeof import('@process/agent/AgentRegistry')>('@process/agent/AgentRegistry');
  (actual.agentRegistry as { refreshAll: () => Promise<void> }).refreshAll = () => agentRefreshAllSpy();
  return actual;
});

/**
 * Build a fake child that emits a tools/list response containing a tool in the
 * `ijfw_` namespace. Real IJFW v1.5.0 exposes 13 tools - we verify by namespace
 * prefix rather than hard-coded canonical tool name (see spawnTestVerify).
 */
function makeSpawnTestSuccessChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: (data: Buffer | string) => void };
    kill: () => void;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = {
    write: () => {
      // Reply asynchronously with a successful tools/list response.
      setImmediate(() => {
        const response = {
          jsonrpc: '2.0',
          id: 1,
          result: { tools: [{ name: 'ijfw_memory_recall' }, { name: 'ijfw_state' }, { name: 'other' }] },
        };
        child.stdout.emit('data', Buffer.from(JSON.stringify(response) + '\n'));
      });
    },
  };
  child.kill = () => {};
  return child;
}

function makeSpawnTestFailureChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: (data: Buffer | string) => void };
    kill: () => void;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = {
    write: () => {
      setImmediate(() => {
        // Exit before a successful response - SEC-003: exit-before-success = failure.
        child.emit('exit', 1);
      });
    },
  };
  child.kill = () => {};
  return child;
}

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function writePendingDir(): string {
  const pending = path.join(tmpHome, '.ijfw', 'mcp-server.pending');
  fs.mkdirSync(pending, { recursive: true });
  fs.writeFileSync(
    path.join(pending, 'package.json'),
    JSON.stringify({ version: '1.5.4', bin: { 'ijfw-mcp': 'src/server.js' } })
  );
  fs.mkdirSync(path.join(pending, 'src'), { recursive: true });
  fs.writeFileSync(path.join(pending, 'src', 'server.js'), '// stub\n');
  return pending;
}

// eslint-disable-next-line import/first
import { ijfwSystemService } from '@process/services/ijfwSystemService';

// The pending-upgrade activator stages the MCP server via symlink-ownership
// checks and `.pending` -> live directory moves (moveWithExdevFallback, i.e.
// fs.rename with a copy fallback). Symlink fixtures are created as NTFS
// junctions ('junction' type) so they need no elevation on win32 and still
// report isSymbolicLink()=true - the ownership-rejection path is exercised on
// both platforms. This block runs on windows - NO skip. If the move-sequence
// tests fail on the windows CI shard, that is a REAL prod finding in
// moveWithExdevFallback's win32 rename semantics (overwrite/open-handle
// behaviour differs from posix) to fix in prod, not re-skip here.
describe('ijfwSystemService.applyPendingUpgrade', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-pending-'));
    emitSpy.mockClear();
    applyPreludeForStatusSpy.mockReset();
    discoverTargetsSpy.mockReset().mockResolvedValue([]);
    mcpShutdownSpy.mockReset().mockResolvedValue(undefined);
    mcpWaitSpy.mockReset().mockResolvedValue(true);
    spawnSpy.mockReset();
    moveWithExdevFallbackImpl = null;
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('is a no-op when no .pending tree exists', async () => {
    await ijfwSystemService.applyPendingUpgrade();
    expect(mcpShutdownSpy).not.toHaveBeenCalled();
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it('refuses to activate when .pending is a symlink (ownership check)', async () => {
    const realDir = path.join(tmpHome, 'evil');
    fs.mkdirSync(realDir, { recursive: true });
    fs.mkdirSync(path.join(tmpHome, '.ijfw'), { recursive: true });
    fs.symlinkSync(realDir, path.join(tmpHome, '.ijfw', 'mcp-server.pending'), 'junction');
    await ijfwSystemService.applyPendingUpgrade();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'install_failed', errorReason: 'unsafe_ownership' })
    );
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it('defers when MCP client fails to drain in time', async () => {
    writePendingDir();
    mcpWaitSpy.mockResolvedValueOnce(false);
    await ijfwSystemService.applyPendingUpgrade();
    expect(spawnSpy).not.toHaveBeenCalled();
    // Pending tree untouched.
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server.pending'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server'))).toBe(false);
  });

  it('activates pending and emits installed_current on spawn-test success', async () => {
    writePendingDir();
    spawnSpy.mockImplementation(() => makeSpawnTestSuccessChild());

    await ijfwSystemService.applyPendingUpgrade();
    for (let i = 0; i < 8; i++) await flush();

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'installed_current' }));
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server.pending'))).toBe(false);
  });

  it('Checkpoint B B2: acquires installLock and short-circuits when one is already held', async () => {
    // Pre-seed a lockfile that matches the current host+boot and points at the
    // running test process pid so `pidAlive()` returns true → the lock is
    // treated as held (not stale).
    const lockDir = path.join(tmpHome, '.ijfw');
    fs.mkdirSync(lockDir, { recursive: true });
    const lockPath = path.join(lockDir, '.install-lock');
    const currentBootTime = Date.now() - os.uptime() * 1000;
    const fakeMeta = {
      pid: process.pid,
      startTime: Date.now(),
      bootTime: currentBootTime,
      nonce: 'aa'.repeat(16),
      hostname: os.hostname(),
    };
    fs.writeFileSync(lockPath, JSON.stringify(fakeMeta), { mode: 0o600 });
    writePendingDir();

    await ijfwSystemService.applyPendingUpgrade();

    // Lockfile still present (we never released it). No mutation occurred.
    expect(fs.existsSync(lockPath)).toBe(true);
    // No spawn-test fired, pending tree untouched, no current dir created.
    expect(spawnSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server.pending'))).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.ijfw', 'mcp-server'))).toBe(false);
  });

  it('Checkpoint B B2: releases installLock after successful activation', async () => {
    writePendingDir();
    spawnSpy.mockImplementation(() => makeSpawnTestSuccessChild());

    await ijfwSystemService.applyPendingUpgrade();
    for (let i = 0; i < 8; i++) await flush();

    // Lockfile must be gone - releaseLock fired in `finally`.
    const lockPath = path.join(tmpHome, '.ijfw', '.install-lock');
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('Checkpoint B H4: emits unsafe_ownership when post-swap re-check finds a symlink', async () => {
    // Simulate the TOCTOU: pending tree passes the pre-swap ownership check,
    // but during the rename an attacker substitutes the destination with a
    // symlink. The post-swap re-stat must catch this.
    writePendingDir();
    const evilTarget = path.join(tmpHome, 'attacker-controlled');
    fs.mkdirSync(evilTarget, { recursive: true });
    fs.writeFileSync(path.join(evilTarget, 'package.json'), JSON.stringify({ version: '666.0.0' }));

    let renameCount = 0;
    moveWithExdevFallbackImpl = async (src, dst) => {
      renameCount += 1;
      // The pending → current rename is the second move call (preceded by the
      // current → previous preserve, which we let go through). Substitute a
      // symlink for the second call.
      if (renameCount === 2 || src.endsWith('mcp-server.pending')) {
        // Drop the real pending tree (simulating attacker removing it after
        // the ownership check passed) and put a symlink in its place at `dst`.
        await fs.promises.rm(src, { recursive: true, force: true });
        fs.symlinkSync(evilTarget, dst, 'junction');
        return;
      }
      // For other rename ops (preserve current → previous), no current dir
      // exists in this test so just ignore ENOENT.
      try {
        await fs.promises.rename(src, dst);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    };

    await ijfwSystemService.applyPendingUpgrade();
    for (let i = 0; i < 8; i++) await flush();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'install_failed', errorReason: 'unsafe_ownership' })
    );
    // spawnTestVerify must NOT have run - the re-check fires before verify.
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  // Wave 7 H2: every install_failed exit MUST also sync the prelude. Without
  // this the on-disk PRELUDE stays in an optimistic `installing` / `upgrading`
  // state after a failed upgrade and the next boot reads stale state.
  it('Wave 7 H2: syncs prelude on unsafe_ownership exit', async () => {
    const realDir = path.join(tmpHome, 'evil');
    fs.mkdirSync(realDir, { recursive: true });
    fs.mkdirSync(path.join(tmpHome, '.ijfw'), { recursive: true });
    fs.symlinkSync(realDir, path.join(tmpHome, '.ijfw', 'mcp-server.pending'), 'junction');

    await ijfwSystemService.applyPendingUpgrade();

    // emit + prelude must both fire.
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'install_failed', errorReason: 'unsafe_ownership' })
    );
    expect(applyPreludeForStatusSpy).toHaveBeenCalledWith('install_failed', expect.anything());
  });

  it('Wave 7 H2: syncs prelude when spawn-test fails after rollback', async () => {
    const current = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(current, { recursive: true });
    fs.writeFileSync(
      path.join(current, 'package.json'),
      JSON.stringify({ version: '1.4.0', bin: { 'ijfw-mcp': 'src/server.js' } })
    );
    fs.mkdirSync(path.join(current, 'src'), { recursive: true });
    fs.writeFileSync(path.join(current, 'src', 'server.js'), '// old\n');
    writePendingDir();
    spawnSpy.mockImplementation(() => makeSpawnTestFailureChild());

    await ijfwSystemService.applyPendingUpgrade();
    for (let i = 0; i < 12; i++) await flush();

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'install_failed' }));
    expect(applyPreludeForStatusSpy).toHaveBeenCalledWith('install_failed', expect.anything());
  });

  it('rolls back to .prev and emits install_failed when spawn-test fails', async () => {
    // Existing current install we will preserve.
    const current = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(current, { recursive: true });
    fs.writeFileSync(
      path.join(current, 'package.json'),
      JSON.stringify({ version: '1.4.0', bin: { 'ijfw-mcp': 'src/server.js' } })
    );
    fs.mkdirSync(path.join(current, 'src'), { recursive: true });
    fs.writeFileSync(path.join(current, 'src', 'server.js'), '// old\n');

    writePendingDir();
    spawnSpy.mockImplementation(() => makeSpawnTestFailureChild());

    await ijfwSystemService.applyPendingUpgrade();
    for (let i = 0; i < 12; i++) await flush();

    // Pending failed → the rolled-back current must be the old one.
    expect(fs.existsSync(current)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(path.join(current, 'package.json'), 'utf-8'));
    expect(pkg.version).toBe('1.4.0');
  });
});
