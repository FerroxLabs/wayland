/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import { realpathSync } from 'fs';
import path from 'path';
import os from 'os';
import { getConfigPath, getDataPath, getTempPath } from '@process/utils';
import { getDatabase } from '@process/services/database';

/**
 * Authorized-roots filesystem confinement for the renderer-facing `fs.*` IPC
 * providers (read/write/delete/rename). The bridge allowlist only validates the
 * IPC *event name*, never the arguments, so a renderer-context XSS - or an
 * authenticated remote WebUI client that shares the same dispatch - can hand a
 * provider any absolute path the OS user can reach (`~/.ssh/id_rsa`,
 * `~/.zshrc`, the SQLite DB, `/etc/passwd`). This module gates every such path
 * against the set of directories the app legitimately operates inside.
 *
 * Roots:
 *  - Static app roots: the config dir, the agent work dir, the OS temp dir, and
 *    the user's Desktop/Downloads/Documents (legitimate upload/export/preview
 *    targets). These are seeded once.
 *  - Registered roots: workspace/project directories that legitimately enter
 *    the main process (e.g. via `createUploadFile`) call
 *    `registerAuthorizedRoot`. Conversation workspaces can live anywhere the
 *    user chose, so they cannot be statically allow-listed.
 *  - DB-discovered workspaces: on a miss, the conversation `extra.workspace`
 *    values are read from the database (cached) and registered, so legitimate
 *    workspace reads/writes are never broken even when the renderer did not
 *    pre-register the root.
 *
 * Anything that escapes every authorized root, or that targets a known
 * credential location, or that uses a traversal/UNC/device/ADS path form, is
 * rejected.
 */

/** TTL for the cached DB-workspace discovery, in milliseconds. */
const WORKSPACE_DISCOVERY_TTL_MS = 30_000;

/** Authorized root directories, stored as resolved absolute paths. */
const authorizedRoots = new Set<string>();

/** Whether the static app roots have been seeded into `authorizedRoots`. */
let staticRootsSeeded = false;

/** Timestamp of the last DB-workspace discovery, for TTL throttling. */
let lastWorkspaceDiscoveryAt = 0;

/**
 * Sensitive directory/file basenames that must never be reachable through the
 * renderer fs.* providers even if they happen to sit under an authorized root
 * (e.g. a workspace mistakenly opened at the home directory). Defense in depth
 * against credential exfiltration.
 */
const SENSITIVE_SEGMENTS = new Set([
  '.ssh',
  '.aws',
  '.gnupg',
  '.gpg',
  '.docker',
  '.kube',
  '.netrc',
  '.npmrc',
  '.pypirc',
  '.git-credentials',
]);

/**
 * Add a directory to the authorized-roots set after resolving it. Also registers
 * the realpath target when it differs, so a root that is itself a symlink (e.g.
 * the macOS CLI-safe `~/.wayland` symlink, whose real target the OS file picker
 * returns) is matched whether the candidate arrives in symlink or real form.
 */
function addRoot(dir: string | undefined | null): void {
  if (!dir) return;
  let resolved: string;
  try {
    resolved = path.resolve(dir);
  } catch {
    return;
  }
  authorizedRoots.add(resolved);
  try {
    const real = realpathSync(resolved);
    if (real !== resolved) authorizedRoots.add(real);
  } catch {
    // Root may not exist yet; the resolved form is still registered.
  }
  // Also register the OS-canonical (libuv) form. On Windows, candidate paths are
  // canonicalized with fs/promises.realpath (GetFinalPathNameByHandle), which
  // expands 8.3 short names (e.g. `RUNNER~1` -> `runneradmin`) to the long form;
  // the pure-JS `realpathSync` above does NOT, so a root seeded from the short
  // form would never match a candidate resolved to the long form. realpathSync.native
  // uses the same libuv canonicalization as the candidate side, closing that gap.
  // Same real directory, different name encoding - no widening of the authorized set.
  try {
    const realNative = realpathSync.native(resolved);
    authorizedRoots.add(realNative);
  } catch {
    // Root may not exist yet, or native realpath is unavailable; the forms above apply.
  }
}

