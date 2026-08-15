/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

vi.mock('@process/services/mcpServices/McpOAuthService', () => ({
  mcpOAuthService: { getValidToken: vi.fn().mockResolvedValue(null) },
}));

import { McpService } from '@process/services/mcpServices/McpService';
import type { IMcpProtocol } from '@process/services/mcpServices/McpProtocol';

const server: IMcpServer = {
  id: 'test-server',
  name: 'test-server',
  enabled: true,
  transport: { type: 'streamable_http', url: 'https://mcp.example.com' },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
};

describe('McpService.syncMcpToAgents publication truth', () => {
  let service: McpService;

  beforeEach(() => {
    service = new McpService();
    vi.spyOn(service as unknown as { isCliAvailable: (cmd: string) => boolean }, 'isCliAvailable').mockReturnValue(
      false
    );
  });

  it('fails closed when a backend has no MCP publication adapter', async () => {
    const result = await service.syncMcpToAgents([server], [{ backend: 'unknown-backend', name: 'Unknown' }]);

    expect(result.success).toBe(false);
    expect(result.results).toEqual([
      {
        agent: 'Unknown',
        success: false,
        // Marks a non-target: detected, but no MCP adapter. `success` above
        // must still be false -- with no actionable agent, nothing was
        // published, so the operation genuinely failed. Kept as toEqual so a
        // non-target cannot quietly acquire other fields.
        unsupported: true,
        error: 'MCP publication is not supported for backend "unknown-backend"',
      },
    ]);
  });

  it('reports success only when a real adapter confirms publication', async () => {
    const adapter = {
      installMcpServers: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as IMcpProtocol;
    (service as unknown as { agents: Map<string, IMcpProtocol> }).agents.set('test-backend', adapter);

    const result = await service.syncMcpToAgents([server], [{ backend: 'test-backend', name: 'Test' }]);

    expect(result.success).toBe(true);
    expect(adapter.installMcpServers).toHaveBeenCalledOnce();
  });

  it('does not mint publication success without an enabled declaration or target adapter', async () => {
    await expect(service.syncMcpToAgents([{ ...server, enabled: false }], [])).resolves.toMatchObject({
      success: false,
      results: [{ error: expect.stringContaining('No enabled MCP server') }],
    });
    await expect(service.syncMcpToAgents([server], [])).resolves.toMatchObject({
      success: false,
      results: [{ error: expect.stringContaining('No MCP publication target') }],
    });
  });

  it('validates and correlates standalone probe evidence to the exact declaration', async () => {
    const adapter = {
      testMcpConnection: vi.fn().mockResolvedValue({ success: true, tools: [{ name: 'search' }] }),
    } as unknown as IMcpProtocol;
    (service as unknown as { agents: Map<string, IMcpProtocol> }).agents = new Map([['test-backend', adapter]]);

    const result = await service.testMcpConnection(server);

    expect(result.prepublication).toMatchObject({
      serverId: server.id,
      serverName: server.name,
      state: 'probed',
      authentication: 'validated',
      toolCount: 1,
    });
  });

  it('rejects resolved failure or malformed success from a probe adapter', async () => {
    const adapter = {
      testMcpConnection: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as IMcpProtocol;
    (service as unknown as { agents: Map<string, IMcpProtocol> }).agents = new Map([['test-backend', adapter]]);

    await expect(service.testMcpConnection(server)).rejects.toThrow('tools array');
  });

  it('fails the whole detection observation when any requested backend is unavailable', async () => {
    await expect(service.getAgentMcpConfigs([{ backend: 'missing-backend', name: 'Missing' }])).rejects.toThrow(
      'Incomplete MCP detection'
    );
  });

  it('rejects conflicting duplicate detections instead of returning partial truth', async () => {
    const adapter = {
      detectMcpServers: vi
        .fn()
        .mockResolvedValueOnce([server])
        .mockResolvedValueOnce([
          { ...server, transport: { type: 'streamable_http', url: 'https://other.example.com' } },
        ]),
    } as unknown as IMcpProtocol;
    (service as unknown as { agents: Map<string, IMcpProtocol> }).agents.set('test-backend', adapter);

    await expect(
      service.getAgentMcpConfigs([
        { backend: 'test-backend', name: 'First' },
        { backend: 'test-backend', name: 'Second' },
      ])
    ).rejects.toThrow('Conflicting MCP detection results');
  });
});
