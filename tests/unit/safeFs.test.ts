/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="node" />

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { backupRealTarget, withAgentLock } from '../../src/process/connectors/safeFs';

describe('backupRealTarget', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'safefs-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('snapshots the REAL target bytes when the configPath is a symlink', async () => {
    const real = path.join(dir, 'real.json');
    const link = path.join(dir, 'config.json');
    const backup = path.join(dir, 'config.json.bak');
    const bytes = '{"hello":"world"}';
    await fs.writeFile(real, bytes, 'utf8');
    await fs.symlink(real, link);

    await backupRealTarget(link, backup);

    expect(await fs.readFile(backup, 'utf8')).toBe(bytes);
  });

  it('throws when the symlink target escapes the allowedRoot', async () => {
    // Home dir the config claims to live in.
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'safefs-home-'));
    // A sibling, OUTSIDE home, that the symlink will actually point at.
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'safefs-out-'));
    const secret = path.join(outside, 'secret.json');
    await fs.writeFile(secret, 'classified', 'utf8');

    const link = path.join(home, 'config.json');
    await fs.symlink(secret, link);
    const backup = path.join(home, 'config.json.bak');

    await expect(backupRealTarget(link, backup, { allowedRoot: home })).rejects.toThrow();

    await fs.rm(home, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  });

  it('does not throw on ENOENT and writes no backup (skip behavior)', async () => {
    const missing = path.join(dir, 'nope.json');
    const backup = path.join(dir, 'nope.json.bak');

    await expect(backupRealTarget(missing, backup)).resolves.toBeUndefined();

    // Chosen behavior: skip writing the backup entirely on ENOENT.
    await expect(fs.access(backup)).rejects.toThrow();
  });
});

describe('withAgentLock', () => {
  it('serializes overlapping calls for the same agentId', async () => {
    const events: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withAgentLock('agent-a', async () => {
      events.push('first:start');
      await firstGate;
      events.push('first:end');
    });

    const second = withAgentLock('agent-a', async () => {
      events.push('second:start');
    });

    // Give microtasks a chance to run; second must NOT have started yet.
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 5));
    expect(events).toEqual(['first:start']);

    releaseFirst();
    await Promise.all([first, second]);

    expect(events).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('runs different agentIds concurrently', async () => {
    const started: string[] = [];
    let releaseA: () => void = () => {};
    let releaseB: () => void = () => {};
    const gateA = new Promise<void>((r) => {
      releaseA = r;
    });
    const gateB = new Promise<void>((r) => {
      releaseB = r;
    });

    const a = withAgentLock('a', async () => {
      started.push('a');
      await gateA;
    });
    const b = withAgentLock('b', async () => {
      started.push('b');
      await gateB;
    });

    await new Promise((r) => setTimeout(r, 5));
    // Both started before either resolved.
    expect(started.sort()).toEqual(['a', 'b']);

    releaseA();
    releaseB();
    await Promise.all([a, b]);
  });

  it('propagates the resolved value', async () => {
    const result = await withAgentLock('agent-v', async () => 42);
    expect(result).toBe(42);
  });

  it('propagates a rejection and does not deadlock the next call for the same id', async () => {
    const failing = withAgentLock('agent-r', async () => {
      throw new Error('boom');
    });
    await expect(failing).rejects.toThrow('boom');

    // The next call for the SAME id must still run.
    const ok = await withAgentLock('agent-r', async () => 'recovered');
    expect(ok).toBe('recovered');
  });
});
