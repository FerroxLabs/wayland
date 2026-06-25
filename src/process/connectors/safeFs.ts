/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="node" />

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

type BackupOptions = {
  /**
   * Directory the resolved real target must stay within. Defaults to the
   * realpath-normalized parent of `configPath`. A target whose realpath escapes
   * this root is treated as a symlink-traversal attack and rejected.
   */
  allowedRoot?: string;
};

/**
 * Resolve `configPath` through symlinks and snapshot the REAL target's bytes to
 * `backupPath` atomically (temp sibling + rename).
 *
 * Security: the realpath of the target must stay within its expected home
 * directory (`opts.allowedRoot`, else the realpath-normalized parent of
 * `configPath`). If it escapes, we throw rather than copy a file the caller did
 * not mean to expose.
 *
 * ENOENT: a missing `configPath` is a valid "nothing to back up" case. We SKIP
 * writing the backup entirely and resolve without throwing.
 */
export async function backupRealTarget(
  configPath: string,
  backupPath: string,
  opts?: BackupOptions,
): Promise<void> {
  let realTarget: string;
  try {
    realTarget = await fs.realpath(configPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // Nothing to back up — skip silently.
      return;
    }
    throw err;
  }

  // Normalize the root the same way (realpath) so the comparison is apples to
  // apples even when the root itself is reached through a symlink (e.g. macOS
  // /tmp -> /private/tmp).
  const declaredRoot = opts?.allowedRoot ?? path.dirname(configPath);
  let realRoot: string;
  try {
    realRoot = await fs.realpath(declaredRoot);
  } catch {
    // If the declared root cannot be resolved, fall back to its literal form so
    // we still fail closed on an obvious escape.
    realRoot = path.resolve(declaredRoot);
  }

  const rel = path.relative(realRoot, realTarget);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(
      `Refusing to back up ${configPath}: real target ${realTarget} escapes allowed root ${realRoot}`,
    );
  }

  const bytes = await fs.readFile(realTarget);
  const tmp = `${backupPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tmp, bytes);
    await fs.rename(tmp, backupPath);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

/**
 * Per-agent write mutex. Overlapping calls for the same `agentId` run strictly
 * one after another; different ids run concurrently. The chain advances whether
 * the previous call resolved or rejected, so a failure never deadlocks the next
 * caller. Map entries are dropped once an id's chain drains.
 */
const agentLocks = new Map<string, Promise<unknown>>();

export async function withAgentLock<T>(agentId: string, fn: () => Promise<T>): Promise<T> {
  const tail = agentLocks.get(agentId) ?? Promise.resolve();

  // Run `fn` only after the previous call settles (success OR failure).
  const run = tail.then(fn, fn);

  // Track a swallowed copy so the map's tail never rejects (which would make the
  // NEXT caller's `.then` short-circuit) and never surfaces an unhandled
  // rejection. The real result/rejection still propagates via `run`.
  const settled = run.then(
    () => {},
    () => {},
  );
  agentLocks.set(agentId, settled);

  // Drop the entry once this is the last queued call, to avoid unbounded growth.
  settled.finally(() => {
    if (agentLocks.get(agentId) === settled) {
      agentLocks.delete(agentId);
    }
  });

  return run;
}
