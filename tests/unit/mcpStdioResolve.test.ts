/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #827 — a Playwright MCP server (`npx @playwright/mcp`) showed green in Settings
 * but exposed zero tools in a live chat on Windows: the Settings probe rewrites
 * `npx` → bundled Bun, but the session-injection path passed `npx` verbatim to
 * the external ACP bridge, which can't resolve it on a machine with no system
 * npx. These tests pin that every session-injection path now applies the same
 * bundled-Bun rewrite the probe uses.
 */
import { describe, it, expect } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { resolveStdioMcpCommand } from '@process/utils/mcpStdioResolve';
import { resolveNpxPath } from '@process/utils/shellEnv';
import { McpConfig } from '@process/acp/session/McpConfig';
import { buildAcpSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';

const BUN = resolveNpxPath({}); // env-agnostic: bundled bun path, or bare 'bun'/'bun.exe'

describe('resolveStdioMcpCommand (#827)', () => {
  it('rewrites npx to bundled Bun with `x --bun` and the package args', () => {
    expect(resolveStdioMcpCommand('npx', ['@playwright/mcp'])).toEqual({
      command: BUN,
      args: ['x', '--bun', '@playwright/mcp'],
    });
  });

  it('strips npm-only flags (-y/--yes/--prefer-offline) that bun x rejects', () => {
    expect(resolveStdioMcpCommand('npx', ['-y', '@playwright/mcp', '--prefer-offline'])).toEqual({
      command: BUN,
      args: ['x', '--bun', '@playwright/mcp'],
    });
  });

  it('passes a non-npx command through unchanged', () => {
    expect(resolveStdioMcpCommand('node', ['server.js'])).toEqual({ command: 'node', args: ['server.js'] });
    expect(resolveStdioMcpCommand('/usr/bin/my-mcp', [])).toEqual({ command: '/usr/bin/my-mcp', args: [] });
  });
});

const npxServer = (): IMcpServer =>
  ({
    id: 'pw',
    name: 'playwright',
    enabled: true,
    status: 'connected',
    source: 'custom',
    transport: { type: 'stdio', command: 'npx', args: ['-y', '@playwright/mcp'] },
  }) as unknown as IMcpServer;

describe('session injection rewrites npx (#827)', () => {
  it('McpConfig.fromStorageConfig resolves an npx stdio server to bundled Bun', () => {
    const [server] = McpConfig.fromStorageConfig([npxServer()]);
    expect(server).toMatchObject({ name: 'playwright', command: BUN, args: ['x', '--bun', '@playwright/mcp'] });
  });

  it('buildAcpSessionMcpServers resolves an npx stdio server to bundled Bun', () => {
    const [server] = buildAcpSessionMcpServers([npxServer()], { stdio: true, http: false, sse: false });
    expect(server).toMatchObject({
      type: 'stdio',
      name: 'playwright',
      command: BUN,
      args: ['x', '--bun', '@playwright/mcp'],
    });
  });
});
