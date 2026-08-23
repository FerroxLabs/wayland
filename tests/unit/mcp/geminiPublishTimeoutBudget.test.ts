/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B4a. `GeminiMcpAgent.installMcpServers` put a hard 5,000 ms wall on a CLI
 * call RC1 measured at 4,399 ms and 5,009 ms on the same machine 600 ms apart
 * — two identical clicks, one success and one `Command timed out after
 * 5000ms`. The class already carries a 30 s budget (`this.timeout`, used by
 * the detection path); only these publication call sites ignored it.
 *
 * The stub models `safeExecFile`'s real contract: a call that runs longer than
 * the supplied `timeout` rejects with the timeout error, and one inside it
 * resolves.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const { safeExecFileSpy, safeExecSpy } = vi.hoisted(() => ({
  safeExecFileSpy: vi.fn(),
  safeExecSpy: vi.fn(async () => ({ stdout: '', stderr: '' })),
}));

vi.mock('@process/utils/safeExec', () => ({ safeExecFile: safeExecFileSpy, safeExec: safeExecSpy }));
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({}) }));

import { GeminiMcpAgent } from '@process/services/mcpServices/agents/GeminiMcpAgent';

/** The observed cost of one `gemini mcp add` on Sean's machine. */
const OBSERVED_CALL_MS = 6_000;

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

beforeEach(() => {
  vi.clearAllMocks();
  safeExecFileSpy.mockImplementation(async (_file: string, _args: string[], options: { timeout?: number }) => {
    const budget = options?.timeout ?? 0;
    if (OBSERVED_CALL_MS > budget) throw new Error(`Command timed out after ${budget}ms`);
    return { stdout: 'added', stderr: '' };
  });
});

describe('Gemini CLI publication timeout budget', () => {
  it('does not fail a publication that costs more than five seconds', async () => {
    const result = await new GeminiMcpAgent().installMcpServers([server]);
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
  });

  it('publishes with the class-level budget, not a hard-coded 5000', async () => {
    await new GeminiMcpAgent().installMcpServers([server]);
    expect(safeExecFileSpy).toHaveBeenCalled();
    const [, , options] = safeExecFileSpy.mock.calls[0] as [string, string[], { timeout?: number }];
    expect(options.timeout).toBeGreaterThan(5_000);
  });
});
