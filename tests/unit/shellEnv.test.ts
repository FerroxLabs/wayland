/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for src/process/utils/shellEnv.ts
 *
 * Verifies that:
 * 1. mergePaths correctly combines PATH strings without duplicates
 * 2. getEnhancedEnv always includes process.env.PATH (critical for workers)
 * 3. Windows extra tool paths are detected and appended
 * 4. Shell environment is loaded and merged on macOS/Linux
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';

const mocks = vi.hoisted(() => ({
  isPackaged: vi.fn(() => false),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      isPackaged: () => mocks.isPackaged(),
    },
  }),
}));

// -------------------------------------------------------------------
// 1. Pure-logic tests for mergePaths (no Electron, no mocking needed)
// -------------------------------------------------------------------
describe('mergePaths', () => {
  // Dynamic import after resetModules is NOT needed for this pure function
  // but we still import lazily so module cache is shared within this describe
  it('merges two PATH strings deduplicating common entries', async () => {
    const { mergePaths } = await import('@process/utils/shellEnv');
    const sep = process.platform === 'win32' ? ';' : ':';
    const p1 = ['/usr/bin', '/usr/local/bin'].join(sep);
    const p2 = ['/usr/local/bin', '/opt/homebrew/bin'].join(sep);
    const result = mergePaths(p1, p2);
    const parts = result.split(sep);
    // No duplicates
    expect(new Set(parts).size).toBe(parts.length);
    // Original order preserved (p1 first)
    expect(parts[0]).toBe('/usr/bin');
    expect(parts).toContain('/opt/homebrew/bin');
  });

  it('handles undefined first arg', async () => {
    const { mergePaths } = await import('@process/utils/shellEnv');
    const result = mergePaths(undefined, '/usr/bin');
    expect(result).toBe('/usr/bin');
  });

  it('handles undefined second arg', async () => {
    const { mergePaths } = await import('@process/utils/shellEnv');
    const result = mergePaths('/usr/bin', undefined);
    expect(result).toBe('/usr/bin');
  });

  it('handles both args undefined', async () => {
    const { mergePaths } = await import('@process/utils/shellEnv');
    expect(mergePaths(undefined, undefined)).toBe('');
  });

  it('preserves Windows semicolon separator', async () => {
    if (process.platform !== 'win32') return;
    const { mergePaths } = await import('@process/utils/shellEnv');
    const result = mergePaths('C:\\Windows\\System32', 'C:\\Users\\test\\AppData\\Roaming\\npm');
    // Entries must be separated by ; on Windows
    const parts = result.split(';');
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe('C:\\Windows\\System32');
    expect(parts[1]).toBe('C:\\Users\\test\\AppData\\Roaming\\npm');
  });
});

// -------------------------------------------------------------------
// 2. getEnhancedEnv – verify it always includes process.env.PATH
//    (This is the core requirement for the worker fix)
// -------------------------------------------------------------------
describe('getEnhancedEnv', () => {
  const SENTINEL_PATH = '/sentinel-test-path/bin';
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Some tests below pin process.platform to exercise the POSIX shell-merge
    // path deterministically on every CI host. Always restore so a pinned value
    // never leaks into the win32-only tests later in this file.
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('includes process.env.PATH in the returned env (macOS/Linux, shell skipped via mock)', async () => {
    // Simulate shell that returns an empty env (shell not available / times out)
    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('shell not available');
      }),
      execFile: vi.fn(),
    }));

    const originalPath = process.env.PATH;
    process.env.PATH = SENTINEL_PATH;

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.PATH).toContain(SENTINEL_PATH);
    process.env.PATH = originalPath;
  });

  it('merges shell PATH with process.env.PATH (macOS/Linux, shell returns extra path)', async () => {
    // Pin darwin so this POSIX shell-merge assertion runs on EVERY host,
    // including Windows CI - rather than silently returning early there.
    // The win32 counterpart (shell loading is skipped) is asserted separately
    // in the 'skips shell env loading on Windows' test below.
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const SHELL_EXTRA = '/nvm/versions/node/v22/bin';
    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockReturnValue(`PATH=${SHELL_EXTRA}:/usr/bin\nHOME=/home/user\n`),
      execFile: vi.fn(),
    }));

    const originalPath = process.env.PATH;
    const originalShell = process.env.SHELL;
    process.env.PATH = '/usr/local/bin';
    process.env.SHELL = '/bin/bash';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    // Must contain both the process PATH and the shell PATH
    expect(result.PATH).toContain('/usr/local/bin');
    expect(result.PATH).toContain(SHELL_EXTRA);
    // No duplicates of /usr/bin
    const sep = ':';
    const parts = result.PATH.split(sep);
    expect(parts.filter((p) => p === '/usr/bin').length).toBeLessThanOrEqual(1);

    process.env.PATH = originalPath;
    process.env.SHELL = originalShell;
  });

  it('merges customEnv.PATH with both process.env.PATH and shell PATH', async () => {
    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip shell');
      }),
      execFile: vi.fn(),
    }));

    const originalPath = process.env.PATH;
    process.env.PATH = '/usr/bin';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv({ PATH: '/custom/tools/bin' });

    expect(result.PATH).toContain('/usr/bin');
    expect(result.PATH).toContain('/custom/tools/bin');
    process.env.PATH = originalPath;
  });

  it('returns an object where all values are strings (not undefined)', async () => {
    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip shell');
      }),
      execFile: vi.fn(),
    }));

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();
    expect(typeof result.PATH).toBe('string');
    // Spot-check: no undefined string values were injected
    for (const [k, v] of Object.entries(result)) {
      expect(typeof v).toBe('string');
    }
  });
});

