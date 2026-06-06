/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * RT-S1: secret-bearing atomic writes must not leave a world-readable temp
 * file during the rename window.
 *
 * POSIX: the temp file and final file are 0o600 (Node honors `mode`), and the
 *        temp file is a sibling of the target (so it inherits the restricted
 *        userData/config dir's perms, never a world-writable /tmp).
 * Windows: Node ignores `mode`, so the helper restricts the DACL of the temp
 *        file AND the final file to owner-only via `icacls`. We assert that
 *        code path is exercised (icacls is not runnable on the macOS CI host,
 *        so the child_process module is mocked and the spawn/exec call asserted).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import * as fsSync from 'fs';
import * as os from 'os';
import * as path from 'path';

// -- child_process mock: capture icacls invocations, never actually spawn ----
const { execFileSyncMock, spawnMock, spawnCalls } = vi.hoisted(() => {
  const spawnCalls: { cmd: string; args: string[] }[] = [];
  return {
    execFileSyncMock: vi.fn(),
    spawnCalls,
    spawnMock: vi.fn((cmd: string, args: string[]) => {
      spawnCalls.push({ cmd, args });
      const ee = new EventEmitter() as EventEmitter & { on: typeof EventEmitter.prototype.on };
      // Resolve the helper's Promise on next tick by firing 'close'.
      queueMicrotask(() => ee.emit('close', 0));
      return ee;
    }),
  };
});

vi.mock('child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('child_process')>();
  return {
    ...orig,
    execFileSync: execFileSyncMock,
    spawn: spawnMock,
  };
});

import { writeFileAtomic, writeFileSyncAtomic } from '../../../../src/process/utils/atomicWrite';

let tmpDir: string;
const realPlatform = process.platform;

const setPlatform = (value: NodeJS.Platform) => {
  Object.defineProperty(process, 'platform', { value, configurable: true });
};

beforeEach(() => {
  tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'rt-s1-'));
  execFileSyncMock.mockReset();
  spawnMock.mockClear();
  spawnCalls.length = 0;
});

afterEach(() => {
  setPlatform(realPlatform);
  fsSync.rmSync(tmpDir, { recursive: true, force: true });
});

describe('writeFileAtomic - RT-S1 secret confidentiality', () => {
  it('writes the temp file as a sibling of the target (in the restricted dir, not /tmp)', async () => {
    const target = path.join(tmpDir, 'wayland-config.txt');
    let observedTmp: string | undefined;
    const origWrite = fsSync.promises.writeFile.bind(fsSync.promises);
    const spy = vi.spyOn(fsSync.promises, 'writeFile').mockImplementation(async (p, ...rest) => {
      observedTmp = String(p);
      // @ts-expect-error pass-through
      return origWrite(p, ...rest);
    });

    await writeFileAtomic(target, 'secret', { mode: 0o600 });

    expect(observedTmp).toBeDefined();
    // Same directory as the target → inherits the restricted parent ACL/perms.
    expect(path.dirname(observedTmp!)).toBe(tmpDir);
    expect(path.basename(observedTmp!)).toContain('wayland-config.txt.tmp-');
    spy.mockRestore();
  });

  it('preserves 0o600 on POSIX for the final file', async () => {
    if (realPlatform === 'win32') return; // perms not meaningful on Windows
    const target = path.join(tmpDir, 'secret.txt');
    await writeFileAtomic(target, 'secret', { mode: 0o600 });
    const mode = fsSync.statSync(target).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('does NOT touch the Windows DACL when no owner-only mode requested', async () => {
    setPlatform('win32');
    const target = path.join(tmpDir, 'plain.txt');
    await writeFileAtomic(target, 'not-secret', 'utf-8');
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('restricts the DACL of BOTH temp and final file on Windows for secret writes', async () => {
    setPlatform('win32');
    const target = path.join(tmpDir, 'secret.txt');
    await writeFileAtomic(target, 'secret', { mode: 0o600 });

    // icacls invoked twice: once for the temp file, once for the final file.
    const icaclsCalls = spawnCalls.filter((c) => c.cmd === 'icacls');
    expect(icaclsCalls.length).toBe(2);
    for (const call of icaclsCalls) {
      expect(call.args).toContain('/inheritance:r');
      expect(call.args).toContain('/grant:r');
      expect(call.args).toContain('*S-1-3-4:F');
    }
    // One call targets a .tmp- sibling, one targets the final path.
    expect(icaclsCalls.some((c) => c.args[0].includes('.tmp-'))).toBe(true);
    expect(icaclsCalls.some((c) => c.args[0] === target)).toBe(true);
  });
});

describe('writeFileSyncAtomic - RT-S1 secret confidentiality', () => {
  it('preserves 0o600 on POSIX', () => {
    if (realPlatform === 'win32') return;
    const target = path.join(tmpDir, 'sync-secret.txt');
    writeFileSyncAtomic(target, 'secret', { mode: 0o600 });
    const mode = fsSync.statSync(target).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('restricts the DACL via icacls (execFileSync) on Windows for secret writes', () => {
    setPlatform('win32');
    const target = path.join(tmpDir, 'sync-secret.txt');
    writeFileSyncAtomic(target, 'secret', { mode: 0o600 });

    const icaclsCalls = execFileSyncMock.mock.calls.filter((c) => c[0] === 'icacls');
    expect(icaclsCalls.length).toBe(2);
    for (const call of icaclsCalls) {
      const args = call[1] as string[];
      expect(args).toContain('/inheritance:r');
      expect(args).toContain('*S-1-3-4:F');
    }
  });

  it('does NOT touch the Windows DACL for plain (non-secret) sync writes', () => {
    setPlatform('win32');
    const target = path.join(tmpDir, 'sync-plain.txt');
    writeFileSyncAtomic(target, 'not-secret', 'utf-8');
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });
});
