/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// MCP-01 production-truth journey. Traverses the real ACP publication seam
// (McpConfig.projectStorageConfig -> current-session receipts) and the
// receipt-bound ToolSearch candidate gate (getCandidateTools) end to end,
// proving the known customer contradiction: a connector the Library shows as
// connected and the user selected for this chat is NOT callable until THIS
// launch's producer registers its tools — and a transport-omitted, revoked, or
// cross-session declaration is withheld outright.

import { describe, it, expect } from 'vitest';

import { McpConfig } from '@process/acp/session/McpConfig';
import { mergeRuntimeMcpServers } from '@process/services/mcpServices/runtimeMcpServers';
import { createMcpSessionDigestKey } from '@process/services/mcpServices/mcpSessionTruthGate';
import { getCandidateTools } from '@process/services/mcpServices/getCandidateTools';
import {
  reduceMcpSessionProducerEvent,
  getMcpSessionReceiptForServer,
  type McpSessionState,
} from '@/common/mcp/sessionReceipt';
import type { IMcpServer } from '@/common/config/storage';

function stdioServer(id: string, name: string, extra: Partial<IMcpServer> = {}): IMcpServer {
  return {
    id,
    name,
    source: 'custom',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'node', args: [`${name}.js`] },
    tools: [],
    createdAt: 1,
    updatedAt: 1,
    ...extra,
  } as IMcpServer;
}

/** Fold the exact producer registration a live backend would emit for a server. */
function registerTools(state: McpSessionState, runtimeName: string, tools: string[]): McpSessionState {
  const expected = state.expectedServers.find((e) => e.runtimeName === runtimeName);
  if (!expected) throw new Error(`no expected server for ${runtimeName}`);
  return reduceMcpSessionProducerEvent(state, {
    type: 'mcp_tools_registered',
    data: {
      generation: state.generation,
      conversationId: state.conversationId,
      backend: state.backend,
      runtimeName,
      definitionDigest: expected.definitionDigest,
      tools,
    },
  });
}

describe('MCP-01 production-truth journey (publication seam -> candidate gate)', () => {
  it('withholds a selected+published connector until this launch registers its tools', () => {
    const tavily = stdioServer('tavily-id', 'tavily');
    const projection = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([tavily], []), {
      publication: {
        generation: 'launch-journey-1',
        conversationId: 'chat-journey-1',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: true },
      activeServerIds: [tavily.id],
    });

    // The connector reached the backend (published) but the producer has not yet
    // registered any tools. This is exactly the customer contradiction: a green
    // Library row / selected connector, but nothing callable in the chat.
    expect(getMcpSessionReceiptForServer(projection.sessionState, tavily)?.status).toBe('published_unverified');
    expect(getCandidateTools(projection.sessionState, projection.selectedServers)).toEqual([]);

    // Only the current launch's producer registration mints callable tools.
    const registered = registerTools(projection.sessionState, 'tavily', ['tavily_search', 'tavily_extract']);
    expect(getCandidateTools(registered, projection.selectedServers)).toEqual([
      { serverId: 'tavily-id', name: 'tavily_extract', description: '' },
      { serverId: 'tavily-id', name: 'tavily_search', description: '' },
    ]);
  });

  it('honors per-server allowedTools scoping over the registered inventory', () => {
    const firecrawl = stdioServer('firecrawl-id', 'firecrawl', { allowedTools: ['firecrawl_scrape'] });
    const projection = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([firecrawl], []), {
      publication: {
        generation: 'launch-journey-2',
        conversationId: 'chat-journey-2',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: true },
      activeServerIds: [firecrawl.id],
    });
    const registered = registerTools(projection.sessionState, 'firecrawl', [
      'firecrawl_scrape',
      'firecrawl_crawl',
      'firecrawl_map',
    ]);
    expect(getCandidateTools(registered, projection.selectedServers).map((t) => t.name)).toEqual(['firecrawl_scrape']);
  });

  it('withholds a transport-omitted connector even alongside a registered one', () => {
    const n8n = stdioServer('n8n-id', 'n8n');
    // A remote-only connector the negotiated ACP contract cannot carry (no SSE).
    const beeper = stdioServer('beeper-id', 'beeper', {
      transport: { type: 'sse', url: 'https://beeper.example/mcp' } as never,
    });
    const projection = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([n8n, beeper], []), {
      publication: {
        generation: 'launch-journey-3',
        conversationId: 'chat-journey-3',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: false },
      activeServerIds: [n8n.id, beeper.id],
    });

    // Beeper was omitted (fail-closed desktop failure), n8n published.
    expect(getMcpSessionReceiptForServer(projection.sessionState, beeper)?.status).toBe('failed');
    const registered = registerTools(projection.sessionState, 'n8n', ['n8n_run_workflow']);
    const candidates = getCandidateTools(registered, projection.selectedServers);
    expect(candidates.map((t) => `${t.serverId}:${t.name}`)).toEqual(['n8n-id:n8n_run_workflow']);
  });

  it('withholds a revoked connector after a later mid-session failure supersedes registration', () => {
    const tavily = stdioServer('tavily-id', 'tavily');
    const projection = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([tavily], []), {
      publication: {
        generation: 'launch-journey-4',
        conversationId: 'chat-journey-4',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: true },
      activeServerIds: [tavily.id],
    });
    const registered = registerTools(projection.sessionState, 'tavily', ['tavily_search']);
    expect(getCandidateTools(registered, projection.selectedServers).length).toBe(1);
    const revoked = reduceMcpSessionProducerEvent(registered, {
      type: 'mcp_registration_failed',
      data: {
        generation: registered.generation,
        conversationId: registered.conversationId,
        backend: registered.backend,
        runtimeName: 'tavily',
        definitionDigest: registered.expectedServers[0].definitionDigest,
        reason: 'connector crashed mid-session',
      },
    });
    expect(getCandidateTools(revoked, projection.selectedServers)).toEqual([]);
  });

  it('fails closed for a cross-session declaration: last launch registrations never carry into a new launch', () => {
    const tavily = stdioServer('tavily-id', 'tavily');
    const first = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([tavily], []), {
      publication: {
        generation: 'launch-journey-5a',
        conversationId: 'chat-journey-5',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: true },
      activeServerIds: [tavily.id],
    });
    registerTools(first.sessionState, 'tavily', ['tavily_search']);

    // A brand-new launch of the same chat: a fresh generation, still only
    // published. The prior launch's registration is not inherited.
    const second = McpConfig.projectStorageConfig(mergeRuntimeMcpServers([tavily], []), {
      publication: {
        generation: 'launch-journey-5b',
        conversationId: 'chat-journey-5',
        backend: 'acp',
        sessionKey: createMcpSessionDigestKey(),
      },
      capabilities: { stdio: true, http: true, sse: true },
      activeServerIds: [tavily.id],
    });
    expect(getCandidateTools(second.sessionState, second.selectedServers)).toEqual([]);
  });
});
