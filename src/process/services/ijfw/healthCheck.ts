/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW health-check watcher - observes ~/.ijfw and notifies callers when the
 * mcp-server entry appears or disappears (e.g. user-driven rm or background
 * re-install). Tolerates the parent directory being absent at watch-start.
 *
 * KNOWN LIMITATION: `fs.watch` on macOS uses FSEvents, which coalesces events
 * and can miss directory-removal events at the parent level. Production users
 * may experience delayed (1-10s) detection of mcp-server disappearance. The
 * v0.6.4 followup migrates this to chokidar (already a project dependency)
 * which has explicit retry/polling fallback for macOS edge cases.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import log from 'electron-log';

function targetPath(): string {
  return path.join(os.homedir(), '.ijfw', 'mcp-server');
}

export function watchInstallRoot(onChange: (exists: boolean) => void): () => void {
  const target = targetPath();
  const parent = path.dirname(target);

  function exists(): boolean {
    try {
      fs.statSync(target);
      return true;
    } catch {
      return false;
    }
  }

  let watcher: fs.FSWatcher | null = null;
  try {
    watcher = fs.watch(parent, () => {
      onChange(exists());
    });
    // An FSWatcher emits 'error' asynchronously (e.g. an FSEvents native-binding
    // failure on macOS Intel, or EMFILE). An unhandled 'error' on an EventEmitter
    // is rethrown and would crash the app at startup (#447). Swallow it: the
    // watcher is best-effort observability, not critical - log and move on.
    // Guard `.on` because tests (and defensive callers) may hand back a minimal
    // watcher object without the EventEmitter surface.
    if (typeof watcher?.on === 'function') {
      watcher.on('error', (err) => {
        log.warn('[healthCheck] install-root watcher error (ignored)', { err });
      });
    }
  } catch (err) {
    // Parent missing or watch unavailable - caller can retry by recreating the
    // watcher later. Never throw from startup wiring (#447).
    log.warn('[healthCheck] failed to start install-root watcher', { err });
  }

  return () => {
    try {
      watcher?.close();
    } catch {
      /* ignore */
    }
  };
}
