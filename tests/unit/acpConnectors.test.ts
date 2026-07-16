/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="node" />

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const { fsPromisesMock } = vi.hoisted(() => ({
  fsPromisesMock: {
    access: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  promises: fsPromisesMock,
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execFile: vi.fn(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      cb: (err: null, result: { stdout: string; stderr: string }) => void
    ) => {
      cb(null, { stdout: '', stderr: '' });
    }
  ),
  execFileSync: vi.fn(() => 'v20.10.0\n'),
}));

vi.mock('@process/utils/shellEnv', () => ({
  findSuitableNodeBin: vi.fn(() => null),
  getEnhancedEnv: vi.fn(() => ({ PATH: '/usr/bin' })),
  getNpxCacheDir: vi.fn(() => '/mock-npm-cache/_npx'),
  getWindowsShellExecutionOptions: vi.fn(() =>
    process.platform === 'win32' ? { shell: true, windowsHide: true } : {}
  ),
  loadFullShellEnvironment: vi.fn(async () => ({ PATH: '/usr/bin' })),
  normalizeNpxArgsForBundledBun: vi.fn((args: string[]) =>
    args.filter((arg) => arg !== '-y' && arg !== '--yes' && arg !== '--prefer-offline')
  ),
  resolveNpxPath: vi.fn(() => '/bundled/bun'),
  resolveNpxDirect: vi.fn(() => null),
}));

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

const ccSwitchMock = vi.hoisted(() => ({
  readClaudeProviderEnvFromCcSwitch: vi.fn(() => ({})),
}));

vi.mock('@process/services/ccSwitchModelSource', () => ccSwitchMock);

// Keep the bridge version resolver offline + deterministic: return the pinned
// fallback package as-is so spawn args match the source-of-truth constants
// instead of whatever version the live npm registry resolves at test time.
vi.mock('../../src/process/agent/acp/bridgeVersionResolver', () => ({
  resolveBridgePackage: vi.fn(async (fallbackPackage: string) => fallbackPackage),
}));

import { execFile as execFileCb, spawn } from 'child_process';
import { execFileSync } from 'child_process';
import {
  connectClaude,
  connectCodex,
  createGenericSpawnConfig,
  spawnGenericBackend,
  spawnNpxBackend,
} from '../../src/process/agent/acp/acpConnectors';
// Track the resolved Claude bridge package from the source of truth so this
// test never goes stale when the pinned bridge version bumps.
import { CLAUDE_ACP_NPX_PACKAGE } from '../../src/common/types/acpTypes';

const mockExecFile = vi.mocked(execFileCb);
const mockExecFileSync = vi.mocked(execFileSync);
const mockFsPromises = vi.mocked(fsPromisesMock);
const mockSpawn = vi.mocked(spawn);

