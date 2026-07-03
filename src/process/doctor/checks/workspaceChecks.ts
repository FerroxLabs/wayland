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

/**
 * A configured workspace with the inputs needed to classify it as persistent vs
 * a throwaway temp/default folder.
 */
export type WorkspaceConfigEntry = {
  label: string;
  /** Resolved workspace path, or `null` when the binding carries none (itself a temp fallback). */
  path: string | null;
  /**
   * The app's authoritative "this is a user-chosen persistent workspace" flag
   * (a conversation's `extra.customWorkspace`). `false` means a temp/default
   * workspace; `null` when the binding carries no such flag (e.g. a project).
   */
  customWorkspace: boolean | null;
};

/** Dependencies for {@link checkWorkspaceConfigured}. */
export type WorkspaceConfiguredDeps = {
  listWorkspaces: () => Promise<WorkspaceConfigEntry[]>;
  /** The OS temp directory (`os.tmpdir()`), injected so the check is unit-testable. */
  tmpDir: string;
};

/** Cap on the number of paths enumerated in the warning detail (output-bound). */
const MAX_LISTED_TEMP = 5;

/**
 * True when a workspace path is a throwaway temp/default directory rather than a
 * real, findable folder. Mirrors the concierge-diag temp detection so both
 * surfaces agree: a `<kind>-temp-<unix-ms>` folder (the timestamp run must be
 * >=10 digits so user folders like `client-temp-2024` are NOT misread), any path
 * under the OS temp dir, or a null path (no workspace at all → a temp fallback).
 */
export function isTempWorkspacePath(path: string | null, tmpDir: string): boolean {
  if (!path) return true;
  if (/(^|[/\\])[a-z]+-temp-\d{10,}([/\\]|$)/i.test(path)) return true;
  return tmpDir.length > 0 && path.includes(tmpDir);
}

/**
 * Workspace configured — every project/conversation writes to a persistent,
 * findable folder rather than a throwaway temp workspace. WARN (not FAIL) when
 * any binding is temp/default: files still get written, but they land in a
 * throwaway directory the user may never find (the temp-workspace-fallback bug
 * behind "the file I asked for went nowhere"). PASS when all bindings are
 * persistent, or none are configured.
 */
export async function checkWorkspaceConfigured(deps: WorkspaceConfiguredDeps): Promise<DoctorCheckOutcome> {
  const workspaces = await deps.listWorkspaces();
  if (workspaces.length === 0) {
    return { status: 'pass', detail: 'No workspaces are configured.' };
  }

  const temp = workspaces.filter(
    (entry) => entry.customWorkspace === false || isTempWorkspacePath(entry.path, deps.tmpDir)
  );

  if (temp.length > 0) {
    const shown = temp.slice(0, MAX_LISTED_TEMP).map((entry) => `${entry.label} → ${entry.path ?? '(no folder)'}`);
    const suffix = temp.length > MAX_LISTED_TEMP ? `; and ${temp.length - MAX_LISTED_TEMP} more` : '';
    return {
      status: 'warn',
      detail: `${temp.length} of ${workspaces.length} workspace(s) use a temporary/default folder: ${shown.join('; ')}${suffix}.`,
      remediation:
        'Open the project or chat and set a persistent workspace folder so files you create are saved where you can find them.',
    };
  }

  return {
    status: 'pass',
    detail: `All ${workspaces.length} configured workspace(s) use a persistent folder.`,
  };
}
