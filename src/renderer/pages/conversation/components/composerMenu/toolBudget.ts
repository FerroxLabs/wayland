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

/**
 * Compute the next per-conversation active-server selection (#348) after the
 * user toggles one server. `current === undefined` means "all enabled servers".
 * Returns `undefined` when the result is once again every enabled server (the
 * clean default, so we don't persist a redundant explicit list), else the
 * explicit id list. Toggling the only-active server off yields `[]` (none).
 */
export function nextActiveSelection(
  current: string[] | undefined,
  allEnabledIds: string[],
  serverId: string,
  active: boolean
): string[] | undefined {
  const base = current ?? allEnabledIds;
  const next = active ? Array.from(new Set([...base, serverId])) : base.filter((id) => id !== serverId);
  const isAll = next.length === allEnabledIds.length && allEnabledIds.every((id) => next.includes(id));
  return isAll ? undefined : next;
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
