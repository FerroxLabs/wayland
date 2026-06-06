/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW install lockfile - single-process gate for first-boot install.
 * Fixes SEC-008 (atomic O_EXCL acquire), SEC-010 (verify-on-release via
 * nonce), GEM-R-02 (hostname check), GEM-R-05 (boot-time check guards against
 * PID reuse after reboot).
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface LockMetadata {
  pid: number;
  startTime: number; // Date.now() at acquire
  bootTime: number; // approximation of boot time in ms
  nonce: string; // 32 hex chars (16 random bytes)
  hostname: string;
}

function lockPath(): string {
  return path.join(os.homedir(), '.ijfw', '.install-lock');
}

function computeBootTime(): number {
  return Date.now() - os.uptime() * 1000;
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export interface AcquireResult {
  acquired: boolean;
  handle?: LockMetadata;
  holderPid?: number;
}

export async function acquireLock(): Promise<AcquireResult> {
  const target = lockPath();
  await fs.promises.mkdir(path.dirname(target), { recursive: true });

  const meta: LockMetadata = {
    pid: process.pid,
    startTime: Date.now(),
    bootTime: computeBootTime(),
    nonce: crypto.randomBytes(16).toString('hex'),
    hostname: os.hostname(),
  };

  try {
    await fs.promises.writeFile(target, JSON.stringify(meta), { flag: 'wx', mode: 0o600 });
    return { acquired: true, handle: meta };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
  }

  // Lockfile exists - check whether it's stale.
  let existing: LockMetadata;
  try {
    existing = JSON.parse(await fs.promises.readFile(target, 'utf-8')) as LockMetadata;
  } catch {
    // Unreadable or corrupt - refuse rather than guess.
    return { acquired: false };
  }

  const sameHost = existing.hostname === os.hostname();
  const sameBoot = Math.abs(existing.bootTime - computeBootTime()) < 5000;
  const aliveOnThisHost = sameHost && sameBoot && pidAlive(existing.pid);

  if (aliveOnThisHost) {
    return { acquired: false, holderPid: existing.pid };
  }

  // Stale lockfile - reclaim.
  try {
    await fs.promises.unlink(target);
  } catch {
    /* race: another process cleared it - fall through to retry */
  }
  return acquireLock();
}

export async function releaseLock(handle: LockMetadata): Promise<void> {
  const target = lockPath();
  try {
    const existing = JSON.parse(await fs.promises.readFile(target, 'utf-8')) as LockMetadata;
    // SEC-010: only delete if the nonce matches - never blindly unlink.
    if (existing.nonce === handle.nonce) {
      await fs.promises.unlink(target);
    }
  } catch {
    /* lockfile already gone or unreadable - nothing to do */
  }
}
