import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpOperations } from '@renderer/hooks/mcp/useMcpOperations';

const mocks = vi.hoisted(() => ({
  getAvailableAgents: vi.fn(),
  removeMcpFromAgents: vi.fn(),
  syncMcpToAgents: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { errors?: string }) => (values?.errors ? `${key}:${values.errors}` : key),
  }),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: mocks.getAvailableAgents } },
  mcpService: {
    removeMcpFromAgents: { invoke: mocks.removeMcpFromAgents },
    syncMcpToAgents: { invoke: mocks.syncMcpToAgents },
  },
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));
vi.mock('@renderer/hooks/mcp/messageQueue', () => ({
  globalMessageQueue: { add: async (callback: () => void) => callback() },
}));

describe('useMcpOperations publication evidence', () => {
  const message = {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAvailableAgents.mockResolvedValue({
      success: true,
      data: [
        { backend: 'claude', name: 'Claude', supportedTransports: ['stdio'] },
        { backend: 'wcore', name: 'Wayland Core', supportedTransports: ['stdio'] },
      ],
    });
  });

  it('rejects a partial removal so callers cannot erase a connector with an orphan config', async () => {
    mocks.removeMcpFromAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude', success: true },
          { agent: 'Wayland Core', success: false, error: 'config locked' },
        ],
      },
    });

    const { result } = renderHook(() => useMcpOperations([], message as never));
    await act(async () => {
      await expect(result.current.removeMcpFromAgents('tavily', undefined, 'stdio')).rejects.toThrow(
        'Wayland Core: config locked'
      );
    });

    expect(message.warning).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Wayland Core: config locked') })
    );
  });

  it('rejects sync when every adapter refuses publication', async () => {
    mocks.syncMcpToAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude', success: false, error: 'unsupported transport' },
          { agent: 'Wayland Core', success: false, error: 'profile write failed' },
        ],
      },
    });

    const server = {
      id: 'mcp_1',
      name: 'firecrawl',
      enabled: true,
      createdAt: 1,
      updatedAt: 1,
      transport: { type: 'stdio' as const, command: 'npx', args: ['firecrawl-mcp'] },
    };
    const { result } = renderHook(() => useMcpOperations([server], message as never));
    await act(async () => {
      await expect(result.current.syncMcpToAgents(server, true)).rejects.toThrow('settings.mcpSyncFailedNoAgents');
    });
  });

  /**
   * A detected backend with no MCP implementation reports `unsupported: true`
   * alongside `success: false`. Before that flag existed the two were
   * indistinguishable, and since a typical install detects a dozen such
   * backends (grok, goose, kimi, cursor, kiro, hermes, ...), EVERY publication
   * and every rollback threw - even when all five agents that can actually
   * carry an MCP server succeeded.
   *
   * That is what made a connector unrecoverable: publication "failed", the
   * rollback "failed" for the same reason, and the divergence marker was
   * persisted. These two tests are the guard. Both fail without the filter.
   */
  const server = {
    id: 'mcp_1',
    name: 'tvcontrol',
    enabled: true,
    createdAt: 1,
    updatedAt: 1,
    transport: { type: 'stdio' as const, command: 'node', args: ['/abs/server.js'] },
  };

  it('publishes successfully when the only unsuccessful agents are unsupported backends', async () => {
    mocks.syncMcpToAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude', success: true },
          { agent: 'Wayland Core', success: true },
          { agent: 'Grok Build', success: false, unsupported: true, error: 'not supported for backend "grok"' },
          { agent: 'Goose', success: false, unsupported: true, error: 'not supported for backend "goose"' },
          { agent: 'Cursor Agent', success: false, unsupported: true, error: 'not supported for backend "cursor"' },
        ],
      },
    });

    const { result } = renderHook(() => useMcpOperations([server], message as never));
    await act(async () => {
      await expect(result.current.syncMcpToAgents(server, true)).resolves.toBeDefined();
    });
  });

  it('removes successfully when the only unsuccessful agents are unsupported backends', async () => {
    // The rollback half. An "incomplete rollback" is what persisted the
    // unrecoverable state, so this path matters as much as publication.
    mocks.removeMcpFromAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'claude:Claude', success: true },
          { agent: 'wcore:Wayland Core', success: true },
          { agent: 'kimi:Kimi CLI', success: false, unsupported: true, error: 'not supported for backend "kimi"' },
        ],
      },
    });

    const { result } = renderHook(() => useMcpOperations([server], message as never));
    await act(async () => {
      await expect(result.current.removeMcpFromAgents('tvcontrol', undefined, 'stdio')).resolves.toBeDefined();
    });
  });

  it('still rejects when a supported agent fails alongside unsupported backends', async () => {
    // Negative control. Without this, filtering could be widened until nothing
    // ever fails and a genuinely broken publication would report success.
    mocks.syncMcpToAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude', success: false, error: 'config locked' },
          { agent: 'Grok Build', success: false, unsupported: true, error: 'not supported for backend "grok"' },
        ],
      },
    });

    const { result } = renderHook(() => useMcpOperations([server], message as never));
    await act(async () => {
      await expect(result.current.syncMcpToAgents(server, true)).rejects.toThrow('settings.mcpSyncFailedNoAgents');
    });
  });

  it('still rejects when every agent is an unsupported backend', async () => {
    // Nothing could carry the server, so publication genuinely did not happen.
    // Filtering must not turn "no target at all" into success.
    mocks.syncMcpToAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Grok Build', success: false, unsupported: true, error: 'not supported for backend "grok"' },
          { agent: 'Goose', success: false, unsupported: true, error: 'not supported for backend "goose"' },
        ],
      },
    });

    const { result } = renderHook(() => useMcpOperations([server], message as never));
    await act(async () => {
      await expect(result.current.syncMcpToAgents(server, true)).rejects.toThrow('settings.mcpSyncFailedNoAgents');
    });
  });

  it('rejects partial sync so one adapter cannot mint publication truth for all adapters', async () => {
    mocks.syncMcpToAgents.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude', success: true },
          { agent: 'Wayland Core', success: false, error: 'profile write failed' },
        ],
      },
    });

    const server = {
      id: 'mcp_1',
      name: 'firecrawl',
      enabled: true,
      createdAt: 1,
      updatedAt: 1,
      transport: { type: 'stdio' as const, command: 'npx', args: ['firecrawl-mcp'] },
    };
    const { result } = renderHook(() => useMcpOperations([server], message as never));
    await act(async () => {
      await expect(result.current.syncMcpToAgents(server, true)).rejects.toThrow('settings.mcpSyncFailedNoAgents');
    });
  });
});