// -------------------------------------------------------------------
// #628 - version-manager node (nvm/volta/fnm) PATH + env on macOS/Linux.
//   A Finder/Dock launch has a login-only shell whose PATH misses the
//   interactive-rc node dir; getEnhancedEnv must append the version-manager
//   node bin and capture NVM_DIR / VOLTA_HOME.
// -------------------------------------------------------------------
describe('getEnhancedEnv version-manager node (#628)', () => {
  // Build every path with path.join so the mock keys use the SAME separators as
  // the code under test (which uses path.join). The code spoofs platform to
  // 'darwin', but path.join still follows the REAL runner OS (backslashes on
  // Windows), so hardcoded forward-slash literals would never match there.
  const HOME = '/home/tester';
  const NVM_DIR = path.join(HOME, '.nvm');
  const NVM_NODE_BASE = path.join(NVM_DIR, 'versions', 'node');
  const NVM_BIN = path.join(NVM_NODE_BASE, 'v20.11.0', 'bin');
  const NVM_NODE = path.join(NVM_BIN, 'node');
  const VOLTA_DIR = path.join(HOME, '.volta');
  const VOLTA_BIN = path.join(VOLTA_DIR, 'bin');
  const originalPlatform = process.platform;
  let savedNvmDir: string | undefined;
  let savedVoltaHome: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    // findSuitableNodeBin derives its nvm search base from process.env.NVM_DIR
    // (falling back to ~/.nvm). A runner/leaked NVM_DIR would point the base
    // away from the mocked dirs and defeat the append. Neutralize both vars so
    // these tests are deterministic regardless of the ambient env or ordering.
    savedNvmDir = process.env.NVM_DIR;
    savedVoltaHome = process.env.VOLTA_HOME;
    delete process.env.NVM_DIR;
    delete process.env.VOLTA_HOME;
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    if (savedNvmDir === undefined) delete process.env.NVM_DIR;
    else process.env.NVM_DIR = savedNvmDir;
    if (savedVoltaHome === undefined) delete process.env.VOLTA_HOME;
    else process.env.VOLTA_HOME = savedVoltaHome;
  });

  // Mock os.homedir + fs so the version-manager dirs "exist"; the login shell
  // returns a PATH WITHOUT the nvm node dir (the Finder-launch condition).
  const mockManagerFs = (present: Set<string>) => {
    vi.doMock('os', async () => {
      const actual = await vi.importActual<typeof import('os')>('os');
      return { ...actual, default: { ...actual, homedir: () => HOME }, homedir: () => HOME };
    });
    vi.doMock('child_process', () => ({
      // login shell PATH deliberately omits the nvm bin (the bug condition)
      execFileSync: vi.fn().mockReturnValue('PATH=/usr/bin:/bin\nHOME=/home/tester\n'),
      execFile: vi.fn(),
    }));
    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn((p: string) => present.has(p)),
        readdirSync: vi.fn((p: string) => (p === NVM_NODE_BASE ? ['v20.11.0'] : [])),
        accessSync: vi.fn((p: string) => {
          if (!present.has(p)) throw new Error('ENOENT');
        }),
      };
    });
  };

  it('appends the nvm versioned node bin dir to PATH', async () => {
    mockManagerFs(new Set([NVM_DIR, NVM_NODE_BASE, NVM_BIN, NVM_NODE]));
    const originalPath = process.env.PATH;
    process.env.PATH = '/usr/bin';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.PATH).toContain(NVM_BIN);
    process.env.PATH = originalPath;
  });

  it('appends the volta shim dir to PATH when present', async () => {
    mockManagerFs(new Set([VOLTA_DIR, VOLTA_BIN]));
    const originalPath = process.env.PATH;
    process.env.PATH = '/usr/bin';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.PATH).toContain(VOLTA_BIN);
    process.env.PATH = originalPath;
  });

  it('captures NVM_DIR and VOLTA_HOME when the dirs exist and the vars are unset', async () => {
    mockManagerFs(new Set([NVM_DIR, VOLTA_DIR, VOLTA_BIN, NVM_NODE_BASE, NVM_BIN, NVM_NODE]));
    const prevNvm = process.env.NVM_DIR;
    const prevVolta = process.env.VOLTA_HOME;
    delete process.env.NVM_DIR;
    delete process.env.VOLTA_HOME;

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.NVM_DIR).toBe(NVM_DIR);
    expect(result.VOLTA_HOME).toBe(VOLTA_DIR);
    if (prevNvm === undefined) delete process.env.NVM_DIR;
    else process.env.NVM_DIR = prevNvm;
    if (prevVolta === undefined) delete process.env.VOLTA_HOME;
    else process.env.VOLTA_HOME = prevVolta;
  });

  it('does NOT override an existing NVM_DIR from the environment', async () => {
    mockManagerFs(new Set([NVM_DIR, NVM_NODE_BASE, NVM_BIN, NVM_NODE]));
    const prevNvm = process.env.NVM_DIR;
    process.env.NVM_DIR = '/custom/nvm';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.NVM_DIR).toBe('/custom/nvm');
    if (prevNvm === undefined) delete process.env.NVM_DIR;
    else process.env.NVM_DIR = prevNvm;
  });

  it('adds nothing when no version manager is installed', async () => {
    mockManagerFs(new Set()); // nothing exists
    const originalPath = process.env.PATH;
    process.env.PATH = '/usr/bin';
    const prevNvm = process.env.NVM_DIR;
    const prevVolta = process.env.VOLTA_HOME;
    delete process.env.NVM_DIR;
    delete process.env.VOLTA_HOME;

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.PATH).toContain('/usr/bin');
    expect(result.NVM_DIR).toBeUndefined();
    expect(result.VOLTA_HOME).toBeUndefined();

    process.env.PATH = originalPath;
    if (prevNvm !== undefined) process.env.NVM_DIR = prevNvm;
    if (prevVolta !== undefined) process.env.VOLTA_HOME = prevVolta;
  });
});

