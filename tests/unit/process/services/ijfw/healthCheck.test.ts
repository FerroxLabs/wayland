/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * healthCheck tests stub `fs.watch` directly. Earlier versions relied on
 * real FSEvents firing during the test window, which is flaky on macOS
 * (different test fails each run depending on FSEvents latency). The
 * production code's correctness is observable from the watcher contract:
 * when `fs.watch` invokes the callback, re-check `exists()` and emit.
 * The macOS event-coalescing flakiness is a real production concern flagged
 * for the v0.6.4 chokidar migration - but not something a unit test should
 * try to verify directly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { FSWatcher } from 'node:fs';

let tmpHome: string;
let lastWatcherCallback: ((eventType: string, filename: string | null) => void) | null = null;
const closeSpy = vi.fn();

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    watch: vi.fn((_path: string, cb: (eventType: string, filename: string | null) => void) => {
      lastWatcherCallback = cb;
      return { close: closeSpy } as unknown as FSWatcher;
    }),
  };
});

// eslint-disable-next-line import/first
import { watchInstallRoot } from '@process/services/ijfw/healthCheck';

describe('ijfw/healthCheck', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-health-'));
    fs.mkdirSync(path.join(tmpHome, '.ijfw'), { recursive: true });
    lastWatcherCallback = null;
    closeSpy.mockClear();
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('returns a disposer function', () => {
    const dispose = watchInstallRoot(() => {
      /* noop */
    });
    expect(typeof dispose).toBe('function');
    dispose();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('subscribes to fs.watch on the parent .ijfw directory', () => {
    const dispose = watchInstallRoot(() => {
      /* noop */
    });
    expect(lastWatcherCallback).not.toBeNull();
    dispose();
  });

  it('does not throw when the install root parent is missing', () => {
    // Simulate fs.watch failing because the parent doesn't exist.
    vi.mocked(fs.watch).mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    const dispose = watchInstallRoot(() => {
      /* noop */
    });
    expect(typeof dispose).toBe('function');
    dispose(); // should not throw even though watcher was never created
  });

  it('emits onChange(true) when callback fires and the mcp-server entry exists', () => {
    fs.mkdirSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true });
    const events: boolean[] = [];
    const dispose = watchInstallRoot((exists) => events.push(exists));
    // Synthesize an fs.watch event by invoking the captured callback.
    lastWatcherCallback!('rename', 'mcp-server');
    expect(events).toContain(true);
    dispose();
  });

  it('emits onChange(false) when callback fires and the mcp-server entry is missing', () => {
    // Parent .ijfw exists, but mcp-server does NOT.
    const events: boolean[] = [];
    const dispose = watchInstallRoot((exists) => events.push(exists));
    lastWatcherCallback!('rename', 'mcp-server');
    expect(events).toContain(false);
    dispose();
  });

  it('emits both true→false sequence when mcp-server appears then disappears', () => {
    const events: boolean[] = [];
    const dispose = watchInstallRoot((exists) => events.push(exists));
    fs.mkdirSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true });
    lastWatcherCallback!('rename', 'mcp-server');
    fs.rmSync(path.join(tmpHome, '.ijfw', 'mcp-server'), { recursive: true, force: true });
    lastWatcherCallback!('rename', 'mcp-server');
    expect(events).toEqual([true, false]);
    dispose();
  });

  it('dispose() can be called multiple times safely', () => {
    const dispose = watchInstallRoot(() => {
      /* noop */
    });
    dispose();
    expect(() => dispose()).not.toThrow();
  });
});
