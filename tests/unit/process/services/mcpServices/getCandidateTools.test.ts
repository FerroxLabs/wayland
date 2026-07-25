/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// MCP-01: getCandidateTools is the receipt-bound ToolSearch candidate gate. A
// tool is callable ONLY when the current launch's correlated publication receipt
// proves it registered with a non-empty inventory. These tests pin that every
// saved/probed/published-only/degraded/failed/stale/revoked/mismatched state
// fails closed, and that allowedTools still scopes a registered pool.

import { describe, it, expect } from 'vitest';

import { getCandidateTools } from '@process/services/mcpServices/getCandidateTools';
import {
  createMcpSessionState,
  recordDesktopMcpSessionFailure,
  recordDesktopMcpSessionPublication,
  reduceMcpSessionProducerEvent,
  type McpSessionState,
} from '@/common/mcp/sessionReceipt';
import {
  createMcpSessionDigestKey,
  createMcpSessionExpectedServer,
} from '@process/services/mcpServices/mcpSessionTruthGate';
import type { IMcpServer } from '@/common/config/storage';

const KEY = createMcpSessionDigestKey();
const GENERATION = 'launch-1';
const CONVERSATION = 'chat-1';

function server(overrides: Partial<IMcpServer>): IMcpServer {
  return {
    id: 's1',
    name: 'svc',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'x', args: [] },
    tools: [{ name: 'a' }, { name: 'b', description: 'B' }],
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  } as IMcpServer;
}

type Stage = 'registered' | 'published' | 'configured' | 'degraded' | 'failed';

/** Build a session state where each server's receipt is at the requested stage. */
function sessionFor(
  servers: IMcpServer[],
  register: (name: string) => Stage,
  registeredTools: (name: string) => string[] = (name) => (name === 'svc' ? ['a', 'b'] : ['a'])
): McpSessionState {
  const expected = servers.map((s) => createMcpSessionExpectedServer(s, 'wcore', KEY));
  let state = createMcpSessionState(GENERATION, expected, {
    conversationId: CONVERSATION,
    backend: 'wcore',
  });
  for (const s of servers) {
    const stage = register(s.name);
    if (stage === 'configured') continue;
    state = recordDesktopMcpSessionPublication(state, s.name);
    if (stage === 'published') continue;
    if (stage === 'failed') {
      state = recordDesktopMcpSessionFailure(state, s.name, 'connector unavailable');
      continue;
    }
    const digest = expected.find((e) => e.runtimeName === s.name)!.definitionDigest;
    state = reduceMcpSessionProducerEvent(state, {
      type: 'mcp_tools_registered',
      data: {
        generation: GENERATION,
        conversationId: CONVERSATION,
        backend: 'wcore',
        runtimeName: s.name,
        definitionDigest: digest,
        tools: stage === 'degraded' ? [] : registeredTools(s.name),
      },
    });
  }
  return state;
}

describe('getCandidateTools receipt-bound gate (MCP-01)', () => {
  it('withholds everything when there is no current session state', () => {
    expect(getCandidateTools(undefined, [server({})])).toEqual([]);
  });

  it('emits a registered server tools, with descriptions from the saved server', () => {
    const s = server({});
    const state = sessionFor([s], () => 'registered');
    const out = getCandidateTools(state, [s]);
    expect(out).toEqual([
      { serverId: 's1', name: 'a', description: '' },
      { serverId: 's1', name: 'b', description: 'B' },
    ]);
  });

  it('is authoritative on the receipt inventory: a registered tool absent from the saved list still appears (empty description)', () => {
    const s = server({ tools: [{ name: 'a', description: 'A' }] });
    const state = sessionFor([s], () => 'registered', () => ['a', 'z']);
    const out = getCandidateTools(state, [s]);
    expect(out).toEqual([
      { serverId: 's1', name: 'a', description: 'A' },
      { serverId: 's1', name: 'z', description: '' },
    ]);
  });

  it('scopes a registered pool by allowedTools (subset)', () => {
    const s = server({ allowedTools: ['b'] });
    const state = sessionFor([s], () => 'registered');
    expect(getCandidateTools(state, [s]).map((t) => t.name)).toEqual(['b']);
  });

  it('emits nothing for a registered server with allowedTools: [] (user disabled all)', () => {
    const s = server({ allowedTools: [] });
    const state = sessionFor([s], () => 'registered');
    expect(getCandidateTools(state, [s])).toEqual([]);
  });

  it('withholds a configured-but-never-published server', () => {
    const s = server({});
    const state = sessionFor([s], () => 'configured');
    expect(getCandidateTools(state, [s])).toEqual([]);
  });

  it('withholds a published-but-unregistered server (no producer tool receipt yet)', () => {
    const s = server({});
    const state = sessionFor([s], () => 'published');
    expect(getCandidateTools(state, [s])).toEqual([]);
  });

  it('withholds a degraded server (registered with no callable tools)', () => {
    const s = server({});
    const state = sessionFor([s], () => 'degraded');
    expect(getCandidateTools(state, [s])).toEqual([]);
  });

  it('withholds a failed server', () => {
    const s = server({});
    const state = sessionFor([s], () => 'failed');
    expect(getCandidateTools(state, [s])).toEqual([]);
  });

  it('withholds a saved-disabled server even when a receipt exists', () => {
    const s = server({});
    const state = sessionFor([s], () => 'registered');
    // Query with the same server flipped to disabled: saved-disabled is never callable.
    expect(getCandidateTools(state, [server({ enabled: false })])).toEqual([]);
  });

  it('withholds when the queried server identity does not correlate the receipt (mismatched id)', () => {
    const s = server({});
    const state = sessionFor([s], () => 'registered');
    expect(getCandidateTools(state, [server({ id: 'other' })])).toEqual([]);
  });

  it('withholds when the queried server transport does not match the receipt', () => {
    const s = server({});
    const state = sessionFor([s], () => 'registered');
    expect(
      getCandidateTools(state, [server({ transport: { type: 'streamable_http', url: 'https://x' } as never })])
    ).toEqual([]);
  });

  it('withholds a stale/cross-session receipt (generation no longer identifies this launch)', () => {
    const s = server({});
    const registered = sessionFor([s], () => 'registered');
    // A different current launch: same expected servers, different generation.
    const currentLaunch = createMcpSessionState('launch-2', registered.expectedServers, {
      conversationId: CONVERSATION,
      backend: 'wcore',
    });
    // The stale registered receipts belong to launch-1, but the current state is
    // launch-2 (configured only) — nothing is callable.
    expect(getCandidateTools(currentLaunch, [s])).toEqual([]);
  });

  it('withholds after a later revocation replaces a registered receipt with failure', () => {
    const s = server({});
    let state = sessionFor([s], () => 'registered');
    expect(getCandidateTools(state, [s]).length).toBe(2);
    state = recordDesktopMcpSessionFailure(state, s.name, 'revoked mid-session');
    expect(getCandidateTools(state, [s])).toEqual([]);
  });

  it('tags each candidate with its owning serverId across multiple registered servers', () => {
    const s1 = server({ id: 's1', name: 'one', tools: [{ name: 'a' }] });
    const s2 = server({ id: 's2', name: 'two', tools: [{ name: 'c', description: 'C' }] });
    const state = sessionFor([s1, s2], () => 'registered', (name) => (name === 'one' ? ['a'] : ['c']));
    expect(getCandidateTools(state, [s1, s2])).toEqual([
      { serverId: 's1', name: 'a', description: '' },
      { serverId: 's2', name: 'c', description: 'C' },
    ]);
  });
});
