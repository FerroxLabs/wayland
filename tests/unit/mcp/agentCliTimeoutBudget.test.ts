/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * LANE 1 / DELIVERABLE 3. Fifteen call sites carried a hard-coded
 * `timeout: 5000` that no measurement ever justified.
 *
 * MEASURED (2026-08-23, macOS 10-core at load average 39, 64 alternating
 * add/remove calls against the real claude/qwen/gemini/codex binaries in a
 * redirected home, every call rc=0): median 965 ms, p95 1,927 ms, max 7,524 ms
 * (`gemini mcp remove`). One call in 64 exceeded 5,000 ms. A user action fans
 * out to roughly eight such calls, so about one action in eight would hit that
 * wall - which is the rate the user experienced.
 *
 * The 5 s wall was BELOW the observed cost of the call it guarded. That is not
 * a timeout, it is a coin flip.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { execFileSpy } = vi.hoisted(() => ({ execFileSpy: vi.fn() }));
vi.mock('@process/utils/safeExec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/utils/safeExec')>();
  return { ...actual, safeExecFile: execFileSpy, safeExec: vi.fn(async () => ({ stdout: '', stderr: '' })) };
});
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: '/usr/bin' }) }));

import {
  MCP_AGENT_CLI_RETRY_BACKOFF_MS,
  MCP_AGENT_CLI_TIMEOUT_MS,
  isAgentCliTimeout,
  runAgentCli,
} from '@process/services/mcpServices/agents/agentCliExec';
import { MCP_AGENT_PUBLICATION_DEADLINE_MS } from '@process/services/mcpServices/McpService';
import { ClaudeMcpAgent } from '@process/services/mcpServices/agents/ClaudeMcpAgent';
import { QwenMcpAgent } from '@process/services/mcpServices/agents/QwenMcpAgent';
import { GeminiMcpAgent } from '@process/services/mcpServices/agents/GeminiMcpAgent';
import { CodexMcpAgent } from '@process/services/mcpServices/agents/CodexMcpAgent';
import { CodebuddyMcpAgent } from '@process/services/mcpServices/agents/CodebuddyMcpAgent';

/** The slowest real call observed in the measurement above. */
const OBSERVED_WORST_MS = 7_524;
/** The wall the user's failure was produced by. */
const OLD_WALL_MS = 5_000;

const server = {
  id: 'mcp-tv',
  name: 'com-ferroxlabs-tvcontrol',
  enabled: true,
  status: 'disconnected' as const,
  transport: { type: 'stdio' as const, command: 'bunx', args: ['--bun', '@ferroxlabs/tvcontrol@2.3.1'] },
  createdAt: 1,
  updatedAt: 2,
};

