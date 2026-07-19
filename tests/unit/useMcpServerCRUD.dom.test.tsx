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

  const renderCRUD = (servers: IMcpServer[] = []) =>
    renderHook(() =>
      useMcpServerCRUD(
        servers,
        saveMcpServers,
        syncMcpToAgents,
        removeMcpFromAgents,
        checkSingleServerInstallStatus,
        setAgentInstallStatus,
        refreshMcpServers
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
  });

  describe('handleToggleMcpServer uses static Message API (Fixes ELECTRON-D)', () => {
    it('calls static Message.error when sync throws, not hook-based message', async () => {
      const server = makeMockServer();
      syncMcpToAgents.mockRejectedValueOnce(new Error('sync failed'));
      saveMcpServers.mockImplementationOnce(async (updater: unknown) => {
        if (typeof updater === 'function') (updater as (prev: IMcpServer[]) => IMcpServer[])([server]);
      });

      const { result } = renderCRUD([server]);

      let outcome: boolean | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', true);
      });

      expect(Message.error).toHaveBeenCalledWith('settings.mcpSyncError');
      expect(outcome).toBe(false);
    });

    it('calls static Message.error when remove throws', async () => {
      const server = makeMockServer({ enabled: false });
      removeMcpFromAgents.mockRejectedValueOnce(new Error('remove failed'));
      saveMcpServers.mockImplementationOnce(async (updater: unknown) => {
        if (typeof updater === 'function') (updater as (prev: IMcpServer[]) => IMcpServer[])([server]);
      });

      const { result } = renderCRUD([server]);

      let outcome: boolean | undefined;
      await act(async () => {
        outcome = await result.current.handleToggleMcpServer('mcp_1', false);
      });

      expect(Message.error).toHaveBeenCalledWith('settings.mcpRemoveError');
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
  });
});
