/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname } from 'node:path';

const TRANSACTION_VERSION = 1;

type ProjectConfigMarker = {
  version: typeof TRANSACTION_VERSION;
  originalExisted: boolean;
  replacementSha256: string;
};

function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

function backupPath(target: string): string {
  return `${target}.wayland-desktop.backup`;
}

function markerPath(target: string): string {
  return `${target}.wayland-desktop.transaction.json`;
}

function syncRenameMetadata(path: string): void {
  // POSIX requires the containing directory to be fsynced after rename/unlink
  // for the directory entry ordering to survive power loss. Windows cannot
  // open directories through Node without backup-semantics flags, so flush the
  // renamed file handle there; NTFS journals the directory mutation itself.
  const syncPath = process.platform === 'win32' ? path : dirname(path);
  const fd = openSync(syncPath, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function removeIfPresent(path: string): void {
  try {
    unlinkSync(path);
    if (process.platform !== 'win32') syncRenameMetadata(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

/**
 * Read a final-component regular file without following a workspace symlink.
 * The pre/post lstat plus fd identity check closes swaps around open on
 * platforms where O_NOFOLLOW is unavailable or incomplete.
 */
export function readProjectConfigNoFollow(path: string): Buffer | null {
  let before;
  try {
    before = lstatSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new Error(`Refusing non-regular Wayland project config: ${path}`);
  }

  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const fd = openSync(path, constants.O_RDONLY | noFollow);
  try {
    const opened = fstatSync(fd);
    const after = lstatSync(path);
    if (
      !opened.isFile() ||
      after.isSymbolicLink() ||
      !after.isFile() ||
      opened.dev !== after.dev ||
      opened.ino !== after.ino ||
      before.dev !== after.dev ||
      before.ino !== after.ino
    ) {
      throw new Error(`Wayland project config changed during no-follow read: ${path}`);
    }
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** Write + fsync a sibling and atomically rename it over the destination. */
export function atomicWriteProjectConfig(path: string, content: Buffer | string): void {
  const temp = `${path}.wayland-desktop.${process.pid}.${randomUUID()}.tmp`;
  let fd: number | undefined;
  try {
    fd = openSync(temp, 'wx', 0o600);
    writeFileSync(fd, content);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    renameSync(temp, path);
    syncRenameMetadata(path);
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    removeIfPresent(temp);
    throw error;
  }
}

function readMarker(path: string): ProjectConfigMarker {
  const content = readProjectConfigNoFollow(path);
  if (content === null) throw new Error(`Missing Wayland project-config transaction marker: ${path}`);
  const parsed = JSON.parse(content.toString('utf-8')) as Partial<ProjectConfigMarker>;
  if (
    parsed.version !== TRANSACTION_VERSION ||
    typeof parsed.originalExisted !== 'boolean' ||
    typeof parsed.replacementSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(parsed.replacementSha256)
  ) {
    throw new Error(`Invalid Wayland project-config transaction marker: ${path}`);
  }
  return parsed as ProjectConfigMarker;
}

/**
 * Heal a transaction left by process death. Restoration occurs only if the
 * target still contains the exact temporary replacement. If a user edited the
 * file after the crash, their bytes win and the stale journal is discarded.
 */
export function recoverProjectConfigTransaction(target: string): 'none' | 'restored' | 'preserved-newer' {
  const marker = markerPath(target);
  const backup = backupPath(target);
  if (!existsSync(marker)) {
    // A crash before marker publication can leave only an inert backup.
    removeIfPresent(backup);
    return 'none';
  }

  const state = readMarker(marker);
  const current = readProjectConfigNoFollow(target);
  const ownsCurrent = current !== null && sha256(current) === state.replacementSha256;

  if (ownsCurrent) {
    if (state.originalExisted) {
      const original = readProjectConfigNoFollow(backup);
      if (original === null) throw new Error(`Missing Wayland project-config backup: ${backup}`);
      atomicWriteProjectConfig(target, original);
    } else {
      removeIfPresent(target);
    }
  }

  removeIfPresent(marker);
  removeIfPresent(backup);
  return ownsCurrent ? 'restored' : 'preserved-newer';
}

export class ProjectConfigTransaction {
  private restored = false;

  private constructor(
    private readonly target: string,
    private readonly replacementSha256: string
  ) {}

  static begin(target: string, replacement: string): ProjectConfigTransaction {
    recoverProjectConfigTransaction(target);
    const original = readProjectConfigNoFollow(target);
    const originalExisted = original !== null;
    const backup = backupPath(target);
    const marker = markerPath(target);

    if (original !== null) atomicWriteProjectConfig(backup, original);
    else removeIfPresent(backup);

    const replacementSha256 = sha256(replacement);
    atomicWriteProjectConfig(
      marker,
      `${JSON.stringify({ version: TRANSACTION_VERSION, originalExisted, replacementSha256 })}\n`
    );
    atomicWriteProjectConfig(target, replacement);
    return new ProjectConfigTransaction(target, replacementSha256);
  }

  restore(): void {
    if (this.restored) return;
    this.restored = true;

    // The marker owns restoration authority; checking the instance digest as
    // well prevents a stale object from restoring a successor transaction.
    const marker = markerPath(this.target);
    if (!existsSync(marker) || readMarker(marker).replacementSha256 !== this.replacementSha256) return;
    recoverProjectConfigTransaction(this.target);
  }
}