// -------------------------------------------------------------------
// 3. Windows extra tool path detection
//    getWindowsExtraToolPaths() is private, but its effect is visible
//    through getEnhancedEnv() on win32.
// -------------------------------------------------------------------
describe('getEnhancedEnv Windows extra paths', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('appends npm global path on Windows when it exists and is not in PATH', async () => {
    if (process.platform !== 'win32') return; // Only meaningful on Windows

    const NPM_GLOBAL = 'C:\\Users\\test\\AppData\\Roaming\\npm';

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn((p: string) => p === NPM_GLOBAL),
        readdirSync: vi.fn(() => []),
        accessSync: vi.fn(),
      };
    });

    const originalPath = process.env.PATH;
    const originalAppData = process.env.APPDATA;
    process.env.PATH = 'C:\\Windows\\System32'; // Does NOT contain npm global
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.PATH).toContain(NPM_GLOBAL);

    process.env.PATH = originalPath;
    process.env.APPDATA = originalAppData;
  });

  it('does not duplicate npm global path if already in PATH on Windows', async () => {
    if (process.platform !== 'win32') return;

    const NPM_GLOBAL = 'C:\\Users\\test\\AppData\\Roaming\\npm';

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn((p: string) => p === NPM_GLOBAL),
        readdirSync: vi.fn(() => []),
        accessSync: vi.fn(),
      };
    });

    const originalPath = process.env.PATH;
    const originalAppData = process.env.APPDATA;
    // npm global IS already in PATH
    process.env.PATH = `C:\\Windows\\System32;${NPM_GLOBAL}`;
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    const occurrences = result.PATH.split(';').filter((p) => p === NPM_GLOBAL).length;
    expect(occurrences).toBe(1);

    process.env.PATH = originalPath;
    process.env.APPDATA = originalAppData;
  });
});

