/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';

export type McpSessionBackend = 'wcore' | 'acp' | 'gemini' | 'codex-native';
export type McpSessionDefinitionDigest = `hmac-sha256:${string}`;

export type McpSessionExpectedServer = {
  /** Stable Desktop storage identity. */
  serverId: string;
  /** User-facing declaration name. */
  serverName: string;
  /** Exact name published to this backend. */
  runtimeName: string;
  /** Cross-adapter collision key; never sufficient by itself to prove readiness. */
  canonicalName: string;
  /** Secret-safe digest of the exact definition supplied to the backend. */
  definitionDigest: McpSessionDefinitionDigest;
  backend: McpSessionBackend;
  transport: IMcpServer['transport']['type'];
  scope: 'conversation';
};

type McpSessionReceiptBinding = McpSessionExpectedServer & {
  generation: string;
  conversationId: string;
  observedAt: number;
};

export type McpSessionReceipt =
  | (McpSessionReceiptBinding & {
      status: 'configured';
      tools: [];
      source: 'desktop';
    })
  | (McpSessionReceiptBinding & {
      status: 'published_unverified';
      tools: [];
      source: 'desktop';
    })
  | (McpSessionReceiptBinding & {
      status: 'registered';
      tools: string[];
      source: 'wcore';
    })
  | (McpSessionReceiptBinding & {
      status: 'degraded' | 'failed';
      tools: string[];
      reason: string;
      source: 'wcore' | 'desktop';
    });

export type McpSessionState = {
  /** Unique to one Desktop-managed runtime launch. Old receipts never carry over. */
  generation: string;
  conversationId: string;
  backend: McpSessionBackend;
  expectedServers: McpSessionExpectedServer[];
  /** Compatibility/display index only. Receipt correlation uses expectedServers. */
  expectedServerNames: string[];
  /** Keyed by definitionDigest, not a mutable or adapter-rewritten name. */
  receipts: Record<string, McpSessionReceipt>;
  startedAt: number;
};

export type McpSessionTerminalEvent =
  | { type: 'mcp_ready'; data: { name: string; tools?: unknown } }
  | { type: 'mcp_failed'; data: { name: string; reason?: unknown } };

function bindReceipt(
  state: McpSessionState,
  expected: McpSessionExpectedServer,
  observedAt: number
): McpSessionReceiptBinding {
  return {
    ...expected,
    generation: state.generation,
    conversationId: state.conversationId,
    observedAt,
  };
}

function findExactExpectedServer(
  state: McpSessionState,
  runtimeName: string
): McpSessionExpectedServer | undefined {
  const matches = state.expectedServers.filter((server) => server.runtimeName === runtimeName);
  return matches.length === 1 ? matches[0] : undefined;
}

export function createMcpSessionState(
  generation: string,
  expectedServers: readonly McpSessionExpectedServer[],
  context: { conversationId: string; backend: McpSessionBackend },
  startedAt: number = Date.now()
): McpSessionState {
  const expected = [...expectedServers].toSorted((left, right) =>
    left.definitionDigest.localeCompare(right.definitionDigest)
  );
  const state: McpSessionState = {
    generation,
    conversationId: context.conversationId,
    backend: context.backend,
    expectedServers: expected,
    expectedServerNames: expected.map((server) => server.runtimeName).toSorted(),
    receipts: {},
    startedAt,
  };
  for (const server of expected) {
    state.receipts[server.definitionDigest] = {
      ...bindReceipt(state, server, startedAt),
      status: 'configured',
      tools: [],
      source: 'desktop',
    };
  }
  return state;
}

/** Record config publication without manufacturing registration or callability. */
export function recordDesktopMcpSessionPublication(
  state: McpSessionState,
  runtimeName: string,
  observedAt: number = Date.now()
): McpSessionState {
  const expected = findExactExpectedServer(state, runtimeName);
  if (!expected) return state;
  return {
    ...state,
    receipts: {
      ...state.receipts,
      [expected.definitionDigest]: {
        ...bindReceipt(state, expected, observedAt),
        status: 'published_unverified',
        tools: [],
        source: 'desktop',
      },
    },
  };
}

/**
 * Fold a named Core terminal event into the current launch.
 *
 * Core v1 proves registration (name + tools) only. It does not prove a named
 * invocation, so the strongest state produced here is `registered`. ACP and
 * native adapters cannot reuse this reducer to mint readiness because their
 * backend does not own the Core producer contract.
 */
