/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LANE 1 / DELIVERABLES 2 + 4, reproduced from the user's screen.
 *
 * The banner, verbatim:
 *
 *   "MCP configuration removal partially failed: claude:Claude Code:
 *    user/com.ferroxlabs-tvcontrol: failed: Command timed out after 5000ms,
 *    qwen:Qwen Code: user: Comma... Server not found in project settings"
 *
 * Three separate lies in one sentence:
 *   - "failed" for a state we do not know (the child was killed mid-flight),
 *   - "Server not found in project settings" reported as a FAILURE when the
 *     operation was a REMOVAL - not being there is the goal,
 *   - two unrelated causes concatenated with no per-agent structure and no
 *     next step for the user.
 *
 * The server itself was healthy: "Server reachable", 105 tools.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { execFileSpy } = vi.hoisted(() => ({ execFileSpy: vi.fn() }));

vi.mock('@process/utils/safeExec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/utils/safeExec')>();
  return { ...actual, safeExecFile: execFileSpy, safeExec: vi.fn(async () => ({ stdout: '', stderr: '' })) };
});
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: '/usr/bin' }) }));

import { ClaudeMcpAgent } from '@process/services/mcpServices/agents/ClaudeMcpAgent';
import { QwenMcpAgent } from '@process/services/mcpServices/agents/QwenMcpAgent';
import { GeminiMcpAgent } from '@process/services/mcpServices/agents/GeminiMcpAgent';
import { CodexMcpAgent } from '@process/services/mcpServices/agents/CodexMcpAgent';
import { MCP_AGENT_CLI_TIMEOUT_MS } from '@process/services/mcpServices/agents/agentCliExec';

/** How `safeExecFile` rejects when it kills the child on its own deadline. */
const timeoutRejection = (ms: number): Error =>
  Object.assign(new Error(`Command timed out after ${ms}ms`), { stdout: '', stderr: '', killed: true });

/** How `safeExecFile` rejects on a non-zero exit: fixed message, CLI words on stderr. */
const exitRejection = (stderr: string, code = 1): Error =>
  Object.assign(new Error(`Command failed with exit code ${code}`), { stdout: '', stderr, code });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('a removal that fails because the thing was already gone is a SUCCESS', () => {
  it('Claude Code: absent in every scope', async () => {
    execFileSpy.mockRejectedValue(exitRejection('No MCP server named "com-ferroxlabs-tvcontrol" in user scope'));
    const result = await new ClaudeMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('already-absent');
    expect(result.error).toBeUndefined();
  });

  it('Qwen Code: "Server not found in project settings" is not a failure', async () => {
    execFileSpy.mockResolvedValue({ stdout: 'Server "com-ferroxlabs-tvcontrol" not found in user settings', stderr: '' });
    const result = await new QwenMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('already-absent');
  });

  it('Gemini CLI: absent in both scopes', async () => {
    execFileSpy.mockResolvedValue({ stdout: 'Server not found in user scope', stderr: '' });
    const result = await new GeminiMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('already-absent');
  });

  it('Codex CLI: absent', async () => {
    execFileSpy.mockRejectedValue(exitRejection('No such server: com-ferroxlabs-tvcontrol'));
    const result = await new CodexMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('already-absent');
  });
});

describe('a timeout is an UNKNOWN, and is worded as one', () => {
  it('Claude Code reports timed-out, not failed, and says what to do', async () => {
    execFileSpy.mockRejectedValue(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS));
    const result = await new ClaudeMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');

    expect(result.success).toBe(false);
    expect(result.outcome).toBe('timed-out');
    // The three things the old sentence never said.
    expect(result.error).toContain('Claude Code');
    expect(result.error).toContain('did not answer in time');
    expect(result.error).toContain('Retry');
    // And the one thing it said that was not true.
    expect(result.error).not.toMatch(/\bfailed:/);
  });

  it("the user's exact mixed case: one scope timed out, one said absent -> RETRYABLE, not failed", async () => {
    // user scope: killed mid-flight. project scope: it was never there.
    execFileSpy
      .mockRejectedValueOnce(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS))
      .mockResolvedValueOnce({ stdout: 'Server "com-ferroxlabs-tvcontrol" not found in project settings', stderr: '' });

    const result = await new QwenMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');

    // Previously: success:false with
    //   "user: Command timed out after 5000ms; project: Server not found in project settings"
    expect(result.outcome).toBe('timed-out');
    expect(result.error).toContain('Qwen Code');
    expect(result.error).toContain('Retry');
    // The absent scope contributes no failure text of its own.
    expect(result.error).not.toContain('not found in project settings');
  });

  it('a removal proven in one scope wins over an unknown in another', async () => {
    execFileSpy
      .mockResolvedValueOnce({ stdout: 'Server "com-ferroxlabs-tvcontrol" removed from user settings', stderr: '' })
      .mockRejectedValueOnce(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS));

    const result = await new QwenMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('applied');
  });

  it('a real CLI error is still a failure, and still says what the CLI said', async () => {
    execFileSpy.mockRejectedValue(exitRejection('EACCES: permission denied, open /Users/x/.claude.json'));
    const result = await new ClaudeMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');
    expect(result.success).toBe(false);
    expect(result.outcome).toBe('failed');
    expect(result.error).toContain('permission denied');
  });
});

describe('publication reports the same three states', () => {
  const server = {
    id: 'mcp-tv',
    name: 'com-ferroxlabs-tvcontrol',
    enabled: true,
    status: 'disconnected' as const,
    transport: { type: 'stdio' as const, command: 'bunx', args: ['--bun', '@ferroxlabs/tvcontrol@2.3.1'] },
    createdAt: 1,
    updatedAt: 2,
  };

  it('a successful publish is applied', async () => {
    execFileSpy.mockResolvedValue({ stdout: 'Added stdio MCP server', stderr: '' });
    const result = await new ClaudeMcpAgent().installMcpServers([server]);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('applied');
  });

  it('a timed-out publish is retryable and says republishing is safe', async () => {
    execFileSpy.mockRejectedValue(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS));
    const result = await new ClaudeMcpAgent().installMcpServers([server]);
    expect(result.outcome).toBe('timed-out');
    expect(result.error).toContain('Retry');
    expect(result.error).toContain('republishing is safe');
  });

  it('an unsupported transport is a plain failure, not a timeout', async () => {
    execFileSpy.mockRejectedValue(exitRejection('unknown transport'));
    const result = await new ClaudeMcpAgent().installMcpServers([
      { ...server, transport: { type: 'websocket' as never, command: 'x' } as never },
    ]);
    expect(result.outcome).toBe('failed');
  });
});
