/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The key a workspace's folder grants are filed under.
 *
 * `WorkspaceFolderGrantStore` is keyed by workspace id and not by path, because
 * a folder can be renamed or moved and the user's decision should follow it.
 * That id comes from the workspace identity marker (`.wayland-workspace.json`).
 *
 * ⚠️ BUT MOST WORKSPACES HAVE NO MARKER. It is written only where Wayland
 * ALLOCATES the folder - durable cron-task workspaces (`durableTaskWorkspace`)
 * and projects (`projectWorkspace`). An ordinary chat whose workspace the user
 * picked in a file dialog carries none, and never will. Requiring a marker
 * would make "remember this folder" a button that silently does nothing for the
 * majority of chats, which is worse than a weaker key.
 *
 * So: marker id when there is one, resolved path when there is not. The two
 * live in SEPARATE NAMESPACES (`marker:` / `path:`) and that prefix is not
 * cosmetic. The marker file sits INSIDE the workspace, which the agent can
 * write; without the prefixes an agent could author a marker whose id is
 * literally another workspace's path key and inherit that workspace's grant
 * list. Prefixing makes the two spaces disjoint by construction, so a forged
 * marker can only ever name another MARKED workspace - whose id is a random
 * UUID stored in a file the boundary already keeps it out of.
 *
 * WHAT THE PATH FALLBACK COSTS, stated plainly: rename or move an unmarked
 * workspace and its grants stop applying. That fails in the safe direction - a
 * grant goes missing, none is invented - and re-granting is one card away.
 */

import path from 'node:path';
import { readWorkspaceMarker } from '@process/services/workspaceIdentity';

/**
 * Resolve the folder-grant key for `workspaceDir`, or `null` when there is no
 * honest one - an absent or relative workspace path. `null` means "do not
 * persist", never "persist under a guessed key": a grant filed under the wrong
 * workspace is a grant the wrong session would replay.
 */
export async function resolveFolderGrantWorkspaceId(workspaceDir: string): Promise<string | null> {
  if (typeof workspaceDir !== 'string' || workspaceDir.length === 0) return null;
  if (!path.isAbsolute(workspaceDir)) return null;

  const marker = await readWorkspaceMarker(workspaceDir);
  if (marker) return `marker:${marker.workspaceId}`;
  return `path:${path.resolve(workspaceDir)}`;
}
