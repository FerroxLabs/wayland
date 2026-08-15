// tests/unit/process/acp/compat/acpAgentV2Login.test.ts

/**
 * K-05: AcpAgentV2.handleAuthRequired -> runBackendLogin is the second CLI-login
 * path (the first is AcpAgent.ensureBackendAuth). It is spawned with the default
 * shell:false, so a composite `"<runtime>" "<entry>"` command STRING reaches
 * CreateProcess as the executable name and fails ENOENT; the failure is only
 * console.warn'd plus a generic UI error, so the real cause never surfaces.
 * These tests pin that an installed agent's { command, args } descriptor is used
 * verbatim, and that a malformed descriptor is not.
 *
 * The descriptor also has to survive `toAgentConfig`, whose return is a
 * hand-listed literal with no spread - so this exercises that hop too.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OldAcpAgentConfig } from '@process/acp/compat/typeBridge';

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: mockSpawn };
});

vi.mock('@process/acp/session/AcpSession', () => ({
  AcpSession: class MockAcpSession {
    constructor() {}
    start = vi.fn();
    stop = vi.fn();
    get status() {
      return 'idle';
    }
    get sessionId() {
      return null;
    }
  },
}));

vi.mock('@process/acp/compat/LegacyConnectorFactory', () => ({
  LegacyConnectorFactory: class {
    constructor() {}
  },
}));

vi.mock('@process/acp/compat/typeBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/acp/compat/typeBridge')>();
  return { ...actual, loadAuthCredentials: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: vi.fn(() => ({ PATH: '/usr/bin' })) }));

import { AcpAgentV2 } from '@process/acp/compat/AcpAgentV2';

const LAUNCH = {
  command: 'C:\\Program Files\\Wayland\\resources\\bundled-bun\\win32-x64\\bun.exe',
  args: ['C:\\Users\\John Smith\\AppData\\Local\\Wayland\\agents\\qwen\\cli-entry.js'],
};

/** A spawned child that closes cleanly, so runBackendLogin resolves. */
function fakeChild() {
  return {
    on: (event: string, cb: (arg?: unknown) => void) => {
      if (event === 'close') setTimeout(() => cb(0), 0);
    },
  };
}

function makeAgent(overrides: Partial<OldAcpAgentConfig>): {
  handleAuthRequired: () => Promise<void>;
} {
  const config = {
    id: 'conv-1',
    backend: 'qwen',
    workingDir: '/workspace/test',
    onStreamEvent: vi.fn(),
    ...overrides,
  } as OldAcpAgentConfig;
  return new AcpAgentV2(config) as unknown as { handleAuthRequired: () => Promise<void> };
}

describe('AcpAgentV2 runBackendLogin - installed-agent launch spec', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpawn.mockImplementation(() => fakeChild());
  });

  it('runs the launch spec verbatim and APPENDS the login args', async () => {
    await makeAgent({ launch: LAUNCH }).handleAuthRequired();

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockSpawn.mock.calls[0][0]).toBe(LAUNCH.command);
    expect(mockSpawn.mock.calls[0][1]).toEqual([...LAUNCH.args, 'login']);
  });

  it('reads the launch spec off extra as well (the shape AcpAgentManager writes)', async () => {
    await makeAgent({ extra: { launch: LAUNCH } as OldAcpAgentConfig['extra'] }).handleAuthRequired();

    expect(mockSpawn.mock.calls[0][0]).toBe(LAUNCH.command);
    expect(mockSpawn.mock.calls[0][1]).toEqual([...LAUNCH.args, 'login']);
  });

  it('still uses the legacy cliPath string when there is no launch spec', async () => {
    await makeAgent({ cliPath: '/usr/local/bin/qwen' }).handleAuthRequired();

    expect(mockSpawn.mock.calls[0][0]).toBe('/usr/local/bin/qwen');
    expect(mockSpawn.mock.calls[0][1]).toEqual(['login']);
  });

  it.each([
    ['missing args', { command: 'C:\\evil.exe' }],
    ['args not an array', { command: 'C:\\evil.exe', args: 'login' }],
    ['missing command', { args: ['x'] }],
    ['not an object', 'C:\\evil.exe'],
  ])('ignores a malformed launch spec and falls back to cliPath (%s)', async (_label, malformed) => {
    await makeAgent({
      cliPath: '/usr/local/bin/qwen',
      launch: malformed as OldAcpAgentConfig['launch'],
    }).handleAuthRequired();

    expect(mockSpawn.mock.calls[0][0]).toBe('/usr/local/bin/qwen');
    expect(mockSpawn.mock.calls[0][1]).toEqual(['login']);
  });
});