// -------------------------------------------------------------------
// 4. Windows extra tool path detection (cross-platform, mocked platform)
//    Verifies that getWindowsExtraToolPaths() appends Git, Chocolatey,
//    and other tool paths. Runs on any OS by mocking process.platform.
// -------------------------------------------------------------------
describe('getEnhancedEnv Windows extra paths (cross-platform mock)', () => {
  const originalPlatform = process.platform;
  const originalArch = process.arch;
  const originalPath = process.env.PATH;
  const originalAppData = process.env.APPDATA;
  const originalLocalAppData = process.env.LOCALAPPDATA;
  const originalProgramFiles = process.env.ProgramFiles;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    Object.defineProperty(process, 'arch', { value: originalArch });
    process.env.PATH = originalPath;
    process.env.APPDATA = originalAppData;
    process.env.LOCALAPPDATA = originalLocalAppData;
    process.env.ProgramFiles = originalProgramFiles;
  });

  it('appends Git for Windows paths when they exist (cygpath fix)', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    process.env.PATH = 'C:\\Windows\\System32';
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
    process.env.LOCALAPPDATA = 'C:\\Users\\test\\AppData\\Local';
    process.env.ProgramFiles = 'C:\\Program Files';

    // Use path.join to compute expected paths - on macOS path.join uses '/'
    // but the source code also uses path.join, so they will match.
    const GIT_USR_BIN = path.join('C:\\Program Files', 'Git', 'usr', 'bin');
    const GIT_CMD = path.join('C:\\Program Files', 'Git', 'cmd');

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn((p: string) => p === GIT_USR_BIN || p === GIT_CMD),
        readdirSync: actual.readdirSync,
        accessSync: actual.accessSync,
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip shell');
      }),
      execFile: vi.fn(),
    }));

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    // PATH must include Git usr/bin (where cygpath lives) and Git cmd
    expect(result.PATH).toContain(GIT_USR_BIN);
    expect(result.PATH).toContain(GIT_CMD);
  });

  it('appends Chocolatey bin when it exists', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    process.env.PATH = 'C:\\Windows\\System32';
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
    process.env.LOCALAPPDATA = 'C:\\Users\\test\\AppData\\Local';
    process.env.ProgramFiles = 'C:\\Program Files';

    const CHOCO_BIN = path.join('C:\\ProgramData\\chocolatey', 'bin');

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn((p: string) => p === CHOCO_BIN),
        readdirSync: actual.readdirSync,
        accessSync: actual.accessSync,
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip shell');
      }),
      execFile: vi.fn(),
    }));

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    expect(result.PATH).toContain(CHOCO_BIN);
  });

  it('does not append paths that are already in PATH', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const GIT_USR_BIN = path.join('C:\\Program Files', 'Git', 'usr', 'bin');
    // Git usr/bin is already in PATH
    process.env.PATH = `C:\\Windows\\System32;${GIT_USR_BIN}`;
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
    process.env.LOCALAPPDATA = 'C:\\Users\\test\\AppData\\Local';
    process.env.ProgramFiles = 'C:\\Program Files';

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn((p: string) => p === GIT_USR_BIN),
        readdirSync: actual.readdirSync,
        accessSync: actual.accessSync,
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip shell');
      }),
      execFile: vi.fn(),
    }));

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const result = getEnhancedEnv();

    // Should appear exactly once (from process.env.PATH), not duplicated
    const occurrences = result.PATH.split(';').filter((p) => p === GIT_USR_BIN).length;
    expect(occurrences).toBe(1);
  });

  it('skips shell env loading on Windows and relies on extra tool paths', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    // Pin arch so this test exercises the Windows x64 path deterministically on
    // every host (CI runners are arm64 on macOS, x64 on Linux). Without this the
    // x64-only bundled-bun AVX2 probe fires only on x64 hosts, making the test
    // host-arch-sensitive.
    Object.defineProperty(process, 'arch', { value: 'x64' });
    process.env.PATH = 'C:\\Windows\\System32';
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
    process.env.LOCALAPPDATA = 'C:\\Users\\test\\AppData\\Local';
    process.env.ProgramFiles = 'C:\\Program Files';

    const execFileSync = vi.fn();

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn(() => false),
        readdirSync: actual.readdirSync,
        accessSync: actual.accessSync,
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync,
      execFile: vi.fn(),
    }));

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    getEnhancedEnv();

    // Shell environment loading must be skipped on Windows. The only permitted
    // execFileSync call is the cached one-shot AVX2 capability probe (powershell
    // `[Avx2]::IsSupported`) used to pick the bundled bun build - that is not
    // shell-env loading. Assert no shell-loading subprocess was spawned.
    const shellEnvCalls = execFileSync.mock.calls.filter((call) => !JSON.stringify(call).includes('Avx2'));
    expect(shellEnvCalls).toEqual([]);
  });
});

