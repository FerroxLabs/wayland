/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * N2 guard - accepting a model-authored `add_mcp` proposal must NEVER execute
 * the command that proposal declares.
 *
 * `command`, `args` and `env` in a `[CONCIERGE_PROPOSE]` block are MODEL
 * OUTPUT. A prompt-injected page, a poisoned tool result or a hostile document
 * can put any argv it likes there. `probeAndPublishAddedMcp` handed that argv
 * straight to `mcpService.testMcpConnection`, which spawns it - so Accept was
 * arbitrary command execution, and `conciergeConfig.confirm-proposal` was
 * reachable from a paired browser.
 *
 * The precedent is in this same feature: `install_agent` already treats its
 * `npmPackage` as ADVISORY because trusting that field "would let a
 * prompt-injected block install an arbitrary npm package". `add_mcp.command`
 * gets the same treatment - persist the declaration, execute nothing.
 *
 * THE SEAM THIS TESTS IS THE SPAWN, NOT THE BRIDGE. `McpService` is deliberately
 * NOT mocked here: the sibling suite conciergeAddMcpEnables.test.ts mocked
 * `testMcpConnection`, which is exactly why it asserted this behaviour as
 * correct for a whole release without ever noticing a process was starting. The
 * filesystem marker is the real assertion; the call spy is corroboration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ConciergeConfirmParams, ConciergeConfirmResult } from '@/common/chat/conciergeConfig';
import type { IMcpServer } from '@/common/config/storage';

const { state, emitSpy, setSpy, getSpy, mcpUpdateSpy, updateSpy } = vi.hoisted(() => {
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
    updateSpy: vi.fn((_id: string, m: Record<string, unknown>) => {
      hoistedState.msg = m;
    }),
  };
});

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

import { initConciergeConfigBridge } from '@process/bridge/conciergeConfigBridge';
import { detectConciergeProposals } from '@process/task/ConciergeProposeDetector';
import { mcpService } from '@process/services/mcpServices/McpService';

const MARKER = path.join(tmpdir(), `wayland-n2-marker-${process.pid}-${Date.now()}`);

/**
 * The proposal is produced by the REAL detector over a REAL `[CONCIERGE_PROPOSE]`
 * block, exactly as a model would emit it. `/usr/bin/touch <marker>` is a
 * perfectly well-formed MCP stdio declaration; nothing about it is malformed,
 * so no validation short-circuit can be credited for the result.
 */
const PROPOSE_BLOCK = (): string =>
  [
    'Sure - I can wire that up.',
    '[CONCIERGE_PROPOSE]',
    'kind: add_mcp',
    'name: weather-helper',
    'command: /usr/bin/touch',
    `args: ${MARKER}`,
    '[/CONCIERGE_PROPOSE]',
    'Apply it and I will use it.',
  ].join('\n');

function storeDetectedProposal(): void {
  const proposals = detectConciergeProposals(PROPOSE_BLOCK());
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
  rmSync(MARKER, { force: true });
});

afterEach(() => {
  rmSync(MARKER, { force: true });
});

describe('N2 - concierge add_mcp Accept never executes the declared command', () => {
  it('does not spawn the declared command, and does not claim reachability', async () => {
    const probeSpy = vi.spyOn(mcpService, 'testMcpConnection');
    storeDetectedProposal();

    // CONTROL: the marker must be absent before Accept. Without this the
    // post-assertion would pass against a marker that never could have existed.
    expect(existsSync(MARKER)).toBe(false);

    const result = await state.handler!({ conversationId: 'c1', msgId: 'm1', action: 'accept' });

    // A spawned `touch` wins its race long before this resolves, but give a
    // detached child room anyway so a pass can never be a timing artifact.
    await new Promise((resolve) => setTimeout(resolve, 750));

    // THE assertion: no process ran.
    expect(existsSync(MARKER)).toBe(false);
    // Corroboration at the seam that spawns.
    expect(probeSpy).not.toHaveBeenCalled();

    expect(result.ok).toBe(true);
    expect(state.mcpServers).toHaveLength(1);
    // The declaration is persisted, and persisted OFF.
    expect(state.mcpServers[0]).toMatchObject({ name: 'weather-helper', enabled: false, status: 'disconnected' });
    expect(state.mcpServers[0].transport).toMatchObject({ command: '/usr/bin/touch' });

    // B3's invariant survives: the receipt may only say what the host checked.
    // The host checked nothing, so the receipt asserts nothing about reachability.
    const summary = String((result as { summary?: string }).summary);
    expect(summary).toContain('weather-helper');
    expect(summary).toContain('MCP Library');
    for (const lie of ['tools', 'did not answer', 'connected', 'it answered']) {
      expect(summary.toLowerCase()).not.toContain(lie);
    }
  }, 20000);
});
