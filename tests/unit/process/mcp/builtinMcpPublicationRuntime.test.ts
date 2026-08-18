/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1015 F1 — the agent-CLI publication fan-out.
 *
 * `McpService.syncMcpToAgents` is the single chokepoint through which every
 * agent-CLI MCP serializer (Claude, Codex, Gemini, Qwen, Codebuddy, OpenCode,
 * Wayland Core, Wayland) receives a stored declaration. A bare `node` published
 * there is a chat with no builtin tools on any stock Mac — while the Library
 * probe, which spawns the resolved runtime, reports green.
 *
 * This drives the REAL service and asserts what the agents actually received.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';
import { getMcpScriptPath } from '@process/utils/mcpScriptDir';

const PACKAGED_BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';

const mocks = vi.hoisted(() => ({ resolveJsRuntime: vi.fn<() => ResolvedJsRuntime>() }));
vi.mock('@process/utils/jsRuntime', () => ({ resolveJsRuntime: mocks.resolveJsRuntime }));

const SCRIPT = getMcpScriptPath('builtin-mcp-image-gen.js');

const builtin = (): IMcpServer => ({
  id: 'builtin-image-gen',
  name: 'wayland-image-generation',
  enabled: true,
  builtin: true,
  transport: {
    type: 'stdio',
    command: 'node',
    args: [SCRIPT],
    env: { WAYLAND_IMG_PLATFORM: 'openai' },
  },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
});

describe('McpService.syncMcpToAgents publishes the resolved runtime, not bare node', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.resolveJsRuntime.mockImplementation(() => ({ command: PACKAGED_BUN, env: {}, kind: 'bundled-bun' }));
  });

  it('hands every publication target the resolved command', async () => {
    const received: IMcpServer[][] = [];
    const agentClass = () =>
      class {
        installMcpServers = vi.fn(async (servers: IMcpServer[]) => {
          received.push(servers);
          return { success: true };
        });
        detectMcpServers = vi.fn(async () => []);
      };
    for (const mod of [
      'ClaudeMcpAgent',
      'CodebuddyMcpAgent',
      'QwenMcpAgent',
      'CodexMcpAgent',
      'WCoreMcpAgent',
      'GeminiMcpAgent',
      'WaylandMcpAgent',
      'OpencodeMcpAgent',
    ]) {
      vi.doMock(`@process/services/mcpServices/agents/${mod}`, () => ({ [mod]: agentClass() }));
    }
    vi.doMock('child_process', () => ({
      execSync: vi.fn(() => {
        throw new Error('gemini not installed');
      }),
    }));

    const { McpService } = await import('@process/services/mcpServices/McpService');
    const service = new McpService();
    const result = await service.syncMcpToAgents(
      [builtin()],
      [{ backend: 'claude', name: 'Claude Code', cliPath: 'claude' }]
    );

    expect(result.success).toBe(true);
    expect(received).toHaveLength(1);
    expect(received[0][0].transport).toEqual({
      type: 'stdio',
      command: PACKAGED_BUN,
      args: [SCRIPT],
      env: { WAYLAND_IMG_PLATFORM: 'openai' },
    });
  });
});
