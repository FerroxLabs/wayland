/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LANE 1 / DELIVERABLES 4 + 5, at the surface the user actually reads.
 *
 * The screen the user saw held two statements at once: a button reading
 * "Adding MCP configuration to 6 agents..." and a side panel reading
 * "Not synced to any agent yet", plus a red banner concatenating a timeout
 * with "Server not found in project settings".
 *
 * WHICH ONE WAS LYING: the toast. The side panel is DETECTED truth - it is
 * rebuilt from `mcpService.getAgentMcpConfigs`, i.e. from what is actually in
 * each agent's config, and it is re-checked after every publish. The toast was
 * a count of agents we were about to CONTACT, phrased as an accomplishment
 * ("Adding ... to 6 agents"), and nothing ever corrected it downward. The
 * result toast now states the number that is true.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { getAvailableAgents, syncInvoke, removeInvoke } = vi.hoisted(() => ({
  getAvailableAgents: vi.fn(),
  syncInvoke: vi.fn(),
  removeInvoke: vi.fn(),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: getAvailableAgents } },
  mcpService: { syncMcpToAgents: { invoke: syncInvoke }, removeMcpFromAgents: { invoke: removeInvoke } },
}));
vi.mock('@/common/config/storage', () => ({ ConfigStorage: { get: vi.fn(async () => null) } }));
vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));
vi.mock('@/renderer/services/McpConfigService', () => ({
  removeMcpFromAgentsHttp: vi.fn(),
  syncMcpToAgentsHttp: vi.fn(),
}));
vi.mock('react-i18next', () => ({
  // Render the key plus its interpolations so the assertions read the real
  // sentence shape, not a stub.
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => `${key}|${JSON.stringify(vars ?? {})}`,
  }),
}));

import { useMcpOperations } from '@/renderer/hooks/mcp/useMcpOperations';
import type { IMcpServer } from '@/common/config/storage';

const server: IMcpServer = {
  id: 'mcp-tv',
  name: 'com-ferroxlabs-tvcontrol',
  enabled: true,
  status: 'connected',
  transport: { type: 'stdio', command: 'bunx', args: ['--bun', '@ferroxlabs/tvcontrol'] },
  createdAt: 1,
  updatedAt: 2,
};

type Toast = { level: 'info' | 'success' | 'warning' | 'error'; content: string; id?: string };

function harness() {
  const toasts: Toast[] = [];
  const record = (level: Toast['level']) => (arg: unknown) =>
    toasts.push({
      level,
      content: typeof arg === 'string' ? arg : String((arg as { content: string }).content),
      id: typeof arg === 'string' ? undefined : (arg as { id?: string }).id,
    });
  const message = {
    info: record('info'),
    success: record('success'),
    warning: record('warning'),
    error: record('error'),
  } as never;
  const { result } = renderHook(() => useMcpOperations([server], message));
  return { toasts, ops: result.current };
}

beforeEach(() => {
  vi.clearAllMocks();
  getAvailableAgents.mockResolvedValue({
    success: true,
    data: [
      { backend: 'claude', name: 'Claude Code', supportedTransports: ['stdio'] },
      { backend: 'qwen', name: 'Qwen Code', supportedTransports: ['stdio'] },
    ],
  });
});

