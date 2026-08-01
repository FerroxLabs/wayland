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
