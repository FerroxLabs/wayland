/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse as parseToml } from 'smol-toml';
import type { IMcpServer } from '@/common/config/storage';
import { codexMcpBearerEnvVar, codexMcpHeaderEnvVar } from '@/common/mcp';
import {
  buildCodexMcpServerTable,
  materializeFluxCodexHome,
  materializeNativeCodexHome,
} from '@process/task/codexConfig';

function server(id: string, name: string, transport: IMcpServer['transport'], allowedTools?: string[]): IMcpServer {
  return {
    id,
    name,
    enabled: true,
    status: 'connected',
    transport,
    allowedTools,
    tools: [],
    createdAt: 1,
    updatedAt: 1,
    originalJson: '{}',
  };
}

describe('Codex per-conversation MCP materialization', () => {
  let dataDir: string;
  let userDir: string;
  let userConfig: string;
  let userAuth: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'wayland-codex-session-data-'));
    userDir = await mkdtemp(join(tmpdir(), 'wayland-codex-session-user-'));
    userConfig = join(userDir, 'config.toml');
    userAuth = join(userDir, 'auth.json');
  });

  afterEach(async () => {
    await Promise.all([rm(dataDir, { recursive: true, force: true }), rm(userDir, { recursive: true, force: true })]);
  });

  it('replaces stale Wayland entries with the exact selected set and preserves unmanaged native entries', async () => {
    await writeFile(
      userConfig,
      [
        'model = "gpt-5"',
        '',
        '[mcp_servers.tavily]',
        'url = "https://stale.example/mcp"',
        '',
        '[mcp_servers.firecrawl-mcp]',
        'url = "https://stale-case-duplicate.example/mcp"',
        '',
        '[mcp_servers.personal-native]',
        'command = "personal-mcp"',
        '',
      ].join('\n'),
      'utf8'
    );
    const firecrawl = server(
      'firecrawl-id',
      'Firecrawl MCP',
      {
        type: 'http',
        url: 'https://mcp.firecrawl.dev/key/v2/mcp',
        headers: { Authorization: 'Bearer top-secret', 'X-Access-Token': 'readwise-secret' },
      },
      ['firecrawl_scrape']
    );

    const home = await materializeNativeCodexHome(dataDir, 'read-only', userConfig, userAuth, {
      sessionId: 'chat/one',
      selectedServers: [firecrawl],
      managedServerNames: ['tavily', 'Firecrawl MCP'],
      preserveUnmanagedUserServers: true,
    });
    expect(home).toBe(join(dataDir, 'codex-homes', 'chat-one'));

    const raw = await readFile(join(home, 'config.toml'), 'utf8');
    const parsed = parseToml(raw) as {
      mcp_servers?: Record<
        string,
        {
          command?: string;
          url?: string;
          bearer_token_env_var?: string;
          env_http_headers?: Record<string, string>;
          enabled_tools?: string[];
        }
      >;
    };
    expect(parsed.mcp_servers?.tavily).toBeUndefined();
    expect(parsed.mcp_servers?.['firecrawl-mcp']).toBeUndefined();
    expect(parsed.mcp_servers?.['personal-native']?.command).toBe('personal-mcp');
    expect(parsed.mcp_servers?.['Firecrawl-MCP']).toMatchObject({
      url: 'https://mcp.firecrawl.dev/key/v2/mcp',
      bearer_token_env_var: codexMcpBearerEnvVar('Firecrawl MCP'),
      env_http_headers: { 'X-Access-Token': codexMcpHeaderEnvVar('Firecrawl MCP', 'X-Access-Token') },
      enabled_tools: ['firecrawl_scrape'],
    });
    expect(raw).not.toContain('top-secret');
    expect(raw).not.toContain('readwise-secret');
  });

  it('an explicit empty chat selection exposes no user or stale global MCP entries', async () => {
    await writeFile(userConfig, '[mcp_servers.personal]\ncommand = "personal-mcp"\n', 'utf8');
    const home = await materializeNativeCodexHome(dataDir, 'workspace-write', userConfig, userAuth, {
      sessionId: 'chat-two',
      selectedServers: [],
      managedServerNames: [],
      preserveUnmanagedUserServers: false,
    });
    const parsed = parseToml(await readFile(join(home, 'config.toml'), 'utf8')) as { mcp_servers?: unknown };
    expect(parsed.mcp_servers).toBeUndefined();
  });

  it('uses distinct homes for simultaneous Flux chats and carries only each chat selection', async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    const tavily = server('tavily-id', 'tavily', { type: 'http', url: 'https://mcp.tavily.com/mcp/' });
    const firecrawl = server('firecrawl-id', 'firecrawl', {
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'firecrawl-mcp'],
      env: { FIRECRAWL_API_KEY: 'fc-key' },
    });
    const [homeA, homeB] = await Promise.all([
      materializeFluxCodexHome(dataDir, 'read-only', undefined, userConfig, undefined, {
        sessionId: 'chat-a',
        selectedServers: [tavily],
        managedServerNames: ['tavily', 'firecrawl'],
      }),
      materializeFluxCodexHome(dataDir, 'read-only', undefined, userConfig, undefined, {
        sessionId: 'chat-b',
        selectedServers: [firecrawl],
        managedServerNames: ['tavily', 'firecrawl'],
      }),
    ]);
    expect(homeA).not.toBe(homeB);
    const configA = parseToml(await readFile(join(homeA, 'config.toml'), 'utf8')) as {
      mcp_servers?: Record<string, unknown>;
    };
    const configB = parseToml(await readFile(join(homeB, 'config.toml'), 'utf8')) as {
      mcp_servers?: Record<string, unknown>;
    };
    expect(Object.keys(configA.mcp_servers ?? {})).toEqual(['tavily']);
    expect(Object.keys(configB.mcp_servers ?? {})).toEqual(['firecrawl']);
  });

  it('omits unsupported SSE declarations instead of creating a false-ready Codex entry', () => {
    const table = buildCodexMcpServerTable([
      server('sse-id', 'legacy-sse', { type: 'sse', url: 'https://example.com/sse' }),
    ]);
    expect(table).toEqual({});
  });
});