describe('resolveNpxPath', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('prefers the bundled bun binary on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const { resolveNpxPath } = await import('@process/utils/shellEnv');
    const result = resolveNpxPath({ PATH: '/tooling' });

    expect(result.endsWith('bun.exe')).toBe(true);
  });

  it('falls back to bun.exe when bundled bun is unavailable on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn(() => false),
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn(),
      execFile: vi.fn(),
    }));

    const { resolveNpxPath } = await import('@process/utils/shellEnv');

    expect(resolveNpxPath({ PATH: '/tooling' })).toBe('bun.exe');
  });
});

describe('resolveNpxDirect', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('returns null on non-Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn(),
      execFile: vi.fn(),
    }));

    const { resolveNpxDirect } = await import('@process/utils/shellEnv');
    expect(resolveNpxDirect({ PATH: '/usr/bin' })).toBeNull();
  });

  it('returns nodePath and npxScript on Windows when npm is present', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const execFileSync = vi
      .fn()
      .mockReturnValueOnce(`${path.join('/tooling', 'node.exe')}\n`)
      .mockReturnValueOnce('10.9.0\n');

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn(() => true),
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync,
      execFile: vi.fn(),
    }));

    const { resolveNpxDirect } = await import('@process/utils/shellEnv');
    const result = resolveNpxDirect({ PATH: '/tooling' });
    expect(result).toEqual({
      nodePath: path.join('/tooling', 'node.exe'),
      npxScript: path.join('/tooling', 'node_modules', 'npm', 'bin', 'npx-cli.js'),
    });
  });

  it('returns null when npm scripts are missing on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const execFileSync = vi.fn().mockReturnValueOnce(`${path.join('/tooling', 'node.exe')}\n`);

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn(() => false),
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync,
      execFile: vi.fn(),
    }));

    const { resolveNpxDirect } = await import('@process/utils/shellEnv');
    expect(resolveNpxDirect({ PATH: '/tooling' })).toBeNull();
  });

  it('returns null when where command throws on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const execFileSync = vi.fn().mockImplementation(() => {
      throw new Error('where: command not found');
    });

    vi.doMock('child_process', () => ({
      execFileSync,
      execFile: vi.fn(),
    }));

    const { resolveNpxDirect } = await import('@process/utils/shellEnv');
    expect(resolveNpxDirect({ PATH: '/tooling' })).toBeNull();
  });

  it('returns null when npx version is too old on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const execFileSync = vi
      .fn()
      .mockReturnValueOnce(`${path.join('/tooling', 'node.exe')}\n`)
      .mockReturnValueOnce('6.14.0\n');

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        existsSync: vi.fn(() => true),
      };
    });

    vi.doMock('child_process', () => ({
      execFileSync,
      execFile: vi.fn(),
    }));

    const { resolveNpxDirect } = await import('@process/utils/shellEnv');
    expect(resolveNpxDirect({ PATH: '/tooling' })).toBeNull();
  });
});

