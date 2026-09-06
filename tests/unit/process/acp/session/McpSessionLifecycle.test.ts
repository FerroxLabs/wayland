/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import type { InitializeResponse } from '@agentclientprotocol/sdk';
import type { IMcpServer } from '@/common/config/storage';
import { createMcpSessionDigestKey } from '@process/services/mcpServices/mcpSessionTruthGate';
import { ConfigTracker } from '@process/acp/session/ConfigTracker';
import { SessionLifecycle, type LifecycleHost } from '@process/acp/session/SessionLifecycle';
import type { AcpClient } from '@process/acp/infra/IAcpClient';

const publication = () => ({
  generation: 'live-launch',
  conversationId: 'live-conversation',
  backend: 'acp' as const,
  sessionKey: createMcpSessionDigestKey(),
});

const stdioSubset = (): IMcpServer =>
  ({
    id: 'stdio',
    name: 'stdio',
    source: 'custom',
    enabled: true,
    status: 'connected',
    allowedTools: ['search'],
    transport: { type: 'stdio', command: 'fixture-server', args: [] },
    createdAt: 1,
    updatedAt: 1,
  }) as IMcpServer;

const hostedSubset = (): IMcpServer =>
  ({
    id: 'hosted',
    name: 'hosted',
    source: 'custom',
    enabled: true,
    status: 'connected',
    allowedTools: ['search'],
    transport: { type: 'streamable_http', url: 'https://example.com/mcp' },
    createdAt: 1,
    updatedAt: 1,
  }) as IMcpServer;

function makeHarness(initResult: InitializeResponse, resumeSessionId?: string) {
  const createSession = vi.fn().mockResolvedValue({ sessionId: 'created' });
  const loadSession = vi.fn().mockResolvedValue({ sessionId: 'loaded' });
  const client = {
    start: vi.fn().mockResolvedValue(initResult),
    createSession,
    loadSession,
    onDisconnect: vi.fn(),
    setModel: vi.fn(),
    setMode: vi.fn(),
    setConfigOption: vi.fn(),
    close: vi.fn(),
  } as unknown as AcpClient;
  const onMcpProjection = vi.fn();
  const host = {
    agentConfig: {
      agentBackend: 'claude',
      agentSource: 'extension',
      agentId: 'claude',
      cwd: '/workspace',
      resumeSessionId,
      mcpStorageSource: {
        servers: [stdioSubset(), hostedSubset()],
        request: { publication: publication(), activeServerIds: ['stdio', 'hosted'] },
      },
    },
    configTracker: new ConfigTracker(),
    callbacks: {
      onInitialize: vi.fn(),
      onMcpProjection,
      onMessage: vi.fn(),
      onSessionId: vi.fn(),
      onStatusChange: vi.fn(),
      onConfigUpdate: vi.fn(),
      onModelUpdate: vi.fn(),
      onModeUpdate: vi.fn(),
      onContextUsage: vi.fn(),
      onPermissionRequest: vi.fn(),
      onSignal: vi.fn(),
    },
    metrics: { recordSpawnLatency: vi.fn() },
    setStatus: vi.fn(),
    enterError: vi.fn(),
    flushPendingPrompt: vi.fn(),
    buildProtocolHandlers: vi.fn(() => ({})),
    onDisconnect: vi.fn(),
  } as unknown as LifecycleHost;
  const lifecycle = new SessionLifecycle(host, { create: () => client }, { maxStartRetries: 0, maxResumeRetries: 0 });
  const internals = lifecycle as unknown as {
    spawnAndInit: () => Promise<void>;
    establishSession: () => Promise<unknown>;
  };
  return { lifecycle, internals, client, createSession, loadSession, onMcpProjection };
}

describe('SessionLifecycle live MCP projection', () => {
  it('uses live initialize capabilities and submits only enforceable descriptors', async () => {
    const h = makeHarness({
      protocolVersion: 1,
      agentCapabilities: { mcpCapabilities: { http: true } },
    } as InitializeResponse);

    await h.internals.spawnAndInit();
    await h.internals.establishSession();

    const submitted = h.createSession.mock.calls[0][0].mcpServers;
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toMatchObject({ name: 'stdio' });
    expect(submitted[0].args).toEqual(expect.arrayContaining(['--allow', 'search', '--', 'fixture-server']));
    expect(h.onMcpProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        omissions: [
          expect.objectContaining({
            reason: 'Standard ACP cannot enforce per-tool selection for hosted HTTP MCP servers',
          }),
        ],
      })
    );
  });

  it('rejects an unsupported initialize version before creating a session', async () => {
    const h = makeHarness({ protocolVersion: 2, agentCapabilities: {} } as InitializeResponse);

    await expect(h.internals.spawnAndInit()).rejects.toThrow(/Unsupported ACP protocol version 2/);
    expect(h.createSession).not.toHaveBeenCalled();
    expect(h.loadSession).not.toHaveBeenCalled();
  });

  it('uses the same live projection for resume and fresh-session fallback', async () => {
    const h = makeHarness(
      { protocolVersion: 1, agentCapabilities: { mcpCapabilities: {} } } as InitializeResponse,
      'resume-me'
    );
    h.loadSession.mockRejectedValueOnce(new Error('expired'));

    await h.internals.spawnAndInit();
    await h.internals.establishSession();

    expect(h.loadSession).toHaveBeenCalledOnce();
    expect(h.createSession).toHaveBeenCalledOnce();
    expect(h.loadSession.mock.calls[0][0].mcpServers).toEqual(h.createSession.mock.calls[0][0].mcpServers);
  });
});
