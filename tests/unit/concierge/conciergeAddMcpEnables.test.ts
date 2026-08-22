/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B3 guard. Concierge "Apply" on an `add_mcp` proposal used to persist a
 * DISABLED declaration and answer `Added MCP server "X".` — an affirmative
 * claim of success over a connector nothing can reach. Only `enabled: true`
 * servers are published to the engine, so the user got a green receipt for an
 * install that did nothing.
 *
 * The invariant this file guards is NOT "always enable". It is: the receipt
 * may only say what the host actually checked.
 *   - probe answered  -> enabled: true, and the receipt carries the tool count
 *   - probe silent    -> enabled stays false, and the receipt SAYS SO
 *
 * Fixtures are produced by production code, never hand-written: the proposal
 * comes out of the real `detectConciergeProposals` over a real
 * `[CONCIERGE_PROPOSE]` block, and the probe result comes out of the real
 * `bindMcpPrepublicationProbeTruth` in mcpSessionTruthGate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConciergeConfirmParams, ConciergeConfirmResult } from '@/common/chat/conciergeConfig';
import type { IMcpServer } from '@/common/config/storage';
import type { McpConnectionTestResult } from '@process/services/mcpServices/McpProtocol';

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
import { bindMcpPrepublicationProbeTruth } from '@process/services/mcpServices/mcpSessionTruthGate';

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

/** A stub stdio MCP server that answers `initialize` and advertises two tools. */
function probeAnswered(server: IMcpServer): McpConnectionTestResult {
  return bindMcpPrepublicationProbeTruth(server, {
    success: true,
    tools: [
      { name: 'chart_get_state', description: 'read the chart' },
      { name: 'quote_get', description: 'read a quote' },
    ],
  });
}

/** The same production authoring path for a server that never answered. */
function probeSilent(server: IMcpServer): McpConnectionTestResult {
  return bindMcpPrepublicationProbeTruth(server, {
    success: false,
    error: 'spawn ["bunx","--bun","@ferroxlabs/tvcontrol@2.3.1"] code=-32000',
  });
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
  it('enables the server and reports the tool count when the probe answers', async () => {
    storeDetectedProposal();
    probeSpy.mockImplementation(async (server: IMcpServer) => probeAnswered(server));

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    expect(result.ok).toBe(true);
    expect(probeSpy).toHaveBeenCalledTimes(1);
    expect(state.mcpServers).toHaveLength(1);
    expect(state.mcpServers[0]).toMatchObject({ name: 'tvcontrol', enabled: true, status: 'connected' });
    expect(state.mcpServers[0].tools?.map((tool) => tool.name)).toEqual(['chart_get_state', 'quote_get']);
    // The receipt may only say what the host checked: it checked two tools.
    expect(String((result as { summary?: string }).summary)).toContain('2 tools');
  });

  it('leaves the server disabled and SAYS SO when the probe never answers', async () => {
    storeDetectedProposal();
    probeSpy.mockImplementation(async (server: IMcpServer) => probeSilent(server));

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    expect(result.ok).toBe(true);
    expect(state.mcpServers).toHaveLength(1);
    expect(state.mcpServers[0]).toMatchObject({ name: 'tvcontrol', enabled: false });
    expect(state.mcpServers[0].lastError).toBeTruthy();
    // Never publish a connector that did not answer.
    expect(syncSpy).not.toHaveBeenCalled();
    expect(String((result as { summary?: string }).summary)).toContain('did not answer');
  });
});
