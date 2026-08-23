/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B3 guard, re-pointed by N2. Formerly `conciergeAddMcpEnables.test.ts`.
 *
 * B3's invariant is NOT "always enable". It is: THE RECEIPT MAY ONLY SAY WHAT
 * THE HOST ACTUALLY CHECKED. What B3 killed was the affirmative lie
 * `Added MCP server "X".` over a connector nothing had reached.
 *
 * B3 satisfied that invariant by making the host CHECK - probe the declaration,
 * then report what the probe found. That probe was arbitrary command execution:
 * `command`/`args`/`env` in a [CONCIERGE_PROPOSE] block are MODEL OUTPUT, and
 * `testMcpConnection` spawns them. Proven end to end through the production
 * path - `/usr/bin/touch <marker>` in a real proposal created the marker, with a
 * control asserting it absent immediately before - while the receipt said the
 * server "did not answer". See conciergeAddMcpDoesNotSpawn.test.ts.
 *
 * So the host now checks NOTHING, and satisfies the identical invariant by
 * CLAIMING nothing. The two assertions that changed are the two that depended on
 * a probe having run; every assertion here that guards the invariant itself is
 * kept and strengthened. The previous version of this file mocked
 * `testMcpConnection`, which is precisely why it could assert a spawning code
 * path as correct without ever observing a process start.
 *
 * Fixtures are produced by production code, never hand-written: the proposal
 * comes out of the real `detectConciergeProposals` over a real
 * `[CONCIERGE_PROPOSE]` block.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConciergeConfirmParams, ConciergeConfirmResult } from '@/common/chat/conciergeConfig';
import type { IMcpServer } from '@/common/config/storage';

const { state, emitSpy, setSpy, getSpy, mcpUpdateSpy, probeSpy, syncSpy, detectedAgentsSpy, updateSpy } = vi.hoisted(
  () => {
    const hoistedState = {
      handler: null as null | ((p: ConciergeConfirmParams) => Promise<ConciergeConfirmResult>),
      msg: null as Record<string, unknown> | null,
      mcpServers: [] as IMcpServer[],
    };
    return {
      state: hoistedState,
      emitSpy: vi.fn(),
      setSpy: vi.fn(async () => {}),
      getSpy: vi.fn(async () => [] as unknown[]),
      mcpUpdateSpy: vi.fn(async (mutator: (current: IMcpServer[]) => IMcpServer[] | Promise<IMcpServer[]>) => {
        hoistedState.mcpServers = structuredClone(await mutator(structuredClone(hoistedState.mcpServers)));
        return { revision: '0'.repeat(64), servers: structuredClone(hoistedState.mcpServers) };
      }),
      probeSpy: vi.fn(async (_server: IMcpServer): Promise<McpConnectionTestResult> => ({
        success: false,
        error: 'not configured',
      })),
      syncSpy: vi.fn(async () => ({ success: true, results: [{ agent: 'Wayland Core', success: true }] })),
      detectedAgentsSpy: vi.fn(() => [{ backend: 'wcore', name: 'Wayland Core', kind: 'acp' }]),
      updateSpy: vi.fn((_id: string, m: Record<string, unknown>) => {
        hoistedState.msg = m;
      }),
    };
  }
);

vi.mock('@/common', () => ({
  ipcBridge: {
    conciergeConfig: {
      confirmProposal: {
        provider: (fn: (p: ConciergeConfirmParams) => Promise<ConciergeConfirmResult>) => {
          state.handler = fn;
        },
      },
    },
    conversation: { responseStream: { emit: emitSpy } },
  },
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({
    getMessageByMsgId: (_cid: string, _mid: string, _type: string) =>
      state.msg ? { success: true, data: state.msg } : { success: false, data: null },
    updateMessage: updateSpy,
  })),
}));

vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: getSpy, set: setSpy } }));
vi.mock('@process/services/mcpServices/mcpConfigAuthority', () => ({ updateMcpConfig: mcpUpdateSpy }));
vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({ connectModelRegistryProvider: vi.fn() }));
vi.mock('@process/providers/types', () => ({}));
vi.mock('@process/bridge/fsBridge', () => ({ writeAssistantRules: vi.fn(async () => true) }));
vi.mock('@process/services/mcpServices/McpService', () => ({
  mcpService: { testMcpConnection: probeSpy, syncMcpToAgents: syncSpy },
}));
vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: { getDetectedAgents: detectedAgentsSpy },
}));

import { initConciergeConfigBridge } from '@process/bridge/conciergeConfigBridge';
import { detectConciergeProposals } from '@process/task/ConciergeProposeDetector';

/**
 * Production path for the proposal: the real detector over a real assistant
 * message. Nothing about the stored card is hand-constructed.
 */
const PROPOSE_BLOCK = [
  'Sure — I can wire that up.',
  '[CONCIERGE_PROPOSE]',
  'kind: add_mcp',
  'name: tvcontrol',
  'command: bunx',
  'args: --bun @ferroxlabs/tvcontrol@2.3.1',
  '[/CONCIERGE_PROPOSE]',
  'Apply it and I will use it.',
].join('\n');

function storeDetectedProposal(): void {
  const proposals = detectConciergeProposals(PROPOSE_BLOCK);
  expect(proposals).toHaveLength(1);
  expect(proposals[0].kind).toBe('add_mcp');
  state.msg = {
    id: 'm1',
    msg_id: 'm1',
    conversation_id: 'c1',
    type: 'concierge_propose',
    content: { ...proposals[0], status: 'pending' },
  };
}

initConciergeConfigBridge();

beforeEach(() => {
  vi.clearAllMocks();
  state.msg = null;
  state.mcpServers = [];
  getSpy.mockResolvedValue([]);
  syncSpy.mockResolvedValue({ success: true, results: [{ agent: 'Wayland Core', success: true }] });
  detectedAgentsSpy.mockReturnValue([{ backend: 'wcore', name: 'Wayland Core', kind: 'acp' }]);
});

describe('concierge add_mcp Apply', () => {
  it('persists the declaration, publishes nothing, and claims nothing', async () => {
    storeDetectedProposal();

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    expect(result.ok).toBe(true);
    // The declaration IS saved - the feature still does its one honest job.
    expect(state.mcpServers).toHaveLength(1);
    expect(state.mcpServers[0]).toMatchObject({ name: 'tvcontrol', enabled: false, status: 'disconnected' });
    expect(state.mcpServers[0].transport).toMatchObject({ command: 'bunx' });

    // Nothing was probed, so nothing may be published: only `enabled` servers
    // reach an agent, and this one is off. This is the assertion B3 added to
    // stop a false-green row, and it holds unchanged.
    expect(syncSpy).not.toHaveBeenCalled();
    expect(probeSpy).not.toHaveBeenCalled();

    // THE B3 INVARIANT. The host checked nothing, so the receipt asserts
    // nothing about reachability - no tool count, no "answered", and equally no
    // "did not answer", which would itself be a claim about a probe that never
    // ran. It states a persist (true) and an instruction (true).
    const summary = String((result as { summary?: string }).summary);
    expect(summary).toContain('tvcontrol');
    expect(summary).toContain('MCP Library');
    for (const unchecked of ['tools', 'did not answer', 'connected', 'it answered']) {
      expect(summary.toLowerCase()).not.toContain(unchecked);
    }
  });

  it('still refuses a duplicate name without touching the stored list', async () => {
    // Control that the pre-accept validation path survived the change: this is
    // the one check that legitimately runs before any write.
    getSpy.mockResolvedValue([{ name: 'tvcontrol' }]);
    storeDetectedProposal();

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    expect(result).toMatchObject({ ok: false, reason: 'mcp_name_exists' });
    expect(state.mcpServers).toHaveLength(0);
  });
});
