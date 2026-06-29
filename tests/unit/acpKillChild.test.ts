import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { spawn } from 'child_process';
import { killChild, isProcessAlive } from '../../src/process/agent/acp/utils';

// The process-tree tests below rely on POSIX commands (sleep, bash, pgrep)
// unavailable on Windows, so they are gated to POSIX. The Windows taskkill
// branch is NOT left to "the implementation itself" - it is asserted directly
// in the cross-platform `killChild on Windows` block at the bottom of this file,
// which pins process.platform = 'win32' and mocks execFile so it runs (and
// proves the taskkill arguments) on every CI host, not only Windows.
const describeIfPosix = process.platform === 'win32' ? describe.skip : describe;

describeIfPosix('killChild', () => {
  it('kills a normal child process with SIGTERM', async () => {
    const child = spawn('sleep', ['60']);
    expect(child.pid).toBeDefined();
    expect(isProcessAlive(child.pid!)).toBe(true);

    await killChild(child, false);

    expect(isProcessAlive(child.pid!)).toBe(false);
  });

  it('kills a detached process group', async () => {
    const child = spawn('sleep', ['60'], { detached: true });
    child.unref();
    expect(child.pid).toBeDefined();
    expect(isProcessAlive(child.pid!)).toBe(true);

    await killChild(child, true);

    expect(isProcessAlive(child.pid!)).toBe(false);
  });

  it('escalates to SIGKILL when process ignores SIGTERM', async () => {
    // Spawn a process that traps SIGTERM (ignores it)
    const child = spawn('bash', ['-c', 'trap "" TERM; sleep 60']);
    expect(child.pid).toBeDefined();

    // Wait for bash to set up the trap
    await new Promise((r) => setTimeout(r, 200));
    expect(isProcessAlive(child.pid!)).toBe(true);

    // Short SIGTERM grace (250ms) so this real-process escalation test does not
    // pay the full 3s production default (#358); the SIGKILL path is identical.
    await killChild(child, false, 250);

    // Should be dead via SIGKILL escalation
    expect(isProcessAlive(child.pid!)).toBe(false);
  });

  it('cleans up child processes spawned by the target', async () => {
    // Parent spawns a child that also spawns a grandchild
    const parent = spawn('bash', ['-c', 'sleep 60 & sleep 60 & wait'], { detached: true });
    parent.unref();
    expect(parent.pid).toBeDefined();

    // Wait for children to spawn
    await new Promise((r) => setTimeout(r, 300));

    // Collect child PIDs before kill
    const { execFile: execFileCb } = await import('child_process');
    const { promisify } = await import('util');
    const execFile = promisify(execFileCb);

    let childPids: number[] = [];
    try {
      const { stdout } = await execFile('pgrep', ['-P', String(parent.pid!)]);
      childPids = stdout
        .trim()
        .split('\n')
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n));
    } catch {
      // no children found
    }

    expect(childPids.length).toBeGreaterThan(0);

    await killChild(parent, true);

    // All descendants should be dead
    expect(isProcessAlive(parent.pid!)).toBe(false);
    for (const pid of childPids) {
      expect(isProcessAlive(pid)).toBe(false);
    }
  });
});

// Windows kill path: `taskkill /PID <pid> /T /F` tree-kill. This cannot use the
// POSIX spawn/pgrep machinery above, but it must still be asserted - leaving it
// to "the implementation itself" is exactly the kind of unverified win32 branch
// the no-skips pass exists to close. We pin process.platform = 'win32' and mock
// execFile so the assertion runs on every host (macOS/Linux CI included), proving
// the exact taskkill argument vector and that the POSIX descendant-collection
// path is never entered on Windows.
describe('killChild on Windows (taskkill tree-kill)', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    vi.restoreAllMocks();
  });

  it('invokes taskkill /PID <pid> /T /F with windowsHide and never touches the POSIX ps/pgrep path', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    // promisify(execFileCb) wraps a callback-style fn - so the mock must call back.
    const execFileMock = vi.fn(
      (_cmd: string, _args: string[], _opts: unknown, cb: (e: unknown, r: unknown) => void) => {
        cb(null, { stdout: '', stderr: '' });
      }
    );

    vi.doMock('child_process', async () => {
      const actual = await vi.importActual<typeof import('child_process')>('child_process');
      return { ...actual, execFile: execFileMock };
    });

    const { killChild: winKillChild } = await import('../../src/process/agent/acp/utils');

    const kill = vi.fn();
    const fakeChild = { pid: 4242, kill } as unknown as import('child_process').ChildProcess;

    await winKillChild(fakeChild, true);

    // Exactly one execFile call - the taskkill tree-kill. The POSIX path would
    // have called execFile('ps', ...) to collect descendants; it must not run.
    expect(execFileMock).toHaveBeenCalledTimes(1);
    const [cmd, args, opts] = execFileMock.mock.calls[0];
    expect(cmd).toBe('taskkill');
    expect(args).toEqual(['/PID', '4242', '/T', '/F']);
    expect(opts).toMatchObject({ windowsHide: true, timeout: 5000 });

    // On Windows we never fall through to child.kill() / process-group signals.
    expect(kill).not.toHaveBeenCalled();
  });

  it('swallows a taskkill failure without throwing (best-effort kill)', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const execFileMock = vi.fn(
      (_cmd: string, _args: string[], _opts: unknown, cb: (e: unknown, r: unknown) => void) => {
        cb(new Error('taskkill: process not found'), null);
      }
    );

    vi.doMock('child_process', async () => {
      const actual = await vi.importActual<typeof import('child_process')>('child_process');
      return { ...actual, execFile: execFileMock };
    });

    const { killChild: winKillChild } = await import('../../src/process/agent/acp/utils');

    const fakeChild = { pid: 99, kill: vi.fn() } as unknown as import('child_process').ChildProcess;

    // A dead/unkillable PID must not crash the caller.
    await expect(winKillChild(fakeChild, false)).resolves.toBeUndefined();
    expect(execFileMock).toHaveBeenCalledTimes(1);
  });
});
