/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// #283: persistMcpByoOAuthCredentials runs in the MAIN process and must persist
// mcp.config through ProcessConfig (the main-process config accessor), NOT the
// renderer-facing ConfigStorage bridge. ConfigStorage.get/set route over the IPC
// wire and have no responder in main -> they hang forever, which left "Save &
// sign in" spinning for every BYO-OAuth MCP. These tests pin the storage path
// and the save behavior (resolving = not hanging).

const { getMock, setMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(),
}));

// Top-level imports of mcpBridge only need these to exist; the IPC handlers in
// initMcpBridge() are never invoked here.
vi.mock('@/common', () => ({ ipcBridge: { mcpService: {} } }));
vi.mock('@process/services/mcpServices/McpService', () => ({ mcpService: {} }));
vi.mock('@process/services/mcpServices/McpOAuthService', () => ({
  mcpOAuthService: {
    // Mirrors the real pure helper: returns the server with byoOAuth populated.
    setByoCredentials: (server: { byoOAuth?: unknown }, clientId: string, clientSecret?: string) => ({
      ...server,
      byoOAuth: { clientId: clientId.trim(), clientSecret: clientSecret?.trim() || undefined },
    }),
  },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: getMock, set: setMock },
}));

import { persistMcpByoOAuthCredentials } from '@process/bridge/mcpBridge';

const ghServer = {
  id: 'gh-1',
  name: 'github',
  transport: { type: 'streamable_http', url: 'https://api.githubcopilot.com/mcp' },
};

beforeEach(() => {
  getMock.mockReset().mockResolvedValue([{ ...ghServer }]);
  setMock.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  vi.clearAllMocks();
});

describe('persistMcpByoOAuthCredentials (#283)', () => {
  it('persists credentials via ProcessConfig (not the renderer ConfigStorage bridge) and resolves', async () => {
    const result = await persistMcpByoOAuthCredentials({ serverId: 'gh-1', clientId: 'CID', clientSecret: 'SEC' });

    expect(result.ok).toBe(true);
    // Regression guard: the save MUST go through the main-process accessor.
    expect(getMock).toHaveBeenCalledWith('mcp.config');
    expect(setMock).toHaveBeenCalledTimes(1);
    const [key, written] = setMock.mock.calls[0];
    expect(key).toBe('mcp.config');
    expect(written[0].byoOAuth).toEqual({ clientId: 'CID', clientSecret: 'SEC' });
  });

  it('returns ok:false without writing when the server id is not found', async () => {
    getMock.mockResolvedValue([{ ...ghServer, id: 'other' }]);

    const result = await persistMcpByoOAuthCredentials({ serverId: 'gh-1', clientId: 'CID', clientSecret: 'SEC' });

    expect(result.ok).toBe(false);
    expect(result.msg).toContain('not found');
    expect(setMock).not.toHaveBeenCalled();
  });

  it('rejects an empty clientId before touching storage', async () => {
    const result = await persistMcpByoOAuthCredentials({ serverId: 'gh-1', clientId: '   ' });

    expect(result.ok).toBe(false);
    expect(result.msg).toBe('clientId is required');
    expect(getMock).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });
});
