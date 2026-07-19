/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { state, toggle, probe, refreshStatuses, checkInstallStatus } = vi.hoisted(() => {
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
    toggle: vi.fn(async () => true),
    probe: vi.fn(async () => {}),
    refreshStatuses: vi.fn(async () => {}),
    checkInstallStatus: vi.fn(async () => {}),
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
    readMcpServers: vi.fn(async () => [state.published]),
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

describe('useConnectedMcps reconnect truth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('probes the durable enabled revision after reconnect publishes a disabled declaration', async () => {
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const { result } = renderHook(() => useConnectedMcps(message as never));

    await act(async () => result.current.reconnect(state.disabled));

    expect(toggle).toHaveBeenCalledWith(state.disabled.id, true);
    expect(probe).toHaveBeenCalledWith(state.published);
  });
});
