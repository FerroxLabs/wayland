/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1106 - which project the wiki is allowed to WRITE into.
 *
 * Both wiki write sites resolve a destination the same way: take `getProjects()`,
 * sort by `lastActive`, use the first row. That list is assembled from
 * `~/.ijfw/registry.md`, a plain text file the IJFW CLI appends to, plus the home
 * directory injected as an ordinary candidate (#137). Neither source is a
 * statement that the path is a place Wayland may create files.
 *
 * The reported failure is `EPERM: operation not permitted, mkdir
 * 'C:\Program Files\Wayland\.ijfw\wiki-state'`. On the reporter's version the
 * cause was a `process.cwd()` fallback, since removed: a packaged Windows app
 * launched from its shortcut has `cwd` = its own install directory. The fallback
 * is gone, but the destination is still taken at face value, so a registry row
 * pointing at an install root - which is exactly what running the CLI from the
 * app folder writes - reproduces the same EPERM. A destination the OS refuses is
 * not a project.
 *
 * This is a WRITE-side filter only. The Memory tab still browses the global store
 * and anything else the index holds; nothing here narrows what can be READ.
 *
 * The root lists are deliberately NOT the ones in `ijfwDropBridge.ts`. That file
 * is answering "may the renderer hand me a file from here", so it includes
 * writable-but-sensitive trees (`/tmp`, `/private`, `/var`). This one is
 * answering "may I create a directory here", so those are absent - `/var/folders`
 * is macOS's temp root and refusing it would refuse ordinary scratch projects.
 */

import path from 'node:path';

/** The shape this module needs from `ProjectSummary`; nothing more. */
export type WikiDestinationCandidate = {
  path: string;
  lastActive: number;
  /** Set by `buildIndex` for the home dir, whose `.ijfw/memory` IS the global store (#1064). */
  isGlobalStore?: boolean;
};

/**
 * OS-owned trees on POSIX. Matched as PREFIXES, because the reported path is a
 * SUBdirectory of one (`C:\Program Files\Wayland`, not `C:\Program Files`), and
 * the Windows list below has the same property.
 */
const POSIX_PROTECTED_ROOTS: readonly string[] = [
  '/Applications',
  '/Library',
  '/System',
  '/bin',
  '/boot',
  '/dev',
  '/etc',
  '/lib',
  '/lib64',
  '/opt',
  '/proc',
  '/run',
  '/sbin',
  '/snap',
  '/sys',
  '/usr',
];

/**
 * Windows system roots, read from the standard environment variables with the
 * conventional fallback, exactly as `ijfwDropBridge.windowsUnsafeRootPrefixes`
 * derives its own. `Program Files` is the one in the report.
 */
function windowsProtectedRoots(): string[] {
  const systemDrive = process.env.SystemDrive ?? 'C:';
  return [
    process.env.SystemRoot ?? `${systemDrive}\\Windows`,
    process.env.ProgramFiles ?? `${systemDrive}\\Program Files`,
    process.env['ProgramFiles(x86)'] ?? `${systemDrive}\\Program Files (x86)`,
    process.env.ProgramData ?? `${systemDrive}\\ProgramData`,
  ].map((root) => root.toLowerCase());
}

/** True when `candidate` is `root` or sits beneath it. */
function isAtOrUnder(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * True when creating `.ijfw/wiki-state` under `candidate` would be a write into
 * an OS-owned tree - the install directory included.
 *
 * A relative path is refused outright: it can only have come from launch context,
 * which is the same class of mistake the removed `process.cwd()` fallback was.
 */
export function isProtectedWriteRoot(candidate: string): boolean {
  if (!candidate || !path.isAbsolute(candidate)) return true;
  const resolved = path.resolve(candidate);
  // The volume root itself. Never a project, and on POSIX it is the one entry a
  // prefix match would turn into "refuse everything".
  if (resolved === path.parse(resolved).root) return true;

  if (process.platform === 'win32') {
    const normalized = resolved.toLowerCase();
    return windowsProtectedRoots().some((root) => isAtOrUnder(root, normalized));
  }
  return POSIX_PROTECTED_ROOTS.some((root) => isAtOrUnder(root, resolved));
}

/**
 * The most recently active project the wiki may write into, or `null`.
 *
 * `null` means DECLINE, never "fall back to something". Both callers already fail
 * closed on that - the sweep returns 0 and the bridge throws
 * `WIKI_NO_ACTIVE_PROJECT` - because the launch/process working directory is
 * launch context, not user-authorized project context.
 *
 * Two kinds of row are dropped:
 *  - the global memory store, which is the home directory and not a project at
 *    all (#1064: it is injected into the index by #137 and, being written by
 *    every quick-add and importer, is almost always the newest row);
 *  - anything under an OS-protected root (#1106).
 */
export function selectWikiProjectPath(projects: ReadonlyArray<WikiDestinationCandidate>): string | null {
  const eligible = projects.filter((entry) => entry.isGlobalStore !== true && !isProtectedWriteRoot(entry.path));
  if (eligible.length === 0) return null;
  return eligible.toSorted((a, b) => b.lastActive - a.lastActive)[0].path;
}
