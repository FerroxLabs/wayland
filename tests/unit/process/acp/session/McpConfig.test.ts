// tests/unit/process/acp/session/McpConfig.test.ts
import { describe, it, expect } from 'vitest';
import { McpConfig } from '@process/acp/session/McpConfig';
import type { McpServerConfig } from '@process/acp/types';
import type { IMcpServer } from '@/common/config/storage';

function mcp(name: string, command: string): McpServerConfig {
  return { name, command, args: [], env: [] };
}

describe('McpConfig', () => {
  it('never manufactures optional HTTP or SSE support for an ACP agent', () => {
    expect(McpConfig.resolveCapabilities()).toEqual({ stdio: true, http: false, sse: false });
    expect(McpConfig.resolveCapabilities({ stdio: true, http: false, sse: false })).toEqual({
      stdio: true,
      http: false,
      sse: false,
    });
    expect(McpConfig.resolveCapabilities({ stdio: true, http: true, sse: false })).toEqual({
      stdio: true,
      http: true,
      sse: false,
    });
  });

  it('returns user config when no presets or team config', () => {
    const user: McpServerConfig[] = [mcp('my-mcp', 'mcp-serve')];
    const result = McpConfig.merge({ userServers: user });
    expect(result).toEqual(user);
  });
  it('user config overrides preset with same name', () => {
    const result = McpConfig.merge({
      userServers: [mcp('fs', 'user-fs')],
      presetServers: [mcp('fs', 'preset-fs')],
    });
    expect(result).toHaveLength(1);
    expect(result[0].command).toBe('user-fs');
  });
  it('team MCP is always appended', () => {
    const result = McpConfig.merge({
      userServers: [mcp('a', 'a')],
      teamServer: mcp('team', 'team-mcp'),
    });
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('team');
  });
  it('merges all three sources with correct priority', () => {
    const result = McpConfig.merge({
      userServers: [mcp('a', 'user-a')],
      presetServers: [mcp('a', 'preset-a'), mcp('b', 'preset-b')],
      teamServer: mcp('team', 'team'),
    });
    expect(result).toHaveLength(3);
    expect(result.find((s) => s.name === 'a')!.command).toBe('user-a');
    expect(result.find((s) => s.name === 'b')!.command).toBe('preset-b');
    expect(result.find((s) => s.name === 'team')!.command).toBe('team');
  });

  it('enforces the per-conversation user connector selection while preserving builtins', () => {
    const stored = [
      {
        id: 'builtin',
        name: 'skill-search',
        builtin: true,
        enabled: true,
        transport: { type: 'stdio', command: 'builtin', args: [] },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tavily',
        name: 'tavily',
        source: 'custom',
        enabled: true,
        status: 'connected',
        transport: { type: 'stdio', command: 'tavily', args: [] },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'firecrawl',
        name: 'firecrawl',
        source: 'custom',
        enabled: true,
        status: 'connected',
        transport: { type: 'stdio', command: 'firecrawl', args: [] },
        createdAt: 1,
        updatedAt: 1,
      },
    ] as IMcpServer[];

    const scoped = McpConfig.fromStorageConfig(
      stored,
      { stdio: true, http: true, sse: true },
      ['tavily']
    );
    expect(scoped.map((server) => server.name).toSorted()).toEqual(['skill-search', 'tavily']);

    const none = McpConfig.fromStorageConfig(stored, { stdio: true, http: true, sse: true }, []);
    expect(none.map((server) => server.name)).toEqual(['skill-search']);
  });

  it('preserves the four reported vendor transport/auth shapes in the live ACP session declaration', () => {
    const stored = [
      {
        id: 'tavily',
        name: 'tavily',
        source: 'library',
        enabled: true,
        status: 'connected',
        transport: { type: 'streamable_http', url: 'https://mcp.tavily.com/mcp/' },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'firecrawl',
        name: 'firecrawl',
        source: 'library',
        enabled: true,
        status: 'connected',
        transport: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', 'firecrawl-mcp'],
          env: { FIRECRAWL_API_KEY: 'fc-test' },
        },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'n8n',
        name: 'n8n',
        source: 'custom',
        enabled: true,
        status: 'connected',
        transport: {
          type: 'http',
          url: 'https://automation.example/mcp-server/http',
          headers: { Authorization: 'Bearer n8n-test' },
        },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'beeper',
        name: 'beeper',
        source: 'custom',
        enabled: true,
        status: 'connected',
        transport: {
          type: 'streamable_http',
          url: 'http://localhost:23373/v0/mcp',
          headers: { Authorization: 'Bearer beeper-test' },
        },
        createdAt: 1,
        updatedAt: 1,
      },
    ] as IMcpServer[];

    const result = McpConfig.fromStorageConfig(
      stored,
      { stdio: true, http: true, sse: true },
      ['tavily', 'firecrawl', 'n8n', 'beeper']
    );
    expect(result.map((server) => server.name).toSorted()).toEqual(['beeper', 'firecrawl', 'n8n', 'tavily']);
    expect(result.find((server) => server.name === 'tavily')).toMatchObject({
      type: 'http',
      url: 'https://mcp.tavily.com/mcp/',
    });
    expect(result.find((server) => server.name === 'firecrawl')).toMatchObject({
      args: expect.arrayContaining(['firecrawl-mcp']),
      env: expect.arrayContaining([{ name: 'FIRECRAWL_API_KEY', value: 'fc-test' }]),
    });
    expect(result.find((server) => server.name === 'n8n')).toMatchObject({
      type: 'http',
      headers: [{ name: 'Authorization', value: 'Bearer n8n-test' }],
    });
    expect(result.find((server) => server.name === 'beeper')).toMatchObject({
      type: 'http',
      url: 'http://localhost:23373/v0/mcp',
      headers: [{ name: 'Authorization', value: 'Bearer beeper-test' }],
    });
  });
});
