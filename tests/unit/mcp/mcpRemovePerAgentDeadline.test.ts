/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The publication fan-out has had a per-agent deadline since #B4c. The REMOVAL
 * fan-out never did - a bare `Promise.all` over `removeMcpServer`. Removal is
 * the ROLLBACK half of publication, so one agent CLI that never returns
 * stranded a connector mid-rollback with no toast and no way forward.
 *
 * Also pins the agent label. The removal path used `${agent.backend}:${agent.name}`
 * where publication used `${agent.name}`, which is why the user's banner opened
 * "claude:Claude Code: user/com.ferroxlabs-tvcontrol: ...".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { removes } = vi.hoisted(() => ({
  removes: {
    wcore: vi.fn(async () => ({ success: true, outcome: 'applied' as const })),
    // The shape RC1 caught on the publication side, here on removal.
    qwen: vi.fn(() => new Promise<never>(() => {})),
    other: vi.fn(async () => ({ success: true, outcome: 'already-absent' as const })),
  },
}));

function stubAgent(remove: () => Promise<{ success: boolean; error?: string; outcome?: string }>) {
  return class {
    getSupportedTransports(): string[] {
      return ['stdio', 'sse', 'http', 'streamable_http'];
    }
    installMcpServers(): Promise<{ success: boolean }> {
      return Promise.resolve({ success: true });
    }
    removeMcpServer(): Promise<{ success: boolean; error?: string; outcome?: string }> {
      return remove();
    }
    detectMcpServers(): Promise<IMcpServer[]> {
      return Promise.resolve([]);
    }
  };
}

vi.mock('@process/services/mcpServices/agents/WCoreMcpAgent', () => ({ WCoreMcpAgent: stubAgent(removes.wcore) }));
vi.mock('@process/services/mcpServices/agents/QwenMcpAgent', () => ({ QwenMcpAgent: stubAgent(removes.qwen) }));
vi.mock('@process/services/mcpServices/agents/ClaudeMcpAgent', () => ({ ClaudeMcpAgent: stubAgent(removes.other) }));
vi.mock('@process/services/mcpServices/agents/GeminiMcpAgent', () => ({ GeminiMcpAgent: stubAgent(removes.other) }));
vi.mock('@process/services/mcpServices/agents/WaylandMcpAgent', () => ({ WaylandMcpAgent: stubAgent(removes.other) }));
vi.mock('@process/services/mcpServices/agents/CodexMcpAgent', () => ({ CodexMcpAgent: stubAgent(removes.other) }));
vi.mock('@process/services/mcpServices/agents/OpencodeMcpAgent', () => ({
  OpencodeMcpAgent: stubAgent(removes.other),
}));
vi.mock('@process/services/mcpServices/agents/CodebuddyMcpAgent', () => ({
  CodebuddyMcpAgent: stubAgent(removes.other),
}));

import { McpService } from '@process/services/mcpServices/McpService';

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

describe('MCP removal cannot be hung by one agent', () => {
  it('settles, names every agent, and reports the hung one as retryable', async () => {
    const settled = vi.fn();
    const removal = new McpService().removeMcpFromAgents('com-ferroxlabs-tvcontrol', agents).then((result) => {
      settled(result);
      return result;
    });

    await vi.advanceTimersByTimeAsync(120_000);

    expect(settled).toHaveBeenCalledTimes(1);
    const result = await removal;
    const byAgent = new Map(result.results.map((entry) => [entry.agent, entry]));

    // Plain display names on BOTH paths - no "claude:Claude Code" stutter.
    // "Google Gemini CLI" is appended by `addNativeGeminiIfNeeded`: the
    // service fans out to MORE targets than the renderer counted, which is
    // part of why the toast's agent count never matched the panel.
    expect([...byAgent.keys()].sort()).toEqual(['Claude Code', 'Google Gemini CLI', 'Qwen Code', 'Wayland Core']);

    expect(byAgent.get('Wayland Core')?.success).toBe(true);
    expect(byAgent.get('Wayland Core')?.outcome).toBe('applied');

    // Removing something that was already gone is a success, and it is
    // reported as a DIFFERENT state from "we changed it".
    expect(byAgent.get('Claude Code')?.success).toBe(true);
    expect(byAgent.get('Claude Code')?.outcome).toBe('already-absent');

    expect(byAgent.get('Qwen Code')?.success).toBe(false);
    expect(byAgent.get('Qwen Code')?.outcome).toBe('timed-out');
    expect(byAgent.get('Qwen Code')?.retryable).toBe(true);
    expect(byAgent.get('Qwen Code')?.error).toContain('Qwen Code');
    expect(byAgent.get('Qwen Code')?.error).toContain('Retry');

    // A removal that is not proven everywhere is still not a green removal.
    expect(result.success).toBe(false);
  });
});
