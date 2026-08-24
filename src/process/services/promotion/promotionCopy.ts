/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Promotion copy semantics (protocol rules 5 and 6).
 *
 * "Copy the workspace" is the operation in this milestone that can lose a
 * user's only copy of a report, so every case is decided here rather than left
 * to whatever `cp -R` happens to do:
 *
 *  - `lstat`, never `stat`. A link is never followed.
 *  - A symlink pointing OUTSIDE the source root aborts the whole copy. It is
 *    the one case where continuing would pull bytes the user never put in the
 *    workspace into a folder we are about to call theirs.
 *  - A symlink pointing inside, and any non-regular file (fifo, socket,
 *    device), is skipped and REPORTED. Silently dropping them is how a
 *    "successful" promotion loses something.
 *  - A hardlinked regular file is copied as an independent file; the link
 *    count is not preserved, and that is deliberate - the copy is a new tree.
 *  - Verification is a canonical manifest of type, relative path, mode, size
 *    and sha256. A file count is not verification: `diffManifests` reports
 *    `sha256 differs` for a tree with the identical shape and different bytes.
 *
 * `verifyDirectoryFiles` in `@process/utils` was the obvious thing to reuse and
 * cannot be: it returns false on ANY symlink, so a legitimate workspace (the
 * engine leaves them behind) would be indistinguishable from a corrupted copy.
 */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

/** Attempts per file before drift is treated as a real failure (rule 6). */
const DEFAULT_MAX_DRIFT_RETRIES = 3;
/** Base wait between drift retries; grows linearly with the attempt. */
const DEFAULT_QUIESCE_MS = 200;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class EscapingSymlinkError extends Error {}
export class DigestDriftError extends Error {}

export type CopyManifestEntry = Readonly<{
  relPath: string;
  type: 'file' | 'directory';
  mode: number;
  size: number;
  sha256: string | null;
}>;

export type SkippedEntry = Readonly<{ relPath: string; reason: 'symlink' | 'non-regular' }>;

export type CopyTreeResult = Readonly<{
  manifest: readonly CopyManifestEntry[];
  skipped: readonly SkippedEntry[];
}>;

export type CopyTreeOptions = {
  exclude?: (relPath: string) => boolean;
  maxDriftRetries?: number;
  quiesceMs?: number;
  hooks?: { afterCopyAttempt?: (relPath: string, attempt: number) => Promise<void> | void };
};