// -------------------------------------------------------------------
// 5. loadFullShellEnvironment - async, detached, with -i flag
// -------------------------------------------------------------------
describe('loadFullShellEnvironment', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('returns empty object on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip');
      }),
      execFile: vi.fn(),
      spawn: vi.fn(),
    }));

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    const result = await loadFullShellEnvironment();
    expect(result).toEqual({});
  });

  it('spawns shell with -i and -l flags in detached mode', async () => {
    // Pin darwin so the detached-spawn assertion runs on every host (incl.
    // Windows CI). On real win32 the impl early-returns {} - that branch is
    // covered by 'returns empty object on Windows' above. afterEach restores.
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const mockStdout = {
      on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
        if (event === 'data') {
          cb(Buffer.from('SSS_API_KEY=secret123\nPATH=/usr/bin\nHOME=/home/user'));
        }
      }),
    };
    const mockStderr = { on: vi.fn() };
    const mockChild = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') {
          // Defer to allow stdout data to be processed
          Promise.resolve().then(() => cb(0));
        }
      }),
      unref: vi.fn(),
      kill: vi.fn(),
    };

    const spawnMock = vi.fn().mockReturnValue(mockChild);

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip');
      }),
      execFile: vi.fn(),
      spawn: spawnMock,
    }));

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    const result = await loadFullShellEnvironment();

    // Verify spawn was called with -i -l flags and detached: true
    expect(spawnMock).toHaveBeenCalledWith(
      expect.any(String),
      ['-i', '-l', '-c', 'env'],
      expect.objectContaining({ detached: true })
    );

    // Verify unref was called (detached child should not keep parent alive)
    expect(mockChild.unref).toHaveBeenCalled();

    // Verify env vars are parsed (no whitelist filtering)
    expect(result.SSS_API_KEY).toBe('secret123');
    expect(result.PATH).toBe('/usr/bin');
    expect(result.HOME).toBe('/home/user');
  });

  it('returns cached result on second call', async () => {
    // Pin darwin so the dedup/caching assertion runs on every host. On real
    // win32 the impl returns {} without spawning, so the spawn-call-count
    // invariant only holds on the POSIX path. afterEach restores platform.
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const mockStdout = {
      on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from('FOO=bar\n'));
      }),
    };
    const mockStderr = { on: vi.fn() };
    const mockChild = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') Promise.resolve().then(() => cb(0));
      }),
      unref: vi.fn(),
      kill: vi.fn(),
    };

    const spawnMock = vi.fn().mockReturnValue(mockChild);

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip');
      }),
      execFile: vi.fn(),
      spawn: spawnMock,
    }));

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    const first = await loadFullShellEnvironment();
    const second = await loadFullShellEnvironment();

    expect(first).toBe(second);
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it('uses dscl-resolved shell on macOS (via resolveLoginShell)', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const execFileSync = vi.fn().mockReturnValue('UserShell: /opt/homebrew/bin/fish\n');
    const mockStdout = {
      on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from('PATH=/usr/bin\n'));
      }),
    };
    const mockStderr = { on: vi.fn() };
    const mockChild = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') Promise.resolve().then(() => cb(0));
      }),
      unref: vi.fn(),
      kill: vi.fn(),
    };
    const spawnMock = vi.fn().mockReturnValue(mockChild);

    vi.doMock('child_process', () => ({ execFileSync, execFile: vi.fn(), spawn: spawnMock }));
    vi.doMock('os', () => {
      const userInfo = vi.fn().mockReturnValue({ username: 'testuser' });
      const homedir = vi.fn().mockReturnValue('/Users/testuser');
      return { default: { userInfo, homedir }, userInfo, homedir };
    });

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    await loadFullShellEnvironment();

    expect(spawnMock).toHaveBeenCalledWith(
      '/opt/homebrew/bin/fish',
      ['-i', '-l', '-c', 'env'],
      expect.objectContaining({ detached: true })
    );
  });

  it('uses getent-resolved shell on Linux (via resolveLoginShell)', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const execFileSync = vi.fn().mockReturnValue('testuser:x:1000:1000:Test User:/home/testuser:/usr/bin/zsh\n');
    const mockStdout = {
      on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from('PATH=/usr/bin\n'));
      }),
    };
    const mockStderr = { on: vi.fn() };
    const mockChild = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') Promise.resolve().then(() => cb(0));
      }),
      unref: vi.fn(),
      kill: vi.fn(),
    };
    const spawnMock = vi.fn().mockReturnValue(mockChild);

    vi.doMock('child_process', () => ({ execFileSync, execFile: vi.fn(), spawn: spawnMock }));
    vi.doMock('os', () => {
      const userInfo = vi.fn().mockReturnValue({ username: 'testuser' });
      const homedir = vi.fn().mockReturnValue('/home/testuser');
      return { default: { userInfo, homedir }, userInfo, homedir };
    });

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    await loadFullShellEnvironment();

    expect(spawnMock).toHaveBeenCalledWith(
      '/usr/bin/zsh',
      ['-i', '-l', '-c', 'env'],
      expect.objectContaining({ detached: true })
    );
  });

  it('falls back to /bin/zsh on macOS when dscl fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const execFileSync = vi.fn().mockImplementation(() => {
      throw new Error('dscl failed');
    });
    const mockStdout = {
      on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from('PATH=/usr/bin\n'));
      }),
    };
    const mockStderr = { on: vi.fn() };
    const mockChild = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') Promise.resolve().then(() => cb(0));
      }),
      unref: vi.fn(),
      kill: vi.fn(),
    };
    const spawnMock = vi.fn().mockReturnValue(mockChild);

    vi.doMock('child_process', () => ({ execFileSync, execFile: vi.fn(), spawn: spawnMock }));
    vi.doMock('os', () => {
      const userInfo = vi.fn().mockReturnValue({ username: 'testuser' });
      const homedir = vi.fn().mockReturnValue('/Users/testuser');
      return { default: { userInfo, homedir }, userInfo, homedir };
    });

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    await loadFullShellEnvironment();

    expect(spawnMock).toHaveBeenCalledWith(
      '/bin/zsh',
      ['-i', '-l', '-c', 'env'],
      expect.objectContaining({ detached: true })
    );
  });

  it('falls back to /bin/bash on Linux when getent fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const execFileSync = vi.fn().mockImplementation(() => {
      throw new Error('getent failed');
    });
    const mockStdout = {
      on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from('PATH=/usr/bin\n'));
      }),
    };
    const mockStderr = { on: vi.fn() };
    const mockChild = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') Promise.resolve().then(() => cb(0));
      }),
      unref: vi.fn(),
      kill: vi.fn(),
    };
    const spawnMock = vi.fn().mockReturnValue(mockChild);

    vi.doMock('child_process', () => ({ execFileSync, execFile: vi.fn(), spawn: spawnMock }));
    vi.doMock('os', () => {
      const userInfo = vi.fn().mockReturnValue({ username: 'testuser' });
      const homedir = vi.fn().mockReturnValue('/home/testuser');
      return { default: { userInfo, homedir }, userInfo, homedir };
    });

    const { loadFullShellEnvironment } = await import('@process/utils/shellEnv');
    await loadFullShellEnvironment();

    expect(spawnMock).toHaveBeenCalledWith(
      '/bin/bash',
      ['-i', '-l', '-c', 'env'],
      expect.objectContaining({ detached: true })
    );
  });
});

