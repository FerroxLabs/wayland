/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #447 - a chokidar/fsevents native-binding failure must NOT crash the app at
 * startup. startDropFolderWatcher guards the watcher init and falls back to
 * polling; if even that fails it returns a no-op handle instead of throwing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

// A fake chokidar watcher: an EventEmitter with a close() that resolves.
class FakeWatcher extends EventEmitter {
  close = vi.fn().mockResolvedValue(undefined);
}

const watchMock = vi.hoisted(() => vi.fn());
vi.mock('chokidar', () => ({ default: { watch: watchMock } }));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@process/services/import/memoryIndexer', () => ({ indexDroppedMemory: vi.fn() }));
// Keep the test hermetic - never touch the real filesystem for dir creation.
vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    readdir: vi.fn(),
  },
}));

import { startDropFolderWatcher, isDropFolderWatching } from '@process/services/import/dropFolderWatcher';

describe('startDropFolderWatcher native-binding crash guard (#447)', () => {
  beforeEach(() => {
    watchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('watches with polling (not the crash-prone fsevents backend) and marks watching', () => {
    const watcher = new FakeWatcher();
    watchMock.mockReturnValueOnce(watcher);

    const handle = startDropFolderWatcher({
      ijfwMemoryDir: '/tmp/ijfw-mem-test',
      dropFolder: '/tmp/drop-test',
      onIngest: vi.fn(),
      onError: vi.fn(),
    });

    expect(isDropFolderWatching()).toBe(true);
    expect(watchMock).toHaveBeenCalledTimes(1);
    // usePolling:true is the actual #447 fix: it keeps chokidar off the fsevents
    // native path that async-rejects (unhandledRejection) on affected macs.
    expect(watchMock.mock.calls[0][1]).toMatchObject({ usePolling: true });
    handle.stop();
    expect(isDropFolderWatching()).toBe(false);
  });

  it('absorbs an async watcher error event without crashing (defense-in-depth)', () => {
    const watcher = new FakeWatcher();
    watchMock.mockReturnValueOnce(watcher);

    const onError = vi.fn();
    startDropFolderWatcher({
      ijfwMemoryDir: '/tmp/ijfw-mem-test',
      dropFolder: '/tmp/drop-test',
      onIngest: vi.fn(),
      onError,
    });

    // An unhandled 'error' on an EventEmitter is rethrown and would crash the app.
    expect(() => watcher.emit('error', new Error('watcher backend failed'))).not.toThrow();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Watcher error'));
  });

  it('returns a no-op handle when watch init throws synchronously (still no crash)', () => {
    watchMock.mockImplementation(() => {
      throw new Error('watch unavailable');
    });

    const onError = vi.fn();
    let handle: { stop: () => void } | undefined;
    expect(() => {
      handle = startDropFolderWatcher({
        ijfwMemoryDir: '/tmp/ijfw-mem-test',
        dropFolder: '/tmp/drop-test',
        onIngest: vi.fn(),
        onError,
      });
    }).not.toThrow();

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Failed to start drop-folder watcher'));
    expect(isDropFolderWatching()).toBe(false);
    // The no-op handle must be safe to stop.
    expect(() => handle?.stop()).not.toThrow();
  });
});
