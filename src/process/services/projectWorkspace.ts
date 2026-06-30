/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { SqliteProjectRepository } from '@process/services/database/SqliteProjectRepository';
import { bootstrapProjectKnowledge } from '@process/services/projectKnowledge/bootstrap';
import { resolveProjectWorkspacePath } from '@process/utils/workspaceLocation';

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

/**
 * Resolve the default base dir for managed project workspaces:
 * `~/Documents/Wayland`. Discoverable (visible in Finder/Explorer) per #455, so
 * files an agent writes "to the local workspace" are not lost in a hidden temp
 * dir. Electron is imported lazily so this module stays loadable in unit tests
 * that don't exercise allocation.
 */
let _baseDirPromise: Promise<string> | null = null;
async function defaultWorkspaceBaseDir(): Promise<string> {
  // Memoized: the documents dir doesn't change at runtime, and sharing a single
  // import keeps concurrent allocations from each re-importing electron.
  if (!_baseDirPromise) {
    _baseDirPromise = import('electron').then(({ app }) => path.join(app.getPath('documents'), 'Wayland'));
  }
  return _baseDirPromise;
}

/**
 * Allocate a fresh, collision-free persistent workspace dir for a project and
 * create it on disk. Default location is `~/Documents/Wayland/<project-name>`;
 * the path logic (sanitize + de-dupe) lives in workspaceLocation.ts.
 */
/** Paths chosen by an in-flight allocateProjectWorkspace but not yet created on disk. */
const allocatingPaths = new Set<string>();

export async function allocateProjectWorkspace(projectName: string): Promise<string> {
  const base = await defaultWorkspaceBaseDir();
  await fs.mkdir(base, { recursive: true });
  // Resolve + reserve in ONE synchronous step so two concurrent allocations whose
  // names sanitize to the SAME folder (different projects -> the per-projectId
  // lock doesn't help) can't both pick the same dir before either is created on
  // disk. A path counts as taken if it exists OR another in-flight allocation
  // already claimed it, so the second caller falls through to the (2)/(3) suffix.
  const dir = resolveProjectWorkspacePath(base, projectName, (p) => existsSync(p) || allocatingPaths.has(p));
  allocatingPaths.add(dir);
  try {
    await fs.mkdir(dir, { recursive: true });
    return dir;
  } finally {
    // Once created, existsSync(dir) keeps it "taken"; safe to drop the reservation.
    allocatingPaths.delete(dir);
  }
}

/**
 * #455 lazy migration: make sure a project has a persistent workspace. If it
 * already has one, return it untouched. Otherwise allocate one, persist it to
 * `projects.workspace`, and bootstrap the `.wayland/` knowledge folder. Existing
 * projects created before #455 (empty `workspace` column) self-heal the next
 * time this runs - typically when a chat is created inside them - with no data
 * loss. `allocate` is injectable for testing.
 *
 * Returns the workspace path, or null when there is nothing to do / on failure
 * (allocation must never block chat creation - the temp fallback still applies).
 */
export async function ensureProjectWorkspace(
  projectId: string | undefined,
  allocate: (projectName: string) => Promise<string> = allocateProjectWorkspace
): Promise<string | null> {
  if (!projectId) return null;
  // Serialize concurrent first-chat allocations for the SAME project. Without
  // this, two conversations created back-to-back in a project that has no
  // workspace yet each read an empty workspace, allocate distinct dirs, and race
  // the DB write - leaking one directory. All conversation creation happens in
  // the main process, so an in-process lock fully closes the window.
  const inflight = ensureLocks.get(projectId);
  if (inflight) return inflight;
  const run = ensureProjectWorkspaceUnlocked(projectId, allocate);
  ensureLocks.set(projectId, run);
  try {
    return await run;
  } finally {
    ensureLocks.delete(projectId);
  }
}

/** In-flight allocation per projectId (see ensureProjectWorkspace). */
const ensureLocks = new Map<string, Promise<string | null>>();

async function ensureProjectWorkspaceUnlocked(
  projectId: string,
  allocate: (projectName: string) => Promise<string>
): Promise<string | null> {
  try {
    const repo = new SqliteProjectRepository();
    const project = await repo.getProject(projectId);
    if (!project) return null;
    const existing = typeof project.workspace === 'string' ? project.workspace.trim() : '';
    if (existing) return existing;

    const workspace = await allocate(project.name);
    await repo.updateProject(projectId, { workspace });
    // Best-effort: a filesystem hiccup bootstrapping knowledge must not undo the
    // allocation (the workspace is already persisted and usable).
    try {
      await bootstrapProjectKnowledge(workspace, project.name, project.description);
    } catch (err) {
      console.error('[projectWorkspace] knowledge bootstrap failed:', err);
    }
    return workspace;
  } catch (err) {
    console.error('[projectWorkspace] ensureProjectWorkspace failed:', err);
    return null;
  }
}
