/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { AcpConnection } from '@process/agent/acp/AcpConnection';
import { McpConfig } from '@process/acp/session/McpConfig';
import { mergeRuntimeMcpServers } from '@process/services/mcpServices/runtimeMcpServers';
import type { IMcpServer } from '@/common/config/storage';
import { createMockAgentBinary } from '../e2e/helpers/mockAgentBinary';

describe('MCP agent-consumption seam', () => {
  let connection: AcpConnection | null = null;
  let workspace: string | null = null;

  afterEach(async () => {
    await connection?.disconnect().catch(() => undefined);
    if (workspace) await rm(workspace, { recursive: true, force: true });
  });

  it('hands the selected MCP declaration to the ACP agent, which can list and call its tool', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'wayland-mcp-agent-consumption-'));
    const expected = 'WAYLAND-MCP-AGENT-ROUNDTRIP';
    const agentScript = createMockAgentBinary({
      binary: 'opencode',
      mcpEcho: { serverName: 'deterministic-echo', text: expected },
    });
    const mcpScript = resolve(process.cwd(), 'tests/e2e/helpers/mocks/mockMcpServer.ts');

    connection = new AcpConnection();
    const chunks: string[] = [];
    connection.onSessionUpdate = (update) => {
      const content = (update as { update?: { content?: { text?: string } } }).update?.content;
      if (content?.text) chunks.push(content.text);
    };

    const persistedDeclaration: IMcpServer = {
      id: 'deterministic-echo-id',
      name: 'deterministic-echo',
      source: 'custom',
      enabled: true,
      status: 'connected',
      transport: { type: 'stdio', command: process.execPath, args: [mcpScript] },
      createdAt: 1,
      updatedAt: 1,
    };
    const sessionServers = McpConfig.fromStorageConfig(
      mergeRuntimeMcpServers([persistedDeclaration], []),
      { stdio: true, http: true, sse: true },
      [persistedDeclaration.id]
    );
    expect(sessionServers.map((server) => server.name)).toEqual(['deterministic-echo']);

    await connection.connect('custom', process.execPath, workspace, [agentScript]);
    await connection.newSession(workspace, {
      mcpServers: sessionServers,
    });
    await connection.sendPrompt('Use the selected echo connector.');

    expect(chunks.join('')).toContain(expected);
  });
});
