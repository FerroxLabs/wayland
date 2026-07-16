/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type McpSessionReceipt =
  | {
      status: 'ready';
      serverName: string;
      tools: string[];
      observedAt: number;
      source: 'wcore';
    }
  | {
      status: 'failed';
      serverName: string;
      reason: string;
      observedAt: number;
      source: 'wcore' | 'desktop';
    };

export type McpSessionState = {
  /** Unique to one Desktop-managed runtime launch. Old receipts never carry over. */
  generation: string;
  expectedServerNames: string[];
  receipts: Record<string, McpSessionReceipt>;
  startedAt: number;
};

export type McpSessionTerminalEvent =
  | { type: 'mcp_ready'; data: { name: string; tools?: unknown } }
  | { type: 'mcp_failed'; data: { name: string; reason?: unknown } };

export function createMcpSessionState(
  generation: string,
  expectedServerNames: readonly string[],
  startedAt: number = Date.now()
): McpSessionState {
  return {
    generation,
    expectedServerNames: [...new Set(expectedServerNames)].sort(),
    receipts: {},
    startedAt,
  };
}

/** Fold a named Core terminal event into the current launch. */
export function reduceMcpSessionTerminal(
  state: McpSessionState,
  event: McpSessionTerminalEvent,
  observedAt: number = Date.now()
): McpSessionState {
  const name = event.data?.name;
  if (typeof name !== 'string' || !name.trim()) return state;
  // A receipt can only prove a connector Desktop declared for this exact
  // launch generation. Ignore unsolicited names so stale or cross-session
  // events cannot manufacture readiness in the composer.
  if (!state.expectedServerNames.includes(name)) return state;

  const receipt: McpSessionReceipt =
    event.type === 'mcp_ready'
      ? {
          status: 'ready',
          serverName: name,
          tools: Array.isArray(event.data.tools)
            ? event.data.tools.filter((tool): tool is string => typeof tool === 'string')
            : [],
          observedAt,
          source: 'wcore',
        }
      : {
          status: 'failed',
          serverName: name,
          reason: typeof event.data.reason === 'string' ? event.data.reason : 'MCP server failed to load',
          observedAt,
          source: 'wcore',
        };

  return { ...state, receipts: { ...state.receipts, [name]: receipt } };
}

export function recordDesktopMcpSessionFailure(
  state: McpSessionState,
  serverName: string,
  reason: string,
  observedAt: number = Date.now()
): McpSessionState {
  if (!serverName.trim()) return state;
  return {
    ...state,
    receipts: {
      ...state.receipts,
      [serverName]: { status: 'failed', serverName, reason, observedAt, source: 'desktop' },
    },
  };
}
