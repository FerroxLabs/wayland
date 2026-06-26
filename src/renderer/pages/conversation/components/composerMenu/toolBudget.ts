/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';

/**
 * Total MCP tools currently active for a chat: every ENABLED + connected
 * server's tools, scoped by its per-server `allowedTools` (#348). A server that
 * hasn't connected yet (no `tools`) contributes 0. This is the count the user
 * weighs against the target model's tool cap — the non-lossy lever Wayland
 * leans on (Core does the automatic BM25 curation when it's exceeded).
 */
export function countEnabledMcpTools(servers: IMcpServer[]): number {
  let total = 0;
  for (const server of servers) {
    if (server.enabled === false || server.status !== 'connected') continue;
    total += server.allowedTools ? server.allowedTools.length : (server.tools?.length ?? 0);
  }
  return total;
}

export type ToolBudgetStatus = 'ok' | 'near' | 'over';

/**
 * Classify a live tool count against a provider/model cap for the nudge:
 * `over` once the count exceeds the cap (the request would 400), `near` within
 * the top 15% of headroom, else `ok`. Display only — never truncates.
 */
export function toolBudgetStatus(count: number, cap: number): ToolBudgetStatus {
  if (count > cap) return 'over';
  if (count >= cap * 0.85) return 'near';
  return 'ok';
}
