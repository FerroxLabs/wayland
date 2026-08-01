/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { mergeRuntimeMcpServers } from '@process/services/mcpServices/runtimeMcpServers';

const stored: IMcpServer = {
  id: 'user-beeper',
  name: 'Beeper',
  enabled: true,
  status: 'connected',
  transport: { type: 'http', url: 'http://localhost:23373/v0/mcp' },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
};

describe('mergeRuntimeMcpServers', () => {
  it('makes extension MCP declarations available to the shared runtime set without inventing health', () => {
    const result = mergeRuntimeMcpServers(
      [stored],
      [
        {
          id: 'ext-research-tavily',
          name: 'Tavily',
          enabled: true,
          transport: { type: 'streamable_http', url: 'https://mcp.tavily.com/mcp/?tavilyApiKey=test' },
        },
      ]
    );

    expect(result.map((server) => server.name)).toEqual(['Beeper', 'Tavily']);
    expect(result[1]).toMatchObject({ id: 'ext-research-tavily', enabled: true, status: undefined });
  });

  it('keeps the user declaration on canonical-name collision and resolves extension collisions deterministically', () => {
    const result = mergeRuntimeMcpServers(
      [stored],
      [
        { id: 'ext-z', name: 'beeper', enabled: true, transport: { type: 'stdio', command: 'wrong' } },
        { id: 'ext-b', name: 'Firecrawl', enabled: true, transport: { type: 'stdio', command: 'second' } },
        { id: 'ext-a', name: 'Firecrawl', enabled: true, transport: { type: 'stdio', command: 'first' } },
      ]
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'user-beeper', transport: stored.transport });
    expect(result[1]).toMatchObject({ id: 'ext-a', transport: { type: 'stdio', command: 'first' } });
  });
});
