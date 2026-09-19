import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Message } from '@arco-design/web-react';
import { useMcpOperations } from '@renderer/hooks/mcp/useMcpOperations';
import { useMcpServerCRUD } from '@renderer/hooks/mcp/useMcpServerCRUD';
import { MCP_PUBLICATION_DIVERGENCE_MARKER } from '@renderer/hooks/mcp/useMcpConnection';
import type { IMcpServer } from '@/common/config/storage';

/**
 * Publication is per agent, and one agent refusing it must not cost the user
 * the agents that took it (#1196).
 *
 * These suites wire the REAL `useMcpOperations` into the REAL
 * `useMcpServerCRUD`, because the defect lives in how the two compose: the
 * publication hook rejected on any per-agent failure, and the CRUD hook
 * answered a rejection by revoking the connector everywhere. When that
 * revocation failed for the same reason the publication had, the connector was
 * left carrying `publication rollback incomplete` and could not be used by any
 * agent again. qwen is a built-in detected backend whose launcher fails
 * `spawn qwen ENOENT` on Windows (#1306), which is enough to trigger it.
 */

const bridgeMocks = vi.hoisted(() => ({
  getAvailableAgents: vi.fn(),
  syncMcpToAgents: vi.fn(),
  removeMcpFromAgents: vi.fn(),
  archiveConfiguredServer: vi.fn(),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: bridgeMocks.getAvailableAgents } },
  mcpService: {
    syncMcpToAgents: { invoke: bridgeMocks.syncMcpToAgents },
    removeMcpFromAgents: { invoke: bridgeMocks.removeMcpFromAgents },
    archiveConfiguredServer: { invoke: bridgeMocks.archiveConfiguredServer },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { errors?: string }) => (values?.errors ? `${key}:${values.errors}` : key),
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Message: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn().mockResolvedValue([]), set: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@renderer/hooks/mcp/messageQueue', () => ({
  globalMessageQueue: { add: async (callback: () => void) => callback() },
}));

const message = { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };

const makeServer = (overrides?: Partial<IMcpServer>): IMcpServer => ({
  id: 'mcp_tvcontrol',
  name: 'tvcontrol',
  enabled: false,
  createdAt: 1000,
  updatedAt: 1000,
  transport: { type: 'stdio' as const, command: 'npx', args: ['@ferroxlabs/tvcontrol'] },
  ...overrides,
});

/** One agent that takes the connector, one that cannot be spawned (#1306). */
const PARTIAL_PUBLICATION = {
  success: true,
  data: {
    results: [
      { agent: 'claude:Claude Code', success: true, outcome: 'applied' as const },
      { agent: 'fuigo:Fuigo', success: true, outcome: 'applied' as const },
      { agent: 'qwen:Qwen Code', success: false, outcome: 'failed' as const, error: 'spawn qwen ENOENT' },
    ],
  },
};

const TOTAL_PUBLICATION_FAILURE = {
  success: true,
  data: {
    results: [
      { agent: 'claude:Claude Code', success: false, outcome: 'failed' as const, error: 'config locked' },
      { agent: 'fuigo:Fuigo', success: false, outcome: 'failed' as const, error: 'profile write failed' },
      { agent: 'qwen:Qwen Code', success: false, outcome: 'failed' as const, error: 'spawn qwen ENOENT' },
    ],
  },
};

