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
import {
  buildWorkspaceMarker,
  writeWorkspaceMarker,
  type WorkspaceMarker,
  type WorkspaceOwnerKind,
} from '@process/services/workspaceIdentity';

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
 *
 * Exported because the Doctor has to withhold the LEAF of any path under this
 * base: the leaf is the sanitised project name, so for a managed workspace the
 * name IS the path (`doctorWorkspaceDisplayPath` in `doctor/workspaceInventory`).
 * Read through this function rather than rebuilding `<documents>/Wayland` at the
 * call site - a second copy of the literal is a silent fail-open the moment this
 * one moves.
 */
let _baseDirPromise: Promise<string> | null = null;
export async function defaultWorkspaceBaseDir(): Promise<string> {
  // Memoized: the documents dir doesn't change at runtime, and sharing a single
  // import keeps concurrent allocations from each re-importing electron.
  if (!_baseDirPromise) {
    const pending = import('electron').then(({ app }) => path.join(app.getPath('documents'), 'Wayland'));
    _baseDirPromise = pending;
    // Cache the SUCCESS, not the attempt. Caching the promise unconditionally meant
    // ONE rejected read was replayed for the whole process lifetime - and
    // `app.getPath` is not throw-free - so the Doctor's `.catch(() => null)` turned
    // a transient fault into `appManagedWorkspaceBase: null` permanently, which
    // disables the workspace-name withholding rather than degrading it. Clearing the
    // slot on rejection keeps the concurrent-dedup property (in-flight callers still
    // share `pending`) while letting the next call retry.
    pending.catch(() => {
      if (_baseDirPromise === pending) _baseDirPromise = null;
    });
  }
  return _baseDirPromise;
}

/** Subfolder of the managed base each owner kind allocates into (P2-1). */
const OWNER_KIND_DIR: Record<WorkspaceOwnerKind, string> = {
  task: 'Tasks',
  project: 'Projects',
};

/** Who a newly allocated workspace belongs to. Defaults to a project (the pre-P2-1 caller). */
export type AllocateWorkspaceOptions = {
  ownerKind?: WorkspaceOwnerKind;
  ownerId?: string | null;
};

/** Result of an allocation: where it landed, and the identity stamped into it. */
export type AllocatedWorkspace = { dir: string; marker: WorkspaceMarker | null };

/**
 * Allocate a fresh, collision-free persistent workspace dir and create it on
 * disk, stamped with a `.wayland-workspace.json` identity marker.
 *
 * P2-1: NEW allocations nest by owner kind -
 * `~/Documents/Wayland/Tasks/<name>` and `~/Documents/Wayland/Projects/<name>`.
 * Flat made the `(2)` suffix an accidental type system in which a Task and a
 * Project of the same name are indistinguishable, so deleting the wrong one
 * destroys history. Nesting is a NEW-allocation rule only: nothing relocates an
 * existing workspace, because the allocated path is persisted by the caller and
 * `ensureProjectWorkspace` returns an existing one untouched.
 *
 * The name is DISPLAY, the marker id is IDENTITY. Two tasks called "Morning
 * Brief" get `Morning Brief` and `Morning Brief (2)` with distinct ids; renaming
 * a task moves nothing, which is why callers must persist the path they were
 * given and never re-derive it from the current name.
 */
/** Paths chosen by an in-flight allocateProjectWorkspace but not yet created on disk. */
const allocatingPaths = new Set<string>();

export async function allocateWorkspace(
  displayName: string,
  options: AllocateWorkspaceOptions = {}
): Promise<AllocatedWorkspace> {
  const ownerKind: WorkspaceOwnerKind = options.ownerKind ?? 'project';
  const base = path.join(await defaultWorkspaceBaseDir(), OWNER_KIND_DIR[ownerKind]);
  await fs.mkdir(base, { recursive: true });
  // Resolve + reserve in ONE synchronous step so two concurrent allocations whose
  // names sanitize to the SAME folder (different projects -> the per-projectId
  // lock doesn't help) can't both pick the same dir before either is created on
  // disk. A path counts as taken if it exists OR another in-flight allocation
  // already claimed it, so the second caller falls through to the (2)/(3) suffix.
  const dir = resolveProjectWorkspacePath(base, displayName, (p) => existsSync(p) || allocatingPaths.has(p));
  allocatingPaths.add(dir);
  try {
    await fs.mkdir(dir, { recursive: true });
    const marker = buildWorkspaceMarker({ ownerKind, ownerId: options.ownerId ?? null, displayName });
    try {
      await writeWorkspaceMarker(dir, marker);
      return { dir, marker };
    } catch (err) {
      // An unmarkable workspace is still a usable workspace - it just cannot
      // prove its identity later, which degrades P2-10 to "missing only". Never
      // fail the allocation over it.
      console.error('[projectWorkspace] failed to write workspace identity marker:', err);
      return { dir, marker: null };
    }
  } finally {
    // Once created, existsSync(dir) keeps it "taken"; safe to drop the reservation.
    allocatingPaths.delete(dir);
  }
}

/** Path-only wrapper kept for the callers that persist nothing but the path. */
export async function allocateProjectWorkspace(
  projectName: string,
  options: AllocateWorkspaceOptions = {}
): Promise<string> {
  return (await allocateWorkspace(projectName, options)).dir;
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
  allocate: (projectName: string, options?: AllocateWorkspaceOptions) => Promise<string> = allocateProjectWorkspace
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
  allocate: (projectName: string, options?: AllocateWorkspaceOptions) => Promise<string>
): Promise<string | null> {
  try {
    const repo = new SqliteProjectRepository();
    const project = await repo.getProject(projectId);
    if (!project) return null;
    const existing = typeof project.workspace === 'string' ? project.workspace.trim() : '';
    if (existing) return existing;

    const workspace = await allocate(project.name, { ownerKind: 'project', ownerId: projectId });
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
