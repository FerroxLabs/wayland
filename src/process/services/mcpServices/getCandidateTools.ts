/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { getMcpSessionReceiptForServer, type McpSessionState } from '@/common/mcp/sessionReceipt';
import type { CandidateTool } from '../tools/toolContract';

/**
 * Receipt-bound ToolSearch candidate gate (#344 Lane 2 -> Lane 3, MCP-01).
 *
 * A tool becomes a callable candidate only when the CURRENT launch's correlated
 * publication receipt proves it registered. Saved `status: 'connected'`, a
 * Library probe, an enabled flag, a selected-but-unpublished declaration, a
 * stale/cross-session receipt, or a later revocation (`degraded`/`failed`) all
 * yield NOTHING: `getMcpSessionReceiptForServer` returns a receipt only when
 * every session/definition binding (server id, generation, conversation,
 * backend, definition digest, runtime name, transport, scope, observed time)
 * still matches this exact launch, and this gate then accepts only a
 * `registered` receipt carrying a non-empty tool inventory.
 *
 * The receipt's `tools` inventory is authoritative for WHICH tools exist; the
 * saved `server.tools[]` is consulted only to attach a human description to a
 * registered tool name. The per-server `allowedTools` toggle still scopes the
 * pool (`undefined` => all registered tools; `[]` => none).
 *
 * Pure and synchronous by design: the caller (each backend session builder,
 * which holds both the current `McpSessionState` and the loaded server list)
 * passes them in. Without a current session state, or for any server the
 * session did not correlate, the gate withholds the whole server.
 */
export function getCandidateTools(
  sessionState: McpSessionState | undefined,
  servers: readonly IMcpServer[]
): CandidateTool[] {
  if (!sessionState) return [];
  const candidates: CandidateTool[] = [];
  for (const server of servers) {
    // A saved-disabled connector is never a current-session candidate, even if
    // a receipt for an earlier enabled launch were somehow presented.
    if (!server.enabled) continue;
    const receipt = getMcpSessionReceiptForServer(sessionState, server);
    if (!receipt || receipt.status !== 'registered' || receipt.tools.length === 0) continue;
    const allowed = server.allowedTools; // undefined => all registered tools
    const describedBy = new Map((server.tools ?? []).map((tool) => [tool.name, tool.description ?? '']));
    for (const name of receipt.tools) {
      if (allowed !== undefined && !allowed.includes(name)) continue;
      candidates.push({
        serverId: server.id,
        name,
        description: describedBy.get(name) ?? '',
      });
    }
  }
  return candidates;
}