async function digestFile(file: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

function isInside(root: string, candidate: string): boolean {
  const r = path.resolve(root);
  const c = path.resolve(candidate);
  return c === r || c.startsWith(r.endsWith(path.sep) ? r : r + path.sep);
}

const toRel = (rel: string): string => rel.split(path.sep).join('/');

export async function buildTreeManifest(
  root: string,
  options: Pick<CopyTreeOptions, 'exclude'> = {}
): Promise<{ manifest: CopyManifestEntry[]; skipped: SkippedEntry[] }> {
  const manifest: CopyManifestEntry[] = [];
  const skipped: SkippedEntry[] = [];
  await walkTree(root, '', options.exclude, {
    onDirectory: async (rel, st) => {
      manifest.push({ relPath: rel, type: 'directory', mode: st.mode & 0o7777, size: 0, sha256: null });
    },
    onFile: async (rel, st, abs) => {
      manifest.push({
        relPath: rel,
        type: 'file',
        mode: st.mode & 0o7777,
        size: st.size,
        sha256: await digestFile(abs),
      });
    },
    onSkipped: (entry) => skipped.push(entry),
  });
  return { manifest, skipped };
}

type WalkHandlers = {
  onDirectory: (rel: string, st: import('node:fs').Stats, abs: string) => Promise<void>;
  onFile: (rel: string, st: import('node:fs').Stats, abs: string) => Promise<void>;
  onSkipped: (entry: SkippedEntry) => void;
};

async function walkTree(
  root: string,
  relDir: string,
  exclude: ((relPath: string) => boolean) | undefined,
  handlers: WalkHandlers
): Promise<void> {
  const absDir = relDir ? path.join(root, relDir) : root;
  const entries = (await fs.readdir(absDir)).toSorted();
  for (const name of entries) {
    const rel = toRel(relDir ? path.join(relDir, name) : name);
    if (exclude?.(rel)) continue;
    const abs = path.join(root, rel);
    const st = await fs.lstat(abs);
    if (st.isSymbolicLink()) {
      const target = await fs.readlink(abs);
      const resolved = path.resolve(path.dirname(abs), target);
      if (!isInside(root, resolved)) {
        throw new EscapingSymlinkError(`symlink escapes the workspace: ${rel} -> ${target}`);
      }
      handlers.onSkipped({ relPath: rel, reason: 'symlink' });
      continue;
    }
    if (st.isDirectory()) {
      await handlers.onDirectory(rel, st, abs);
      await walkTree(root, rel, exclude, handlers);
      continue;
    }
    if (st.isFile()) {
      await handlers.onFile(rel, st, abs);
      continue;
    }
    handlers.onSkipped({ relPath: rel, reason: 'non-regular' });
  }
}

/**
 * Rule 6: a file being appended while we read it makes the copy disagree with
 * the source, which is NOT corruption and must not fail the promotion forever.
 * Copy, compare source against destination, and on a mismatch wait for the
 * writer to quiesce and copy again. Only an exhausted budget is an error.
 */
export async function copyFileWithQuiesce(
  abs: string,
  target: string,
  rel: string,
  options: CopyTreeOptions
): Promise<string> {
  const maxRetries = options.maxDriftRetries ?? DEFAULT_MAX_DRIFT_RETRIES;
  const quiesceMs = options.quiesceMs ?? DEFAULT_QUIESCE_MS;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    await fs.copyFile(abs, target);
    await options.hooks?.afterCopyAttempt?.(rel, attempt);
    // Re-read the SOURCE after the copy: that is what catches an append that
    // landed while copyFile was streaming.
    const [sourceDigest, destDigest] = await Promise.all([digestFile(abs), digestFile(target)]);
    if (sourceDigest === destDigest) return destDigest;
    if (attempt < maxRetries) await sleep(quiesceMs * (attempt + 1));
  }
  throw new DigestDriftError(`source kept changing during the copy: ${rel}`);
}

export async function copyTreeVerified(
  source: string,
  dest: string,
  options: CopyTreeOptions = {}
): Promise<CopyTreeResult> {
  const manifest: CopyManifestEntry[] = [];
  const skipped: SkippedEntry[] = [];
  await fs.mkdir(dest, { recursive: true });

  await walkTree(source, '', options.exclude, {
    onDirectory: async (rel, st) => {
      await fs.mkdir(path.join(dest, rel), { recursive: true });
      await fs.chmod(path.join(dest, rel), st.mode & 0o7777);
      manifest.push({ relPath: rel, type: 'directory', mode: st.mode & 0o7777, size: 0, sha256: null });
    },
    onFile: async (rel, st, abs) => {
      const target = path.join(dest, rel);
      const digest = await copyFileWithQuiesce(abs, target, rel, options);
      const finalStat = await fs.stat(abs);
      await fs.chmod(target, finalStat.mode & 0o7777);
      manifest.push({
        relPath: rel,
        type: 'file',
        mode: finalStat.mode & 0o7777,
        size: (await fs.stat(target)).size,
        sha256: digest,
      });
    },
    onSkipped: (entry) => skipped.push(entry),
  });

  return { manifest, skipped };
}

export function diffManifests(expected: readonly CopyManifestEntry[], actual: readonly CopyManifestEntry[]): string[] {
  const problems: string[] = [];
  const actualByPath = new Map(actual.map((e) => [e.relPath, e]));
  for (const want of expected) {
    const got = actualByPath.get(want.relPath);
    if (!got) {
      problems.push(`${want.relPath}: missing`);
      continue;
    }
    actualByPath.delete(want.relPath);
    if (got.type !== want.type) problems.push(`${want.relPath}: type differs`);
    else if (got.mode !== want.mode) problems.push(`${want.relPath}: mode differs`);
    else if (got.size !== want.size) problems.push(`${want.relPath}: size differs`);
    else if (got.sha256 !== want.sha256) problems.push(`${want.relPath}: sha256 differs`);
  }
  for (const extra of actualByPath.keys()) problems.push(`${extra}: unexpected`);
  return problems.toSorted();
}
