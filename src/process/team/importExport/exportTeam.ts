/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 (T4.1) - Build the whitelist-only JSON payload for a team export.
 *
 * Every field that ships out is named here; everything else is dropped on the
 * floor. This is the entire surface area that the v1 import path needs to
 * recreate a team, and nothing more. See `TeamExportSchema.ts` for the
 * shape the receiver validates against.
 *
 * EXCLUDED (load-bearing - do NOT add back without an audit):
 *   • API keys / model credentials of any kind
 *   • Workspace paths, file lists, conversation IDs, slot IDs
 *   • Mailbox history, task history, event log entries
 *   • Anything in `conversation.extra` (teamMcpStdioConfig, env, etc.)
 *   • The user-visible team name beyond `name` (no nicknames, no avatars)
 *
 * Capabilities are always serialized as all-false in v1; the import dialog
 * (W4b) lets the receiving user opt-in per capability after review.
 */

import type { TTeam } from '../types';
import type { TeamExport } from './TeamExportSchema';

/** Strip the `ext-` prefix from a customAgentId to produce a bundle skill id. */
function stripExtPrefix(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return id.startsWith('ext-') ? id.slice(4) : id;
}

/**
 * Optional adapter for resolving the source launcher's `rituals` field at
 * export time. Returns the rituals array or `undefined` when the launcher is
 * unknown / has none. Kept as an injected dep so tests can provide a stub
 * without spinning up the full ExtensionRegistry.
 */
export type RitualsResolver = (
  sourceLauncherId: string
) => Promise<Array<{ name: string; cadence: string }> | undefined>;

/**
 * Convert a persisted TTeam into the whitelist v1 export payload. Throws
 * Error when the team has no leader agent (catastrophic - should never
 * happen for a persisted row, but defended for safety).
 */
export async function buildTeamExport(
  team: TTeam,
  resolveRituals?: RitualsResolver
): Promise<TeamExport> {
  const leader = team.agents.find((a) => a.role === 'leader');
  if (!leader) {
    throw new Error(`Team "${team.id}" has no leader agent - cannot export`);
  }

  const leaderId = stripExtPrefix(leader.customAgentId) || stripExtPrefix(leader.agentType) || 'leader';
  const teammates = team.agents
    .filter((a) => a.role === 'teammate')
    .map((a) => ({
      id: stripExtPrefix(a.customAgentId) || stripExtPrefix(a.agentType) || 'teammate',
      name: a.agentName.slice(0, 100),
      // v1 - system prompts are NOT round-tripped because they live in bundle
      // markdown files keyed by `customAgentId`. Receiver re-loads them from
      // their own bundle when the team is imported. Empty string is the
      // schema-compatible signal for "use bundle default".
      prompt: '',
      recommendBackend: a.agentType || undefined,
    }));

  let rituals: Array<{ name: string; cadence: string }> | undefined;
  if (team.sourceLauncherId && resolveRituals) {
    try {
      rituals = await resolveRituals(team.sourceLauncherId);
    } catch {
      rituals = undefined;
    }
  }

  return {
    version: 'v1',
    id: team.id,
    name: team.name.slice(0, 100),
    leader: {
      id: leaderId,
      recommendBackend: leader.agentType || undefined,
    },
    teammates,
    ...(rituals && rituals.length > 0 ? { rituals } : {}),
    capabilities: {
      // v1 - export always declares zero capabilities. The receiver's import
      // dialog (W4b) is the only place a `true` can enter the system.
      canReadFiles: false,
      canWriteFiles: false,
      canSpawnAgents: false,
      canNetworkRequest: false,
      canCrossTeamMessage: false,
    },
  };
}

/** Pretty-print the export payload for human review before save. Indent = 2. */
export function serializeTeamExport(payload: TeamExport): string {
  return JSON.stringify(payload, null, 2);
}
