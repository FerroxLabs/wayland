/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The ONE gate a folder root passes through before Wayland hands it to anyone -
 * the durable list, or an engine on the wire.
 *
 * WHY THIS EXISTS AS ITS OWN FUNCTION. It used to be inlined in
 * `WorkspaceFolderGrantStore.add` and nowhere else, so "may this root be
 * persisted?" was answered and "may this root be GRANTED?" was never asked. An
 * external audit walked straight through the gap: the consent card sent
 * `always_path` the instant the user clicked, and the classifier was reached
 * only by the fire-and-forget persist that explicitly does not gate the
 * approval. A root Wayland refuses to remember was still a root Wayland handed
 * to the engine for the rest of the session.
 *
 * WHY THE ENGINE CANNOT COVER FOR US. Core refuses `/`, `$HOME` or an ancestor
 * of it, and a credential list (`.ssh`, `.gnupg`, `.aws`, `.config/gh`,
 * `/Library/Keychains`, ...) - see `crates/wcore-tools/src/workspace_policy.rs`.
 * It has never heard of Wayland's own user-data directory, which is a host-only
 * concept and holds `wayland-config.txt` (the provider config) and the Electron
 * `safeStorage` material. An agent asking to read a file in there raises an
 * ordinary boundary card naming an ordinary-looking folder, and Core accepts
 * the grant. `waylandPrivateRoots` is the part of the check that only the host
 * can make, which is exactly why the host must make it on the LIVE path too.
 *
 * FAIL CLOSED. When the context cannot be enumerated we cannot show a root is
 * NOT part of Wayland's own storage, so the root is refused as if it were.
 */

import { classifyFolderGrantRoot, type FolderGrantRootCheck, type FolderGrantRootContext } from './folderGrantRoots';

/**
 * Decide whether `root` may be handed out, and return the canonical directory
 * that would be.
 *
 * `resolveContext` is a REQUIRED parameter rather than a default import so this
 * module depends on nothing but the classifier - the durable store owns the
 * production context and passes its own, which is also what keeps its tests
 * able to substitute one.
 */
export async function vetFolderGrantRoot(
  root: unknown,
  resolveContext: () => Promise<FolderGrantRootContext>
): Promise<FolderGrantRootCheck> {
  let context: FolderGrantRootContext;
  try {
    context = await resolveContext();
  } catch {
    return { ok: false, refusal: 'wayland_private' };
  }
  return classifyFolderGrantRoot(root, context);
}
