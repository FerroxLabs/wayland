/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Atomic file-write helpers for state files.
 *
 * Plain writeFile/writeFileSync truncates the destination then streams bytes.
 * If the process crashes mid-write the file is left empty or partial and the
 * next launch fails JSON.parse - losing analytics IDs, CDP registry state,
 * Wayland config, or user workspace paths.
 *
 * The helpers below write to a sibling `.tmp-<pid>-<ts>` file first, then
 * rename into place. POSIX rename is atomic on the same filesystem, so a crash
 * leaves either the old file intact or the new file fully written - never a
 * truncated half.
 *
 * Scope: state files only. User-content writes (where partial output is
 * recoverable by the user) intentionally do not use these helpers.
 *
 * --- RT-S1: cross-platform confidentiality of the temp file ----------------
 * The sibling temp file is created inside the SAME directory as `targetPath`.
 * For secret-bearing writes (callers pass `{ mode: 0o600 }` - config/env/chat
 * blobs, analytics id, models cache) that directory is userData/config, which
 * on Windows is already ACL-restricted to the current user, so the temp file
 * inherits an owner-only ACL by default.
 *
 * Node IGNORES the `mode` option on Windows, so 0o600 alone is a no-op there.
 * As defense-in-depth (in case the parent dir's ACL was widened, or the file
 * is created somewhere with a permissive inherited ACL), when the caller asked
 * for owner-only POSIX perms we ALSO restrict the Windows DACL explicitly:
 * strip inherited ACEs and grant the current user full control, applied to the
 * temp file before secrets are flushed AND to the final file after rename.
 * This is best-effort (icacls failures are swallowed) - the inherited
 * owner-only ACL of userData/config remains the baseline guarantee. POSIX
 * behavior is unchanged.
 */

import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { constants as fsConstants } from 'fs';
import { execFileSync, spawn } from 'child_process';
import path from 'path';

/**
 * True when the caller requested owner-only POSIX permissions, i.e. the data
 * is secret-bearing and must not be world-readable during the write window.
 */
function wantsOwnerOnly(opts?: fsSync.WriteFileOptions): boolean {
  if (opts == null || typeof opts === 'string') return false;
  return opts.mode === 0o600;
}

/**
 * On Windows, set an owner-only DACL on `filePath`: remove inherited ACEs and
 * grant the current user full control. Mirrors the intent of POSIX 0o600 on a
 * platform where Node ignores the `mode` option. Best-effort: any failure is
 * swallowed because the file already lives in an ACL-restricted directory.
 *
 * `*S-1-3-4` is the well-known OWNER RIGHTS SID, so the grant always resolves
 * to whoever created the file regardless of username/domain quirks.
 */
function restrictWindowsDacl(filePath: string): void {
  if (process.platform !== 'win32') return;
  try {
    // /inheritance:r  → drop ACEs inherited from the parent directory
    // /grant:r <SID>:F → replace grants with: current owner = full control
    execFileSync('icacls', [filePath, '/inheritance:r', '/grant:r', '*S-1-3-4:F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } catch {
    // Best-effort. The temp/final file already inherits the userData/config
    // dir's owner-only ACL; an icacls failure leaves that baseline intact.
  }
}

/** Async variant of {@link restrictWindowsDacl}; never rejects. */
function restrictWindowsDaclAsync(filePath: string): Promise<void> {
  if (process.platform !== 'win32') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const child = spawn('icacls', [filePath, '/inheritance:r', '/grant:r', '*S-1-3-4:F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('error', () => resolve());
    child.on('close', () => resolve());
  });
}

/**
 * Flags for opening a file purely to flush it.
 *
 * Windows implements fsync as FlushFileBuffers, which requires the handle to
 * carry GENERIC_WRITE. An O_RDONLY handle therefore fails with EPERM
 * (errno -4048) on every single write, which is what broke config persistence
 * on Windows. POSIX keeps O_RDONLY so a file the process may read but not write
 * can still be flushed.
 */
function fileSyncFlags(): number {
  return process.platform === 'win32' ? fsConstants.O_RDWR : fsConstants.O_RDONLY;
}

/**
 * Whether this platform can flush a directory handle at all.
 *
 * It cannot on Windows: a directory handle never carries GENERIC_WRITE, so
 * FlushFileBuffers rejects it with EPERM however the path is spelled -
 * `path.join(directory, '.')` does not help. There is no per-directory flush
 * primitive short of FlushFileBuffers on the whole volume, which needs
 * administrator rights. NTFS journals the directory entry that the rename
 * creates, so on Windows the rename itself is the ordering barrier and the
 * file-level flushes above are the durability guarantee. SQLite makes the same
 * trade for the same reason.
 */
function canSyncDirectory(): boolean {
  return process.platform !== 'win32';
}

async function syncFile(filePath: string): Promise<void> {
  const handle = await fs.open(filePath, fileSyncFlags());
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function syncDirectory(directory: string): Promise<void> {
  if (!canSyncDirectory()) return;
  const handle = await fs.open(directory, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function syncFileSync(filePath: string): void {
  const fd = fsSync.openSync(filePath, fileSyncFlags());
  try {
    fsSync.fsyncSync(fd);
  } finally {
    fsSync.closeSync(fd);
  }
}

function syncDirectorySync(directory: string): void {
  if (!canSyncDirectory()) return;
  const fd = fsSync.openSync(directory, fsConstants.O_RDONLY);
  try {
    fsSync.fsyncSync(fd);
  } finally {
    fsSync.closeSync(fd);
  }
}

export async function writeFileAtomic(
  targetPath: string,
  data: string | Buffer,
  opts?: fsSync.WriteFileOptions
): Promise<void> {
  const tmp = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  const ownerOnly = wantsOwnerOnly(opts);
  await fs.writeFile(tmp, data, opts);
  let renamed = false;
  try {
    // Harden before the first flush so secret-bearing bytes never rely on a
    // wider inherited ACL during the rename window.
    if (ownerOnly) await restrictWindowsDaclAsync(tmp);
    await syncFile(tmp);
    await fs.rename(tmp, targetPath);
    renamed = true;
    if (ownerOnly) await restrictWindowsDaclAsync(targetPath);
    await syncFile(targetPath);
    await syncDirectory(path.dirname(targetPath));
  } catch (err) {
    if (!renamed) await fs.unlink(tmp).catch(() => {});
    throw err;
  }
}

export function writeFileSyncAtomic(targetPath: string, data: string | Buffer, opts?: fsSync.WriteFileOptions): void {
  const tmp = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  const ownerOnly = wantsOwnerOnly(opts);
  fsSync.writeFileSync(tmp, data, opts);
  let renamed = false;
  try {
    if (ownerOnly) restrictWindowsDacl(tmp);
    syncFileSync(tmp);
    fsSync.renameSync(tmp, targetPath);
    renamed = true;
    if (ownerOnly) restrictWindowsDacl(targetPath);
    syncFileSync(targetPath);
    syncDirectorySync(path.dirname(targetPath));
  } catch (err) {
    if (!renamed) {
      try {
        fsSync.unlinkSync(tmp);
      } catch {
        // Ignore - surface the original persistence error below.
      }
    }
    throw err;
  }
}
