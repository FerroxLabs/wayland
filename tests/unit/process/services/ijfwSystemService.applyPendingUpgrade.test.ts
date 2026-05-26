/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwSystemService.applyPendingUpgrade()` — the boot-time
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
vi.mock('@process/services/ijfw/ijfwMcpClientStub', () => ({
  ijfwMcpClient: {
    shutdown: () => mcpShutdownSpy(),
    waitForExit: (ms: number) => mcpWaitSpy(ms),
  },
}));

const spawnSpy = vi.fn();
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return {
    ...actual,
    spawn: (...args: unknown[]) => spawnSpy(...args),
  };
});

/** Build a fake child that emits a tools/list response containing ijfw_brain. */
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
          result: { tools: [{ name: 'ijfw_brain' }, { name: 'other' }] },
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
        // Exit before a successful response — SEC-003: exit-before-success = failure.
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
    JSON.stringify({ version: '1.5.4', bin: { 'ijfw-mcp': 'src/server.js' } }),
  );
  fs.mkdirSync(path.join(pending, 'src'), { recursive: true });
  fs.writeFileSync(path.join(pending, 'src', 'server.js'), '// stub\n');
  return pending;
}

// eslint-disable-next-line import/first
import { ijfwSystemService } from '@process/services/ijfwSystemService';

describe('ijfwSystemService.applyPendingUpgrade', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-pending-'));
    emitSpy.mockClear();
    applyPreludeForStatusSpy.mockReset();
    discoverTargetsSpy.mockReset().mockResolvedValue([]);
    mcpShutdownSpy.mockReset().mockResolvedValue(undefined);
    mcpWaitSpy.mockReset().mockResolvedValue(true);
    spawnSpy.mockReset();
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
    fs.symlinkSync(realDir, path.join(tmpHome, '.ijfw', 'mcp-server.pending'));
    await ijfwSystemService.applyPendingUpgrade();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'install_failed', errorReason: 'unsafe_ownership' }),
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

  it('rolls back to .prev and emits install_failed when spawn-test fails', async () => {
    // Existing current install we will preserve.
    const current = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(current, { recursive: true });
    fs.writeFileSync(
      path.join(current, 'package.json'),
      JSON.stringify({ version: '1.4.0', bin: { 'ijfw-mcp': 'src/server.js' } }),
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