const renderToggle = (initial: IMcpServer[]) => {
  const store = { servers: initial };
  const saveMcpServers = vi.fn(async (update: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => {
    store.servers = typeof update === 'function' ? update(store.servers) : update;
  });
  const checkSingleServerInstallStatus = vi.fn(async () => {});
  const rendered = renderHook(() => {
    const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(store.servers, message as never);
    return useMcpServerCRUD(
      store.servers,
      saveMcpServers,
      syncMcpToAgents,
      removeMcpFromAgents,
      checkSingleServerInstallStatus,
      vi.fn(),
      vi.fn(async () => {}),
      async () => store.servers
    );
  });
  return { rendered, store };
};

const findSaved = (servers: IMcpServer[], id: string): IMcpServer | undefined =>
  servers.find((server) => server.id === id);

describe('MCP partial publication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridgeMocks.getAvailableAgents.mockResolvedValue({
      success: true,
      data: [
        { backend: 'claude', name: 'Claude Code', supportedTransports: ['stdio'] },
        { backend: 'fuigo', name: 'Fuigo', supportedTransports: ['stdio'] },
        { backend: 'qwen', name: 'Qwen Code', supportedTransports: ['stdio'] },
      ],
    });
  });

  it('keeps the connector enabled on the agents that took it when one agent fails', async () => {
    bridgeMocks.syncMcpToAgents.mockResolvedValue(PARTIAL_PUBLICATION);
    const { rendered, store } = renderToggle([makeServer()]);

    let committed: unknown;
    await act(async () => {
      committed = await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true);
    });

    expect(committed).toBeTruthy();
    expect(findSaved(store.servers, 'mcp_tvcontrol')?.enabled).toBe(true);
    // The connector was never pulled back out of Claude Code and Fuigo.
    expect(bridgeMocks.removeMcpFromAgents).not.toHaveBeenCalled();
    // The agent that refused it is named, with its reason.
    expect(message.warning).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('qwen:Qwen Code: spawn qwen ENOENT') })
    );
  });

  it('leaves no publication-rollback-incomplete marker after a partial publication', async () => {
    // The stuck state from #1196: the revocation that followed the rejected
    // publication failed for the very same reason, so the marker was persisted
    // and every later probe refused to touch the connector.
    bridgeMocks.syncMcpToAgents.mockResolvedValue(PARTIAL_PUBLICATION);
    bridgeMocks.removeMcpFromAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'claude:Claude Code', success: true, outcome: 'applied' as const },
          { agent: 'fuigo:Fuigo', success: true, outcome: 'applied' as const },
          { agent: 'qwen:Qwen Code', success: false, outcome: 'failed' as const, error: 'spawn qwen ENOENT' },
        ],
      },
    });
    const { rendered, store } = renderToggle([makeServer()]);

    await act(async () => {
      await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true);
    });

    const saved = findSaved(store.servers, 'mcp_tvcontrol');
    expect(saved?.lastError ?? '').not.toContain(MCP_PUBLICATION_DIVERGENCE_MARKER);
    expect(saved?.status).not.toBe('error');
  });

  it('records the agent that refused it, durably, where a toast cannot survive', async () => {
    // The toast is gone the moment the user looks away. The row has to be able
    // to answer "which agents do NOT have this" on its own.
    bridgeMocks.syncMcpToAgents.mockResolvedValue(PARTIAL_PUBLICATION);
    const { rendered, store } = renderToggle([makeServer()]);

    await act(async () => {
      await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true);
    });

    expect(findSaved(store.servers, 'mcp_tvcontrol')?.publicationGaps).toEqual(['qwen:Qwen Code: spawn qwen ENOENT']);
  });

  it('clears the recorded gap once a later publication reaches every agent', async () => {
    // A repaired agent must not leave an answered complaint on the row.
    bridgeMocks.syncMcpToAgents.mockResolvedValue(PARTIAL_PUBLICATION);
    bridgeMocks.removeMcpFromAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'claude:Claude Code', success: true, outcome: 'applied' as const },
          { agent: 'fuigo:Fuigo', success: true, outcome: 'applied' as const },
          { agent: 'qwen:Qwen Code', success: true, outcome: 'applied' as const },
        ],
      },
    });
    const { rendered, store } = renderToggle([makeServer()]);

    await act(async () => {
      await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true);
    });
    expect(findSaved(store.servers, 'mcp_tvcontrol')?.publicationGaps).toHaveLength(1);

    // qwen is fixed; the user turns the connector off and on again.
    bridgeMocks.syncMcpToAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'claude:Claude Code', success: true, outcome: 'applied' as const },
          { agent: 'fuigo:Fuigo', success: true, outcome: 'applied' as const },
          { agent: 'qwen:Qwen Code', success: true, outcome: 'applied' as const },
        ],
      },
    });
    await act(async () => {
      await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', false);
    });
    await act(async () => {
      await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true);
    });

    const repaired = findSaved(store.servers, 'mcp_tvcontrol');
    expect(repaired?.enabled).toBe(true);
    expect(repaired?.publicationGaps ?? []).toEqual([]);
  });

  it('still reports a total publication failure and does not enable the connector', async () => {
    // Negative control. Partial tolerance must not be widened into "nothing
    // ever fails": a publication that reached NO agent is still a failure.
    bridgeMocks.syncMcpToAgents.mockResolvedValue(TOTAL_PUBLICATION_FAILURE);
    bridgeMocks.removeMcpFromAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'claude:Claude Code', success: true, outcome: 'already-absent' as const },
          { agent: 'fuigo:Fuigo', success: true, outcome: 'already-absent' as const },
          { agent: 'qwen:Qwen Code', success: true, outcome: 'already-absent' as const },
        ],
      },
    });
    const { rendered, store } = renderToggle([makeServer()]);

    let committed: unknown;
    await act(async () => {
      committed = await rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true);
    });

    expect(committed).toBe(false);
    expect(findSaved(store.servers, 'mcp_tvcontrol')?.enabled).toBe(false);
    expect(Message.error).toHaveBeenCalledWith('settings.mcpSyncError');
  });

  it('still retains the divergence marker when a total failure cannot be rolled back', async () => {
    // The fail-closed machinery is untouched: when the publication reached no
    // agent AND the revocation itself fails, the adapters are genuinely in an
    // unknown state and that must still be recorded.
    bridgeMocks.syncMcpToAgents.mockResolvedValue(TOTAL_PUBLICATION_FAILURE);
    bridgeMocks.removeMcpFromAgents.mockResolvedValue({
      success: true,
      data: {
        results: [{ agent: 'qwen:Qwen Code', success: false, outcome: 'failed' as const, error: 'spawn qwen ENOENT' }],
      },
    });
    const { rendered, store } = renderToggle([makeServer()]);

    await act(async () => {
      await expect(rendered.result.current.handleToggleMcpServer('mcp_tvcontrol', true)).rejects.toThrow(
        'publication rollback was incomplete'
      );
    });

    expect(findSaved(store.servers, 'mcp_tvcontrol')?.lastError).toContain(MCP_PUBLICATION_DIVERGENCE_MARKER);
  });
});
