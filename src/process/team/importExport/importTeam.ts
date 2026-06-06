/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 (T4.2 + T4.6 + T4.6.1) - Validate + preview the v1 team-import payload.
 *
 * Order of operations (each step is a hard reject on failure):
 *   1. `safeParseWithTimeout` - byte-cap + worker-thread JSON.parse + 1s
 *      timeout. Throws `TeamImportError('File exceeds…')` / `'Parse timeout'`.
 *   2. `rejectPrototypePollutionKeys` - recursive `__proto__` /
 *      `constructor` / `prototype` rejection.
 *   3. `enforceMaxDepth` - depth-6 guard.
 *   4. `TeamExportSchema.parse` - Zod strict + skill-id regex + roster cap.
 *   5. `checkSpecialistAvailability` - hard-reject when payload references
 *      a skill id not present in the receiver's bundle.
 *
 * Returns a preview struct describing whether the payload can be accepted
 * as-is or whether the receiver is missing specialists.
 */

import { TeamImportError } from './errors';
import {
  enforceMaxDepth,
  MAX_JSON_DEPTH,
  rejectPrototypePollutionKeys,
  safeParseWithTimeout,
} from './safeParse';
import { TeamExportSchema, type TeamExport } from './TeamExportSchema';

export type ImportPreviewResult = {
  parsed: TeamExport;
  specialistsAvailable: boolean;
  missingSpecialists: string[];
};

/**
 * Caller-injected accessor for the bundle specialist catalog. Returns the
 * set of skill ids the receiver has installed. Kept as a callback so the
 * service layer can wire up `ExtensionRegistry.getAssistants()` while the
 * tests pass a literal set.
 */
export type SpecialistCatalog = () => Promise<Set<string>>;

export async function previewImport(
  jsonText: string,
  specialistCatalog: SpecialistCatalog
): Promise<ImportPreviewResult> {
  // Step 1 - DOS guard + bounded JSON.parse in worker.
  const rawValue = await safeParseWithTimeout(jsonText);

  // Step 2 - prototype-pollution walker.
  rejectPrototypePollutionKeys(rawValue);

  // Step 3 - depth walker.
  enforceMaxDepth(rawValue, MAX_JSON_DEPTH);

  // Step 4 - Zod strict + skill-id regex + roster cap.
  const result = TeamExportSchema.safeParse(rawValue);
  if (!result.success) {
    const detail = result.error.issues[0];
    const path = detail?.path.join('.') || '<root>';
    throw new TeamImportError(
      `Invalid team export at ${path}: ${detail?.message ?? 'unknown'}`,
      'TEAM_IMPORT_SCHEMA_INVALID'
    );
  }
  const parsed = result.data;

  // Step 5 - specialist availability.
  const installed = await specialistCatalog();
  const referenced = [parsed.leader.id, ...parsed.teammates.map((t) => t.id)];
  const missing = referenced.filter((id) => !installed.has(id));
  if (missing.length > 0) {
    const dedup = Array.from(new Set(missing));
    return {
      parsed,
      specialistsAvailable: false,
      missingSpecialists: dedup,
    };
  }

  return {
    parsed,
    specialistsAvailable: true,
    missingSpecialists: [],
  };
}

/**
 * Build the per-capability grant map persisted on `TTeam.importCapabilityGrants`.
 * Skips capabilities the user did not grant - the absence of an entry is
 * the absence of a grant. Each granted entry records the unix-ms timestamp
 * and an explicit `by_user: true` so an audit trail survives renames /
 * re-imports.
 */
export function buildCapabilityGrants(
  capabilityGrants: Record<string, boolean>,
  now: number = Date.now()
): Record<string, { granted_at: number; by_user: boolean }> {
  const out: Record<string, { granted_at: number; by_user: boolean }> = {};
  for (const [cap, granted] of Object.entries(capabilityGrants)) {
    if (granted === true) {
      out[cap] = { granted_at: now, by_user: true };
    }
  }
  return out;
}

/**
 * Decide whether the receiving team should be persisted with the sandbox
 * flag on. A team is sandboxed unless EVERY capability the payload declared
 * was also granted by the user. The five-cap shape is fixed by the
 * `TeamExportSchema`, so we audit all five.
 */
export function isSandboxedAfterImport(
  payloadCaps: TeamExport['capabilities'],
  capabilityGrants: Record<string, boolean>
): boolean {
  const allCaps = [
    'canReadFiles',
    'canWriteFiles',
    'canSpawnAgents',
    'canNetworkRequest',
    'canCrossTeamMessage',
  ] as const;
  for (const cap of allCaps) {
    const declared = payloadCaps[cap];
    if (declared === true && capabilityGrants[cap] !== true) return true;
    // Even when the payload declares a cap as false, the receiver still
    // operates in sandbox if NO caps were granted - the absence-of-grant
    // is the load-bearing signal for FS/network gates.
  }
  // If at least one cap was granted, we'd flip out of sandbox only when the
  // payload's declared caps are a subset of the grants. v1 payloads always
  // declare all caps false (export-side), so we conservatively keep the
  // sandbox on unless the user explicitly granted at least one cap.
  const grantedCount = Object.values(capabilityGrants).filter((v) => v === true).length;
  return grantedCount === 0;
}