describe('the toast tells the truth about what happened', () => {
  it('the START toast says CONTACTING, not that anything has been added', async () => {
    syncInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude Code', success: true, outcome: 'applied' },
          { agent: 'Qwen Code', success: true, outcome: 'applied' },
        ],
      },
    });

    const { toasts, ops } = harness();
    await ops.syncMcpToAgents(server);

    // The old key value was "Adding MCP configuration to {{count}} agents...".
    expect(toasts[0].content).toContain('settings.mcpSyncStarted');
    // And the closing toast states the number that is actually true.
    const last = toasts[toasts.length - 1];
    expect(last.level).toBe('success');
    expect(last.content).toContain('settings.mcpSyncOutcome');
    expect(last.content).toContain('"applied":2');
    expect(last.content).toContain('"total":2');
  });

  it('a partial publish reports 1 of 2, never a bare "6 agents"', async () => {
    // `success` here is the IPC envelope, which is true whenever the call was
    // delivered. The per-agent verdicts live in `data.results`.
    syncInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude Code', success: true, outcome: 'applied' },
          { agent: 'Qwen Code', success: false, outcome: 'failed', error: 'unknown transport' },
        ],
      },
    });

    const { toasts, ops } = harness();
    await expect(ops.syncMcpToAgents(server)).rejects.toThrow();

    const warn = toasts.find((entry) => entry.level === 'warning');
    expect(warn?.content).toContain('settings.mcpAgentsFailed');
    expect(warn?.content).toContain('Qwen Code');
    expect(warn?.content).toContain('"applied":1');
    expect(warn?.content).toContain('"total":2');
  });

  it("the user's removal: a timeout and an absence are no longer one red sentence", async () => {
    removeInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          {
            agent: 'Claude Code',
            success: false,
            outcome: 'timed-out',
            retryable: true,
            error: 'Claude Code did not answer in time, so its config was left unchanged and unverified. Retry.',
          },
          // This one is a SUCCESS. It used to be half of the failure banner.
          { agent: 'Qwen Code', success: true, outcome: 'already-absent' },
        ],
      },
    });

    const { toasts, ops } = harness();
    await expect(ops.removeMcpFromAgents('com-ferroxlabs-tvcontrol')).rejects.toThrow();

    const warn = toasts.find((entry) => entry.level === 'warning');
    expect(warn?.content).toContain('settings.mcpAgentsRetryNeeded');
    // Only the agent we genuinely do not know about is named.
    expect(warn?.content).toContain('Claude Code');
    expect(warn?.content).not.toContain('Qwen Code');
    // The old banner key is gone entirely.
    expect(toasts.every((entry) => !entry.content.includes('mcpRemovePartialFailed'))).toBe(true);
  });

  it('a removal where every agent said "it was not there" is a SUCCESS', async () => {
    removeInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude Code', success: true, outcome: 'already-absent' },
          { agent: 'Qwen Code', success: true, outcome: 'already-absent' },
        ],
      },
    });

    const { toasts, ops } = harness();
    await ops.removeMcpFromAgents('com-ferroxlabs-tvcontrol');

    expect(toasts.some((entry) => entry.level === 'warning' || entry.level === 'error')).toBe(false);
    expect(toasts[toasts.length - 1].content).toContain('settings.mcpRemoveNothingToDo');
  });

  it('a backend with no MCP implementation is excluded from the totals', async () => {
    syncInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude Code', success: true, outcome: 'applied' },
          { agent: 'Goose', success: false, unsupported: true, outcome: 'unsupported', error: 'not supported' },
        ],
      },
    });

    const { toasts, ops } = harness();
    await ops.syncMcpToAgents(server);

    const last = toasts[toasts.length - 1];
    expect(last.level).toBe('success');
    expect(last.content).toContain('"total":1');
  });
});

/**
 * WORKING, BUT CLUMSY.
 *
 * The publish SUCCEEDED - it just looked broken while it did. A warning carries
 * `duration: 8000`, so it stays on screen for eight seconds. Toggle the
 * connector again inside that window and the NEXT operation's "contacting N
 * agents to remove this connector..." appears while the PREVIOUS operation's
 * warning is still sitting above it. Read together they say the app is removing
 * something you just asked it to enable, and the warning is never retracted
 * once it stops being true.
 *
 * Arco keys a message by `id` and REPLACES a live one that shares it. One slot
 * per connector means each message supersedes the one it corrects, so the
 * screen only ever holds the CURRENT state of a connector.
 *
 * These assertions go through the real hook. Nothing here constructs a message
 * by hand - the ids are whatever the production path actually emitted.
 */
describe('one message slot per connector, so nothing stale outlives the truth', () => {
  it('a publish that partly times out and is then toggled off never stacks two operations', async () => {
    syncInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude Code', success: true, outcome: 'applied' },
          { agent: 'Qwen Code', success: false, outcome: 'timed-out' },
        ],
      },
    });
    removeInvoke.mockResolvedValue({
      success: true,
      data: {
        results: [
          { agent: 'Claude Code', success: true, outcome: 'applied' },
          { agent: 'Qwen Code', success: true, outcome: 'applied' },
        ],
      },
    });

    const { toasts, ops } = harness();
    await ops.syncMcpToAgents(server).catch(() => undefined);
    await ops.removeMcpFromAgents(server.name).catch(() => undefined);

    // The sequence the user actually saw: start, timeout warning, start, outcome.
    expect(toasts.length).toBeGreaterThanOrEqual(4);
    expect(toasts.some((entry) => entry.content.includes('settings.mcpAgentsRetryNeeded'))).toBe(true);
    expect(toasts.some((entry) => entry.content.includes('settings.mcpRemoveStarted'))).toBe(true);

    // EVERY message about this connector claims the same slot, so the remove
    // spinner replaces the publish warning instead of appearing underneath it.
    const ids = toasts.map((entry) => entry.id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(1);
  });

  it('two different connectors keep their own slots and do not overwrite each other', async () => {
    const other: IMcpServer = { ...server, id: 'mcp-other', name: 'com-example-other' };
    syncInvoke.mockResolvedValue({
      success: true,
      data: { results: [{ agent: 'Claude Code', success: true, outcome: 'applied' }] },
    });

    const { toasts, ops } = harness();
    await ops.syncMcpToAgents(server).catch(() => undefined);
    await ops.syncMcpToAgents(other).catch(() => undefined);

    // A shared slot for everything would be the opposite bug: one connector's
    // result silently erasing another's.
    expect(new Set(toasts.map((entry) => entry.id)).size).toBe(2);
  });
});