describe('spawnNpxBackend - Windows UTF-8 fix', () => {
  const mockChild = { unref: vi.fn() };

  beforeEach(() => {
    mockSpawn.mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses npxCommand directly on non-Windows (no chcp prefix)', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', '/bundled/bun', {}, '/cwd', false, false);

    expect(mockSpawn).toHaveBeenCalledWith(
      '/bundled/bun',
      expect.any(Array),
      expect.objectContaining({ shell: false })
    );
  });

  it('spawns the resolved command directly on Windows without a shell (SEC-ACP-04)', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', '/bundled/bun', {}, '/cwd', true, false);

    const [command, , options] = mockSpawn.mock.calls[0];
    // No `chcp 65001 >nul && ...` cmd.exe string - the executable is spawned directly.
    expect(command).toBe('/bundled/bun');
    expect(options).toMatchObject({ shell: false, windowsHide: true });
  });

  it('passes a quoted Windows path through unquoted with no shell (SEC-ACP-04)', () => {
    const npxWithSpaces = 'C:\\Program Files\\nodejs\\npx.cmd';
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', `"${npxWithSpaces}"`, {}, '/cwd', true, false);

    const [command, , options] = mockSpawn.mock.calls[0];
    // Surrounding quotes are stripped; no chcp prefix, no shell interpretation.
    expect(command).toBe(npxWithSpaces);
    expect(options).toMatchObject({ shell: false });
  });

  it('passes bun x --bun and package name as spawn args', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'npx', {}, '/cwd', false, false);

    const [, args] = mockSpawn.mock.calls[0];
    expect(args).toContain('x');
    expect(args).toContain('--bun');
    expect(args).toContain('@pkg/cli@1.0.0');
  });

  it('does not include npx-only flags when preferOffline is true', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'npx', {}, '/cwd', false, true);

    const [, args] = mockSpawn.mock.calls[0];
    expect(args).not.toContain('--prefer-offline');
  });

  it('omits --yes when preferOffline is false', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'npx', {}, '/cwd', false, false);

    const [, args] = mockSpawn.mock.calls[0];
    expect(args).not.toContain('--yes');
  });

  it('calls child.unref() when detached is true', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'npx', {}, '/cwd', false, false, { detached: true });

    expect(mockChild.unref).toHaveBeenCalled();
  });

  it('does not call child.unref() when detached is false', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'npx', {}, '/cwd', false, false, { detached: false });

    expect(mockChild.unref).not.toHaveBeenCalled();
  });

  it('spawns the bundled bun command directly on Windows (no chcp prefix)', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'npx.cmd', {}, 'C:\\cwd', true, false);

    const [command, , options] = mockSpawn.mock.calls[0];
    expect(command).toBe('npx.cmd');
    expect(options).toMatchObject({ shell: false });
  });

  it('spawns an unquoted Windows npx path directly with no shell', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', 'C:\\nodejs\\npx.cmd', {}, 'C:\\cwd', true, false);

    const [command, , options] = mockSpawn.mock.calls[0];
    expect(command).toBe('C:\\nodejs\\npx.cmd');
    expect(options).toMatchObject({ shell: false });
  });

  it('uses bundled bun command directly on non-Windows', () => {
    spawnNpxBackend('claude', '@pkg/cli@1.0.0', '/usr/local/bin/npx', {}, '/cwd', false, false);

    const [command] = mockSpawn.mock.calls[0];
    expect(command).toBe('/usr/local/bin/npx');
  });
});

const setWindowsPlatform = () => {
  Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
};

const setLinuxPlatform = () => {
  Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
};

describe('createGenericSpawnConfig - Windows path handling', () => {
  let originalPlatform: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('returns plain command on non-Windows', () => {
    setLinuxPlatform();
    const config = createGenericSpawnConfig('goose', '/cwd', ['acp'], undefined, { PATH: '/usr/bin' });

    expect(config.command).toBe('goose');
    expect(config.args).toEqual(['acp']);
    expect(config.options).toMatchObject({ shell: false });
  });

  it('spawns the resolved executable directly on Windows with no shell (SEC-ACP-04)', () => {
    setWindowsPlatform();
    const config = createGenericSpawnConfig('goose', 'C:\\cwd', ['acp'], undefined, { PATH: 'C:\\Windows' });

    // No `chcp 65001 >nul && ...` cmd.exe string; cliPath is parsed into command + args
    // and spawned directly so embedded metacharacters cannot reach a shell.
    expect(config.command).toBe('goose');
    expect(config.args).toEqual(['acp']);
    expect(config.options).toMatchObject({ shell: false, windowsHide: true });
  });

  it('parses a quoted Windows path with spaces into a bare command, no shell', () => {
    setWindowsPlatform();
    const config = createGenericSpawnConfig('"C:\\Program Files\\agent\\agent.exe"', 'C:\\cwd', [], undefined, {
      PATH: 'C:\\Windows',
    });

    // Quoted path is unquoted into the command itself - not handed to cmd.exe.
    expect(config.command).toBe('C:\\Program Files\\agent\\agent.exe');
    expect(config.options).toMatchObject({ shell: false });
  });

  it('splits npx package into command and args (no chcp prefix for npx path)', () => {
    const config = createGenericSpawnConfig('npx @pkg/cli', '/cwd', ['--acp'], undefined, { PATH: '/usr/bin' });

    expect(config.command).toBe('/bundled/bun');
    expect(config.args).toContain('x');
    expect(config.args).toContain('--bun');
    expect(config.args).toContain('@pkg/cli');
    expect(config.args).toContain('--acp');
  });
});

