import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMcpServerCRUD } from '@renderer/hooks/mcp/useMcpServerCRUD';
import {
  MCP_PREPUBLICATION_MAX_AGE_MS,
  readCorrelatedMcpPrepublicationTruth,
  useMcpConnection,
} from '@renderer/hooks/mcp/useMcpConnection';
import { Message } from '@arco-design/web-react';
import type { IMcpServer } from '@/common/config/storage';

const bridgeMocks = vi.hoisted(() => ({
  getAvailableAgents: vi.fn(),
  archiveConfiguredServer: vi.fn(),
  testMcpConnection: vi.fn(),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: bridgeMocks.getAvailableAgents } },
  mcpService: {
    archiveConfiguredServer: { invoke: bridgeMocks.archiveConfiguredServer },
    testMcpConnection: { invoke: bridgeMocks.testMcpConnection },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@arco-design/web-react', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { set: vi.fn().mockResolvedValue(undefined) },
}));

const makeMockServer = (overrides?: Partial<IMcpServer>): IMcpServer => ({
  id: 'mcp_1',
  name: 'test-server',
  enabled: true,
  createdAt: 1000,
  updatedAt: 1000,
  transport: { type: 'stdio' as const, command: 'echo', args: [] },
  originalJson: '{}',
  ...overrides,
});

