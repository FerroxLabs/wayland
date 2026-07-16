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
    vi.spyOn(
      service as unknown as { isCliAvailable: (cmd: string) => boolean },
      'isCliAvailable'
    ).mockReturnValue(false);
  });

  it('fails closed when a backend has no MCP publication adapter', async () => {
    const result = await service.syncMcpToAgents([server], [
      { backend: 'unknown-backend', name: 'Unknown' },
    ]);

    expect(result.success).toBe(false);
    expect(result.results).toEqual([
      {
        agent: 'Unknown',
        success: false,
        error: 'MCP publication is not supported for backend "unknown-backend"',
      },
    ]);
  });

  it('reports success only when a real adapter confirms publication', async () => {
    const adapter = {
      installMcpServers: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as IMcpProtocol;
    (service as unknown as { agents: Map<string, IMcpProtocol> }).agents.set('test-backend', adapter);

    const result = await service.syncMcpToAgents([server], [
      { backend: 'test-backend', name: 'Test' },
    ]);

    expect(result.success).toBe(true);
    expect(adapter.installMcpServers).toHaveBeenCalledOnce();
  });
});