const timeoutRejection = (ms: number): Error =>
  Object.assign(new Error(`Command timed out after ${ms}ms`), { stdout: '', stderr: '', killed: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the CLI budget covers the calls it guards', () => {
  it('is wider than the slowest call actually observed', () => {
    expect(MCP_AGENT_CLI_TIMEOUT_MS).toBeGreaterThan(OBSERVED_WORST_MS);
    expect(MCP_AGENT_CLI_TIMEOUT_MS).toBeGreaterThan(OLD_WALL_MS);
  });

  it('leaves room for the one retry inside the per-agent publication deadline', () => {
    // Two attempts plus the backoff must still settle before the fan-out gives
    // up on this agent, or the retry is dead code.
    //
    // This is the WHOLE agent operation's worst case, not one call's, and only
    // because the multi-scope removal loops now STOP at the first unreachable
    // scope. Without that, a three-scope removal costs 3 x (timeout + retry)
    // and blows the deadline - which is exactly what a live run showed:
    // `gemini mcp remove` spent 61,433 ms before the loop was cut short.
    expect(MCP_AGENT_CLI_TIMEOUT_MS * 2 + MCP_AGENT_CLI_RETRY_BACKOFF_MS).toBeLessThanOrEqual(
      MCP_AGENT_PUBLICATION_DEADLINE_MS
    );
  });

  it('a multi-scope removal makes at most one unreachable-CLI attempt sequence', async () => {
    // Claude checks three scopes. If the CLI is not answering, it must be
    // asked ONCE (plus the single retry), not once per scope.
    execFileSpy.mockRejectedValue(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS));
    const result = await new ClaudeMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol');

    expect(result.outcome).toBe('timed-out');
    expect(execFileSpy).toHaveBeenCalledTimes(2); // first attempt + one retry
  });

  it.each([
    ['claude publish', async () => new ClaudeMcpAgent().installMcpServers([server])],
    ['claude remove', async () => new ClaudeMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol')],
    ['qwen publish', async () => new QwenMcpAgent().installMcpServers([server])],
    ['qwen remove', async () => new QwenMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol')],
    ['gemini publish', async () => new GeminiMcpAgent().installMcpServers([server])],
    ['gemini remove', async () => new GeminiMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol')],
    ['codex publish', async () => new CodexMcpAgent().installMcpServers([server])],
    ['codex remove', async () => new CodexMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol')],
    ['codebuddy publish', async () => new CodebuddyMcpAgent().installMcpServers([server])],
    ['codebuddy remove', async () => new CodebuddyMcpAgent().removeMcpServer('com-ferroxlabs-tvcontrol')],
  ])('%s never spawns a child under the old 5000ms wall', async (_label, run) => {
    execFileSpy.mockResolvedValue({ stdout: 'removed', stderr: '' });
    await run();

    expect(execFileSpy).toHaveBeenCalled();
    for (const call of execFileSpy.mock.calls) {
      const options = (call as unknown as [string, string[], { timeout?: number }])[2];
      expect(options.timeout).toBe(MCP_AGENT_CLI_TIMEOUT_MS);
      expect(options.timeout).toBeGreaterThan(OLD_WALL_MS);
    }
  });

  it('a call that costs more than five seconds now succeeds', async () => {
    execFileSpy.mockImplementation(async (_file: string, _args: string[], options: { timeout?: number }) => {
      if (OBSERVED_WORST_MS > (options?.timeout ?? 0)) throw timeoutRejection(options?.timeout ?? 0);
      return { stdout: 'Added stdio MCP server', stderr: '' };
    });

    const result = await new ClaudeMcpAgent().installMcpServers([server]);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe('applied');
  });
});

describe('retry on timeout, and only on timeout', () => {
  it('recognises a killed child as a timeout, and an exit code as not one', () => {
    expect(isAgentCliTimeout(timeoutRejection(15_000))).toBe(true);
    expect(isAgentCliTimeout(Object.assign(new Error('Command failed with exit code 1'), { code: 1 }))).toBe(false);
  });

  it('retries once when the child is killed, and converges', async () => {
    execFileSpy
      .mockRejectedValueOnce(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS))
      .mockResolvedValueOnce({ stdout: 'removed', stderr: '' });

    const result = await runAgentCli('claude', ['mcp', 'remove', 'x'], { env: {} });
    expect(result.stdout).toBe('removed');
    expect(execFileSpy).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry a real error - the CLI already answered', async () => {
    execFileSpy.mockRejectedValue(
      Object.assign(new Error('Command failed with exit code 1'), { stderr: 'unknown transport', code: 1 })
    );
    await expect(runAgentCli('claude', ['mcp', 'add', 'x'], { env: {} })).rejects.toThrow();
    expect(execFileSpy).toHaveBeenCalledTimes(1);
  });

  it('gives up after the single retry rather than looping', async () => {
    execFileSpy.mockRejectedValue(timeoutRejection(MCP_AGENT_CLI_TIMEOUT_MS));
    await expect(runAgentCli('claude', ['mcp', 'add', 'x'], { env: {} })).rejects.toThrow(/timed out/);
    expect(execFileSpy).toHaveBeenCalledTimes(2);
  });
});
