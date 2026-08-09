/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-05: AcpAgent.ensureBackendAuth is the CLI-login path (qwen `login`,
 * claude `/login`). It is worse than the spawn path, not better: its surrounding
 * catch only console.warn's, so handing CreateProcess a composite command STRING
 * as the executable name fails with ENOENT and the user simply never gets
 * authenticated - no error surfaces anywhere. These tests pin that an installed
 * agent's { command, args } descriptor is used verbatim and that a malformed one
 * is not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({ PATH: '/usr/bin' })),
  resolveNpxPath: vi.fn(() => '/bundled/bun'),
  normalizeNpxArgsForBundledBun: vi.fn((args: string[]) => args),
}));
vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: vi.fn().mockResolvedValue(null) } }));

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock('child_process', () => ({ spawn: mockSpawn }));
vi.mock('fs', () => ({ promises: { readFile: vi.fn(), access: vi.fn() } }));

vi.mock('@process/agent/acp/AcpConnection', () => ({
  AcpConnection: class MockAcpConnection {
    setConversationId = vi.fn();
    on = vi.fn();
    destroy = vi.fn();
    sessionId = null;
  },
}));
vi.mock('@process/agent/acp/mcpSessionConfig', () => ({ buildAcpSessionMcpServers: vi.fn().mockResolvedValue([]) }));
vi.mock('@process/agent/acp/modelInfo', () => ({ buildAcpModelInfo: vi.fn(), summarizeAcpModelInfo: vi.fn() }));
vi.mock('@process/agent/acp/utils', () => ({ getClaudeModel: vi.fn(), getClaudeModelSlot: vi.fn() }));

import { AcpAgent } from '@process/agent/acp';

/** A spawned child that closes cleanly, so ensureBackendAuth resolves. */
function fakeChild() {
  return {
    on: (event: string, cb: (arg?: unknown) => void) => {
      if (event === 'close') setTimeout(() => cb(0), 0);
    },
  };
}

const LAUNCH = {
  command: 'C:\\Program Files\\Wayland\\resources\\bundled-bun\\win32-x64\\bun.exe',
  args: ['C:\\Users\\John Smith\\AppData\\Local\\Wayland\\agents\\qwen\\cli-entry.js'],
};

function agentWithExtra(extra: Record<string, unknown>) {
  const agent = new AcpAgent({
    id: 'conv-1',
    backend: 'qwen',
    workingDir: '/tmp/ws',
    extra: { workspace: '/tmp/ws', backend: 'qwen' as const, ...extra },
    onStreamEvent: vi.fn(),
  });
  return agent as unknown as { ensureBackendAuth: (backend: string, loginArg: string) => Promise<void> };
}

describe('AcpAgent.ensureBackendAuth - installed-agent launch spec', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpawn.mockImplementation(() => fakeChild());
  });

  it('runs the launch spec verbatim and APPENDS the login arg', async () => {
    // The runtime and the entry script must stay in separate argv slots, and the
    // login arg must be appended - substituting it would run the bare runtime
    // (bun.exe login) instead of the agent.
    await agentWithExtra({ launch: LAUNCH }).ensureBackendAuth('qwen', 'login');

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockSpawn.mock.calls[0][0]).toBe(LAUNCH.command);
    expect(mockSpawn.mock.calls[0][1]).toEqual([...LAUNCH.args, 'login']);
  });

  it('prefers the launch spec over a cliPath string when both are present', async () => {
    await agentWithExtra({ launch: LAUNCH, cliPath: '/usr/local/bin/qwen' }).ensureBackendAuth('qwen', 'login');

    expect(mockSpawn.mock.calls[0][0]).toBe(LAUNCH.command);
    expect(mockSpawn.mock.calls[0][1]).toEqual([...LAUNCH.args, 'login']);
  });

  it('still uses the legacy cliPath string when there is no launch spec', async () => {
    await agentWithExtra({ cliPath: '/usr/local/bin/qwen' }).ensureBackendAuth('qwen', 'login');

    expect(mockSpawn.mock.calls[0][0]).toBe('/usr/local/bin/qwen');
    expect(mockSpawn.mock.calls[0][1]).toEqual(['login']);
  });

  // `extra` is rehydrated from untyped persisted JSON, so a partial descriptor is
  // reachable. It must not become the spawned executable.
  it.each([
    ['missing args', { command: 'C:\\evil.exe' }],
    ['args not an array', { command: 'C:\\evil.exe', args: 'login' }],
    ['missing command', { args: ['x'] }],
    ['not an object', 'C:\\evil.exe'],
  ])('ignores a malformed launch spec and falls back to cliPath (%s)', async (_label, malformed) => {
    await agentWithExtra({ launch: malformed, cliPath: '/usr/local/bin/qwen' }).ensureBackendAuth('qwen', 'login');

    expect(mockSpawn.mock.calls[0][0]).toBe('/usr/local/bin/qwen');
    expect(mockSpawn.mock.calls[0][1]).toEqual(['login']);
  });

  it('does not spawn at all when the launch spec is malformed and there is no cliPath', async () => {
    await agentWithExtra({ launch: { command: 'C:\\evil.exe' } }).ensureBackendAuth('qwen', 'login');

    expect(mockSpawn).not.toHaveBeenCalled();
  });
});