describe('connectCodex - Windows diagnostics', () => {
  let originalPlatform: PropertyDescriptor | undefined;
  const mockChild = { unref: vi.fn() };

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    mockSpawn.mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>);
    mockFsPromises.readdir.mockRejectedValue(new Error('cache not found'));
    mockFsPromises.stat.mockRejectedValue(new Error('not found'));
    mockExecFile.mockImplementation(
      (
        _cmd: string,
        args: string[],
        _opts: unknown,
        cb: (err: null, result: { stdout: string; stderr: string }) => void
      ) => {
        if (args[0] === '--version') {
          cb(null, { stdout: '0.0.1\n', stderr: '' });
          return undefined as never;
        }

        cb(null, { stdout: 'Logged in with ChatGPT\n', stderr: '' });
        return undefined as never;
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('uses shell execution for codex.cmd probes on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

    const setup = vi.fn().mockResolvedValue(undefined);
    const cleanup = vi.fn().mockResolvedValue(undefined);

    await connectCodex('C:\\cwd', { setup, cleanup });

    expect(mockExecFile).toHaveBeenNthCalledWith(
      1,
      'codex.cmd',
      ['--version'],
      expect.objectContaining({
        env: expect.objectContaining({ PATH: '/usr/bin' }),
        shell: true,
        timeout: 5000,
        windowsHide: true,
      }),
      expect.any(Function)
    );
    expect(mockExecFile).toHaveBeenNthCalledWith(
      2,
      'codex.cmd',
      ['login', 'status'],
      expect.objectContaining({
        env: expect.objectContaining({ PATH: '/usr/bin' }),
        shell: true,
        timeout: 5000,
        windowsHide: true,
      }),
      expect.any(Function)
    );
    expect(setup).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });
});

describe('connectClaude - detached process group', () => {
  let originalPlatform: PropertyDescriptor | undefined;
  const mockChild = { unref: vi.fn() };

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    mockSpawn.mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('spawns detached on POSIX so killChild can terminate the whole Claude ACP process group', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

    const setup = vi.fn().mockResolvedValue(undefined);
    const cleanup = vi.fn().mockResolvedValue(undefined);

    await connectClaude('/cwd', { setup, cleanup });

    expect(mockSpawn).toHaveBeenCalledWith(
      '/bundled/bun',
      expect.arrayContaining(['x', '--bun', CLAUDE_ACP_NPX_PACKAGE]),
      expect.objectContaining({
        cwd: '/cwd',
        detached: true,
        shell: false,
      })
    );
    expect(mockChild.unref).toHaveBeenCalledTimes(1);
  });

  it('injects Claude env from cc-switch into the spawned process env', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    ccSwitchMock.readClaudeProviderEnvFromCcSwitch.mockReturnValue({
      ANTHROPIC_BASE_URL: 'http://localhost:4000',
      ANTHROPIC_AUTH_TOKEN: 'sk-test-token',
    });

    const setup = vi.fn().mockResolvedValue(undefined);
    const cleanup = vi.fn().mockResolvedValue(undefined);

    await connectClaude('/cwd', { setup, cleanup });

    expect(mockSpawn).toHaveBeenCalledWith(
      '/bundled/bun',
      expect.arrayContaining(['x', '--bun', CLAUDE_ACP_NPX_PACKAGE]),
      expect.objectContaining({
        env: expect.objectContaining({
          PATH: '/usr/bin',
          ANTHROPIC_BASE_URL: 'http://localhost:4000',
          ANTHROPIC_AUTH_TOKEN: 'sk-test-token',
        }),
      })
    );
  });

  it('merges customEnv (Flux surface) LAST, overriding cc-switch native ANTHROPIC env', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    ccSwitchMock.readClaudeProviderEnvFromCcSwitch.mockReturnValue({
      ANTHROPIC_BASE_URL: 'http://localhost:4000',
      ANTHROPIC_AUTH_TOKEN: 'sk-native-token',
    });

    const setup = vi.fn().mockResolvedValue(undefined);
    const cleanup = vi.fn().mockResolvedValue(undefined);

    await connectClaude(
      '/cwd',
      { setup, cleanup },
      {
        ANTHROPIC_BASE_URL: 'https://api.fluxrouter.ai/anthropic',
        ANTHROPIC_AUTH_TOKEN: 'sk-flux-key',
        ANTHROPIC_MODEL: 'flux-auto',
      }
    );

    expect(mockSpawn).toHaveBeenCalledWith(
      '/bundled/bun',
      expect.arrayContaining(['x', '--bun', CLAUDE_ACP_NPX_PACKAGE]),
      expect.objectContaining({
        env: expect.objectContaining({
          ANTHROPIC_BASE_URL: 'https://api.fluxrouter.ai/anthropic',
          ANTHROPIC_AUTH_TOKEN: 'sk-flux-key',
          ANTHROPIC_MODEL: 'flux-auto',
        }),
      })
    );
  });

  it('does not detach on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

    const setup = vi.fn().mockResolvedValue(undefined);
    const cleanup = vi.fn().mockResolvedValue(undefined);

    await connectClaude('C:\\cwd', { setup, cleanup });

    expect(mockSpawn).toHaveBeenCalledWith(
      '/bundled/bun',
      expect.arrayContaining(['x', '--bun', CLAUDE_ACP_NPX_PACKAGE]),
      expect.objectContaining({
        cwd: 'C:\\cwd',
        detached: false,
        shell: false,
      })
    );
    expect(mockChild.unref).not.toHaveBeenCalled();
  });
});

