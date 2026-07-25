/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { parse } from 'smol-toml';
import type { IMcpServer } from '@/common/config/storage';
import { buildWCoreSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import {
  appendDesktopMcpProfile,
  WCORE_DESKTOP_MCP_PROFILE,
} from '@process/agent/wcore/envBuilder';

const server = (id: string, name: string, overrides: Partial<IMcpServer> = {}): IMcpServer => ({
  id,
  name,
  enabled: true,
  status: 'connected',
  transport: { type: 'streamable_http', url: `https://${id}.example.com/mcp` },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
  ...overrides,
});

describe('Desktop-managed Core MCP profile', () => {
  it('selects all supported user transports and sanitizes names', () => {
    const selected = buildWCoreSessionMcpServers([
      server('tavily', 'Tavily'),
      server('firecrawl', 'com.firecrawl/firecrawl'),
      server('builtin', 'builtin', { builtin: true }),
    ]);

    expect(selected.map((item) => item.name)).toEqual(['Tavily', 'com.firecrawl-firecrawl']);
  });

  it('enforces the exact per-chat id selection', () => {
    const all = [server('tavily', 'Tavily'), server('firecrawl', 'Firecrawl')];
    expect(buildWCoreSessionMcpServers(all, ['firecrawl']).map((item) => item.name)).toEqual(['Firecrawl']);
    expect(buildWCoreSessionMcpServers(all, [])).toEqual([]);
  });

  it('appends a valid Core profile while preserving provider overrides', () => {
    const text = appendDesktopMcpProfile(
      '[providers.openai.compat]\nmax_tokens_field = "max_completion_tokens"\n',
      ['tavily', 'firecrawl', 'tavily']
    );
    const config = parse(text) as {
      providers: { openai: { compat: { max_tokens_field: string } } };
      profiles: Record<string, { mcp_servers: string[] }>;
    };

    expect(config.providers.openai.compat.max_tokens_field).toBe('max_completion_tokens');
    expect(config.profiles[WCORE_DESKTOP_MCP_PROFILE].mcp_servers).toEqual(['firecrawl', 'tavily']);
  });

  it('represents an explicit no-connectors chat as an empty allowlist', () => {
    const config = parse(appendDesktopMcpProfile('', [])) as {
      profiles: Record<string, { mcp_servers: string[] }>;
    };
    expect(config.profiles[WCORE_DESKTOP_MCP_PROFILE].mcp_servers).toEqual([]);
  });
});
