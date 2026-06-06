/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 audit CRIT-1 fix (2026-05-19) - Service-locator registry binding ACP
 * conversation IDs to team sandbox context.
 *
 * The ACP file-protocol handlers (`AcpConnection.handleReadOperation` /
 * `handleWriteOperation`) bypass the workspace-FS sandbox helper, so a
 * sandboxed imported team can read outside the workspace and write
 * protected paths through `READ_TEXT_FILE` / `WRITE_TEXT_FILE` requests.
 *
 * This module is the v1 plumbing: when a team session spawns an ACP
 * agent it calls `registerTeamConversation`; the team-context lookup in
 * `gateAcpFileOp` then routes file ops through `withOpenInsideWorkspace`
 * for imported teams only. Non-team conversations and non-imported teams
 * remain on the unchanged legacy path.
 *
 * v2 should replace this with proper dependency injection through
 * `AcpAgentManager`. Documented as a temporary v1 shape.
 */

import type { TTeam } from '@process/team/types';

export type AcpTeamContext = {
  teamId: string;
  isImported: boolean;
  /** Async accessor so the registry never holds a stale TTeam snapshot. */
  getTeam: () => Promise<TTeam | null>;
};

const registry = new Map<string, AcpTeamContext>();

/** Register / refresh the team context for an ACP conversation. */
export function registerTeamConversation(conversationId: string, ctx: AcpTeamContext): void {
  registry.set(conversationId, ctx);
}

/** Remove the team context when the ACP conversation shuts down. */
export function unregisterTeamConversation(conversationId: string): void {
  registry.delete(conversationId);
}

/** Return the team context if one is registered for this conversation, else undefined. */
export function getTeamContextForConversation(conversationId: string): AcpTeamContext | undefined {
  return registry.get(conversationId);
}

/** Test-only: clear all registrations between cases. */
export function __resetAcpTeamContextRegistryForTests(): void {
  registry.clear();
}
