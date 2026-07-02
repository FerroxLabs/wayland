/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #447 - the IJFW install-root watcher uses fs.watch, whose FSWatcher emits
 * 'error' asynchronously (e.g. an FSEvents native-binding failure on macOS
 * Intel). An unhandled 'error' on an EventEmitter is rethrown and would crash
 * the app at startup. watchInstallRoot must attach an 'error' handler and must
 * never throw from its own init.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

class FakeFsWatcher extends EventEmitter {
  close = vi.fn();
}

const watchMock = vi.hoisted(() => vi.fn());
const statSyncMock = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({ watch: watchMock, statSync: statSyncMock }));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { watchInstallRoot } from '@process/services/ijfw/healthCheck';

describe('watchInstallRoot native-binding crash guard (#447)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('swallows an async FSWatcher error event instead of letting it crash', () => {
    const watcher = new FakeFsWatcher();
    watchMock.mockReturnValue(watcher);

    const cleanup = watchInstallRoot(vi.fn());

    // An unhandled 'error' on an EventEmitter throws; the handler must absorb it.
    expect(() => watcher.emit('error', new Error('fsevents: dlopen failed'))).not.toThrow();

    cleanup();
    expect(watcher.close).toHaveBeenCalled();
  });

  it('does not throw when fs.watch itself throws (parent missing / watch unavailable)', () => {
    watchMock.mockImplementation(() => {
      throw new Error('ENOENT: watch target gone');
    });

    let cleanup: (() => void) | undefined;
    expect(() => {
      cleanup = watchInstallRoot(vi.fn());
    }).not.toThrow();

    // Returned cleanup must be safe to call even though no watcher was created.
    expect(() => cleanup?.()).not.toThrow();
  });

  it('reports existence changes via the callback on watch events', () => {
    const watcher = new FakeFsWatcher();
    watchMock.mockReturnValue(watcher);
    statSyncMock.mockImplementation(() => {
      throw new Error('not found');
    });

    const onChange = vi.fn();
    watchInstallRoot(onChange);

    // fs.watch(parent, listener) invokes the second-arg listener on each event.
    const listener = watchMock.mock.calls[0][1] as () => void;
    listener();
    expect(onChange).toHaveBeenCalledWith(false);

    statSyncMock.mockReturnValue({});
    listener();
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});
