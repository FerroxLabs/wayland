/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * User-approved destination directories for renderer-facing write operations
 * that legitimately target locations OUTSIDE the app's authorized roots.
 *
 * The export ("save conversation as zip") feature lets the user pick an
 * arbitrary destination folder via the native OS directory dialog, or falls
 * back to the Desktop. Those destinations are inherently outside the config /
 * data / temp roots that {@link confinePath} confines to, so a blanket app-root
 * confinement on the zip destination would break the feature.
 *
 * The real threat is a COMPROMISED RENDERER calling `createZip` with an
 * arbitrary `path` (e.g. `~/.zshrc`, `/etc/cron.d/...`) to gain an
 * arbitrary-write primitive WITHOUT any user dialog. The defense here is an
 * allowlist that is populated ONLY from main-mediated, user-initiated sources:
 *  - directories the user selects through the native open dialog (which runs in
 *    MAIN and cannot be spoofed by the renderer), and
 *  - the Desktop default path resolved in MAIN.
 *
 * A write destination is accepted only if it is inside one of these approved
 * directories. The renderer can never add to this set directly.
 */

import path from 'path';
import { realpathSync } from 'fs';

/** Maximum number of approved directories retained, FIFO-evicted past the cap. */
const MAX_APPROVED_DIRECTORIES = 64;

/**
 * Resolved absolute approved directory paths. Insertion order is preserved by
 * Set, which lets us evict the oldest entry when the cap is exceeded.
 */
const approvedDirectories = new Set<string>();

/**
 * Resolve a directory path to an absolute form, collapsing symlinks via
 * realpath when the directory exists. Falls back to the lexically resolved
 * path when it does not exist yet (the user may pick a folder the dialog just
 * created, or a path realpath cannot reach).
 */
function resolveDirectory(dir: string): string | null {
  let resolved: string;
  try {
    resolved = path.resolve(dir);
  } catch {
    return null;
  }
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

/**
 * Register a directory the user has explicitly approved as a write destination
 * (via the native dialog or the MAIN-resolved Desktop default). Tolerates
 * invalid / non-existent input without throwing. Caps the set size with FIFO
 * eviction so an unbounded dialog history cannot grow memory without limit.
 *
 * @param dir - Absolute directory path approved by a main-side, user-initiated
 *   action. Must NOT originate from renderer-controlled data.
 */
export function registerApprovedDirectory(dir: string): void {
  if (typeof dir !== 'string' || dir.trim().length === 0) return;
  const resolved = resolveDirectory(dir.trim());
  if (resolved === null) return;

  // Re-insert to refresh recency: delete first so the entry moves to the tail
  // of the insertion order, keeping recently-used directories from being
  // evicted before stale ones.
  approvedDirectories.delete(resolved);
  approvedDirectories.add(resolved);

  while (approvedDirectories.size > MAX_APPROVED_DIRECTORIES) {
    const oldest = approvedDirectories.values().next().value;
    if (oldest === undefined) break;
    approvedDirectories.delete(oldest);
  }
}

/** True when `child` is `root` itself or nested beneath it (separator-aware). */
function isInsideDirectory(root: string, child: string): boolean {
  const rel = path.relative(root, child);
  // Empty rel => identical path. A rel that starts with '..' or is absolute
  // means child escapes root. This is separator-aware and rejects the
  // sibling-prefix false positive (`/a/bc` vs `/a/b`) that a raw string prefix
  // check would accept.
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Resolve `targetPath` to its realpath-collapsed absolute form when it falls
 * inside any user-approved directory, or `null` when it does not.
 *
 * Resolves the target first (collapsing `..` and, when the path exists,
 * symlinks) before comparing, so a traversal or symlinked path cannot smuggle a
 * write outside an approved directory. Callers MUST operate on the returned
 * (resolved) path, not the raw input - this collapses an in-approved-dir
 * symlink to its real target so the path validated is the path touched (TOCTOU
 * / symlink-follow defense).
 *
 * @param targetPath - The renderer-supplied destination path to validate.
 * @returns The resolved absolute path when inside an approved directory, else
 *   `null` (fail closed).
 */
export function resolveWithinApprovedDirectory(targetPath: unknown): string | null {
  if (typeof targetPath !== 'string' || targetPath.trim().length === 0) return null;
  if (approvedDirectories.size === 0) return null;

  let resolved: string;
  try {
    resolved = path.resolve(targetPath.trim());
  } catch {
    return null;
  }
  // Collapse symlinks on the nearest existing ancestor so an in-approved-dir
  // symlink cannot redirect the write outside it. A non-existent destination
  // (the common case: the zip file does not exist yet) keeps its parent's real
  // form via the directory walk below.
  const realResolved = realpathOfNearestExisting(resolved);

  for (const dir of approvedDirectories) {
    if (isInsideDirectory(dir, realResolved)) return realResolved;
  }
  return null;
}

/**
 * Resolve the realpath of the nearest existing ancestor of `target`, then
 * re-append the non-existent tail. Mirrors the confinement module's approach so
 * a symlinked ancestor cannot redirect an in-approved-dir path to an outside
 * target while still allowing not-yet-created destination files.
 */
function realpathOfNearestExisting(target: string): string {
  let current = target;
  const tail: string[] = [];
  for (;;) {
    try {
      const real = realpathSync(current);
      return tail.length === 0 ? real : path.join(real, ...tail.reverse());
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return target;
      tail.push(path.basename(current));
      current = parent;
    }
  }
}