describe('spawnGenericBackend - detached process group', () => {
  let originalPlatform: PropertyDescriptor | undefined;
  const mockChild = { unref: vi.fn() };

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    mockSpawn.mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('spawns detached on POSIX so generic ACP backends can be killed as a process group', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

    const result = await spawnGenericBackend('qwen', 'qwen', '/cwd', ['--acp']);

    expect(mockSpawn).toHaveBeenCalledWith(
      'qwen',
      ['--acp'],
      expect.objectContaining({
        cwd: '/cwd',
        detached: true,
        shell: false,
      })
    );
    expect(result.isDetached).toBe(true);
    expect(mockChild.unref).toHaveBeenCalledTimes(1);
  });

  it('does not detach generic ACP backends on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

    const result = await spawnGenericBackend('qwen', 'qwen', 'C:\\cwd', ['--acp']);

    expect(mockSpawn).toHaveBeenCalledWith(
      'qwen',
      ['--acp'],
      expect.objectContaining({
        cwd: 'C:\\cwd',
        detached: false,
        shell: false,
      })
    );
    expect(result.isDetached).toBe(false);
    expect(mockChild.unref).not.toHaveBeenCalled();
  });
});

function setPlatform(platform: NodeJS.Platform, arch: string): void {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
  Object.defineProperty(process, 'arch', { value: arch, configurable: true });
}

describe('connectCodex - App Server adapter package', () => {
  let originalPlatform: PropertyDescriptor | undefined;
  let originalArch: PropertyDescriptor | undefined;
  const mockChild = { unref: vi.fn() };

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    originalArch = Object.getOwnPropertyDescriptor(process, 'arch');
    mockExecFileSync.mockImplementation(() => 'v20.10.0\n' as never);
    mockSpawn.mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>);
    mockFsPromises.readdir.mockRejectedValue(new Error('cache not found'));
    mockFsPromises.stat.mockRejectedValue(new Error('not found'));
  });

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
    if (originalArch) {
      Object.defineProperty(process, 'arch', originalArch);
    }
    vi.clearAllMocks();
  });

  // The App-Server adapter (@agentclientprotocol/codex-acp) is a single pure-JS
  // package with NO per-platform binary sub-packages, so every OS/arch launches
  // the exact same specifier via bundled bun. (resolveBridgePackage is mocked to
  // echo the pinned fallback, so we assert against CODEX_ACP_NPX_PACKAGE.)
  it.each([
    ['win32', 'x64', 'C:\\cwd'],
    ['linux', 'x64', '/cwd'],
    ['darwin', 'arm64', '/cwd'],
  ])('launches the meta App Server adapter on %s/%s (no platform sub-package)', async (platform, arch, cwd) => {
    setPlatform(platform as NodeJS.Platform, arch);
    const hooks = { setup: vi.fn(async () => {}), cleanup: vi.fn(async () => {}) };

    await connectCodex(cwd, hooks);

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    const [command, args] = mockSpawn.mock.calls[0];
    // SEC-ACP-04: bundled bun is spawned directly (shell: false), no chcp prefix.
    expect(command).toBe('/bundled/bun');
    expect(args).toContain('x');
    expect(args).toContain('--bun');
    expect(args).toContain('@agentclientprotocol/codex-acp@1.1.2');
    // The retired Zed bridge (and its per-platform binaries) is never referenced.
    expect((args as string[]).some((a) => typeof a === 'string' && a.includes('@zed-industries/codex-acp'))).toBe(
      false
    );
  });

  it('makes a single spawn attempt and cleans up on startup failure (no platform-package retry)', async () => {
    setPlatform('darwin', 'arm64');
    const hooks = {
      setup: vi.fn(async () => {
        throw new Error('Request initialize timed out after 60 seconds');
      }),
      cleanup: vi.fn(async () => {}),
    };

    await expect(connectCodex('/cwd', hooks)).rejects.toThrow(/timed out/);
    // No candidate-fallback list anymore: one spawn, then propagate.
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(hooks.cleanup).toHaveBeenCalled();
  });
});
