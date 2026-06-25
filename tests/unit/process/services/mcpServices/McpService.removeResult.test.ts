/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * S12 regression: removeMcpFromAgents must reflect per-agent removal failures
 * in its top-level `success`. Previously it returned `success: true`
 * unconditionally, so a per-agent removal that failed (captured in results[]
 * with success:false) was hidden and the renderer reported "deleted" while the
 * server stayed in that agent's CLI config (Claude/Codex/wcore drift).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpService } from '@process/services/mcpServices/McpService';
import type { IMcpProtocol, McpOperationResult } from '@process/services/mcpServices/McpProtocol';

function makeAgent(result: McpOperationResult): IMcpProtocol {
  // Only removeMcpServer is exercised by removeMcpFromAgents; the rest are
  // stubbed so the object satisfies the interface shape used by the service.
  return {
    removeMcpServer: vi.fn().mockResolvedValue(result),
  } as unknown as IMcpProtocol;
}

describe('McpService.removeMcpFromAgents (S12)', () => {
  let service: McpService;

  beforeEach(() => {
    service = new McpService();
    // addNativeGeminiIfNeeded would otherwise append a real native gemini agent
    // when the `gemini` CLI happens to be installed on the dev box. Force it off
    // so the removal set is exactly the agents we pass in.
    vi.spyOn(
      service as unknown as { isCliAvailable: (cmd: string) => boolean },
      'isCliAvailable'
    ).mockReturnValue(false);
  });

  function injectAgent(source: string, agent: IMcpProtocol): void {
    (service as unknown as { agents: Map<string, IMcpProtocol> }).agents.set(source, agent);
  }

  it('returns success:false when a per-agent removal fails (regression)', async () => {
    injectAgent('claude', makeAgent({ success: false, error: 'could not write config' }));

    const result = await service.removeMcpFromAgents('test-server', [{ backend: 'claude', name: 'Claude' }]);

    // Before the fix this asserted true unconditionally, hiding the failure.
    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('could not write config');
  });

  it('returns success:true when every per-agent removal succeeds', async () => {
    injectAgent('claude', makeAgent({ success: true }));
    injectAgent('codex', makeAgent({ success: true }));

    const result = await service.removeMcpFromAgents('test-server', [
      { backend: 'claude', name: 'Claude' },
      { backend: 'codex', name: 'Codex' },
    ]);

    expect(result.success).toBe(true);
    expect(result.results.every((r) => r.success)).toBe(true);
  });

  it('returns success:false when at least one of several agents fails', async () => {
    injectAgent('claude', makeAgent({ success: true }));
    injectAgent('codex', makeAgent({ success: false, error: 'locked' }));

    const result = await service.removeMcpFromAgents('test-server', [
      { backend: 'claude', name: 'Claude' },
      { backend: 'codex', name: 'Codex' },
    ]);

    expect(result.success).toBe(false);
  });
});
