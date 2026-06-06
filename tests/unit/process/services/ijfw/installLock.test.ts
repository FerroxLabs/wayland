/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => tmpHome,
    hostname: () => actual.hostname(),
    uptime: actual.uptime,
  };
});

// eslint-disable-next-line import/first
import { acquireLock, releaseLock } from '@process/services/ijfw/installLock';

describe('ijfw/installLock', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-lock-home-'));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('acquires a fresh lock and returns metadata', async () => {
    const result = await acquireLock();
    expect(result.acquired).toBe(true);
    expect(result.handle).toBeDefined();
    expect(result.handle?.pid).toBe(process.pid);
    expect(result.handle?.nonce).toMatch(/^[0-9a-f]{32}$/);
  });

  it('rejects re-acquire while a live holder exists', async () => {
    const first = await acquireLock();
    expect(first.acquired).toBe(true);
    const second = await acquireLock();
    expect(second.acquired).toBe(false);
    expect(second.holderPid).toBe(process.pid);
  });

  it('releaseLock removes the lockfile when nonce matches', async () => {
    const first = await acquireLock();
    expect(first.acquired).toBe(true);
    await releaseLock(first.handle!);
    const lockPath = path.join(tmpHome, '.ijfw', '.install-lock');
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('releaseLock does NOT remove the lockfile when nonce mismatches', async () => {
    const first = await acquireLock();
    expect(first.acquired).toBe(true);
    // Stale handle from a different session.
    await releaseLock({
      pid: 99999,
      startTime: 0,
      bootTime: 0,
      nonce: '0'.repeat(32),
      hostname: 'other',
    });
    const lockPath = path.join(tmpHome, '.ijfw', '.install-lock');
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  it('reclaims a stale lockfile from a dead PID', async () => {
    const lockPath = path.join(tmpHome, '.ijfw', '.install-lock');
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    // Write a lockfile from a "dead" PID. PID 1 is alive on every host, so we
    // use a PID that's astronomically unlikely to exist.
    const stale = {
      pid: 2147483646,
      startTime: 0,
      bootTime: 0,
      nonce: 'stale-nonce'.padEnd(32, '0'),
      hostname: os.hostname(),
    };
    fs.writeFileSync(lockPath, JSON.stringify(stale), { mode: 0o600 });

    const result = await acquireLock();
    expect(result.acquired).toBe(true);
    expect(result.handle?.pid).toBe(process.pid);
  });

  it('reclaims a lock written by a different hostname', async () => {
    const lockPath = path.join(tmpHome, '.ijfw', '.install-lock');
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    const foreign = {
      pid: process.pid, // matches ours, but hostname differs
      startTime: Date.now(),
      bootTime: Date.now() - os.uptime() * 1000,
      nonce: 'foreign-nonce'.padEnd(32, '0'),
      hostname: 'different-host-name',
    };
    fs.writeFileSync(lockPath, JSON.stringify(foreign), { mode: 0o600 });

    const result = await acquireLock();
    expect(result.acquired).toBe(true);
  });
});
