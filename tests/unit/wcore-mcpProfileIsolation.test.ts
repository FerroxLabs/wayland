/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #278: the MCP config sync must never write one profile's connector into
 * ANOTHER profile's config.toml.
 *
 * WCoreMcpAgent used to resolve its target file with:
 *
 *     try { return await resolveActiveConfigPath(); }
 *     catch { return getWCoreConfigPath(cliPath); }   // <- the NATIVE/default dir
 *
 * The catch was justified in-comment as "backward-compatible for the default
 * profile", but it is UNREACHABLE for the default profile (resolveActiveConfigDir
 * only throws on its named-profile branch). So the only situation it could ever
 * fire in was a live NAMED profile — where falling back to the native dir writes
 * that profile's MCP server into the DEFAULT profile's config.toml. That is the
 * exact divergence the function's own docstring says it was introduced to fix.
 *
 * This pins the fallback out: a resolution failure must abort the write.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { ProfileIsolationError } from '@process/agent/wcore/profilePaths';

const writeFileMock = vi.fn(async () => undefined);
const mkdirMock = vi.fn(async () => undefined);
const readFileMock = vi.fn(async () => '');

vi.mock('fs', async (orig) => {
  const actual = await orig<typeof import('fs')>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: (...a: unknown[]) => readFileMock(...(a as [])),
      writeFile: (...a: unknown[]) => writeFileMock(...(a as [])),
      mkdir: (...a: unknown[]) => mkdirMock(...(a as [])),
    },
  };
});

const resolveActiveConfigPathMock = vi.fn();
vi.mock('@process/agent/wcore/profilePaths', async (orig) => {
  const actual = await orig<typeof import('@process/agent/wcore/profilePaths')>();
  return { ...actual, resolveActiveConfigPath: () => resolveActiveConfigPathMock() };
});

// Never let the real first-run chromium download fire from a unit test.
vi.mock('@process/services/mcpServices/playwrightBrowsers', () => ({
  ensurePlaywrightChromium: vi.fn(async () => undefined),
}));

import { WCoreMcpAgent } from '@process/services/mcpServices/agents/WCoreMcpAgent';

const SERVER = {
  id: 'srv-1',
  name: 'my-server',
  transport: { type: 'stdio', command: 'node', args: ['x.js'] },
} as unknown as IMcpServer;

describe('#278: the MCP sync must not write a named profile into the default config.toml', () => {
  beforeEach(() => {
    writeFileMock.mockClear();
    mkdirMock.mockClear();
    readFileMock.mockClear();
    readFileMock.mockResolvedValue('');
    resolveActiveConfigPathMock.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  it('CONTROL: when the active profile resolves, the connector is written to THAT profile', async () => {
    resolveActiveConfigPathMock.mockResolvedValue('/home/u/.wayland/profiles/work/config.toml');

    const result = await new WCoreMcpAgent().installMcpServers([SERVER]);

    expect(result.success).toBe(true);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock.mock.calls[0][0]).toBe('/home/u/.wayland/profiles/work/config.toml');
  });

  it('an unresolvable active profile ABORTS the write instead of falling back to the default config.toml', async () => {
    resolveActiveConfigPathMock.mockRejectedValue(new ProfileIsolationError('work', 'EACCES'));

    const result = await new WCoreMcpAgent().installMcpServers([SERVER]);

    // The whole point: nothing was written ANYWHERE. Re-adding the
    // `catch -> getWCoreConfigPath()` fallback writes to the native
    // (default-profile) config.toml and turns this red.
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/profile/i);
  });
});