/**
 * Register an authorized root directory. Call this wherever a workspace or
 * project directory legitimately enters the main process so subsequent
 * confinement checks accept paths inside it.
 *
 * @param dir - Absolute directory path to authorize.
 */
export function registerAuthorizedRoot(dir: string): void {
  addRoot(dir);
}

/** Seed the static app roots once. Idempotent. */
function ensureStaticRoots(): void {
  if (staticRootsSeeded) return;
  staticRootsSeeded = true;

  // Config dir (getSystemDir().cacheDir) and agent work dir
  // (getSystemDir().workDir) are the symlink-safe equivalents of these getters.
  try {
    addRoot(getConfigPath());
    addRoot(getDataPath());
  } catch {
    // Path getters may not be ready in some standalone init orders; the temp
    // and home roots below still apply.
  }

  addRoot(getTempPath());
  addRoot(os.tmpdir());

  const home = os.homedir();
  if (home) {
    addRoot(path.join(home, 'Desktop'));
    addRoot(path.join(home, 'Downloads'));
    addRoot(path.join(home, 'Documents'));
  }
}

/**
 * Lazily discover conversation workspace directories from the database and
 * register them as authorized roots. Throttled by TTL so a miss does not hammer
 * the DB on every call. Safe to call frequently; failures are swallowed.
 */
async function discoverWorkspaceRoots(): Promise<void> {
  const now = Date.now();
  if (now - lastWorkspaceDiscoveryAt < WORKSPACE_DISCOVERY_TTL_MS) return;
  lastWorkspaceDiscoveryAt = now;

  try {
    const db = await getDatabase();
    const pageSize = 200;
    let page = 0;
    let hasMore = true;
    while (hasMore) {
      const result = db.getUserConversations(undefined, page, pageSize);
      for (const conversation of result.data) {
        const extra = conversation.extra as { workspace?: string } | undefined;
        if (extra?.workspace) addRoot(extra.workspace);
      }
      hasMore = result.hasMore;
      page += 1;
      // Bound the scan so a very large history cannot stall a single fs op.
      if (page > 50) break;
    }
  } catch {
    // DB not ready or query failed - fall back to the static/registered roots.
  }
}

/**
 * Reject path forms that are inherently unsafe before any resolution:
 * Windows UNC (`\\host\share`), device namespace (`\\?\`, `\\.\`), NTFS
 * alternate data streams (`name:stream`), and NUL bytes. Returns true when the
 * raw input must be rejected outright.
 */
function hasUnsafePathForm(raw: string): boolean {
  if (raw.length === 0) return true;
  // NUL byte - truncation attacks.
  if (raw.includes('\0')) return true;

  // Normalize separators for the UNC/device check.
  const slashed = raw.replace(/\\/g, '/');
  // UNC and Windows device paths (\\?\, \\.\, \\server\share).
  if (slashed.startsWith('//')) return true;

  // NTFS alternate data streams: a colon that is NOT the drive-letter colon
  // (e.g. `C:\file.txt:secret` or `file.txt:secret`). Allow exactly one colon
  // at index 1 following a drive letter.
  const driveColon = /^[A-Za-z]:[\\/]/.test(raw) || /^[A-Za-z]:$/.test(raw);
  const colonIndex = raw.indexOf(':');
  if (colonIndex !== -1) {
    const isDriveColon = driveColon && colonIndex === 1;
    if (!isDriveColon) return true;
    // A second colon after the drive colon is an ADS.
    if (raw.indexOf(':', colonIndex + 1) !== -1) return true;
  }

  return false;
}

/**
 * Reject any path segment that ends in a dot or space (Windows strips these,
 * letting `secret.txt ` resolve to `secret.txt` and defeating suffix checks),
 * or that is a parent-traversal segment.
 */
