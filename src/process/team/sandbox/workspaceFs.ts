/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4b - Workspace FS sandbox for imported teams.
 *
 * Provides `openInsideWorkspace` + `withOpenInsideWorkspace`: validate a
 * sandboxed-team workspace FS path, then atomically open it with
 * `O_NOFOLLOW` + return a `FileHandle` so consumers operate on the open
 * fd (eliminating the check-then-use TOCTOU window for the FINAL path
 * component).
 *
 * Layered defenses (TRIAGE round-3 CRIT + round-4 + round-5 follow-ups):
 *   1. `path.resolve` + `path.relative` reject - escapes workspace
 *   2. ancestor `lstat`-walk - no symlinks anywhere in pre-existing path
 *   3. NFKC + case-insensitive segment denylist - `.env` / `.ENV` /
 *      `．env` (fullwidth) / `.eNv` / `.ssh` / `node_modules/.cache` /
 *      `node_modules/.bin`
 *   4. `O_NOFOLLOW` on `fs.open` - atomic final-component symlink rejection
 *
 * **Residual TOCTOU window:** between ancestor `lstat`-walk completion and
 * `fs.open` there is a ~microsecond window in which an attacker could swap
 * an ancestor to a symlink. `O_NOFOLLOW` only protects the FINAL component
 * on Linux/macOS. Node does NOT expose `openat()`, so a truly sub-
 * microsecond-safe sandbox would require a different runtime or process-
 * level isolation (chroot, AppArmor, sandbox-exec) and is deferred to a
 * future iteration. Mitigated by the attacker model: imported-team agents
 * run with rate-limited IPC, cannot reliably win a microsecond race in
 * practice.
 *
 * Callers MUST prefer `withOpenInsideWorkspace` over `openInsideWorkspace`
 * directly so the wrapper guarantees `fh.close()` in `finally`.
 */

import { promises as fs, constants } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { TeamSandboxedError } from '@process/team/importExport/errors';

const PROTECTED_EXACT = new Set(['.env', '.ssh']);
const PROTECTED_SEGMENT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['node_modules', '.cache'],
  ['node_modules', '.bin'],
];

const normalizeSegment = (s: string): string => s.normalize('NFKC').toLowerCase();

/**
 * Split a relative POSIX-or-Windows path into segments. We split on both
 * separators so a Windows-style request like `foo\.ENV` passed from a
 * cross-platform caller still trips the denylist regardless of the host
 * `path.sep`.
 */
function splitSegments(rel: string): string[] {
  return rel.split(/[\\/]/).filter(Boolean);
}

function rejectProtectedSegments(rel: string, segments: string[]): void {
  const normalized = segments.map(normalizeSegment);
  if (normalized.some((s) => PROTECTED_EXACT.has(s))) {
    throw new TeamSandboxedError(`Protected segment in path: ${rel}`);
  }
  for (const pair of PROTECTED_SEGMENT_PAIRS) {
    for (let i = 0; i + pair.length <= normalized.length; i++) {
      let match = true;
      for (let j = 0; j < pair.length; j++) {
        if (normalized[i + j] !== pair[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        throw new TeamSandboxedError(`Protected segment sequence in path: ${rel}`);
      }
    }
  }
}

/**
 * Validate a sandboxed-team workspace FS path, then atomically open it
 * with `O_NOFOLLOW` + fd-based handle. Returns the `FileHandle` (NOT a
 * path string) so consumers operate on the open fd, eliminating the
 * check-then-use TOCTOU window for the FINAL path component.
 *
 * Caller MUST use the returned FileHandle for the FS op (NOT re-open
 * the path by string). Caller is responsible for `fh.close()` in a
 * try/finally - prefer `withOpenInsideWorkspace` which does this
 * automatically.
 */
export async function openInsideWorkspace(
  workspaceDir: string,
  requested: string,
  mode: 'read' | 'write' | 'mkdir'
): Promise<FileHandle> {
  const absWorkspace = path.resolve(workspaceDir);
  const absRequested = path.resolve(absWorkspace, requested);

  const relFromWorkspace = path.relative(absWorkspace, absRequested);
  if (relFromWorkspace.startsWith('..') || path.isAbsolute(relFromWorkspace)) {
    throw new TeamSandboxedError(`Path escapes workspace: ${requested}`);
  }

  // Cross-platform: also split the raw requested string so `foo\.ENV` is
  // rejected on POSIX hosts where `path.sep === '/'` and the resolve step
  // would otherwise treat `\` as a literal filename byte.
  const segments = splitSegments(relFromWorkspace);
  const requestedSegments = splitSegments(requested);
  rejectProtectedSegments(relFromWorkspace, segments);
  rejectProtectedSegments(requested, requestedSegments);

  // Ancestor lstat-walk - no symlinks anywhere in pre-existing path.
  // The walk is intentionally sequential: each stat depends on the
  // previous component existing, and a symlink at any depth must short-
  // circuit the loop before we examine deeper segments.
  let cursor = absWorkspace;
  for (const seg of segments) {
    cursor = path.join(cursor, seg);
    let stat: import('node:fs').Stats | undefined;
    try {
      // eslint-disable-next-line no-await-in-loop
      stat = await fs.lstat(cursor);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') break;
      const msg = e instanceof Error ? e.message : String(e);
      throw new TeamSandboxedError(`lstat failed on ${cursor}: ${msg}`);
    }
    if (stat.isSymbolicLink()) {
      throw new TeamSandboxedError(
        `Symlink rejected in sandbox path: ${cursor}. ` +
          `Sandboxed teams cannot traverse symlinks. Grant trust via Settings → Teams → Trust to enable.`
      );
    }
  }

  // mkdir branch - explicit capability path; no symlinks ahead of target so safe to create.
  if (mode === 'mkdir') {
    // Caller responsibility: ensure mkdir is gated by canWriteFiles capability.
    await fs.mkdir(absRequested, { recursive: false });
    // Open the just-created directory with O_NOFOLLOW for the return contract.
    return await fs.open(
      absRequested,
      constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW
    );
  }

  // For write: parent MUST exist (no auto-mkdir; caller must explicitly mkdir first).
  if (mode === 'write') {
    const parent = path.dirname(absRequested);
    try {
      await fs.access(parent);
    } catch {
      throw new TeamSandboxedError(
        `Parent directory must exist: ${parent}. Use mkdir capability to create it first.`
      );
    }
  }

  // O_NOFOLLOW on the open call - atomic final-component symlink rejection.
  const openFlags =
    mode === 'read'
      ? constants.O_RDONLY | constants.O_NOFOLLOW
      : constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW;
  try {
    return await fs.open(absRequested, openFlags);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ELOOP') {
      throw new TeamSandboxedError(`Symlink at target rejected: ${absRequested}`);
    }
    throw e;
  }
}

/**
 * Preferred entry point - caller passes a body fn that receives the
 * `FileHandle`; wrapper guarantees `fh.close()` in a `finally` so the
 * fd cannot leak (TRIAGE round-5 MED fix).
 */
export async function withOpenInsideWorkspace<T>(
  workspaceDir: string,
  requested: string,
  mode: 'read' | 'write' | 'mkdir',
  body: (fh: FileHandle) => Promise<T>
): Promise<T> {
  const fh = await openInsideWorkspace(workspaceDir, requested, mode);
  try {
    return await body(fh);
  } finally {
    await fh.close().catch(() => {
      /* swallow close-on-already-thrown */
    });
  }
}
