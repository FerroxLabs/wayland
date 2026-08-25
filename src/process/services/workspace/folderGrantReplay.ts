/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * REPLAY: the durable folder-grant list, applied to the boundary card the user
 * has already answered once (#982).
 *
 * WHAT WAS MISSING. v0.12.4 shipped the whole record: grants are persisted in
 * app user-data keyed by workspace, vetted host-side, revocable by a stable id,
 * surfaced in Settings. Nothing re-applied them, so prior consent died with the
 * session - and for an unattended run (cron, Autopilot) there is nobody at the
 * window to answer the card, which is the exact dead end the feature exists to
 * remove.
 *
 * WHY NOT `grant_path`. That is the command Core added for spawn-time replay,
 * and it shipped without a fixture; the desktop contract's command schema is
 * generated from the fixture set over a CLOSED `oneOf`, so `grant_path` is not
 * representable and `validateOutboundCommand` throws before a frame is written
 * (`FerroxLabs/wayland-core#314`, open). Waiting for it means shipping the
 * feature switched off, again.
 *
 * WHAT IS SENDABLE. `tool_approve` with `scope: { always_path: { root, write } }`,
 * which the v0.13.4 corpus import added and `pathGrantSeam.test.ts` pins as
 * accepted. It is the SAME command the user's own click on the consent card
 * sends. So the replay does not need a new protocol: when the engine raises a
 * boundary for a folder the user already recorded, the host answers it with the
 * recorded root instead of asking again.
 *
 * ---------------------------------------------------------------------------
 * THE BOUNDARY OF THE AUTHORITY - this file widens NOTHING.
 * ---------------------------------------------------------------------------
 *  1. The candidate roots come from the store's REVALIDATING read, so a folder
 *     that has been renamed, re-pointed or replaced since consent comes back
 *     `withheld` and is never seen here. Over the cap is withheld too.
 *  2. A candidate must CONTAIN the root the engine asked about - by path
 *     containment (`isWithin`), never by string prefix, so `/x/reports-archive`
 *     is not covered by a grant on `/x/reports`.
 *  3. It must then pass `vetFolderGrantRoot`, the same gate a click passes, and
 *     what is returned is that gate's CANONICAL root. A recorded entry naming
 *     Wayland's own storage - which only a hand-edited file can produce - is
 *     refused here exactly as it would be refused on the card.
 *  4. Every failure answers `null`. Fail closed: no list, no key, no context, no
 *     replay.
 *
 * There is no mode, setting or engine frame that reaches this function. It can
 * only re-state a decision the user already made and the store still certifies.
 */

import path from 'node:path';

import type { WorkspaceFolderGrants } from '@/common/workspace/folderGrants';
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

/**
 * The recorded root that covers `requestedRoot` for `workspaceDir`, ready to
 * hand to the engine - or null when nothing does.
 *
 * The GRANTED root is returned, not the narrower folder the engine named: that
 * is the decision the user actually made, and returning the narrower one would
 * re-raise a card for every sibling inside a folder they already opened.
 */
export async function resolveReplayableGrantRoot(
  workspaceDir: string,
  requestedRoot: unknown,
  deps: FolderGrantReplayDeps = productionDeps()
): Promise<string | null> {
  if (typeof requestedRoot !== 'string' || requestedRoot.length === 0 || !path.isAbsolute(requestedRoot)) return null;
  if (typeof workspaceDir !== 'string' || workspaceDir.length === 0) return null;

  try {
    const workspaceId = await deps.resolveWorkspaceId(workspaceDir);
    if (!workspaceId) return null;

    const record = await deps.listGrants(workspaceId);
    // `grants` is the certified half. `withheld` is deliberately not consulted:
    // an entry the read refused is an entry no caller may replay.
    const covering = record.grants.find((grant) => isWithin(requestedRoot, grant.root));
    if (!covering) return null;

    const check = await vetFolderGrantRoot(covering.root, deps.resolveContext);
    // `=== false`, not `!check.ok`: without `strictNullChecks` TypeScript will
    // not narrow a boolean-literal discriminant through truthiness.
    if (check.ok === false) return null;
    return check.root;
  } catch {
    // A replay that cannot be justified is a replay that does not happen.
    return null;
  }
}
