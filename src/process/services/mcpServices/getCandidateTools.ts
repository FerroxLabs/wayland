/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import type { CandidateTool } from '../tools/toolContract';

/**
 * Build the candidate tool pool for Lane 3 (#344) to rank + cap (#348).
 *
 * For every ENABLED + CONNECTED server, emit each of its tools (from the
 * persisted `tools[]` populated by McpProtocol.listTools on connect) that the
 * user hasn't disabled via `allowedTools`. `allowedTools === undefined` means
 * all of that server's tools are enabled (default); `[]` means none.
 *
 * Pure and synchronous by design: the caller (the ACP session builder, which
 * already holds the loaded server list at session start) passes `servers` in.
 * The contract's no-arg `GetCandidateTools` type is the consumer-facing view —
 * the persisted server source (ProcessConfig.get) is async, so a no-arg sync
 * reader isn't possible; Lane 3 binds this over its already-loaded servers.
 * See the note posted to #348.
 */
export function getCandidateTools(servers: IMcpServer[]): CandidateTool[] {
  const candidates: CandidateTool[] = [];
  for (const server of servers) {
    // Only servers that are installed (enabled) AND have a live connection can
    // contribute tools the engine can actually call.
    if (!server.enabled || server.status !== 'connected') continue;
    const allowed = server.allowedTools; // undefined => all enabled
    for (const tool of server.tools ?? []) {
      if (allowed !== undefined && !allowed.includes(tool.name)) continue;
      candidates.push({
        serverId: server.id,
        name: tool.name,
        description: tool.description ?? '',
      });
    }
  }
  return candidates;
}
