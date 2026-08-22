/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B4c. `McpService.syncMcpToAgents` fanned `installMcpServers` across every
 * detected agent under a bare `Promise.all` with NO per-agent deadline, so one
 * agent CLI that never returns hangs the whole publication forever.
 *
 * RC1 executed it: main-process instrumentation, restart, click Reconnect ->
 * `[RC1LOCK] enqueue #394 from McpService.syncMcpToAgents` -> `start #394` ->
 * no `done`, no `fail`, for the rest of the session. `gemini` and `wcore`
 * returned in 4 ms and 38 ms; claude/codex/qwen/opencode never did. The
 * renderer publishes BEFORE committing `enabled: true`, so the hang means no
 * commit, no rollback, no toast, and `updatedAt` byte-identical two minutes
 * later across four attempts.
 *
 * The deadline is per AGENT, not on the aggregate: an aggregate timeout still
 * lets one agent starve the settle for the whole budget.
 *
 * This bounds the WAIT. It deliberately does not widen the aggregate verdict:
 * `mcpAgentOperationSucceeded` is the single shared definition used by both the
 * publication and the rollback halves, and a partial publication must still
 * report failure.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { installs } = vi.hoisted(() => ({
  installs: {
    wcore: vi.fn(async () => ({ success: true })),
    claude: vi.fn(async () => {
      throw new Error('claude mcp add exited 1');
    }),
    // The agent RC1 caught never returning.
    qwen: vi.fn(() => new Promise<never>(() => {})),
    other: vi.fn(async () => ({ success: true })),
  },
}));

function stubAgent(install: () => Promise<{ success: boolean; error?: string }>) {
  return class {
    getSupportedTransports(): string[] {
      return ['stdio', 'sse', 'http', 'streamable_http'];
    }
    installMcpServers(): Promise<{ success: boolean; error?: string }> {
      return install();
    }
    removeMcpServer(): Promise<{ success: boolean }> {
      return Promise.resolve({ success: true });
    }
    detectMcpServers(): Promise<IMcpServer[]> {
      return Promise.resolve([]);
    }
  };
}

vi.mock('@process/services/mcpServices/agents/WCoreMcpAgent', () => ({ WCoreMcpAgent: stubAgent(installs.wcore) }));
vi.mock('@process/services/mcpServices/agents/ClaudeMcpAgent', () => ({ ClaudeMcpAgent: stubAgent(installs.claude) }));
vi.mock('@process/services/mcpServices/agents/QwenMcpAgent', () => ({ QwenMcpAgent: stubAgent(installs.qwen) }));
vi.mock('@process/services/mcpServices/agents/GeminiMcpAgent', () => ({ GeminiMcpAgent: stubAgent(installs.other) }));
vi.mock('@process/services/mcpServices/agents/WaylandMcpAgent', () => ({ WaylandMcpAgent: stubAgent(installs.other) }));
vi.mock('@process/services/mcpServices/agents/CodexMcpAgent', () => ({ CodexMcpAgent: stubAgent(installs.other) }));
vi.mock('@process/services/mcpServices/agents/OpencodeMcpAgent', () => ({ OpencodeMcpAgent: stubAgent(installs.other) }));
vi.mock('@process/services/mcpServices/agents/CodebuddyMcpAgent', () => ({
  CodebuddyMcpAgent: stubAgent(installs.other),
}));

import { McpService } from '@process/services/mcpServices/McpService';

const server: IMcpServer = {
  id: 'mcp-tv',
  name: 'com-ferroxlabs-tvcontrol',
  enabled: true,
  status: 'disconnected',
  transport: { type: 'stdio', command: 'bunx', args: ['--bun', '@ferroxlabs/tvcontrol@2.3.1'] },
  createdAt: 1,
  updatedAt: 2,
  source: 'custom',
};

const agents = [
  { backend: 'wcore', name: 'Wayland Core' },
  { backend: 'claude', name: 'Claude Code' },
  { backend: 'qwen', name: 'Qwen Code' },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('MCP publication cannot be hung by one agent', () => {
  it('settles with a named failure instead of waiting on an agent that never returns', async () => {
    const settled = vi.fn();
    const publication = new McpService().syncMcpToAgents([server], agents).then((result) => {
      settled(result);
      return result;
    });

    // Deterministic advance: well past any per-agent budget, and far short of
    // "forever". Before the fix nothing here settles at all.
    await vi.advanceTimersByTimeAsync(120_000);

    expect(settled).toHaveBeenCalledTimes(1);
    const result = await publication;

    // Every agent is accounted for by NAME, including the one that never
    // returned - the caller can say which CLI is broken instead of spinning.
    const byAgent = new Map(result.results.map((entry) => [entry.agent, entry]));
    expect(byAgent.get('Wayland Core')?.success).toBe(true);
    expect(byAgent.get('Claude Code')?.success).toBe(false);
    expect(byAgent.get('Claude Code')?.error).toContain('claude mcp add exited 1');
    expect(byAgent.get('Qwen Code')?.success).toBe(false);
    expect(byAgent.get('Qwen Code')?.error).toContain('timed out');

    // The aggregate verdict is deliberately NOT widened here: a partial
    // publication still reports failure, so the renderer's publish-before-
    // commit gate keeps refusing to mint a false-green row.
    expect(result.success).toBe(false);
  });
});