// -------------------------------------------------------------------
// 6. Regression test: the fix that was applied to ForkTask.ts
//    Documents the expected behavior: getEnhancedEnv must be called
//    so workers get the full PATH.
// -------------------------------------------------------------------
describe('ForkTask environment propagation (regression)', () => {
  it('getEnhancedEnv returns PATH that includes global tool directories', async () => {
    vi.resetModules();

    vi.doMock('child_process', () => ({
      execFileSync: vi.fn().mockImplementation(() => {
        throw new Error('skip shell');
      }),
      execFile: vi.fn(),
    }));

    // Simulate a PATH that a global tool (e.g. openclaw) would be installed in
    const originalPath = process.env.PATH;
    const GLOBAL_BIN = '/home/user/.npm-global/bin'; // typical npm global bin on Linux
    process.env.PATH = `/usr/bin:/usr/local/bin:${GLOBAL_BIN}`;

    const { getEnhancedEnv } = await import('@process/utils/shellEnv');
    const workerEnv = getEnhancedEnv();

    // Worker process will have this PATH - tools like `openclaw`, `node`, `npm`
    // installed in GLOBAL_BIN will be found
    expect(workerEnv.PATH).toContain(GLOBAL_BIN);
    expect(workerEnv.PATH).toContain('/usr/bin');

    process.env.PATH = originalPath;
  });
});
