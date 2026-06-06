/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwSystemService.getLatestPublished()` - verifies semver guard,
 * atomic cache, and offline (null) fallback.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpUserData: string;

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => {
      if (key === 'userData') return tmpUserData;
      return `/tmp/wayland-test-${key}`;
    },
  },
}));

const safeSpawnSpy = vi.fn();
vi.mock('@process/services/ijfw/safeSpawn', () => ({
  safeSpawn: (opts: unknown) => safeSpawnSpy(opts),
}));

/**
 * Build a child stub whose stdout/exit events fire AFTER the caller has had
 * a chance to attach listeners. Since the production code does
 * `const child = await safeSpawn(...)` then attaches `.on('exit', ...)` and
 * `.on('data', ...)` synchronously, we schedule emissions via setImmediate
 * inside a Promise so they land one macrotask after the await resolves.
 */
function queueFakeChild(stdoutText: string, exitCode = 0): Promise<EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: () => void;
}> {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  return Promise.resolve(child).then((c) => {
    setImmediate(() => {
      c.stdout.emit('data', Buffer.from(stdoutText));
      c.emit('exit', exitCode);
    });
    return c;
  });
}

// eslint-disable-next-line import/first
import { ijfwSystemService } from '@process/services/ijfwSystemService';
// eslint-disable-next-line import/first
import { __resetCacheForTests } from '@process/services/ijfwSystemService';

describe('ijfwSystemService.getLatestPublished', () => {
  beforeEach(() => {
    tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-latest-'));
    safeSpawnSpy.mockReset();
    __resetCacheForTests();
  });

  afterEach(() => {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  });

  it('returns the published version on success', async () => {
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild('1.5.4\n'));
    const v = await ijfwSystemService.getLatestPublished();
    expect(v).toBe('1.5.4');
  });

  it('returns null when npm exits non-zero (offline)', async () => {
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild('', 1));
    const v = await ijfwSystemService.getLatestPublished();
    expect(v).toBeNull();
  });

  it('returns null and refuses an invalid (non-semver) output', async () => {
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild('not-a-version\n'));
    const v = await ijfwSystemService.getLatestPublished();
    expect(v).toBeNull();
  });

  it('returns null when safeSpawn itself rejects', async () => {
    safeSpawnSpy.mockRejectedValueOnce(new Error('npm not resolvable'));
    const v = await ijfwSystemService.getLatestPublished();
    expect(v).toBeNull();
  });

  it('caches the value to disk via writeAtomic', async () => {
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild('1.6.0\n'));
    await ijfwSystemService.getLatestPublished();
    // Cache file should exist somewhere under userData.
    const entries = fs.readdirSync(tmpUserData);
    const cacheFile = entries.find((f) => f.startsWith('ijfw-latest-cache-'));
    expect(cacheFile).toBeDefined();
    const raw = fs.readFileSync(path.join(tmpUserData, cacheFile!), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.6.0');
    expect(typeof parsed.fetchedAt).toBe('number');
  });

  it('serves from cache within TTL without respawning', async () => {
    safeSpawnSpy.mockImplementationOnce(() => queueFakeChild('1.7.0\n'));
    const first = await ijfwSystemService.getLatestPublished();
    expect(first).toBe('1.7.0');
    expect(safeSpawnSpy).toHaveBeenCalledTimes(1);

    const second = await ijfwSystemService.getLatestPublished();
    expect(second).toBe('1.7.0');
    expect(safeSpawnSpy).toHaveBeenCalledTimes(1);
  });
});
