/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workspace-drift Doctor check.
 *
 * Projects and conversations can point at a working directory on disk. When a
 * user moves or deletes that directory the binding goes stale: the next chat in
 * that project/conversation writes to (or fails on) a path that no longer
 * exists. This check stats every configured workspace path and reports the ones
 * that are missing.
 */

import type { DoctorCheckOutcome } from '../types';

/** A configured workspace path with a label for the diagnostic copy. */
export type WorkspaceEntry = { label: string; path: string };

/** Dependencies — the configured paths, plus an injectable existence probe. */
export type WorkspaceCheckDeps = {
  listWorkspaces: () => Promise<WorkspaceEntry[]>;
  /** True when `path` exists on disk. Injected so the check is unit-testable. */
  pathExists: (path: string) => Promise<boolean>;
};

/**
 * Workspace drift — every configured workspace path exists on disk. FAIL when
 * any path is missing (a stale binding); PASS when all exist or none are
 * configured.
 */
export async function checkWorkspaceDrift(deps: WorkspaceCheckDeps): Promise<DoctorCheckOutcome> {
  const workspaces = await deps.listWorkspaces();
  if (workspaces.length === 0) {
    return { status: 'pass', detail: 'No custom workspace paths are configured.' };
  }

  // fs.access probes are independent and side-effect-free, so run them in
  // parallel — unlike the network/CLI probes in the provider/MCP checks, there
  // is no resource-storm reason to serialize them.
  const checked = await Promise.all(
    workspaces.map(async (entry) => ({ entry, exists: await deps.pathExists(entry.path) }))
  );
  const missing = checked
    .filter((result) => !result.exists)
    .map((result) => `${result.entry.label} → ${result.entry.path}`);

  if (missing.length > 0) {
    return {
      status: 'fail',
      detail: `${missing.length} of ${workspaces.length} workspace path(s) no longer exist: ${missing.join('; ')}.`,
      remediation: 'Recreate the folder, or update the project/conversation to a valid workspace path.',
    };
  }
  return { status: 'pass', detail: `All ${workspaces.length} configured workspace path(s) exist.` };
}
