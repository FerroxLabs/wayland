/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

/**
 * `WaylandMcpAgent` is one of the agents a publication publishes to, and it used
 * to write `mcp.config` itself during `installMcpServers`.
 *
 * That write went through `updateMcpConfig`, a MAIN-PROCESS authority that
 * bypasses the renderer's write queue, and it bumped `updatedAt` on the very row
 * the caller was about to compare-and-set. `handleToggleMcpServer` publishes
 * first and commits second, guarding on the `updatedAt` it read before
 * publishing -- so publication invalidated its own caller's guard from the
 * inside. The commit then failed and rolled every agent back, and because the
 * self-write had already set `enabled: true`, the retained divergence row came
 * back ENABLED even though the toggle never committed.
 *
 * Removal was already a no-op for exactly this reason ("config managed by
 * renderer"). This asserts install is now symmetric.
 */

const updateMcpConfig = vi.fn();

vi.mock('@process/services/mcpServices/mcpConfigAuthority', () => ({
  updateMcpConfig,
  compareAndSetMcpConfig: vi.fn(),
  readMcpConfigSnapshot: vi.fn(),
  mcpConfigRevision: vi.fn(),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn().mockResolvedValue([]), set: vi.fn(), update: vi.fn() },
}));

const { WaylandMcpAgent } = await import('@process/services/mcpServices/agents/WaylandMcpAgent');

const stdioServer = {
  id: 'mcp_tv',
  name: 'tvcontrol',
  enabled: true,
  createdAt: 1,
  updatedAt: 1,
  transport: { type: 'stdio' as const, command: 'node', args: ['/abs/server.js'], env: {} },
  originalJson: '{}',
};

describe('WaylandMcpAgent does not mutate the config it is publishing', () => {
  it('does not write mcp.config on install', async () => {
    updateMcpConfig.mockClear();
    const result = await new WaylandMcpAgent().installMcpServers([stdioServer]);

    expect(result.success).toBe(true);
    expect(updateMcpConfig, 'install must not write the config the renderer owns').not.toHaveBeenCalled();
  });

  it('does not write mcp.config on remove', async () => {
    // Already true before this change; asserted so the pair cannot drift apart.
    updateMcpConfig.mockClear();
    const result = await new WaylandMcpAgent().removeMcpServer('tvcontrol');

    expect(result.success).toBe(true);
    expect(updateMcpConfig).not.toHaveBeenCalled();
  });

  it('reports success for a transport it cannot serve, without writing', async () => {
    // NOT a negative control -- a blanket `return true` would also pass this,
    // as the audit pointed out. It pins current behaviour only: an unsupported
    // transport is logged and skipped, and the overall result stays success,
    // matching what the pre-no-op code did. The real guard against a hidden
    // write is the assertion on updateMcpConfig.
    updateMcpConfig.mockClear();
    const websocketServer = {
      ...stdioServer,
      name: 'unsupported-transport',
      transport: { type: 'websocket' as unknown as 'stdio', url: 'ws://localhost' } as never,
    };
    const result = await new WaylandMcpAgent().installMcpServers([websocketServer]);

    expect(result.success).toBe(true);
    expect(updateMcpConfig).not.toHaveBeenCalled();
  });
});
