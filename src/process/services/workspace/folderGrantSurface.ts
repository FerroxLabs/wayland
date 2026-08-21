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
import { defaultWorkspaceBaseDir } from '@process/services/projectWorkspace';
import { listLivePathGrantSessions } from '@process/agent/wcore/pathGrantSessions';
import { pathsEqual } from './folderGrantRoots';

/** What one workspace id resolves to on disk right now. */
export type WorkspaceDirectoryEntry = Readonly<{ workspaceId: string; dir: string; displayName: string }>;

/**
 * The subfolders `allocateWorkspace` nests durable workspaces into, plus the
 * base itself for the flat allocations that predate that nesting.
 */
const SCAN_SUBDIRS: readonly string[] = ['', 'Tasks', 'Projects'];

/**
 * Map every marked workspace under the managed base to its id.
 *
 * A SCAN and not a lookup table, because nothing persists a workspaceId -> path
 * index: the marker lives in the folder precisely so it survives the user
 * moving or renaming it in Finder, which is the same reason a stored path
 * would be wrong. One level deep per subdir - that is where `allocateWorkspace`
 * puts them, and recursing further would read markers out of nested project
 * content.
 *
 * Never throws. An unreadable base directory means "nothing resolved", which
 * renders as grants whose workspace is unknown - still listed, still
 * removable.
 */
export async function scanWorkspaceDirectory(): Promise<readonly WorkspaceDirectoryEntry[]> {
  let base: string;
  try {
    base = await defaultWorkspaceBaseDir();
  } catch {
    return [];
  }

  const entries: WorkspaceDirectoryEntry[] = [];
  for (const subdir of SCAN_SUBDIRS) {
    const root = subdir ? path.join(base, subdir) : base;
    let names: string[];
    try {
      names = await fs.readdir(root);
    } catch {
      continue;
    }
    for (const name of names) {
      const dir = path.join(root, name);
      const marker = await readWorkspaceMarker(dir);
      if (!marker) continue;
      // First writer wins: a folder duplicated by a plain copy carries the same
      // id twice, and inventing a second row for it would show the user two
      // identical workspaces neither of which they can tell apart.
      if (entries.some((entry) => entry.workspaceId === marker.workspaceId)) continue;
      entries.push({ workspaceId: marker.workspaceId, dir, displayName: marker.displayName });
    }
  }
  return entries;
}

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