describe('MCP pre-publication renderer correlation', () => {
  const server = makeMockServer({ id: 'mcp-correlated', name: 'Tavily', updatedAt: 100 });
  const now = 1_000_000;
  const successfulResult = {
    success: true,
    tools: [{ name: 'search' }],
    prepublication: {
      version: 'wayland-mcp-prepublication/1' as const,
      serverId: server.id,
      serverName: server.name,
      serverUpdatedAt: server.updatedAt,
      observedAt: now,
      state: 'probed' as const,
      authentication: 'validated' as const,
      probe: 'succeeded' as const,
      toolCount: 1,
    },
  };

  it('accepts only fresh truth for the exact saved declaration revision', () => {
    expect(readCorrelatedMcpPrepublicationTruth(server, successfulResult, now)).toMatchObject({
      state: 'probed',
      serverUpdatedAt: 100,
    });
    expect(() => readCorrelatedMcpPrepublicationTruth({ ...server, updatedAt: 101 }, successfulResult, now)).toThrow(
      'mismatched'
    );
  });

  it('rejects stale, future, and contradictory probe evidence', () => {
    expect(() =>
      readCorrelatedMcpPrepublicationTruth(
        server,
        {
          ...successfulResult,
          prepublication: {
            ...successfulResult.prepublication,
            observedAt: now - MCP_PREPUBLICATION_MAX_AGE_MS - 1,
          },
        },
        now
      )
    ).toThrow('stale');
    expect(() =>
      readCorrelatedMcpPrepublicationTruth(
        server,
        { ...successfulResult, prepublication: { ...successfulResult.prepublication, observedAt: now + 5_001 } },
        now
      )
    ).toThrow('stale');
    expect(() => readCorrelatedMcpPrepublicationTruth(server, { ...successfulResult, success: false }, now)).toThrow(
      'contradicts'
    );
    expect(() =>
      readCorrelatedMcpPrepublicationTruth(server, { ...successfulResult, authMethod: 'oauth' }, now)
    ).toThrow('contradicts');

    const authRequired = {
      success: false,
      needsAuth: true,
      authMethod: 'oauth' as const,
      prepublication: {
        ...successfulResult.prepublication,
        state: 'authentication-required' as const,
        authentication: 'required' as const,
        probe: 'not-completed' as const,
        authMethod: 'oauth' as const,
      },
    };
    expect(readCorrelatedMcpPrepublicationTruth(server, authRequired, now)).toMatchObject({
      state: 'authentication-required',
      authMethod: 'oauth',
    });
    expect(() => readCorrelatedMcpPrepublicationTruth(server, { ...authRequired, authMethod: 'basic' }, now)).toThrow(
      'contradicts'
    );
  });

  it('discards a successful probe when the saved declaration changes in flight', async () => {
    let stored = [server];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    let resolveProbe!: (value: unknown) => void;
    bridgeMocks.testMcpConnection.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProbe = resolve;
      })
    );
    const message = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    } as unknown as ReturnType<typeof Message.useMessage>[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message));

    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.handleTestMcpConnection(server);
      await Promise.resolve();
    });
    stored = [{ ...stored[0], status: 'disconnected', updatedAt: 101 }];
    resolveProbe({ success: true, data: successfulResult });
    await act(async () => pending);

    expect(stored[0]).toMatchObject({ updatedAt: 101, status: 'disconnected' });
    expect(message.success).not.toHaveBeenCalled();
  });

  it('clears the in-flight indicator when the initial testing-state write fails', async () => {
    bridgeMocks.testMcpConnection.mockClear();
    const save = vi.fn().mockRejectedValue(new Error('storage unavailable'));
    const message = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    } as unknown as ReturnType<typeof Message.useMessage>[0];
    const { result } = renderHook(() => useMcpConnection([server], save, message));

    await act(async () => {
      await result.current.handleTestMcpConnection(server);
    });

    expect(result.current.testingServers[server.id]).toBe(false);
    expect(bridgeMocks.testMcpConnection).not.toHaveBeenCalled();
  });

  it('revokes an enabled publication before persisting a failed probe as disabled', async () => {
    let stored = [server];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const remove = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue(undefined);
    bridgeMocks.testMcpConnection.mockResolvedValueOnce({
      success: true,
      data: {
        success: false,
        error: 'probe unavailable',
        prepublication: {
          version: 'wayland-mcp-prepublication/1',
          serverId: server.id,
          serverName: server.name,
          serverUpdatedAt: server.updatedAt,
          observedAt: Date.now(),
          state: 'probe-failed',
          authentication: 'unavailable',
          probe: 'failed',
          error: 'probe unavailable',
        },
      },
    });
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message, undefined, remove, sync));

    await act(async () => result.current.handleTestMcpConnection(server));

    expect(remove).toHaveBeenCalledWith(server.name, undefined, server.transport.type);
    expect(sync).not.toHaveBeenCalled();
    expect(stored[0]).toMatchObject({ enabled: false, status: 'error' });
  });

  it('does not leave a concurrent enabled declaration false-green when failed-probe revocation wins but status CAS loses', async () => {
    const concurrent = { ...server, description: 'concurrent edit', updatedAt: server.updatedAt + 1 };
    let stored = [server];
    let saveCount = 0;
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      saveCount += 1;
      // The initial testing-state write preserves the declaration revision. A
      // concurrent edit lands after the probe begins but before the failed
      // probe tries to commit its revoked/disabled truth.
      if (saveCount === 2) stored = [concurrent];
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const remove = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue(undefined);
    bridgeMocks.testMcpConnection.mockResolvedValueOnce({ success: false, msg: 'probe unavailable' });
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message, undefined, remove, sync));

    await act(async () => result.current.handleTestMcpConnection(server));

    expect(remove).toHaveBeenCalledWith(server.name, undefined, server.transport.type);
    const winnerWasRepublished = sync.mock.calls.some(
      ([published]) => published.id === concurrent.id && published.updatedAt === concurrent.updatedAt
    );
    const durableTruthFailsClosed =
      stored[0].enabled === false || stored[0].lastError?.includes('publication rollback incomplete') === true;
    expect(winnerWasRepublished || durableTruthFailsClosed).toBe(true);
  });

  it('restores all publications and keeps local enabled truth when revocation reports failure', async () => {
    let stored = [server];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const remove = vi.fn().mockRejectedValue(new Error('partial removal'));
    const sync = vi.fn().mockResolvedValue(undefined);
    bridgeMocks.testMcpConnection.mockResolvedValueOnce({ success: false, msg: 'probe unavailable' });
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message, undefined, remove, sync));

    await act(async () => result.current.handleTestMcpConnection(server));

    expect(sync).toHaveBeenCalledWith(server, true);
    expect(stored[0]).toMatchObject({ enabled: true, status: 'error' });
  });

  it('surfaces an incomplete publication rollback instead of hiding external divergence', async () => {
    let stored = [server];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const remove = vi.fn().mockRejectedValue(new Error('partial removal'));
    const sync = vi.fn().mockRejectedValue(new Error('restore rejected'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    bridgeMocks.testMcpConnection.mockResolvedValueOnce({ success: false, msg: 'probe unavailable' });
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message, undefined, remove, sync));

    await act(async () => result.current.handleTestMcpConnection(server));
    errorSpy.mockRestore();

    expect(sync).toHaveBeenCalledWith(server, true);
    expect(stored[0]).toMatchObject({ enabled: true, status: 'error' });
    expect(stored[0].lastError).toMatch(/rollback|restore|reconcil/i);
    expect(message.error).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringMatching(/rollback|restore|reconcil/i) })
    );
  });

  it('does not truncate the publication-divergence marker behind a long probe error', async () => {
    let stored = [server];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const remove = vi.fn().mockRejectedValue(new Error('partial removal'));
    const sync = vi.fn().mockRejectedValue(new Error('restore rejected'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    bridgeMocks.testMcpConnection.mockReset().mockResolvedValueOnce({ success: false, msg: 'x'.repeat(300) });
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message, undefined, remove, sync));

    await act(async () => result.current.handleTestMcpConnection(server));
    errorSpy.mockRestore();

    expect(stored[0]).toMatchObject({ enabled: true, status: 'error' });
    expect(stored[0].lastError).toContain('publication rollback incomplete');
  });

  it('does not let a later standalone probe erase an unresolved publication divergence', async () => {
    let stored = [server];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const remove = vi.fn().mockRejectedValue(new Error('partial removal'));
    const sync = vi.fn().mockRejectedValue(new Error('restore rejected'));
    bridgeMocks.testMcpConnection
      .mockResolvedValueOnce({ success: false, msg: 'probe unavailable' })
      .mockImplementationOnce(async () => ({
        success: true,
        data: {
          success: true,
          tools: [{ name: 'search' }],
          prepublication: {
            version: 'wayland-mcp-prepublication/1',
            serverId: stored[0].id,
            serverName: stored[0].name,
            serverUpdatedAt: stored[0].updatedAt,
            observedAt: Date.now(),
            state: 'probed',
            authentication: 'validated',
            probe: 'succeeded',
            toolCount: 1,
          },
        },
      }));
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message, undefined, remove, sync));

    await act(async () => result.current.handleTestMcpConnection(server));
    expect(stored[0].lastError).toMatch(/rollback|restore|reconcil/i);

    await act(async () => result.current.refreshServerStatuses(stored, { force: true }));

    expect(stored[0]).toMatchObject({ enabled: true, status: 'error' });
    expect(stored[0].lastError).toMatch(/rollback|restore|reconcil/i);
  });

  it('does not let a direct reconnect probe erase an unresolved publication divergence', async () => {
    const divergent = makeMockServer({
      ...server,
      status: 'error',
      lastError: 'probe unavailable; publication rollback incomplete — reconnect this connector',
    });
    let stored = [divergent];
    const save = vi.fn(async (updater: IMcpServer[] | ((previous: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    bridgeMocks.testMcpConnection.mockReset().mockResolvedValueOnce({
      success: true,
      data: {
        success: true,
        tools: [{ name: 'search' }],
        prepublication: {
          version: 'wayland-mcp-prepublication/1',
          serverId: divergent.id,
          serverName: divergent.name,
          serverUpdatedAt: divergent.updatedAt,
          observedAt: Date.now(),
          state: 'probed',
          authentication: 'validated',
          probe: 'succeeded',
          toolCount: 1,
        },
      },
    });
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() } as unknown as ReturnType<
      typeof Message.useMessage
    >[0];
    const { result } = renderHook(() => useMcpConnection(stored, save, message));

    await act(async () => result.current.handleTestMcpConnection(divergent));

    expect(stored[0]).toMatchObject({ enabled: true, status: 'error' });
    expect(stored[0].lastError).toMatch(/rollback|restore|reconcil/i);
  });
});

describe('useMcpServerCRUD', () => {
  const saveMcpServers = vi.fn().mockImplementation(async (updater: unknown) => {
    if (typeof updater === 'function') (updater as (prev: IMcpServer[]) => IMcpServer[])([]);
  });
  const syncMcpToAgents = vi.fn().mockResolvedValue(undefined);
  const removeMcpFromAgents = vi.fn().mockResolvedValue(undefined);
  const checkSingleServerInstallStatus = vi.fn().mockResolvedValue(undefined);
  const setAgentInstallStatus = vi.fn();
  const refreshMcpServers = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    saveMcpServers.mockImplementation(async (updater: unknown) => {
      if (typeof updater === 'function') (updater as (prev: IMcpServer[]) => IMcpServer[])([]);
    });
    syncMcpToAgents.mockResolvedValue(undefined);
    removeMcpFromAgents.mockResolvedValue(undefined);
    refreshMcpServers.mockResolvedValue(undefined);
    bridgeMocks.getAvailableAgents.mockResolvedValue({
      success: true,
      data: [{ backend: 'wcore', name: 'Wayland Core' }],
    });
    bridgeMocks.archiveConfiguredServer.mockResolvedValue({
      success: true,
      data: {
        archiveId: '9fef2d90-6384-4a84-834c-efb1a437696f',
        archivedAt: 2000,
        serverId: 'mcp_1',
        name: 'test-server',
        transportType: 'stdio',
      },
    });
    bridgeMocks.testMcpConnection.mockReset();
  });

  const renderCRUD = (servers: IMcpServer[] = [], readMcpServers = async () => servers) =>
    renderHook(() =>
      useMcpServerCRUD(
        servers,
        saveMcpServers,
        syncMcpToAgents,
        removeMcpFromAgents,
        checkSingleServerInstallStatus,
        setAgentInstallStatus,
        refreshMcpServers,
        readMcpServers
      )
    );

  describe('handleAddMcpServer pre-publication transaction', () => {
    it('updates a canonical-name match instead of creating a case-only duplicate', async () => {
      let stored = [makeMockServer({ id: 'existing', name: 'Tavily', enabled: false })];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored =
          typeof updater === 'function'
            ? (updater as (prev: IMcpServer[]) => IMcpServer[])(stored)
            : (updater as IMcpServer[]);
      });

      const { result } = renderCRUD(stored);
      await act(async () => {
        await result.current.handleAddMcpServer({
          name: 'tavily',
          enabled: true,
          status: 'connected',
          transport: { type: 'streamable_http', url: 'https://mcp.tavily.com/mcp/' },
        });
      });

      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ id: 'existing', name: 'tavily', enabled: false, status: 'disconnected' });
      expect(syncMcpToAgents).not.toHaveBeenCalled();
    });

    it('advances the declaration revision even when the wall clock does not move', async () => {
      const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
      let stored = [makeMockServer({ id: 'existing', name: 'Tavily', enabled: false, updatedAt: 1000 })];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored = (updater as (prev: IMcpServer[]) => IMcpServer[])(stored);
      });

      const { result } = renderCRUD(stored);
      await act(async () => {
        await result.current.handleAddMcpServer({
          name: 'tavily',
          enabled: false,
          transport: { type: 'streamable_http', url: 'https://mcp.tavily.com/mcp/' },
        });
      });

      expect(stored[0].updatedAt).toBe(1001);
      now.mockRestore();
    });

    it('downgrades imported enabled/connected claims to a saved declaration without publishing', async () => {
      let stored: IMcpServer[] = [];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored =
          typeof updater === 'function'
            ? (updater as (prev: IMcpServer[]) => IMcpServer[])(stored)
            : (updater as IMcpServer[]);
      });

      const { result } = renderCRUD();

      await act(async () => {
        await result.current.handleAddMcpServer({
          name: 'beeper',
          enabled: true,
          status: 'connected',
          transport: { type: 'streamable_http', url: 'http://localhost:23373/v0/mcp' },
        });
      });

      expect(syncMcpToAgents).not.toHaveBeenCalled();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ name: 'beeper', enabled: false, status: 'disconnected' });
    });

    it('revokes a previously enabled same-name definition before replacing it as disabled', async () => {
      let stored: IMcpServer[] = [makeMockServer({ id: 'existing', name: 'beeper', enabled: true })];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored =
          typeof updater === 'function'
            ? (updater as (prev: IMcpServer[]) => IMcpServer[])(stored)
            : (updater as IMcpServer[]);
      });
      const { result } = renderCRUD(stored);

      await act(async () => {
        await result.current.handleAddMcpServer({
          name: 'beeper',
          enabled: true,
          status: 'connected',
          transport: { type: 'streamable_http', url: 'http://localhost:23373/v0/mcp' },
        });
      });

      expect(removeMcpFromAgents).toHaveBeenCalledWith('beeper', undefined, 'stdio');
      expect(syncMcpToAgents).not.toHaveBeenCalled();
      expect(stored[0]).toMatchObject({ id: 'existing', enabled: false, status: 'disconnected' });
    });

    it('restores an old publication when replacement declaration persistence fails', async () => {
      const existing = makeMockServer({ id: 'existing', name: 'beeper', enabled: true });
      saveMcpServers.mockRejectedValueOnce(new Error('storage unavailable'));
      const { result } = renderCRUD([existing]);

      await act(async () => {
        await expect(
          result.current.handleAddMcpServer({
            name: 'beeper',
            enabled: true,
            status: 'connected',
            transport: { type: 'streamable_http', url: 'http://localhost:23373/v0/mcp' },
          })
        ).rejects.toThrow('storage unavailable');
      });

      expect(removeMcpFromAgents).toHaveBeenCalledWith('beeper', undefined, 'stdio');
      expect(syncMcpToAgents).toHaveBeenCalledWith(existing, true);
    });

    it('does not overwrite a declaration that changes after add reads durable state', async () => {
      const original = makeMockServer({ id: 'existing', name: 'beeper', enabled: true, updatedAt: 1000 });
      const concurrent = { ...original, description: 'concurrent edit', updatedAt: 1001 };
      let stored = [original];
      removeMcpFromAgents.mockImplementationOnce(async () => {
        stored = [concurrent];
      });
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored = (updater as (prev: IMcpServer[]) => IMcpServer[])(stored);
      });
      const { result } = renderCRUD([original], async () => [original]);

      await act(async () => {
        await expect(
          result.current.handleAddMcpServer({
            name: 'beeper',
            enabled: false,
            transport: { type: 'streamable_http', url: 'http://localhost:23373/v0/mcp' },
          })
        ).rejects.toThrow(/changed|conflict|stale/i);
      });

      expect(stored).toEqual([concurrent]);
      expect(syncMcpToAgents).toHaveBeenCalledWith(original, true);
    });
  });

  describe('handleBatchImportMcpServers publication transaction', () => {
    it('collapses case-only duplicates within the same import batch', async () => {
      let stored: IMcpServer[] = [];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored =
          typeof updater === 'function'
            ? (updater as (prev: IMcpServer[]) => IMcpServer[])(stored)
            : (updater as IMcpServer[]);
      });

      const { result } = renderCRUD();
      await act(async () => {
        await result.current.handleBatchImportMcpServers([
          {
            name: 'Firecrawl',
            enabled: false,
            transport: { type: 'stdio', command: 'npx', args: ['-y', 'firecrawl-mcp'] },
          },
          {
            name: 'firecrawl',
            enabled: false,
            transport: { type: 'stdio', command: 'bunx', args: ['firecrawl-mcp'] },
          },
        ]);
      });

      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        name: 'firecrawl',
        transport: { type: 'stdio', command: 'bunx' },
      });
    });

    it('imports all definitions disabled and ignores incoming connected/publication claims', async () => {
      let stored: IMcpServer[] = [];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored =
          typeof updater === 'function'
            ? (updater as (prev: IMcpServer[]) => IMcpServer[])(stored)
            : (updater as IMcpServer[]);
      });
      const { result } = renderCRUD();
      await act(async () => {
        await result.current.handleBatchImportMcpServers([
          {
            name: 'tavily',
            enabled: true,
            status: 'connected',
            transport: { type: 'streamable_http', url: 'https://mcp.tavily.com/mcp/' },
          },
          {
            name: 'n8n',
            enabled: true,
            status: 'connected',
            transport: { type: 'http', url: 'http://localhost:5678/mcp-server/http' },
          },
        ]);
      });

      expect(syncMcpToAgents).not.toHaveBeenCalled();
      expect(stored).toHaveLength(2);
      expect(stored.every((server) => server.enabled === false && server.status === 'disconnected')).toBe(true);
    });

    it('does not overwrite a declaration that changes after batch import reads durable state', async () => {
      const original = makeMockServer({ id: 'existing', name: 'firecrawl', enabled: true, updatedAt: 2000 });
      const concurrent = { ...original, description: 'concurrent edit', updatedAt: 2001 };
      let stored = [original];
      removeMcpFromAgents.mockImplementationOnce(async () => {
        stored = [concurrent];
      });
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored = (updater as (prev: IMcpServer[]) => IMcpServer[])(stored);
      });
      const { result } = renderCRUD([original], async () => [original]);

      await act(async () => {
        await expect(
          result.current.handleBatchImportMcpServers([
            {
              name: 'firecrawl',
              enabled: false,
              transport: { type: 'streamable_http', url: 'https://mcp.firecrawl.dev/v2' },
            },
          ])
        ).rejects.toThrow(/changed|conflict|stale/i);
      });

      expect(stored).toEqual([concurrent]);
      expect(syncMcpToAgents).toHaveBeenCalledWith(original, true);
    });

    it('restores every prior publication when any batch revocation reports failure', async () => {
      const first = makeMockServer({ id: 'one', name: 'tavily', enabled: true });
      const second = makeMockServer({ id: 'two', name: 'firecrawl', enabled: true });
      removeMcpFromAgents.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('config locked'));
      const { result } = renderCRUD([first, second]);

      await act(async () => {
        await expect(
          result.current.handleBatchImportMcpServers([
            { name: 'tavily', enabled: false, transport: first.transport },
            { name: 'firecrawl', enabled: false, transport: second.transport },
          ])
        ).rejects.toThrow('Failed to revoke existing MCP publications');
      });

      expect(syncMcpToAgents).toHaveBeenCalledTimes(2);
      expect(syncMcpToAgents).toHaveBeenCalledWith(first, true);
      expect(syncMcpToAgents).toHaveBeenCalledWith(second, true);
      expect(saveMcpServers).not.toHaveBeenCalled();
    });
  });

  describe('handleToggleMcpServer uses static Message API (Fixes ELECTRON-D)', () => {
    it('publishes a newly saved revision even when the render closure is stale', async () => {
      let durable = [makeMockServer({ enabled: false, updatedAt: 41 })];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        durable = (updater as (current: IMcpServer[]) => IMcpServer[])(durable);
      });
      const { result } = renderCRUD([], async () => structuredClone(durable));

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', true, 41);
      });

      expect(outcome).toMatchObject({ id: 'mcp_1', enabled: true });
      expect(syncMcpToAgents).toHaveBeenCalledWith(expect.objectContaining({ id: 'mcp_1', enabled: true }), true);
      expect(durable[0].enabled).toBe(true);
      expect(durable[0].updatedAt).toBeGreaterThan(41);
    });

    it('returns the exact reconciled revision and clears publication divergence after republishing', async () => {
      let durable = [
        makeMockServer({
          enabled: true,
          status: 'error',
          lastError: 'probe unavailable; publication rollback incomplete — reconnect this connector',
          updatedAt: 41,
        }),
      ];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        durable = (updater as (current: IMcpServer[]) => IMcpServer[])(durable);
      });
      const { result } = renderCRUD([], async () => structuredClone(durable));

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', true, 41);
      });

      expect(outcome).toEqual(durable[0]);
      expect(outcome).toMatchObject({ enabled: true, status: 'disconnected', lastError: undefined });
      expect(syncMcpToAgents).toHaveBeenCalledWith(outcome, true);
    });

    it('does not publish when the requested declaration revision is stale', async () => {
      const durable = [makeMockServer({ enabled: false, updatedAt: 42 })];
      const { result } = renderCRUD([], async () => structuredClone(durable));

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', true, 41);
      });

      expect(outcome).toBe(false);
      expect(syncMcpToAgents).not.toHaveBeenCalled();
      expect(saveMcpServers).not.toHaveBeenCalled();
    });

    it('calls static Message.error when sync throws, not hook-based message', async () => {
      const server = makeMockServer();
      syncMcpToAgents.mockRejectedValueOnce(new Error('sync failed'));

      const { result } = renderCRUD([server]);

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', true);
      });

      expect(Message.error).toHaveBeenCalledWith('settings.mcpSyncError');
      expect(outcome).toBe(false);
      expect(saveMcpServers).not.toHaveBeenCalled();
      expect(removeMcpFromAgents).toHaveBeenCalledWith(server.name, undefined, server.transport.type);
    });

    it('calls static Message.error when remove throws', async () => {
      const server = makeMockServer({ enabled: true });
      removeMcpFromAgents.mockRejectedValueOnce(new Error('remove failed'));

      const { result } = renderCRUD([server]);

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', false);
      });

      expect(Message.error).toHaveBeenCalledWith('settings.mcpRemoveError');
      expect(outcome).toBe(false);
      expect(saveMcpServers).not.toHaveBeenCalled();
      expect(syncMcpToAgents).toHaveBeenCalledWith(server, true);
    });

    it('revokes a new publication when the enabled-state commit fails', async () => {
      const server = makeMockServer({ enabled: false });
      saveMcpServers.mockRejectedValueOnce(new Error('storage unavailable'));
      const { result } = renderCRUD([server]);

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer(server.id, true);
      });

      expect(syncMcpToAgents).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }), true);
      expect(removeMcpFromAgents).toHaveBeenCalledWith(server.name, undefined, server.transport.type);
      expect(outcome).toBe(false);
    });

    it('persists an unresolved-divergence marker when publication commit and compensation both fail', async () => {
      const original = makeMockServer({ enabled: false, updatedAt: 1000 });
      const concurrent = { ...original, description: 'concurrent edit', updatedAt: 1001 };
      let durable = [original];
      syncMcpToAgents.mockResolvedValueOnce(undefined);
      removeMcpFromAgents.mockRejectedValueOnce(new Error('adapter cleanup failed'));
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        // The adapter publication completed, but another durable edit wins the
        // compare-and-set before the enabled state can be committed.
        durable = [concurrent];
        durable = (updater as (current: IMcpServer[]) => IMcpServer[])(durable);
      });
      const { result } = renderCRUD([], async () => [original]);

      await act(async () => {
        await expect(result.current.handleToggleMcpServer(original.id, true)).rejects.toThrow(
          'publication rollback was incomplete'
        );
      });

      // The replacement publication may still exist externally. Durable truth
      // must carry the same fail-closed marker used to suppress passive/direct
      // probing until an explicit reconnect reconciles publication.
      expect(durable[0]).toMatchObject({ enabled: false, status: 'error' });
      expect(durable[0].lastError).toContain('publication rollback incomplete');
    });

    it('retains a disabled reconciliation handle when the declaration is concurrently deleted', async () => {
      const original = makeMockServer({ enabled: false, updatedAt: 1000 });
      let durable = [original];
      let firstWrite = true;
      removeMcpFromAgents.mockRejectedValueOnce(new Error('adapter cleanup failed'));
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        if (firstWrite) {
          durable = [];
          firstWrite = false;
        }
        durable = (updater as (current: IMcpServer[]) => IMcpServer[])(durable);
      });
      const { result } = renderCRUD([], async () => [original]);

      await act(async () => {
        await expect(result.current.handleToggleMcpServer(original.id, true)).rejects.toThrow(
          'publication rollback was incomplete'
        );
      });

      expect(durable).toHaveLength(1);
      expect(durable[0]).toMatchObject({
        id: original.id,
        enabled: false,
        status: 'error',
        lastError: expect.stringContaining('publication rollback incomplete'),
      });
    });

    it('marks a concurrent canonical replacement instead of creating a duplicate reconciliation row', async () => {
      const original = makeMockServer({ id: 'old-id', name: 'Tavily', enabled: false, updatedAt: 1000 });
      const replacement = makeMockServer({ id: 'new-id', name: 'tavily', enabled: false, updatedAt: 1001 });
      let durable = [original];
      let firstWrite = true;
      removeMcpFromAgents.mockRejectedValueOnce(new Error('adapter cleanup failed'));
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        if (firstWrite) {
          durable = [replacement];
          firstWrite = false;
        }
        durable = (updater as (current: IMcpServer[]) => IMcpServer[])(durable);
      });
      const { result } = renderCRUD([], async () => [original]);

      await act(async () => {
        await expect(result.current.handleToggleMcpServer(original.id, true)).rejects.toThrow(
          'publication rollback was incomplete'
        );
      });

      expect(durable).toHaveLength(1);
      expect(durable[0]).toMatchObject({
        id: replacement.id,
        name: replacement.name,
        enabled: false,
        status: 'error',
        lastError: expect.stringContaining('publication rollback incomplete'),
      });
    });

    it('restores an old publication when the disabled-state commit fails', async () => {
      const server = makeMockServer({ enabled: true });
      saveMcpServers.mockRejectedValueOnce(new Error('storage unavailable'));
      const { result } = renderCRUD([server]);

      let outcome: IMcpServer | false | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer(server.id, false);
      });

      expect(removeMcpFromAgents).toHaveBeenCalledWith(server.name, undefined, server.transport.type);
      expect(syncMcpToAgents).toHaveBeenCalledWith(server, true);
      expect(outcome).toBe(false);
    });
  });

  describe('handleDeleteMcpServer uses static Message API', () => {
    it('archives before revoking even a locally-disabled record and refreshes from main-process truth', async () => {
      const server = makeMockServer({ enabled: false });

      const { result } = renderCRUD([server]);

      await act(async () => {
        await result.current.handleDeleteMcpServer('mcp_1');
      });

      expect(bridgeMocks.archiveConfiguredServer).toHaveBeenCalledWith({
        serverId: 'mcp_1',
        agents: [{ backend: 'wcore', name: 'Wayland Core' }],
      });
      expect(refreshMcpServers).toHaveBeenCalledTimes(1);
      expect(saveMcpServers).not.toHaveBeenCalled();
      expect(Message.success).toHaveBeenCalled();
    });

    it('keeps renderer state when the archive transaction fails so cleanup can be retried', async () => {
      const server = makeMockServer();
      bridgeMocks.archiveConfiguredServer.mockResolvedValueOnce({ success: false, msg: 'codex config locked' });

      const { result } = renderCRUD([server]);
      await act(async () => {
        await result.current.handleDeleteMcpServer('mcp_1');
      });

      expect(refreshMcpServers).not.toHaveBeenCalled();
      expect(saveMcpServers).not.toHaveBeenCalled();
      expect(Message.error).toHaveBeenCalledWith('settings.mcpDeleteError');
    });
  });

  describe('handleEditMcpServer uses static Message API', () => {
    it('revokes the old enabled definition and publishes the replacement before saving', async () => {
      const server = makeMockServer();
      let stored = [server];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored = (updater as (prev: IMcpServer[]) => IMcpServer[])(stored);
      });

      const { result } = renderCRUD([server]);

      await act(async () => {
        await result.current.handleEditMcpServer(server, {
          name: 'updated-server',
          enabled: true,
          transport: server.transport,
        });
      });

      expect(removeMcpFromAgents).toHaveBeenCalledWith('test-server', undefined, 'stdio');
      expect(syncMcpToAgents).toHaveBeenCalledWith(expect.objectContaining({ name: 'updated-server' }), true);
      expect(stored[0].name).toBe('updated-server');
      expect(Message.success).toHaveBeenCalledWith('settings.mcpImportSuccess');
    });

    it('keeps the old declaration and attempts restoration when replacement publication fails', async () => {
      const server = makeMockServer();
      let stored = [server];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored = (updater as (prev: IMcpServer[]) => IMcpServer[])(stored);
      });
      syncMcpToAgents.mockRejectedValueOnce(new Error('replacement rejected')).mockResolvedValueOnce(undefined);

      const { result } = renderCRUD([server]);
      await act(async () => {
        await expect(
          result.current.handleEditMcpServer(server, {
            name: 'updated-server',
            enabled: true,
            transport: server.transport,
          })
        ).rejects.toThrow('replacement rejected');
      });

      expect(stored).toEqual([server]);
      expect(syncMcpToAgents).toHaveBeenNthCalledWith(2, server, true);
      expect(Message.error).toHaveBeenCalledWith('settings.mcpSyncError');
      expect(Message.success).not.toHaveBeenCalled();
    });

    it('removes the replacement and restores the old publication when the local commit fails', async () => {
      const server = makeMockServer();
      saveMcpServers.mockRejectedValueOnce(new Error('storage unavailable'));
      const { result } = renderCRUD([server]);

      await act(async () => {
        await expect(
          result.current.handleEditMcpServer(server, {
            name: 'updated-server',
            enabled: true,
            transport: server.transport,
          })
        ).rejects.toThrow('storage unavailable');
      });

      expect(removeMcpFromAgents).toHaveBeenNthCalledWith(1, 'test-server', undefined, 'stdio');
      expect(removeMcpFromAgents).toHaveBeenNthCalledWith(2, 'updated-server', undefined, 'stdio');
      expect(syncMcpToAgents).toHaveBeenNthCalledWith(1, expect.objectContaining({ name: 'updated-server' }), true);
      expect(syncMcpToAgents).toHaveBeenNthCalledWith(2, server, true);
      expect(Message.success).not.toHaveBeenCalled();
    });

    it('rejects a stale edit commit and rolls back both publications', async () => {
      const server = makeMockServer({ updatedAt: 1000 });
      let stored = [{ ...server, updatedAt: 1001, description: 'newer edit' }];
      saveMcpServers.mockImplementation(async (updater: unknown) => {
        stored = (updater as (prev: IMcpServer[]) => IMcpServer[])(stored);
      });
      const { result } = renderCRUD([server]);

      await act(async () => {
        await expect(
          result.current.handleEditMcpServer(server, {
            name: 'stale-edit',
            enabled: true,
            transport: server.transport,
          })
        ).rejects.toThrow('changed while edit publication was in progress');
      });

      expect(stored[0]).toMatchObject({ updatedAt: 1001, description: 'newer edit' });
      expect(removeMcpFromAgents).toHaveBeenNthCalledWith(2, 'stale-edit', undefined, 'stdio');
      expect(syncMcpToAgents).toHaveBeenLastCalledWith(server, true);
      expect(Message.success).not.toHaveBeenCalled();
    });
  });
});
