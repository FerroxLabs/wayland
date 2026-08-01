/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import {
  createMcpSessionState,
  getMcpSessionReceiptForServer,
  recordDesktopMcpSessionFailure,
  recordDesktopMcpSessionPublication,
  reduceMcpSessionProducerEvent,
  reduceMcpSessionToolInvocation,
  reduceMcpSessionTerminal,
  type McpSessionBackend,
  type McpSessionDefinitionDigest,
  type McpSessionExpectedServer,
  type McpSessionState,
} from '@/common/mcp/sessionReceipt';

const server = (overrides: Partial<IMcpServer> = {}): IMcpServer => ({
  id: 'tavily-id',
  name: 'tavily',
  enabled: true,
  status: 'connected',
  transport: { type: 'http', url: 'https://mcp.tavily.com/mcp' },
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
  ...overrides,
});

const expected = (
  value: IMcpServer,
  digest: McpSessionDefinitionDigest,
  backend: McpSessionBackend = 'wcore'
): McpSessionExpectedServer => ({
  serverId: value.id,
  serverName: value.name,
  runtimeName: value.name,
  canonicalName: value.name.toLocaleLowerCase('en-US'),
  definitionDigest: digest,
  backend,
  transport: value.transport.type,
  scope: 'conversation',
});

const stateFor = (servers: McpSessionExpectedServer[], backend: McpSessionBackend = 'wcore') =>
  createMcpSessionState('launch-1', servers, { conversationId: 'chat-1', backend }, 10);

