/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { AcpConnection } from '@process/agent/acp/AcpConnection';
import { McpConfig } from '@process/acp/session/McpConfig';
import { mergeRuntimeMcpServers } from '@process/services/mcpServices/runtimeMcpServers';
import { createMcpSessionDigestKey } from '@process/services/mcpServices/mcpSessionTruthGate';
import { getMcpSessionReceiptForServer } from '@/common/mcp/sessionReceipt';
import type { IMcpServer } from '@/common/config/storage';
import { createMockAgentBinary } from '../e2e/helpers/mockAgentBinary';
import { SessionLifecycle, type LifecycleHost } from '@process/acp/session/SessionLifecycle';
import { ConfigTracker } from '@process/acp/session/ConfigTracker';
import { LegacyConnectorFactory } from '@process/acp/compat/LegacyConnectorFactory';
import { build as buildBundle } from 'esbuild';

const toolFilterPath = vi.hoisted(() => ({ current: '' }));
vi.mock('@process/utils/mcpScriptDir', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/utils/mcpScriptDir')>();
  return {
    ...actual,
    getMcpScriptPath: (name: string) =>
      name === 'builtin-mcp-tool-filter.js' && toolFilterPath.current
        ? toolFilterPath.current
        : actual.getMcpScriptPath(name),
  };
});

describe('MCP agent-consumption seam', () => {
  let connection: AcpConnection | null = null;
  let lifecycle: SessionLifecycle | null = null;
  let workspace: string | null = null;

  afterEach(async () => {
    await connection?.disconnect().catch(() => undefined);
    await lifecycle?.teardown().catch(() => undefined);
    if (workspace) await rm(workspace, { recursive: true, force: true });
  });

  it('hands the selected MCP declaration to the ACP agent, which can list and call its tool', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'wayland-mcp-agent-consumption-'));
    const expected = 'WAYLAND-MCP-AGENT-ROUNDTRIP';
    const agentScript = createMockAgentBinary({
      binary: 'opencode',
      mcpEcho: { serverName: 'deterministic-echo', text: expected },
    });
    const mcpScript = resolve(process.cwd(), 'tests/e2e/helpers/mocks/mockMcpServer.mjs');

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

  it('enforces a selected tool through production SessionLifecycle and ProcessAcpClient', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'wayland-mcp-production-consumption-'));
    const expected = 'WAYLAND-MCP-PRODUCTION-ROUNDTRIP';
    const callLog = join(workspace, 'upstream-calls.log');
    toolFilterPath.current = join(workspace, 'builtin-mcp-tool-filter.cjs');
    await buildBundle({
      entryPoints: [resolve(process.cwd(), 'src/process/resources/builtinMcp/toolFilterShimEntry.ts')],
      outfile: toolFilterPath.current,
      bundle: true,
      platform: 'node',
      format: 'cjs',
    });
    const agentScript = createMockAgentBinary({
      binary: 'opencode',
      mcpEcho: { serverName: 'deterministic-echo', text: expected, deniedTool: 'danger' },
      mcpCapabilities: {},
    });
    const mcpScript = resolve(process.cwd(), 'tests/e2e/helpers/mocks/mockMcpServer.mjs');
    const persistedDeclaration: IMcpServer = {
      id: 'deterministic-echo-id',
      name: 'deterministic-echo',
      source: 'custom',
      enabled: true,
      status: 'connected',
      allowedTools: ['echo'],
      transport: {
        type: 'stdio',
        command: process.execPath,
        args: [mcpScript],
        env: {
          WAYLAND_MCP_INCLUDE_DANGER: '1',
          WAYLAND_MCP_CALL_LOG: callLog,
        },
      },
      createdAt: 1,
      updatedAt: 1,
    };
    const chunks: string[] = [];
    let active!: () => void;
    const activePromise = new Promise<void>((resolveActive) => {
      active = resolveActive;
    });
    const projection = vi.fn();
    const configTracker = new ConfigTracker();
    const host = {
      agentConfig: {
        agentBackend: 'custom',
        agentSource: 'custom',
        agentId: 'fixture',
        command: process.execPath,
        args: [agentScript],
        cwd: workspace,
        mcpStorageSource: {
          servers: [persistedDeclaration],
          request: {
            publication: {
              generation: 'launch-production-consumption',
              conversationId: 'chat-production-consumption',
              backend: 'acp',
              sessionKey: createMcpSessionDigestKey(),
            },
            activeServerIds: [persistedDeclaration.id],
          },
        },
      },
      configTracker,
      messageTranslator: { reset: vi.fn() },
      callbacks: {
        onMcpProjection: projection,
        onInitialize: () => undefined,
        onMessage: () => undefined,
        onSessionId: () => undefined,
        onStatusChange: (status: string) => {
          if (status === 'active') active();
        },
        onConfigUpdate: () => undefined,
        onModelUpdate: () => undefined,
        onModeUpdate: () => undefined,
        onContextUsage: () => undefined,
        onPermissionRequest: () => undefined,
        onSignal: () => undefined,
      },
      metrics: { recordSpawnLatency: () => undefined },
      setStatus: (status: string) => {
        if (status === 'active') active();
      },
      enterError: (message: string) => {
        throw new Error(message);
      },
      flushPendingPrompt: () => undefined,
      buildProtocolHandlers: () => ({
        onSessionUpdate: (notification: unknown) => {
          const content = (notification as { update?: { content?: { text?: string } } }).update?.content;
          if (content?.text) chunks.push(content.text);
        },
        onRequestPermission: async () => ({ outcome: { outcome: 'cancelled' as const } }),
        onReadTextFile: async () => ({ content: '' }),
        onWriteTextFile: async () => ({}),
      }),
      onDisconnect: () => undefined,
    } as unknown as LifecycleHost;

    lifecycle = new SessionLifecycle(host, new LegacyConnectorFactory(), { maxStartRetries: 0, maxResumeRetries: 0 });
    lifecycle.start();
    await activePromise;
    await lifecycle.client!.prompt(lifecycle.sessionId!, [{ type: 'text', text: 'Use the selected echo connector.' }]);

    expect(chunks.join('')).toContain(expected);
    expect(projection).toHaveBeenCalledWith(
      expect.objectContaining({ servers: [expect.objectContaining({ name: 'deterministic-echo' })] })
    );
    expect(await readFile(callLog, 'utf8')).toBe('echo\n');
  });
});
