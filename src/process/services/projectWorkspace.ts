/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { SqliteProjectRepository } from '@process/services/database/SqliteProjectRepository';

/**
 * #30 NO-DRIFT: a chat created inside a project (extra.projectId) must always
 * run in that project's workspace. The only exception is a user-chosen custom
 * workspace (extra.customWorkspace === true), which is never overridden.
 *
 * Anything else - an empty workspace, a stale path, or a throwaway
 * `*-temp-*` directory the agent factory substituted before the project
 * workspace was resolved - is drift and gets pinned back to the project
 * workspace. When the project itself has no workspace the existing temp
 * fallback is left untouched (a project may legitimately have no workspace
 * yet), so the guarantee holds whenever the project actually has one.
 *
 * Mutates `extra.workspace` in place and returns true when a change was made,
 * so the caller can persist the correction. All failures are swallowed (return
 * false) - workspace enforcement must never block chat creation or spawn.
 */
export async function enforceProjectWorkspace(extra: Record<string, unknown> | undefined): Promise<boolean> {
  const projectId = extra?.projectId as string | undefined;
  if (!extra || !projectId) return false;
  // A user who explicitly picked a workspace owns that choice.
  if (extra.customWorkspace) return false;
  try {
    const project = await new SqliteProjectRepository().getProject(projectId);
    const projectWorkspace = project?.workspace;
    if (!projectWorkspace) return false;
    const current = typeof extra.workspace === 'string' ? extra.workspace.trim() : '';
    if (current === projectWorkspace) return false;
    extra.workspace = projectWorkspace;
    return true;
  } catch (err) {
    console.error('[projectWorkspace] #30 workspace enforcement failed:', err);
    return false;
  }
}
