/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B4b guard — the process-spawn loop that ships to every user who has one
 * expired connector enabled.
 *
 * Two independent mechanisms fed it, and both are guarded here:
 *
 *  1. `useConnectedMcps`'s mount effect was keyed on the `mcpServers` ARRAY
 *     IDENTITY. Every probe writes storage, every write hands the page a new
 *     array with identical contents, and the effect refires — refreshing
 *     statuses, re-checking agent install status and recomputing leftovers,
 *     which writes again.
 *  2. `refreshServerStatuses` only granted its STALE_MS skip to a CONNECTED
 *     server. A failed probe therefore never earned the skip, so an enabled
 *     connector that can never answer was re-probed on every pass.
 *
 * Root cause 1 alone would settle; root cause 2 alone would settle. Together
 * they are a feedback loop: RC1 measured 1,201 `getAgentMcpConfigs` calls at a
 * sustained 18-30/sec with one permanently-failing enabled connector present,
 * against 3 calls total with the same connector disabled.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { getAgentMcpConfigs, probeInvoke, getAvailableAgents, listIdentity } = vi.hoisted(() => ({
  getAgentMcpConfigs: vi.fn(async () => ({ success: true, data: [] })),
  probeInvoke: vi.fn(),
  getAvailableAgents: vi.fn(async () => ({ success: true, data: [{ backend: 'wcore', name: 'Wayland Core' }] })),
  /**
   * `version` is bumped by the test to hand the page a NEW array with
   * IDENTICAL contents — the exact thing a storage read does after any write.
   * The array is cached between bumps so a render caused by the page's own
   * state does not itself change identity, which keeps the reproduction
   * bounded instead of a runaway feedback loop.
   */
  listIdentity: { version: 0, cachedVersion: -1, cached: [] as unknown[] },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: getAvailableAgents } },
  mcpService: {
    getAgentMcpConfigs: { invoke: getAgentMcpConfigs },
    testMcpConnection: { invoke: probeInvoke },
  },
}));

const failingServer: IMcpServer = {
  id: 'mcp-expired',
  name: 'notion-mcp',
  enabled: true,
  status: 'disconnected',
  transport: { type: 'stdio', command: 'npx', args: ['-y', '@notion/mcp'] },
  createdAt: 10,
  updatedAt: 20,
  source: 'custom',
};

function currentList(): IMcpServer[] {
  if (listIdentity.cachedVersion !== listIdentity.version) {
    listIdentity.cachedVersion = listIdentity.version;
    listIdentity.cached = [{ ...failingServer }];
  }
  return listIdentity.cached as IMcpServer[];
}

vi.mock('@renderer/hooks/mcp', () => ({
  useMcpServers: () => ({
    mcpServers: currentList(),
    allMcpServers: currentList(),
    saveMcpServers: vi.fn(async () => {}),
    readMcpServers: vi.fn(async () => [{ ...failingServer }]),
    refreshMcpServers: vi.fn(async () => {}),
  }),
  useMcpAgentStatus: () => ({
    agentInstallStatus: {},
    setAgentInstallStatus: vi.fn(),
    checkSingleServerInstallStatus: vi.fn(async () => {}),
    checkAgentInstallStatus: vi.fn(async () => {}),
  }),
  useMcpOperations: () => ({ removeMcpFromAgents: vi.fn(async () => {}), syncMcpToAgents: vi.fn(async () => {}) }),
  useMcpServerCRUD: () => ({ handleToggleMcpServer: vi.fn(), handleDeleteMcpServer: vi.fn() }),
  useMcpOAuth: () => ({ oauthStatus: {} }),
}));

import { useConnectedMcps } from '@renderer/pages/settings/McpLibrary/hooks/useConnectedMcps';
import { useMcpConnection } from '@renderer/hooks/mcp/useMcpConnection';

const message = { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  listIdentity.version = 0;
  listIdentity.cachedVersion = -1;
  probeInvoke.mockResolvedValue({ success: false, msg: 'invalid_token' });
  getAgentMcpConfigs.mockResolvedValue({ success: true, data: [] });
});

describe('MCP connections page does not re-resolve on array identity', () => {
  it('re-renders with an identical-content server list without re-running the mount effect', async () => {
    const { rerender } = renderHook(() => useConnectedMcps(message as never));
    await act(async () => {});
    const afterMount = getAgentMcpConfigs.mock.calls.length;
    expect(afterMount).toBe(1);

    for (let i = 0; i < 8; i += 1) {
      listIdentity.version += 1;
      rerender();
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {});
    }

    // Before the fix this is 9 — one full re-resolution per identity change,
    // and in the app each re-resolution writes storage and produces the next
    // identity change. After the fix the content is unchanged, so nothing
    // re-resolves.
    expect(getAgentMcpConfigs.mock.calls.length).toBe(1);
  });
});

describe('a failed probe earns the same staleness skip as a successful one', () => {
  it('does not re-probe an enabled connector that just failed', async () => {
    let stored: IMcpServer[] = [{ ...failingServer }];
    const saveMcpServers = vi.fn(async (updater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => {
      stored = typeof updater === 'function' ? updater(stored) : updater;
    });

    const { result } = renderHook(() =>
      useMcpConnection(stored, saveMcpServers as never, message as never, undefined, undefined, undefined, async () =>
        structuredClone(stored)
      )
    );

    await act(async () => {
      await result.current.refreshServerStatuses(stored);
    });
    expect(probeInvoke.mock.calls.length).toBe(1);
    expect(stored[0].status).toBe('error');

    // Second pass over the SAME durable truth, well inside STALE_MS.
    await act(async () => {
      await result.current.refreshServerStatuses(stored);
    });
    expect(probeInvoke.mock.calls.length).toBe(1);
  });
});