function hasUnsafeSegment(resolved: string): boolean {
  const segments = resolved.split(/[\\/]+/);
  for (const segment of segments) {
    if (segment === '..') return true;
    if (segment.length > 0 && /[ .]$/.test(segment) && segment !== '.' && segment !== '..') {
      return true;
    }
  }
  return false;
}

/** True when `child` is `root` itself or nested beneath it. */
function isInsideRoot(root: string, child: string): boolean {
  const rel = path.relative(root, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** True when any segment of the resolved path is a sensitive credential dir. */
function touchesSensitiveSegment(resolved: string): boolean {
  const segments = resolved.split(/[\\/]+/).filter(Boolean);
  return segments.some((segment) => SENSITIVE_SEGMENTS.has(segment.toLowerCase()));
}

/**
 * Resolve the realpath of the nearest existing ancestor of `resolved`, then
 * re-append the non-existent tail. This collapses symlinks so a symlinked
 * ancestor cannot redirect an in-root path to an out-of-root target, while
 * still allowing writes that create new files/dirs.
 */
async function realpathExistingPrefix(resolved: string): Promise<string> {
  let current = resolved;
  const tail: string[] = [];
  // Walk up until an existing ancestor is found (or we hit the filesystem root).
  for (;;) {
    try {
      const real = await fs.realpath(current);
      return tail.length === 0 ? real : path.join(real, ...tail.toReversed());
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        // Reached the root with nothing existing; return the resolved form.
        return resolved;
      }
      tail.push(path.basename(current));
      current = parent;
    }
  }
}

/**
 * Confine a renderer-supplied filesystem path to the app's authorized roots.
 *
 * @param rawPath - The path string as received from the renderer/WebUI.
 * @param opts.allowOutsideRoots - When true, a path that passes every
 *   form/traversal/symlink/sensitive-location guard is accepted even if it is
 *   not inside a registered root. Reserved for an explicit local user gesture
 *   (a drag-drop / paste of a specific file) on a remote-denied IPC; it only
 *   widens the permitted *source location*, never the dangerous-path checks.
 * @returns The fully resolved, realpath-collapsed absolute path when it is safe
 *   to operate on, or `null` when the path must be rejected (out of every
 *   authorized root, a traversal/UNC/device/ADS form, or a sensitive location).
 */
export async function confinePath(
  rawPath: unknown,
  opts?: { allowOutsideRoots?: boolean }
): Promise<string | null> {
  if (typeof rawPath !== 'string') return null;

  const raw = rawPath.trim();
  if (hasUnsafePathForm(raw)) return null;

  ensureStaticRoots();

  let resolved: string;
  try {
    resolved = path.resolve(raw);
  } catch {
    return null;
  }

  if (hasUnsafeSegment(resolved)) return null;
  if (touchesSensitiveSegment(resolved)) return null;

  // Collapse symlinks on the existing prefix so an in-root symlink cannot point
  // out of the authorized roots.
  const real = await realpathExistingPrefix(resolved);
  if (hasUnsafeSegment(real)) return null;
  if (touchesSensitiveSegment(real)) return null;

  if (isAuthorized(real)) return real;

  // Miss: a legitimate workspace may not have been registered yet. Discover
  // conversation workspaces from the DB (throttled) and retry once.
  await discoverWorkspaceRoots();
  if (isAuthorized(real)) return real;

  // An explicit user gesture (drag-drop / paste of a specific file) authorizes
  // THAT file even outside the static roots. Every form/traversal/symlink/
  // sensitive-location guard above has already passed, so a secret like
  // ~/.ssh/id_rsa is still rejected; this only widens where a deliberately
  // chosen file may be read from. Opted into solely by the remote-denied
  // copy-files-to-workspace path.
  if (opts?.allowOutsideRoots) return real;

  console.warn(`[pathConfinement] Rejected out-of-root fs path: ${resolved}`);
  return null;
}

/** True when `candidate` is inside any currently authorized root. */
function isAuthorized(candidate: string): boolean {
  for (const root of authorizedRoots) {
    if (isInsideRoot(root, candidate)) return true;
  }
  return false;
}
