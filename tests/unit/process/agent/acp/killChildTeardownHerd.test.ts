/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Windows teardown enumerates the process table ONCE per teardown, not once
 * per child.
 *
 * `win32ProcessTable` has always carried a 1s TTL cache and a comment promising
 * that "a teardown killing N children pays for ONE PowerShell". It did not: the
 * cache is written when a call FINISHES, and the caller that matters is
 * `killAllAgentChildren`, which reaps every registered child with
 * Promise.allSettled. All N reach the cache in the same tick, all miss, and all
 * spawn their own PowerShell.
 *
 * On a Windows CI runner that herd blew the 1500ms enumeration timeout, every
 * kill plan fell back to a blind taskkill, and the 2s before-quit budget for the
 * whole step was gone. The app recorded cleanup-failed and the v0.13.2 updater
 * observer refused the release on win32-x64 twice in a row.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

describe('Windows teardown does not spawn one PowerShell per child', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    vi.restoreAllMocks();
  });

  it('enumerates the process table once for a whole concurrent reap', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const TABLE = [
      '4242 4 C:\\Users\\t\\AppData\\Local\\Programs\\Wayland\\fuigo.exe',
      '4243 4 C:\\Windows\\System32\\where.exe',
      '4244 4 C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      '9999 4 C:\\Windows\\explorer.exe',
    ].join('\n');

    // The enumeration is deliberately SLOW, the way it is on a CI runner: every
    // concurrent caller is still inside it when the next one arrives, which is
    // the exact condition a completion-written cache cannot help with.
    const execFileMock = vi.fn((cmd: string, _args: string[], _opts: unknown, cb: (e: unknown, r: unknown) => void) => {
      if (cmd === 'powershell.exe') {
        setTimeout(() => cb(null, { stdout: TABLE, stderr: '' }), 40);
        return;
      }
      cb(null, { stdout: '', stderr: '' });
    });

    vi.doMock('child_process', async () => {
      const actual = await vi.importActual<typeof import('child_process')>('child_process');
      return { ...actual, execFile: execFileMock };
    });

    const { killChild } = await import('../../../../../src/process/agent/acp/utils');

    vi.spyOn(process, 'kill').mockImplementation(((pid: number) => {
      const err = new Error(`kill ESRCH ${pid}`) as NodeJS.ErrnoException;
      err.code = 'ESRCH';
      throw err;
    }) as typeof process.kill);

    const child = (pid: number) => ({ pid, kill: vi.fn() }) as unknown as import('child_process').ChildProcess;

    // Exactly what killAllAgentChildren does.
    await Promise.allSettled([
      killChild(child(4242), false),
      killChild(child(4243), false),
      killChild(child(4244), false),
    ]);

    const enumerations = execFileMock.mock.calls.filter((call) => call[0] === 'powershell.exe');
    expect(enumerations).toHaveLength(1);
    // And the kills still happened - a test that proves only "one PowerShell"
    // would also pass if the teardown had stopped killing anything.
    const killed = execFileMock.mock.calls
      .filter((call) => call[0] === 'taskkill')
      .flatMap((call) => (call[1] as string[]).filter((arg) => /^[0-9]+$/.test(arg)));
    expect(killed).toContain('4242');
    expect(killed).toContain('4243');
    expect(killed).toContain('4244');
    expect(killed).not.toContain('9999');
  });
});
