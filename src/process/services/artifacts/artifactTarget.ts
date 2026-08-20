/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9. From an ARTIFACT ID to something it is safe to hand an OS launcher.
 *
 * The renderer never sends a path. It sends an id, and the host does the
 * resolution - because a path from the renderer is attacker input the moment
 * the renderer is compromised, and "confine it" only bounds where it points,
 * never what it is or whether it is still the thing the ledger described.
 *
 * ## The window this closes
 *
 * A ledger record was written when a run finished. The user clicks Open some
 * time later - possibly days later, on a workspace an agent has been writing to
 * on a cron in between. Between those two moments the filesystem is free to
 * change, and the interesting changes are the ones that leave the PATH looking
 * identical:
 *
 *  - the leaf replaced by a symlink to `~/.ssh/id_rsa` or to a `.command`;
 *  - an ANCESTOR DIRECTORY replaced by a symlink, which redirects a path whose
 *    every byte still reads as in-workspace, and which a leaf-only check misses
 *    completely;
 *  - the file replaced by a directory, a FIFO, or a device node;
 *  - the same path, different bytes.
 *
 * So resolution is not a lookup. Every component from the workspace root down
 * is `lstat`ed and refused if it is a link, the leaf is opened and the OPEN
 * HANDLE's identity is compared against what `lstat` saw, and the bytes are
 * hashed off that handle and compared to the digest the ledger recorded.
 *
 * ## The residual, stated plainly
 *
 * `shell.openPath` and `shell.showItemInFolder` take a PATH. After we close the
 * handle, the OS re-resolves that path by name, and nothing in Electron accepts
 * a file descriptor instead. That window is irreducible with those APIs; it is
 * sub-millisecond, it requires an attacker already able to write into the
 * workspace at that instant, and the type gate still applies to whatever the
 * OS lands on. `readVerifiedArtifact` has NO such window - it returns the bytes
 * read from the verified handle - which is why Save a copy uses it rather than
 * copying by path.
 */

import { createHash } from 'crypto';
import { promises as fs, type Stats } from 'fs';
import path from 'path';

import type { ArtifactRecord } from './artifactLedger';
import { MAX_ARTIFACT_BYTES } from './artifactLedger';

export type ArtifactTargetFailure = { ok: false; error: string };

export type ArtifactTargetSuccess = {
  ok: true;
  /** The canonical absolute path, verified as of this call. */
  path: string;
  record: ArtifactRecord;
};

export type ArtifactTargetOutcome = ArtifactTargetSuccess | ArtifactTargetFailure;

export type VerifiedArtifactOutcome = ({ ok: true; contents: Buffer } & ArtifactTargetSuccess) | ArtifactTargetFailure;

/**
 * The ledger's ids are `sha256(...).slice(0, 32)` - lower-case hex, fixed
 * length. Anything else never reaches a lookup, let alone the filesystem.
 */
const ARTIFACT_ID = /^[0-9a-f]{32}$/;

export function isArtifactId(value: unknown): value is string {
  return typeof value === 'string' && ARTIFACT_ID.test(value);
}

