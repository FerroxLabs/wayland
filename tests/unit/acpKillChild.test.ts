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

  it('enumerates the tree, prunes it, and kills the survivors WITHOUT /T', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    // pid ppid path - the same row shape as `ps -eo pid=,ppid=,comm=`, which is
    // why one parser serves both platforms. 5000/5001 are the exempt chart.
    const TABLE = [
      '4242 4 C:\\Users\\t\\AppData\\Local\\Programs\\Wayland\\wayland-core.exe',
      '4300 4242 C:\\Program Files\\nodejs\\node.exe',
      '5000 4300 C:\\Program Files\\WindowsApps\\TradingView.Desktop_3.1.0_x64__v\\TradingView.exe',
      '5001 5000 C:\\Program Files\\WindowsApps\\TradingView.Desktop_3.1.0_x64__v\\TradingView.exe',
      '4400 4242 C:\\Windows\\System32\\cmd.exe',
      '9999 4 C:\\Windows\\explorer.exe',
    ].join('\n');

    // promisify(execFileCb) wraps a callback-style fn - so the mock must call back.
    const execFileMock = vi.fn(
      (cmd: string, _args: string[], _opts: unknown, cb: (e: unknown, r: unknown) => void) => {
        cb(null, { stdout: cmd === 'powershell.exe' ? TABLE : '', stderr: '' });
      }
    );

    vi.doMock('child_process', async () => {
      const actual = await vi.importActual<typeof import('child_process')>('child_process');
      return { ...actual, execFile: execFileMock };
    });

    const { killChild: winKillChild } = await import('../../src/process/agent/acp/utils');

    const kill = vi.fn();
    const fakeChild = { pid: 4242, kill } as unknown as import('child_process').ChildProcess;

    // After taskkill, killChild proves the tree is gone via isProcessAlive,
    // which probes the REAL OS with `process.kill(pid, 0)`. PID 4242 is made up,
    // so on a host that happens to own that PID the probe reports it alive and
    // this test fails on an unrelated assertion - which is exactly how it failed
    // on a macOS runner. Pin the probe to "not alive" so the taskkill argument
    // vector below is what decides the result.
    vi.spyOn(process, 'kill').mockImplementation(((pid: number) => {
      const err = new Error(`kill ESRCH ${pid}`) as NodeJS.ErrnoException;
      err.code = 'ESRCH';
      throw err;
    }) as typeof process.kill);

    await winKillChild(fakeChild, true);

    // Call 0 enumerates. Pinning the binary stops a silent regression to `wmic`,
    // which is REMOVED from Windows 11 24H2 and would fail on a modern host.
    const [enumCmd, enumArgs] = execFileMock.mock.calls[0];
    expect(enumCmd).toBe('powershell.exe');
    expect(enumArgs.join(' ')).toContain('Get-CimInstance Win32_Process');
    expect(enumArgs.join(' ')).not.toContain('wmic');

    // Call 1 kills the pruned set. THIS is the load-bearing assertion: no /T,
    // because the tree walk is ours and the chart must not be handed to taskkill.
    const [killCmd, killArgs, killOpts] = execFileMock.mock.calls[1];
    expect(killCmd).toBe('taskkill');
    expect(killArgs).not.toContain('/T');
    expect(killOpts).toMatchObject({ windowsHide: true, timeout: 5000 });

    const killedPids = killArgs.filter((a: string) => /^[0-9]+$/.test(a));
    expect(killedPids).toContain('4242'); // the engine root
    expect(killedPids).toContain('4300'); // ordinary descendant
    expect(killedPids).toContain('4400'); // ordinary descendant
    expect(killedPids).not.toContain('5000'); // TradingView - spared
    expect(killedPids).not.toContain('5001'); // its helper - spared
    expect(killedPids).not.toContain('9999'); // outside the tree entirely

    // On Windows we never fall through to child.kill() / process-group signals.
    expect(kill).not.toHaveBeenCalled();
  });

  it('fails closed when taskkill cannot prove whole-tree shutdown', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    // Enumeration fails too, so this exercises the documented fallback to the
    // previous shipped behaviour AND the error surface on top of it.
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

    await expect(winKillChild(fakeChild, false)).rejects.toThrow(
      'ACP process-tree shutdown failed for PID 99: taskkill: process not found'
    );
    // Two calls now: the enumeration attempt, then the fallback taskkill. The
    // fallback is deliberate - failing closed here would regress #139 on any
    // host where PowerShell is blocked by policy.
    expect(execFileMock).toHaveBeenCalledTimes(2);
    expect(execFileMock.mock.calls[1][0]).toBe('taskkill');
    expect(execFileMock.mock.calls[1][1]).toEqual(['/PID', '99', '/T', '/F']);
  });

  it('fails closed before signalling when POSIX process-tree enumeration fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const execFileMock = vi.fn(
      (_cmd: string, _args: string[], _opts: unknown, cb: (e: unknown, r: unknown) => void) => {
        cb(new Error('ps unavailable'), null);
      }
    );

    vi.doMock('child_process', async () => {
      const actual = await vi.importActual<typeof import('child_process')>('child_process');
      return { ...actual, execFile: execFileMock };
    });

    const { killChild: posixKillChild } = await import('../../src/process/agent/acp/utils');
    const fakeChild = { pid: 4242, kill: vi.fn() } as unknown as import('child_process').ChildProcess;

    await expect(posixKillChild(fakeChild, false)).rejects.toThrow('Unable to enumerate ACP process tree for PID 4242');
    expect(fakeChild.kill).not.toHaveBeenCalled();
  });

  it('rejects when taskkill returns success without actually stopping the process', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    vi.useFakeTimers();

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
    const fakeChild = {
      pid: process.pid,
      kill: vi.fn(),
    } as unknown as import('child_process').ChildProcess;

    try {
      const shutdown = winKillChild(fakeChild, true);
      const rejected = expect(shutdown).rejects.toThrow(`ACP process ${process.pid} is still alive after taskkill`);
      await vi.advanceTimersByTimeAsync(2_100);
      await rejected;
    } finally {
      vi.useRealTimers();
    }
  });
});
