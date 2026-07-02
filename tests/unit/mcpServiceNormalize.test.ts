/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import os from 'node:os';
import type { IMcpServer } from '@/common/config/storage';
import { mcpService } from '@process/services/mcpServices/McpService';

/**
 * Guards the #448 integration seam: the pure `normalizeMcpServerForSpawn` is
 * exercised by its own suite, but nothing else asserts McpService actually
 * CALLS it. Without this, deleting the normalize call in testMcpConnection /
 * syncMcpToAgents leaves every unit test green while the filesystem connector
 * silently regresses to spawning with zero directories.
 */
const FS = '@modelcontextprotocol/server-filesystem@0.6.2';

function fsServer(): IMcpServer {
  return {
    id: 'fs',
    name: 'io.modelcontextprotocol-server-filesystem',
    enabled: true,
    transport: { type: 'stdio', command: 'npx', args: [FS], env: { ALLOWED_DIRS: '' } },
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
  };
}

describe('McpService #448 normalization seam', () => {
  it('testMcpConnection probes with the home dir baked into positional args', async () => {
    const firstAgent = (mcpService as unknown as { agents: Map<string, { testMcpConnection: unknown }> }).agents
      .values()
      .next().value;
    const spy = vi.spyOn(firstAgent, 'testMcpConnection').mockResolvedValue({ success: true, tools: [] });

    await mcpService.testMcpConnection(fsServer());

    expect(spy).toHaveBeenCalledTimes(1);
    const probed = spy.mock.calls[0][0] as IMcpServer;
    expect((probed.transport as { args: string[] }).args).toEqual([FS, os.homedir()]);
    spy.mockRestore();
  });
});
