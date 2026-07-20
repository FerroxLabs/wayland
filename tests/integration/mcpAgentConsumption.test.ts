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
import { createMcpSessionDigestKey } from '@process/services/mcpServices/mcpSessionTruthGate';
import { getMcpSessionReceiptForServer } from '@/common/mcp/sessionReceipt';
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
    // Traverse the receipt-bound publication seam: the projection both selects
    // the session declaration AND mints the correlated current-session receipt,
    // so what the agent consumes is exactly what publication truth records.
    const projection = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([persistedDeclaration], []), {
      publication: {
        generation: 'launch-agent-consumption',
        conversationId: 'chat-agent-consumption',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: true },
      activeServerIds: [persistedDeclaration.id],
    });
    const sessionServers = projection.servers;
    expect(sessionServers.map((server) => server.name)).toEqual(['deterministic-echo']);
    expect(getMcpSessionReceiptForServer(projection.sessionState, persistedDeclaration)?.status).toBe(
      'published_unverified'
    );

    await connection.connect('custom', process.execPath, workspace, [agentScript]);
    await connection.newSession(workspace, {
      mcpServers: sessionServers,
    });
    await connection.sendPrompt('Use the selected echo connector.');

    expect(chunks.join('')).toContain(expected);
  });
});