export function reduceMcpSessionTerminal(
  state: McpSessionState,
  event: McpSessionTerminalEvent,
  observedAt: number = Date.now()
): McpSessionState {
  if (state.backend !== 'wcore') return state;
  const name = event.data?.name;
  if (typeof name !== 'string' || !name.trim()) return state;
  const expected = findExactExpectedServer(state, name);
  if (!expected) return state;

  // A backend event cannot skip Desktop's publication boundary. This rejects
  // stale/cross-session events and events for a declaration that never reached
  // the exact launch definition.
  const prior = state.receipts[expected.definitionDigest];
  if (prior?.status !== 'published_unverified') return state;

  let receipt: McpSessionReceipt;
  if (event.type === 'mcp_failed') {
    receipt = {
      ...bindReceipt(state, expected, observedAt),
      status: 'failed',
      tools: [],
      reason: typeof event.data.reason === 'string' ? event.data.reason : 'MCP server failed to load',
      source: 'wcore',
    };
  } else {
    const tools = Array.isArray(event.data.tools)
      ? [
          ...new Set(
            event.data.tools
              .filter((tool): tool is string => typeof tool === 'string')
              .map((tool) => tool.trim())
              .filter(Boolean)
          ),
        ].toSorted()
      : [];
    receipt =
      tools.length > 0
        ? {
            ...bindReceipt(state, expected, observedAt),
            status: 'registered',
            tools,
            source: 'wcore',
          }
        : {
            ...bindReceipt(state, expected, observedAt),
            status: 'degraded',
            tools: [],
            reason: 'Core loaded the connector but registered no tools',
            source: 'wcore',
          };
  }

  return { ...state, receipts: { ...state.receipts, [expected.definitionDigest]: receipt } };
}

export function recordDesktopMcpSessionFailure(
  state: McpSessionState,
  runtimeName: string,
  reason: string,
  observedAt: number = Date.now()
): McpSessionState {
  const expected = findExactExpectedServer(state, runtimeName);
  if (!expected) return state;
  return {
    ...state,
    receipts: {
      ...state.receipts,
      [expected.definitionDigest]: {
        ...bindReceipt(state, expected, observedAt),
        status: 'failed',
        tools: [],
        reason,
        source: 'desktop',
      },
    },
  };
}

/** Return a receipt only when every session/definition binding still matches. */
export function getMcpSessionReceiptForServer(
  state: McpSessionState | undefined,
  server: Pick<IMcpServer, 'id' | 'name' | 'transport'>
): McpSessionReceipt | undefined {
  if (!state) return undefined;
  const matches = state.expectedServers.filter(
    (expected) =>
      expected.serverId === server.id &&
      expected.serverName === server.name &&
      expected.canonicalName === mcpServerCollisionKey(server.name) &&
      expected.transport === server.transport.type &&
      expected.backend === state.backend &&
      expected.scope === 'conversation'
  );
  if (matches.length !== 1) return undefined;
  const expected = matches[0];
  const receipt = state.receipts[expected.definitionDigest];
  if (!receipt) return undefined;
  const validSourceForStatus =
    ((receipt.status === 'configured' || receipt.status === 'published_unverified') &&
      receipt.source === 'desktop') ||
    ((receipt.status === 'registered' || receipt.status === 'degraded') &&
      state.backend === 'wcore' &&
      receipt.source === 'wcore') ||
    (receipt.status === 'failed' &&
      (receipt.source === 'desktop' || (state.backend === 'wcore' && receipt.source === 'wcore')));
  const receiptTools = receipt.tools as unknown[];
  const toolsAreCanonical =
    Array.isArray(receiptTools) &&
    receiptTools.every(
      (tool): tool is string => typeof tool === 'string' && tool.length > 0 && tool === tool.trim()
    ) &&
    new Set(receiptTools).size === receiptTools.length;
  const validToolsForStatus =
    toolsAreCanonical && (receipt.status === 'registered' ? receiptTools.length > 0 : receiptTools.length === 0);
  if (
    !validSourceForStatus ||
    !validToolsForStatus ||
    receipt.definitionDigest !== expected.definitionDigest ||
    receipt.generation !== state.generation ||
    receipt.conversationId !== state.conversationId ||
    receipt.backend !== state.backend ||
    receipt.serverName !== expected.serverName ||
    receipt.runtimeName !== expected.runtimeName ||
    receipt.serverId !== expected.serverId ||
    receipt.canonicalName !== expected.canonicalName ||
    receipt.transport !== expected.transport ||
    receipt.scope !== 'conversation' ||
    !Number.isFinite(receipt.observedAt) ||
    receipt.observedAt < state.startedAt
  ) {
    return undefined;
  }
  return receipt;
}
