/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { state, toggle, probe, refreshStatuses, checkInstallStatus, readServers } = vi.hoisted(() => {
  const disabled: IMcpServer = {
    id: 'mcp-disabled',
    name: 'customer-tools',
    enabled: false,
    status: 'disconnected',
    transport: { type: 'stdio', command: 'npx', args: ['-y', '@customer/mcp'] },
    createdAt: 10,
    updatedAt: 20,
    source: 'custom',
  };
  return {
    state: {
      disabled,
      published: { ...disabled, enabled: true, updatedAt: 21 } as IMcpServer,
      servers: [disabled],
    },
    toggle: vi.fn(async () => ({ ...disabled, enabled: true, updatedAt: 21 }) as IMcpServer),
    probe: vi.fn(async () => {}),
    refreshStatuses: vi.fn(async () => {}),
    checkInstallStatus: vi.fn(async () => {}),
    readServers: vi.fn(async () => [{ ...disabled, enabled: true, updatedAt: 21 } as IMcpServer]),
  };
});

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: vi.fn(async () => ({ success: false })) } },
  mcpService: { getAgentMcpConfigs: { invoke: vi.fn(async () => ({ success: false })) } },
}));

vi.mock('@renderer/hooks/mcp', () => ({
  useMcpServers: () => ({
    mcpServers: state.servers,
    allMcpServers: state.servers,
    saveMcpServers: vi.fn(),
    readMcpServers: readServers,
    refreshMcpServers: vi.fn(async () => {}),
  }),
  useMcpAgentStatus: () => ({
    agentInstallStatus: {},
    setAgentInstallStatus: vi.fn(),
    checkSingleServerInstallStatus: vi.fn(async () => {}),
    checkAgentInstallStatus: checkInstallStatus,
  }),
  useMcpOperations: () => ({
    removeMcpFromAgents: vi.fn(async () => {}),
    syncMcpToAgents: vi.fn(async () => {}),
  }),
  useMcpServerCRUD: () => ({
    handleToggleMcpServer: toggle,
    handleDeleteMcpServer: vi.fn(async () => {}),
  }),
  useMcpOAuth: () => ({ oauthStatus: {} }),
}));

vi.mock('@renderer/hooks/mcp/useMcpConnection', () => ({
  useMcpConnection: () => ({
    testingServers: {},
    refreshServerStatuses: refreshStatuses,
    handleTestMcpConnection: probe,
  }),
}));

import { useConnectedMcps } from '@renderer/pages/settings/McpLibrary/hooks/useConnectedMcps';

// `preserveEnabled` is part of the reconnect contract, not decoration: without
// it a probe that fails after the republish revokes the publication it just
// made and writes `enabled: false` (#B4d), so Reconnect could never leave a
// connector on. The row's `Enable` is the same operation under its true label.
describe('useConnectedMcps reconnect truth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toggle.mockResolvedValue(state.published);
    readServers.mockResolvedValue([state.published]);
  });

  it('probes the durable enabled revision after reconnect publishes a disabled declaration', async () => {
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const { result } = renderHook(() => useConnectedMcps(message as never));

    await act(async () => result.current.reconnect(state.disabled));

    expect(toggle).toHaveBeenCalledWith(state.disabled.id, true);
    expect(probe).toHaveBeenCalledWith(state.published, { preserveEnabled: true });
  });

  it('republishes before probing when local enabled truth carries an unresolved divergence', async () => {
    const divergent = {
      ...state.disabled,
      enabled: true,
      status: 'error' as const,
      lastError: 'probe unavailable; publication rollback incomplete — reconnect this connector',
    };
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const { result } = renderHook(() => useConnectedMcps(message as never));

    await act(async () => result.current.reconnect(divergent));

    expect(toggle).toHaveBeenCalledWith(divergent.id, true);
    expect(probe).toHaveBeenCalledWith(state.published, { preserveEnabled: true });
  });

  it('does not probe a durable revision that superseded the exact reconnect publication', async () => {
    const superseded = { ...state.published, updatedAt: state.published.updatedAt + 1 };
    toggle.mockResolvedValueOnce(state.published);
    readServers.mockResolvedValueOnce([superseded]);
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const { result } = renderHook(() => useConnectedMcps(message as never));

    await act(async () => result.current.reconnect(state.disabled));

    expect(toggle).toHaveBeenCalledWith(state.disabled.id, true);
    expect(probe).toHaveBeenCalledWith(state.published, { preserveEnabled: true });
  });
});