describe('MCP session receipt reducer', () => {
  it('requires publication before a Core ready event can register exact named tools', () => {
    const tavily = server();
    const firecrawl = server({ id: 'firecrawl-id', name: 'firecrawl' });
    const initial = stateFor([expected(tavily, 'hmac-sha256:aaa'), expected(firecrawl, 'hmac-sha256:bbb')]);

    const rejected = reduceMcpSessionTerminal(
      initial,
      { type: 'mcp_ready', data: { name: 'tavily', tools: ['tavily_search'] } },
      15
    );
    expect(rejected).toBe(initial);

    const published = recordDesktopMcpSessionPublication(initial, 'tavily', 18);
    const registered = reduceMcpSessionTerminal(
      published,
      { type: 'mcp_ready', data: { name: 'tavily', tools: ['tavily_search', 'tavily_extract'] } },
      20
    );
    expect(registered.receipts['hmac-sha256:aaa']).toMatchObject({
      status: 'registered',
      tools: ['tavily_extract', 'tavily_search'],
      generation: 'launch-1',
      conversationId: 'chat-1',
      backend: 'wcore',
      definitionDigest: 'hmac-sha256:aaa',
    });
    expect(registered.receipts['hmac-sha256:bbb']?.status).toBe('configured');
  });

  it('degrades a published connector when Core registers no tools', () => {
    const initial = recordDesktopMcpSessionPublication(stateFor([expected(server(), 'hmac-sha256:aaa')]), 'tavily', 15);
    const next = reduceMcpSessionTerminal(initial, { type: 'mcp_ready', data: { name: 'tavily', tools: [] } }, 20);
    expect(next.receipts['hmac-sha256:aaa']).toMatchObject({
      status: 'degraded',
      reason: 'Core loaded the connector but registered no tools',
    });
  });

  it.each(['acp', 'gemini', 'codex-native'] as const)(
    'accepts only exact %s producer evidence bound to this launch and definition',
    (backend) => {
      const digest = 'hmac-sha256:aaa' as const;
      const initial = recordDesktopMcpSessionPublication(
        stateFor([expected(server(), digest, backend)], backend),
        'tavily',
        12
      );
      const exact = {
        generation: 'launch-1',
        conversationId: 'chat-1',
        backend,
        runtimeName: 'tavily',
        definitionDigest: digest,
        tools: ['search', ' search ', 'extract'],
      };

      const registered = reduceMcpSessionProducerEvent(initial, { type: 'mcp_tools_registered', data: exact }, 20);
      expect(registered.receipts[digest]).toMatchObject({
        status: 'registered',
        source: backend,
        tools: ['extract', 'search'],
      });
      expect(getMcpSessionReceiptForServer(registered, server())?.status).toBe('registered');

      for (const hostile of [
        { ...exact, generation: 'old-launch' },
        { ...exact, conversationId: 'other-chat' },
        { ...exact, backend: 'wcore' as const },
        { ...exact, definitionDigest: 'hmac-sha256:forged' as const },
      ]) {
        expect(reduceMcpSessionProducerEvent(initial, { type: 'mcp_tools_registered', data: hostile }, 20)).toBe(
          initial
        );
      }
    }
  );

  it('keeps connected configuration unverified and makes producer omissions visible', () => {
    const digest = 'hmac-sha256:aaa' as const;
    const published = recordDesktopMcpSessionPublication(
      stateFor([expected(server(), digest, 'acp')], 'acp'),
      'tavily',
      12
    );
    expect(published.receipts[digest]?.status).toBe('published_unverified');

    const degraded = reduceMcpSessionProducerEvent(
      published,
      {
        type: 'mcp_tools_registered',
        data: {
          generation: 'launch-1',
          conversationId: 'chat-1',
          backend: 'acp',
          runtimeName: 'tavily',
          definitionDigest: digest,
          tools: [],
        },
      },
      20
    );
    expect(degraded.receipts[digest]).toMatchObject({
      status: 'degraded',
      source: 'acp',
      tools: [],
    });

    const recovered = reduceMcpSessionProducerEvent(
      degraded,
      {
        type: 'mcp_tools_registered',
        data: {
          generation: 'launch-1',
          conversationId: 'chat-1',
          backend: 'acp',
          runtimeName: 'tavily',
          definitionDigest: digest,
          tools: ['search'],
        },
      },
      25
    );
    expect(recovered.receipts[digest]).toMatchObject({ status: 'registered', tools: ['search'] });
  });

  it('accepts only an exact backend-native MCP invocation name as observed tool evidence', () => {
    const digest = 'hmac-sha256:aaa' as const;
    const published = recordDesktopMcpSessionPublication(
      stateFor([expected(server(), digest, 'codex-native')], 'codex-native'),
      'tavily',
      12
    );

    expect(reduceMcpSessionToolInvocation(published, 'Tavily search')).toBe(published);
    expect(reduceMcpSessionToolInvocation(published, 'mcp__firecrawl__search')).toBe(published);
    expect(reduceMcpSessionToolInvocation(published, 'mcp__tavily__search__forged')).toBe(published);
    expect(reduceMcpSessionToolInvocation(published, 'the model says mcp__tavily__search')).toBe(published);

    const observed = reduceMcpSessionToolInvocation(published, 'mcp__tavily__search', 20);
    expect(observed.receipts[digest]).toMatchObject({
      status: 'registered',
      source: 'codex-native',
      tools: ['search'],
    });
  });

  it('records an exact runtime failure and preserves another definition receipt', () => {
    const tavily = server();
    const firecrawl = server({ id: 'firecrawl-id', name: 'firecrawl' });
    let state = stateFor([expected(tavily, 'hmac-sha256:aaa'), expected(firecrawl, 'hmac-sha256:bbb')]);
    state = recordDesktopMcpSessionPublication(state, 'tavily');
    state = recordDesktopMcpSessionPublication(state, 'firecrawl');
    state = reduceMcpSessionTerminal(state, {
      type: 'mcp_ready',
      data: { name: 'tavily', tools: ['search'] },
    });
    const failed = reduceMcpSessionTerminal(state, {
      type: 'mcp_failed',
      data: { name: 'firecrawl', reason: 'credential rejected' },
    });

    expect(failed.receipts['hmac-sha256:aaa']?.status).toBe('registered');
    expect(failed.receipts['hmac-sha256:bbb']).toMatchObject({ status: 'failed', reason: 'credential rejected' });
  });

  it('rejects unsolicited, ambiguous, and non-Core readiness claims', () => {
    const tavily = expected(server(), 'hmac-sha256:aaa');
    const duplicate = { ...tavily, serverId: 'duplicate', definitionDigest: 'hmac-sha256:bbb' as const };
    const ambiguous = recordDesktopMcpSessionPublication(stateFor([tavily, duplicate]), 'tavily');
    const unsolicited = reduceMcpSessionTerminal(ambiguous, {
      type: 'mcp_ready',
      data: { name: 'firecrawl', tools: ['scrape'] },
    });
    const acp = stateFor([{ ...tavily, backend: 'acp' }], 'acp');
    const acpPublished = recordDesktopMcpSessionPublication(acp, 'tavily');
    const acpClaim = reduceMcpSessionTerminal(acpPublished, {
      type: 'mcp_ready',
      data: { name: 'tavily', tools: ['search'] },
    });

    expect(unsolicited).toBe(ambiguous);
    expect(ambiguous.receipts['hmac-sha256:aaa']?.status).toBe('configured');
    expect(acpClaim).toBe(acpPublished);
    expect(acpClaim.receipts['hmac-sha256:aaa']?.status).toBe('published_unverified');

    const forgedAcpRegistration = {
      ...acpPublished,
      receipts: {
        'hmac-sha256:aaa': {
          ...acpPublished.receipts['hmac-sha256:aaa'],
          status: 'registered' as const,
          tools: ['search'],
          source: 'wcore' as const,
        },
      },
    };
    expect(getMcpSessionReceiptForServer(forgedAcpRegistration, server())).toBeUndefined();
  });

  it('fails closed when Desktop cannot publish trusted startup config', () => {
    const failed = recordDesktopMcpSessionFailure(
      stateFor([expected(server({ id: 'beeper-id', name: 'beeper' }), 'hmac-sha256:aaa')]),
      'beeper',
      'config is read-only',
      30
    );
    expect(failed.receipts['hmac-sha256:aaa']).toMatchObject({
      status: 'failed',
      serverName: 'beeper',
      reason: 'config is read-only',
      observedAt: 30,
      source: 'desktop',
    });
  });

  it('returns a receipt only when identity, digest, backend, session, scope, and transport all match', () => {
    const tavily = server();
    let state = stateFor([expected(tavily, 'hmac-sha256:aaa')]);
    state = recordDesktopMcpSessionPublication(state, 'tavily');
    expect(getMcpSessionReceiptForServer(state, tavily)?.status).toBe('published_unverified');

    const tampered = {
      ...state,
      receipts: {
        ...state.receipts,
        'hmac-sha256:aaa': { ...state.receipts['hmac-sha256:aaa'], generation: 'old-launch' },
      },
    };
    expect(getMcpSessionReceiptForServer(tampered, tavily)).toBeUndefined();
    expect(
      getMcpSessionReceiptForServer(state, { ...tavily, transport: { type: 'sse', url: 'https://x' } })
    ).toBeUndefined();
  });

  it('rejects hostile persisted snapshots with mismatched identity or impossible source/status pairs', () => {
    const tavily = server();
    const digest = 'hmac-sha256:aaa' as const;
    let registered = stateFor([expected(tavily, digest)]);
    registered = recordDesktopMcpSessionPublication(registered, 'tavily');
    registered = reduceMcpSessionTerminal(registered, {
      type: 'mcp_ready',
      data: { name: 'tavily', tools: ['search'] },
    });
    const receipt = registered.receipts[digest];
    const hostileSnapshot = (receiptOverrides: Record<string, unknown>): McpSessionState =>
      ({
        ...registered,
        receipts: { ...registered.receipts, [digest]: { ...receipt, ...receiptOverrides } },
      }) as McpSessionState;

    expect(getMcpSessionReceiptForServer(hostileSnapshot({ serverName: 'firecrawl' }), tavily)).toBeUndefined();
    expect(getMcpSessionReceiptForServer(hostileSnapshot({ canonicalName: 'firecrawl' }), tavily)).toBeUndefined();
    expect(getMcpSessionReceiptForServer(hostileSnapshot({ source: 'desktop' }), tavily)).toBeUndefined();
    expect(getMcpSessionReceiptForServer(hostileSnapshot({ tools: [] }), tavily)).toBeUndefined();
    expect(getMcpSessionReceiptForServer(hostileSnapshot({ observedAt: 0 }), tavily)).toBeUndefined();
    expect(
      getMcpSessionReceiptForServer(hostileSnapshot({ status: 'configured', source: 'wcore', tools: [] }), tavily)
    ).toBeUndefined();
  });
});
