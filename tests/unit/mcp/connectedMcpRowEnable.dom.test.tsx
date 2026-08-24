/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B4 guard, both halves.
 *
 * B4e — the MCP connections row (the page a user lands on straight after a
 * concierge install) rendered exactly two branches: `Disable` when reachable,
 * `Reconnect` otherwise. A DISABLED connector therefore had no control that
 * says what it does, on the one page the install flow leads to.
 *
 * B4d — `recordProbeFailure` un-enabled the server on a failed standalone
 * probe. Because the branch pins an unpublished connector version the probe
 * can never succeed, so turning the connector on and having it fail to answer
 * silently undid a fully successful publication. Enabling is the user's
 * instruction; a failed probe is evidence about reachability, and evidence
 * must not overwrite the instruction. It sets `status: 'error'` and a
 * `lastError` the row shows.
 *
 * The failing probe fixture is authored by the production truth binder
 * (`bindMcpPrepublicationProbeTruth`), never hand-written.
 */
import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { probeInvoke } = vi.hoisted(() => ({ probeInvoke: vi.fn() }));

vi.mock('@/common/adapter/ipcBridge', () => ({
  mcpService: { testMcpConnection: { invoke: probeInvoke } },
  acpConversation: { getAvailableAgents: { invoke: vi.fn(async () => ({ success: false })) } },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: unknown, vars?: Record<string, unknown>) => {
      const template = typeof fallback === 'string' ? fallback : String(_key);
      if (!vars) return template;
      return template.replace(/\{\{(\w+)\}\}/g, (_m, name: string) => String(vars[name] ?? ''));
    },
  }),
}));

import ConnectedMcpRow from '@renderer/pages/settings/McpLibrary/components/ConnectedMcpRow';
import { useMcpConnection } from '@renderer/hooks/mcp/useMcpConnection';
import { bindMcpPrepublicationProbeTruth } from '@process/services/mcpServices/mcpSessionTruthGate';

const disabledServer: IMcpServer = {
  id: 'mcp-tv',
  name: 'com.ferroxlabs-tvcontrol',
  enabled: false,
  status: 'disconnected',
  transport: { type: 'stdio', command: 'bunx', args: ['--bun', '@ferroxlabs/tvcontrol@2.3.1'] },
  createdAt: 10,
  updatedAt: 20,
  source: 'custom',
};

describe('MCP connections row — Enable', () => {
  it('offers Enable on a disabled row, not only Reconnect', () => {
    const onEnable = vi.fn();
    render(
      <ConnectedMcpRow
        row={{ server: disabledServer, status: 'disconnected', toolCount: 0, agents: [], testing: false }}
        onEnable={onEnable}
        onReconnect={vi.fn()}
        onDisconnect={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const enable = screen.getByText('Enable');
    expect(enable).toBeTruthy();
    act(() => {
      (enable.closest('button') as HTMLButtonElement).click();
    });
    expect(onEnable).toHaveBeenCalledTimes(1);
  });
});

describe('a failed probe is evidence, not a command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps an enabled connector enabled and shows why the probe failed', async () => {
    const enabledServer: IMcpServer = { ...disabledServer, enabled: true, status: 'connected' };
    let stored: IMcpServer[] = [enabledServer];
    const saveMcpServers = vi.fn(async (updater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });
    const removeMcpFromAgents = vi.fn(async () => {});
    const syncMcpToAgents = vi.fn(async () => {});
    const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() };

    probeInvoke.mockResolvedValue({
      success: true,
      data: bindMcpPrepublicationProbeTruth(enabledServer, {
        success: false,
        error: 'spawn ["bunx","--bun","@ferroxlabs/tvcontrol@2.3.1"] code=-32000',
      }),
    });

    const { result } = renderHook(() =>
      useMcpConnection(
        stored,
        saveMcpServers as never,
        message as never,
        undefined,
        removeMcpFromAgents,
        syncMcpToAgents,
        async () => stored
      )
    );

    await act(async () => {
      await result.current.handleTestMcpConnection(enabledServer, { preserveEnabled: true });
    });

    const after = stored.find((server) => server.id === enabledServer.id)!;
    expect(after.status).toBe('error');
    expect(after.lastError).toBeTruthy();
    // The user asked for this connector to be on. A probe that could not reach
    // it does not revoke that instruction.
    expect(after.enabled).toBe(true);
    expect(removeMcpFromAgents).not.toHaveBeenCalled();
  });
});
