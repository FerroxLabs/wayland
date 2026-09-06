/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Revalidate durable read-only consent before each new engine session. */

import path from 'node:path';

import type { LiveFolderGrant, WorkspaceFolderGrants } from '@/common/workspace/folderGrants';
import { vetFolderGrantRoot } from './folderGrantAuthority';
import { isWithin, type FolderGrantRootContext } from './folderGrantRoots';
import { defaultFolderGrantRootContext, defaultWorkspaceFolderGrantStore } from './folderGrantStore';
import { resolveFolderGrantWorkspaceId } from './folderGrantWorkspaceId';

export type FolderGrantReplayDeps = Readonly<{
  /** The grant key for this workspace, or null when there is no honest one. */
  resolveWorkspaceId: (workspaceDir: string) => Promise<string | null>;
  /** The store's REVALIDATING read. Nothing else may be substituted for it. */
  listGrants: (workspaceId: string) => Promise<WorkspaceFolderGrants>;
  /** Wayland's own storage roots, for the authority gate. */
  resolveContext: () => Promise<FolderGrantRootContext>;
}>;

const productionDeps = (): FolderGrantReplayDeps => ({
  resolveWorkspaceId: resolveFolderGrantWorkspaceId,
  listGrants: (workspaceId) => defaultWorkspaceFolderGrantStore().list(workspaceId),
  resolveContext: defaultFolderGrantRootContext,
});

/** Stable consent IDs and canonical roots from the store's revalidating read. */
export async function loadReplayableGrants(
  workspaceDir: string,
  deps: FolderGrantReplayDeps = productionDeps()
): Promise<readonly LiveFolderGrant[]> {
  if (typeof workspaceDir !== 'string' || workspaceDir.length === 0) return [];
  try {
    const workspaceId = await deps.resolveWorkspaceId(workspaceDir);
    if (!workspaceId) return [];

    // `grants` is the certified half of the revalidating read. `withheld` is
    // deliberately not consulted: an entry the read refused is an entry no
    // caller may replay.
    const record = await deps.listGrants(workspaceId);
    const grants: LiveFolderGrant[] = [];
    for (const grant of record.grants) {
      // eslint-disable-next-line no-await-in-loop -- capped at MAX_FOLDER_GRANTS_PER_WORKSPACE (64), once per spawn
      const check = await vetFolderGrantRoot(grant.root, deps.resolveContext);
      // `=== false`, not `!check.ok`: without `strictNullChecks` TypeScript will
      // not narrow a boolean-literal discriminant through truthiness.
      if (check.ok === false) continue;
      // The gate's CANONICAL root is what is kept, so what is later handed to
      // the engine is the directory that was vetted rather than the string that
      // was recorded.
      grants.push({ ...grant, root: check.root });
    }
    return grants;
  } catch {
    return [];
  }
}

/** Root-only compatibility read for callers that do not mint session grants. */
export async function loadReplayableGrantRoots(
  workspaceDir: string,
  deps: FolderGrantReplayDeps = productionDeps()
): Promise<readonly string[]> {
  return (await loadReplayableGrants(workspaceDir, deps)).map((grant) => grant.root);
}

/**
 * The snapshotted root that covers `requestedRoot`, or null when none does.
 *
 * Pure and synchronous, so the boundary handler can answer without yielding.
 *
 * Containment, never string prefix: `isWithin` compares resolved paths
 * component-wise, so a grant on `/x/reports` does not cover `/x/reports-archive`.
 *
 * The GRANTED root is returned, not the narrower folder the engine named: that
 * is the decision the user actually made, and returning the narrower one would
 * re-raise a card for every sibling inside a folder they already opened.
 */
export function replayableGrantRootFor(roots: readonly string[], requestedRoot: unknown): string | null {
  if (typeof requestedRoot !== 'string' || requestedRoot.length === 0 || !path.isAbsolute(requestedRoot)) return null;
  return roots.find((root) => isWithin(requestedRoot, root)) ?? null;
}

/** Both halves in one call. The unit of behaviour, for callers that hold neither. */
export async function resolveReplayableGrantRoot(
  workspaceDir: string,
  requestedRoot: unknown,
  deps: FolderGrantReplayDeps = productionDeps()
): Promise<string | null> {
  if (typeof requestedRoot !== 'string' || requestedRoot.length === 0 || !path.isAbsolute(requestedRoot)) return null;
  return replayableGrantRootFor(await loadReplayableGrantRoots(workspaceDir, deps), requestedRoot);
}
