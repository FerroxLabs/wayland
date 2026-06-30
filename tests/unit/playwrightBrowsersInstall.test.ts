/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #465 - the first-run chromium install must be resilient: an offline machine
 * (or any spawn/exit failure) must resolve to `false` WITHOUT throwing, so it
 * never bricks MCP sync or chat. These mock the install subprocess to fail and
 * assert ensurePlaywrightChromium degrades gracefully.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

// A fake child process whose behavior each test sets via `mode`. `spawnCount`
// lets the concurrency test assert the in-flight guard collapses callers.
let mode: 'exit-nonzero' | 'spawn-error' = 'exit-nonzero';
let spawnCount = 0;
vi.mock('child_process', () => ({
  spawn: () => {
    spawnCount++;
    const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter };
    child.stderr = new EventEmitter();
    child.stdout = new EventEmitter();
    queueMicrotask(() => {
      if (mode === 'spawn-error') {
        child.emit('error', new Error('ENOENT: bun not found'));
      } else {
        child.stderr.emit('data', 'offline: failed to download chromium');
        child.emit('close', 1); // non-zero exit (e.g. network failure)
      }
    });
    return child;
  },
}));

// Keep electron out of the unit env (shellEnv pulls it transitively).
vi.mock('electron', () => ({ app: { getPath: () => os.tmpdir() } }));

import { ensurePlaywrightChromium } from '@process/services/mcpServices/playwrightBrowsers';

let emptyDir: string;
beforeAll(async () => {
  emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-465-off-'));
});
afterAll(async () => {
  await fs.rm(emptyDir, { recursive: true, force: true });
});

describe('ensurePlaywrightChromium offline/failure resilience (#465)', () => {
  it('resolves false (never throws) when the install exits non-zero (offline)', async () => {
    mode = 'exit-nonzero';
    await expect(ensurePlaywrightChromium(path.join(emptyDir, 'a'))).resolves.toBe(false);
  });

  it('resolves false (never throws) when the install process errors (no bun)', async () => {
    mode = 'spawn-error';
    await expect(ensurePlaywrightChromium(path.join(emptyDir, 'b'))).resolves.toBe(false);
  });

  it('collapses concurrent callers to a single install (in-flight guard)', async () => {
    mode = 'exit-nonzero';
    spawnCount = 0;
    const dir = path.join(emptyDir, 'c');
    const [a, b, c] = await Promise.all([
      ensurePlaywrightChromium(dir),
      ensurePlaywrightChromium(dir),
      ensurePlaywrightChromium(dir),
    ]);
    // Three concurrent calls, one spawned install; all share the result.
    expect(spawnCount).toBe(1);
    expect([a, b, c]).toEqual([false, false, false]);
  });
});
