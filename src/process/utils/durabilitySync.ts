/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Platform rules for flushing data to stable storage.
 *
 * Windows implements fsync as FlushFileBuffers, which requires the handle to
 * carry GENERIC_WRITE. Two consequences, both verified empirically on Windows
 * 10 / Node 24 rather than inferred:
 *
 *   - `openSync(file, O_RDONLY)` + `fsyncSync` fails with EPERM (errno -4048).
 *     Only an O_RDWR handle can be flushed.
 *   - A directory handle can never satisfy it, so flushing a directory fails
 *     with EPERM however the path is spelled. `path.join(dir, '.')` does not
 *     help; it fails identically.
 *
 * POSIX allows both, and flushing the containing directory is what commits the
 * rename/link metadata, so POSIX behavior must not change. On Windows the
 * rename is itself ordered by the NTFS journal, and flushing the published file
 * is the established fallback.
 *
 * Every durability flush in the process tree goes through these helpers so the
 * platform rule lives in exactly one place. Getting the flag wrong is silent on
 * macOS and ubuntu and fatal on Windows: it broke every atomic state write,
 * including `wayland-config.txt`.
 */

import { closeSync, constants, fsyncSync, openSync } from 'fs';

/**
 * Flags for opening a file solely in order to flush it.
 *
 * O_RDWR on Windows because FlushFileBuffers needs write access; O_RDONLY
 * elsewhere so a file the process may read but not write can still be flushed.
 */
export function fileSyncFlags(platform: NodeJS.Platform = process.platform): number {
  return platform === 'win32' ? constants.O_RDWR : constants.O_RDONLY;
}

/** Whether this platform can flush a directory handle at all. Windows cannot. */
export function canSyncDirectory(platform: NodeJS.Platform = process.platform): boolean {
  return platform !== 'win32';
}

/** Open `filePath` with the correct flags for this platform, fsync it, close it. */
export function syncFileSync(filePath: string, extraFlags = 0): void {
  const fd = openSync(filePath, fileSyncFlags() | extraFlags);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/**
 * Flush `directory` so entries created by a rename/link/unlink are committed.
 * A no-op on Windows, where the operation is impossible and the NTFS journal
 * provides the ordering instead.
 */
export function syncDirectorySync(directory: string): void {
  if (!canSyncDirectory()) return;
  const fd = openSync(directory, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/**
 * Flush a publication target already chosen per platform - a containing
 * directory on POSIX, the published file itself on Windows, which is what
 * helpers like `constitutionRevisionDurabilitySyncPath` return.
 *
 * Those helpers picked the right *path* for Windows but were then opened
 * O_RDONLY, so the fallback they existed to provide failed with EPERM anyway.
 */
export function syncPublicationTargetSync(target: string): void {
  if (canSyncDirectory()) syncDirectorySync(target);
  else syncFileSync(target);
}