/** True when `child` is `root` itself or nested beneath it. */
function isInside(root: string, child: string): boolean {
  const rel = path.relative(root, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Walk every component from the workspace root down to the leaf, refusing any
 * link on the way.
 *
 * Deliberately NOT `realpath`-and-compare. Realpath would FOLLOW a symlinked
 * ancestor and then tell us the destination is outside the workspace - true,
 * but only when the destination happens to be outside. A link pointing at
 * another directory INSIDE the workspace would pass, and the record would still
 * be describing a different file than the one that opens. The question here is
 * not "where does this end up", it is "is this path still the literal path the
 * ledger recorded", and only a per-component `lstat` answers that.
 *
 * The workspace root itself is exempt from the link check: a user is entitled
 * to keep their whole workspace behind a symlink (a common macOS/iCloud and
 * home-directory arrangement), and that decision is theirs, not an agent's.
 */
async function assertUnlinkedChain(workspace: string, target: string): Promise<ArtifactTargetFailure | null> {
  const relative = path.relative(workspace, target);
  const segments = relative.split(path.sep).filter((segment) => segment.length > 0);
  let current = workspace;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat: Stats;
    try {
      // eslint-disable-next-line no-await-in-loop -- each component must be proven before the next is even named
      stat = await fs.lstat(current);
    } catch {
      return { ok: false, error: 'artifact is no longer on disk' };
    }
    if (stat.isSymbolicLink()) {
      return { ok: false, error: 'refusing an artifact path that passes through a symbolic link' };
    }
  }
  return null;
}

function findRecord(artifactId: unknown, records: readonly ArtifactRecord[]): ArtifactRecord | null {
  if (!isArtifactId(artifactId)) return null;
  return records.find((record) => record.artifactId === artifactId) ?? null;
}

/**
 * Open the leaf and prove it is still the file the ledger described.
 *
 * Order matters: `lstat` settles link-ness and regular-ness BEFORE anything is
 * opened, so a FIFO - which would block the read forever - is never opened, and
 * the handle's device/inode is then compared to what `lstat` saw, closing the
 * swap window between the check and the open without needing `O_NOFOLLOW`
 * (which Windows does not have).
 */
async function openVerified(
  record: ArtifactRecord,
  target: string
): Promise<{ contents: Buffer } | ArtifactTargetFailure> {
  let stat: Stats;
  try {
    stat = await fs.lstat(target);
  } catch {
    return { ok: false, error: 'artifact is no longer on disk' };
  }
  if (stat.isSymbolicLink()) return { ok: false, error: 'refusing a symbolic link' };
  if (!stat.isFile()) return { ok: false, error: 'artifact is no longer a regular file' };
  if (stat.size !== record.sizeBytes) return { ok: false, error: 'artifact has changed since it was recorded' };
  if (stat.size > MAX_ARTIFACT_BYTES) return { ok: false, error: 'artifact is too large to verify' };

  let handle: Awaited<ReturnType<typeof fs.open>>;
  try {
    handle = await fs.open(target, 'r');
  } catch {
    return { ok: false, error: 'artifact could not be read' };
  }
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino || opened.size !== record.sizeBytes) {
      return { ok: false, error: 'artifact changed identity between validation and read' };
    }
    const contents = await handle.readFile();
    const digest = createHash('sha256').update(contents).digest('hex');
    if (digest !== record.sha256) {
      return { ok: false, error: 'artifact has changed since it was recorded' };
    }
    return { contents };
  } catch {
    return { ok: false, error: 'artifact could not be read' };
  } finally {
    await handle.close();
  }
}

/**
 * The shared front half: id -> record -> containment -> unlinked chain -> the
 * leaf still being the recorded file, bytes and all.
 */
async function verify(
  artifactId: unknown,
  records: readonly ArtifactRecord[]
): Promise<{ record: ArtifactRecord; target: string; contents: Buffer } | ArtifactTargetFailure> {
  const record = findRecord(artifactId, records);
  if (!record) return { ok: false, error: 'unknown artifact' };

  // The ledger's reader already rejects absolute and `..`-bearing relative
  // paths, but this is the point where a path becomes an argument to the OS, so
  // it is re-checked rather than assumed - the reader is a different module and
  // could be relaxed without anyone noticing this depended on it.
  const relative = record.relativePath;
  if (typeof relative !== 'string' || relative.length === 0) return { ok: false, error: 'unknown artifact' };
  if (path.isAbsolute(relative) || relative.split('/').includes('..')) {
    return { ok: false, error: 'artifact location is not inside its workspace' };
  }

  const workspace = path.resolve(record.workspace);
  const target = path.resolve(workspace, ...relative.split('/'));
  if (!isInside(workspace, target) || target === workspace) {
    return { ok: false, error: 'artifact location is not inside its workspace' };
  }

  const chain = await assertUnlinkedChain(workspace, target);
  if (chain) return chain;

  const opened = await openVerified(record, target);
  if ('ok' in opened) return opened;

  return { record, target, contents: opened.contents };
}

/**
 * Resolve an id to a path that may be handed to an OS launcher.
 *
 * The caller must still type-gate the result (`refuseUnsafeOpenTarget`) and
 * confine it: this proves the path is the recorded artifact, not that opening
 * it is safe. Location, identity and TYPE are three separate questions.
 */
export async function resolveArtifactTarget(
  artifactId: unknown,
  records: readonly ArtifactRecord[]
): Promise<ArtifactTargetOutcome> {
  const verified = await verify(artifactId, records);
  if ('ok' in verified) return verified;
  return { ok: true, path: verified.target, record: verified.record };
}

/**
 * Resolve an id to the artifact's BYTES, read from the verified handle.
 *
 * This is the form with no re-resolution window at all, which is why Save a
 * copy uses it: the bytes written to the user's chosen destination are the
 * bytes whose digest matched the ledger, not whatever the path resolves to a
 * moment later.
 */
export async function readVerifiedArtifact(
  artifactId: unknown,
  records: readonly ArtifactRecord[]
): Promise<VerifiedArtifactOutcome> {
  const verified = await verify(artifactId, records);
  if ('ok' in verified) return verified;
  return { ok: true, path: verified.target, record: verified.record, contents: verified.contents };
}
