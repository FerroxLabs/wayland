/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What Settings needs on top of the durable store: a human-readable name for
 * each workspace id, and a revoke that reaches the engines already running.
 *
 * Kept out of `folderGrantStore.ts` on purpose. The store is the record and
 * deliberately talks to nothing; this module talks to the filesystem and to
 * live sessions, which is exactly the coupling the store refuses to take on.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readWorkspaceMarker } from '@process/services/workspaceIdentity';
import { listLivePathGrantSessions } from '@process/agent/wcore/pathGrantSessions';
import { FOLDER_GRANT_PATH_KEY_PREFIX } from './folderGrantWorkspaceId';
import { pathsEqual } from './folderGrantRoots';

export type LiveRevokeOutcome = Readonly<{ revoked: number; failed: number }>;

/**
 * Withdraw `grantId` from every engine currently running in `workspaceDir`.
 *
 * WHY THIS IS NOT OPTIONAL. Core holds grants in session memory and nothing
 * re-reads the durable list mid-session, so deleting the entry alone leaves
 * every running engine still reading the folder for the rest of its life. The
 * user watched a revoke succeed; without this it did nothing until the next
 * launch.
 *
 * Call this AFTER the store has already dropped the entry. In that order a
 * session spawning concurrently replays the shrunk list, so there is no window
 * in which a new engine picks up the grant this call has just finished
 * withdrawing from the old ones.
 *
 * `workspaceDir` null means the id resolved to no folder on disk, so there is
 * nothing to match a live session against and nothing is revoked - reported as
 * zero rather than guessed.
 */
export async function revokeFolderGrantInLiveSessions(
  workspaceDir: string | null,
  grantId: string,
  sessions = listLivePathGrantSessions()
): Promise<LiveRevokeOutcome> {
  if (!workspaceDir) return { revoked: 0, failed: 0 };
  const targets = sessions.filter((session) => pathsEqual(session.workspace, workspaceDir));

  const results = await Promise.all(
    targets.map(async (session) => {
      try {
        // `revokePath` resolves the updated policy receipt, or null when the
        // host could not get the command out (a dead or not-yet-live
        // transport). Core treats an unknown id as a no-op and re-emits the
        // receipt either way, so a receipt IS proof the engine acted.
        return (await session.revokePath(grantId)) !== null;
      } catch {
        return false;
      }
    })
  );

  return {
    revoked: results.filter(Boolean).length,
    failed: results.filter((ok) => !ok).length,
  };
}

/**
 * Where each of `workspaceIds` lives on disk right now, for the keys that can
 * still be located.
 *
 * A key absent from the result is NOT an error: it is a workspace whose folder
 * has been moved or deleted, or a legacy `marker:` entry from before the key
 * became the path. Its grants are still listed and still removable, because an
 * entry the user can no longer account for is exactly the one they most need to
 * revoke.
 *
 * A key CARRIES its folder, so this is the inverse of the one production
 * derivation (`resolveFolderGrantWorkspaceId`) rather than a second scheme.
 * There is no scan of the managed workspace tree any more: that scan existed
 * only to find a folder by its identity marker, and the marker no longer
 * selects anything.
 */
export async function resolveFolderGrantWorkspaces(
  workspaceIds: readonly string[]
): Promise<Map<string, { dir: string; displayName: string }>> {
  const resolved = await Promise.all(workspaceIds.map(locateOne));

  const located = new Map<string, { dir: string; displayName: string }>();
  for (const entry of resolved) {
    if (entry) located.set(entry.key, { dir: entry.dir, displayName: entry.displayName });
  }
  return located;
}

/** One key, or null when it names nothing this surface may show. */
async function locateOne(key: string): Promise<{ key: string; dir: string; displayName: string } | null> {
  if (typeof key !== 'string' || !key.startsWith(FOLDER_GRANT_PATH_KEY_PREFIX)) return null;
  const dir = key.slice(FOLDER_GRANT_PATH_KEY_PREFIX.length);
  // A relative entry can only come from a hand-edited file. Refuse it rather
  // than resolving it against whatever the process cwd happens to be.
  if (!path.isAbsolute(dir)) return null;
  try {
    if (!(await fs.stat(dir)).isDirectory()) return null;
  } catch {
    return null;
  }
  return { key, dir, displayName: await displayNameFor(dir) };
}

/**
 * A name for `dir` in the Settings list.
 *
 * The identity marker is read HERE and only here, as a LABEL. It is written by
 * Wayland when it allocates a workspace and carries the name the user gave that
 * task or project, which beats a generated folder basename. It is also a file
 * inside the workspace, which the agent can write - so it may never do anything
 * but decorate a row that the PATH already selected. Getting a forged
 * `displayName` in front of the user is a cosmetic lie about a grant they can
 * still see the real folder of; getting a forged key would have been theft of
 * another workspace's authority.
 */
async function displayNameFor(dir: string): Promise<string> {
  const marker = await readWorkspaceMarker(dir);
  if (marker && typeof marker.displayName === 'string' && marker.displayName.length > 0) return marker.displayName;
  return path.basename(dir) || dir;
}
