/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4b - Capability grant check helpers.
 *
 * Single source of truth for "is capability X granted on team Y" queries.
 * Used by the MCP tool dispatch (TeamMcpServer) and will be reused by the
 * workspace-FS IPC handlers in W4c.
 *
 * Contract (W4 audit CRIT-2 fix - 2026-05-19):
 *   - Imported teams (`team.importedFrom != null`) ALWAYS consult the
 *     per-capability grant map regardless of the `isSandboxed` flag. The
 *     `isSandboxed` flag is informational/visual only - it drives UI
 *     badges and prompt-injection wrap, but the security gate is the
 *     grant map itself. Granting one cap NEVER de-sandboxes the team.
 *   - Non-imported (legitimately user-created) teams: full trust by
 *     definition; every capability is considered granted.
 *
 * `assertCapGranted` throws `TeamSandboxedError` (defined in W4a) so the
 * existing MCP error path serializes a uniform message to the agent.
 */

import { TeamSandboxedError } from '@process/team/importExport/errors';
import type { TTeam } from '@process/team/types';

/**
 * Names of the five capabilities the W4a `TeamExportSchema` defines. Kept in
 * sync manually because reusing the Zod-derived type would force a runtime
 * import of the schema into the hot MCP path.
 */
export type TeamCapabilities = {
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canSpawnAgents: boolean;
  canNetworkRequest: boolean;
  canCrossTeamMessage: boolean;
};

export type TeamCapability = keyof TeamCapabilities;

/**
 * Returns true when `cap` is currently allowed on `team`.
 *
 * W4 audit CRIT-2 fix: the security gate is the per-capability grant map,
 * NOT the `isSandboxed` flag. Imported teams (`importedFrom != null`)
 * ALWAYS check the grant map regardless of `isSandboxed` - granting one
 * cap never de-sandboxes the others. Non-imported teams (legitimately
 * user-created) are fully trusted by definition.
 */
export function isCapGranted(team: TTeam, cap: TeamCapability): boolean {
  // Non-imported teams: full trust. Pre-W4 teams (no importedFrom) and
  // user-created teams fall in this bucket.
  if (!team.importedFrom) return true;
  // Imported teams: per-capability grant gate, independent of isSandboxed.
  const grants = team.importCapabilityGrants ?? {};
  return grants[cap]?.by_user === true;
}

/**
 * Throws `TeamSandboxedError` with a descriptive message when `cap` is
 * denied on `team`. Intentionally a no-op when allowed so callers can wrap
 * any IPC entry-point in a single line.
 */
export function assertCapGranted(team: TTeam, cap: TeamCapability): void {
  if (isCapGranted(team, cap)) return;
  throw new TeamSandboxedError(
    `Sandboxed team "${team.name}" lacks capability "${cap}". ` +
      `Grant it via Settings → Teams → Trust to enable.`
  );
}
