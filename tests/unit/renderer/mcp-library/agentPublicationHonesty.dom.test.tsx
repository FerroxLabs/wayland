/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The panel said "Not synced to any agent yet" while the primary button said
 * "Adding MCP configuration to 6 agents...". Both were on screen at once.
 *
 * The panel was rendering an EMPTY LIST as a POSITIVE CLAIM. Empty is only the
 * truth once the answer is known: not while an install is running, not while
 * the agent configs are being re-read, and not before the persisted status has
 * been loaded back.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { agentPublicationIsUnknown } from '@renderer/pages/settings/McpLibrary/agentPublication';

const configStore = new Map<string, unknown>();
let resolveGet: ((value: unknown) => void) | null = null;

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        })
    ),
    set: vi.fn((key: string, value: unknown) => {
      configStore.set(key, value);
      return Promise.resolve();
    }),
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: vi.fn(async () => ({ success: false })) } },
  mcpService: { getAgentMcpConfigs: { invoke: vi.fn(async () => ({ success: false })) } },
}));

vi.mock('@/common/mcp', () => ({ mcpServerCollisionKey: (name: string) => name }));

describe('agentPublicationIsUnknown', () => {
  test('an install in flight is never reported as "published nowhere"', () => {
    expect(agentPublicationIsUnknown({ installing: true, statusLoaded: true, serverLoading: false })).toBe(true);
  });

  test('a re-read of the agent configs is never reported as "published nowhere"', () => {
    expect(agentPublicationIsUnknown({ installing: false, statusLoaded: true, serverLoading: true })).toBe(true);
  });

  test('an unread persisted status is never reported as "published nowhere"', () => {
    expect(agentPublicationIsUnknown({ installing: false, statusLoaded: false, serverLoading: false })).toBe(true);
  });

  test('a settled, idle, loaded state IS an answer', () => {
    expect(agentPublicationIsUnknown({ installing: false, statusLoaded: true, serverLoading: false })).toBe(false);
  });
});

describe('useMcpAgentStatus reports when its answer is actually known', () => {
  beforeEach(() => {
    resolveGet = null;
    configStore.clear();
  });

  test('statusLoaded is false until the persisted status has been read back', async () => {
    const { useMcpAgentStatus } = await import('@renderer/hooks/mcp/useMcpAgentStatus');
    const { result } = renderHook(() => useMcpAgentStatus());

    expect(result.current.statusLoaded).toBe(false);
    expect(result.current.agentInstallStatus).toEqual({});

    await waitFor(() => expect(resolveGet).not.toBeNull());
    resolveGet!({ 'com.ferroxlabs/tvcontrol': ['claude', 'codex'] });

    await waitFor(() => expect(result.current.statusLoaded).toBe(true));
    expect(result.current.agentInstallStatus['com.ferroxlabs/tvcontrol']).toEqual(['claude', 'codex']);
  });

  test('a failed read still resolves the question rather than hanging on "checking"', async () => {
    vi.resetModules();
    const storage = await import('@/common/config/storage');
    vi.mocked(storage.ConfigStorage.get).mockRejectedValueOnce(new Error('boom'));
    const { useMcpAgentStatus } = await import('@renderer/hooks/mcp/useMcpAgentStatus');
    const { result } = renderHook(() => useMcpAgentStatus());
    await waitFor(() => expect(result.current.statusLoaded).toBe(true));
    expect(result.current.agentInstallStatus).toEqual({});
  });
});
