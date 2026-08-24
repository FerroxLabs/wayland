/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The key a workspace's folder grants are filed under: its resolved PATH, and
 * nothing else.
 *
 * WHY NOT THE IDENTITY MARKER. An earlier version of this file keyed a marked
 * workspace on `marker:<id>` read out of `.wayland-workspace.json`, and argued
 * that the `marker:` / `path:` prefixes made forgery unreachable. The prefixes
 * do make marker-vs-path collision unreachable. They do nothing about
 * marker-vs-MARKER collision, and the marker file lives INSIDE the workspace,
 * which the agent can write. Two attacks followed, both closed by this file
 * having no marker branch at all:
 *
 *   A. FORGED ID. The agent learns another workspace's marker id - from a
 *      copied folder, a backup, an earlier session, or the prompt - and writes
 *      it into its own `.wayland-workspace.json`. Its session then resolves to
 *      the victim's bucket, inherits every grant in it, and can add more.
 *
 *   B. DELETED MARKER. An unmarked workspace at `/Projects/X` accumulates
 *      grants under `path:/Projects/X`. It is later replaced at the same
 *      pathname by a MARKED workspace. The agent deletes its own marker; the
 *      resolution falls back to the path and inherits the old grants. No id is
 *      needed for this one at all.
 *
 * An agent-writable file cannot be an authority selector. Authenticating it
 * would mean an app-owned id -> path index in user-data plus a rule for what to
 * do when the two disagree - machinery whose whole purpose is to re-earn a
 * property the path already has for free.
 *
 * WHY THE PATH IS THE HONEST KEY ANYWAY. A folder grant is filesystem
 * authority: it says "the agent working HERE may also read THERE". Identifying
 * the "here" by filesystem location is the same kind of fact as the grant
 * itself. The workspace path is fixed by the host when the session is created
 * and is not something the agent can restate.
 *
 * WHAT THIS COSTS, STATED PLAINLY. Move or rename a workspace and its grants
 * stop applying - including a Wayland-ALLOCATED one, which the marker used to
 * carry across a move. That fails in the safe direction: a grant goes missing,
 * none is inherited. For an attended chat re-granting is one card away. For an
 * unattended run it is a refused read, which is the same dead end the user
 * would hit if they had never granted the folder - never a silent widening.
 *
 * `path.resolve` and NOT `fs.realpath`, deliberately. `pathsEqual` in
 * `folderGrantRoots.ts` is what matches this key's folder against a live
 * session's workspace when Settings revokes a grant, and it compares with
 * `path.resolve` too. Canonicalising only here would make `/tmp/ws` and
 * `/private/tmp/ws` name one bucket that the live revoke could no longer find.
 */

import path from 'node:path';

/**
 * The one namespace folder-grant keys live in.
 *
 * Kept as a prefix rather than dropped now the marker space is gone, for two
 * reasons: it is what `resolveFolderGrantWorkspaces` reads the folder back out
 * of, and it keeps a legacy `marker:` entry in an existing grants file
 * unresolvable rather than accidentally re-interpreted as a path.
 */
export const FOLDER_GRANT_PATH_KEY_PREFIX = 'path:';

/**
 * Resolve the folder-grant key for `workspaceDir`, or `null` when there is no
 * honest one - an absent or relative workspace path. `null` means "do not
 * persist", never "persist under a guessed key": a grant filed under the wrong
 * workspace is a grant the wrong session would replay.
 *
 * Async because every caller awaits it and the workspace key is the kind of
 * thing that may yet need to touch the filesystem; the marker read it used to
 * do is gone on purpose.
 */
export async function resolveFolderGrantWorkspaceId(workspaceDir: string): Promise<string | null> {
  if (typeof workspaceDir !== 'string' || workspaceDir.length === 0) return null;
  if (!path.isAbsolute(workspaceDir)) return null;

  return `${FOLDER_GRANT_PATH_KEY_PREFIX}${path.resolve(workspaceDir)}`;
}
