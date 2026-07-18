/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';

export type McpSessionBackend = 'wcore' | 'acp' | 'gemini' | 'codex-native';
export type McpSessionDefinitionDigest = `hmac-sha256:${string}`;
export type McpSessionProducer = Exclude<McpSessionBackend, never>;

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
      source: McpSessionProducer;
    })
  | (McpSessionReceiptBinding & {
      status: 'degraded' | 'failed';
      tools: string[];
      reason: string;
      source: McpSessionProducer | 'desktop';
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

/**
 * Evidence emitted by the runtime that actually owns a session's tool registry.
 * Every correlation field is mandatory: a name-only or config-only event can
 * never manufacture callability for another launch.
 */
export type McpSessionProducerEvent =
  | {
      type: 'mcp_tools_registered';
      data: {
        generation: string;
        conversationId: string;
        backend: McpSessionBackend;
        runtimeName: string;
        definitionDigest: McpSessionDefinitionDigest;
        tools?: unknown;
      };
    }
  | {
      type: 'mcp_registration_failed';
      data: {
        generation: string;
        conversationId: string;
        backend: McpSessionBackend;
        runtimeName: string;
        definitionDigest: McpSessionDefinitionDigest;
        reason?: unknown;
      };
    };

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

function canonicalTools(tools: unknown): string[] {
  return Array.isArray(tools)
    ? [
        ...new Set(
          tools
            .filter((tool): tool is string => typeof tool === 'string')
            .map((tool) => tool.trim())
            .filter(Boolean)
        ),
      ].toSorted()
    : [];
}

/** Fold exact producer-owned tool-registry evidence into the current launch. */
export function reduceMcpSessionProducerEvent(
  state: McpSessionState,
  event: McpSessionProducerEvent,
  observedAt: number = Date.now()
): McpSessionState {
  const { data } = event;
  if (
    data.generation !== state.generation ||
    data.conversationId !== state.conversationId ||
    data.backend !== state.backend ||
    !Number.isFinite(observedAt) ||
    observedAt < state.startedAt
  ) {
    return state;
  }
  const expected = findExactExpectedServer(state, data.runtimeName);
  if (!expected || expected.definitionDigest !== data.definitionDigest) return state;
  const prior = state.receipts[expected.definitionDigest];
  if (
    prior?.status !== 'published_unverified' &&
    !(
      (prior?.status === 'registered' || prior?.status === 'degraded' || prior?.status === 'failed') &&
      prior.source === state.backend
    )
  ) {
    return state;
  }

  let receipt: McpSessionReceipt;
  if (event.type === 'mcp_registration_failed') {
    const reason = event.data.reason;
    receipt = {
      ...bindReceipt(state, expected, observedAt),
      status: 'failed',
      tools: [],
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'MCP registration failed',
      source: state.backend,
    };
  } else {
    const tools = canonicalTools(event.data.tools);
    const mergedTools = prior?.status === 'registered' ? canonicalTools([...prior.tools, ...tools]) : tools;
    receipt =
      mergedTools.length > 0
        ? {
            ...bindReceipt(state, expected, observedAt),
            status: 'registered',
            tools: mergedTools,
            source: state.backend,
          }
        : {
            ...bindReceipt(state, expected, observedAt),
            status: 'degraded',
            tools: [],
            reason:
              state.backend === 'wcore'
                ? 'Core loaded the connector but registered no tools'
                : `${state.backend} registered no callable tools`,
            source: state.backend,
          };
  }
  return { ...state, receipts: { ...state.receipts, [expected.definitionDigest]: receipt } };
}

/**
 * Adapt a backend-native MCP invocation name (`mcp__server__tool`) into exact
 * producer evidence. Human titles and ambiguous aliases are deliberately
 * ignored; observing a model mention is not registry authority.
 */
export function reduceMcpSessionToolInvocation(
  state: McpSessionState,
  nativeToolName: unknown,
  observedAt: number = Date.now()
): McpSessionState {
  if (typeof nativeToolName !== 'string' || !nativeToolName.startsWith('mcp__')) return state;
  const matches = state.expectedServers
    .map((expected) => ({ expected, prefix: `mcp__${expected.runtimeName}__` }))
    .filter(({ prefix }) => nativeToolName.startsWith(prefix) && nativeToolName.length > prefix.length);
  if (matches.length !== 1) return state;
  const { expected, prefix } = matches[0];
  const tool = nativeToolName.slice(prefix.length);
  if (!tool || tool.trim() !== tool || tool.includes('__')) return state;
  return reduceMcpSessionProducerEvent(
    state,
    {
      type: 'mcp_tools_registered',
      data: {
        generation: state.generation,
        conversationId: state.conversationId,
        backend: state.backend,
        runtimeName: expected.runtimeName,
        definitionDigest: expected.definitionDigest,
        tools: [tool],
      },
    },
    observedAt
  );
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

  return reduceMcpSessionProducerEvent(
    state,
    event.type === 'mcp_failed'
      ? {
          type: 'mcp_registration_failed',
          data: {
            generation: state.generation,
            conversationId: state.conversationId,
            backend: 'wcore',
            runtimeName: expected.runtimeName,
            definitionDigest: expected.definitionDigest,
            reason: event.data.reason,
          },
        }
      : {
          type: 'mcp_tools_registered',
          data: {
            generation: state.generation,
            conversationId: state.conversationId,
            backend: 'wcore',
            runtimeName: expected.runtimeName,
            definitionDigest: expected.definitionDigest,
            tools: event.data.tools,
          },
        },
    observedAt
  );
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
    ((receipt.status === 'registered' || receipt.status === 'degraded') && receipt.source === state.backend) ||
    (receipt.status === 'failed' &&
      (receipt.source === 'desktop' || receipt.source === state.backend));
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
