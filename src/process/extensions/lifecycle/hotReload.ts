/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { EXTENSION_MANIFEST_FILE, getExtensionScanSources } from '@process/extensions/constants';
import { ExtensionRegistry } from '@process/extensions/ExtensionRegistry';

const DEBOUNCE_MS = 1000;

export class ExtensionWatcher {
  private watchers: fs.FSWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    // Skip the read-only 'bundled' source: it ships inside the app (asar in
    // packaged builds), which fs.watch cannot observe, and it never changes at
    // runtime so there's nothing to hot-reload.
    const dirs = getExtensionScanSources()
      .filter((s) => s.source !== 'bundled')
      .map((s) => s.dir);
    const uniqueDirs = [...new Set(dirs)];

    for (const dir of uniqueDirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        const watcher = fs.watch(dir, { recursive: true }, (_eventType, filename) => {
          if (filename && path.basename(filename) === EXTENSION_MANIFEST_FILE) {
            this.scheduleReload();
          }
        });
        this.watchers.push(watcher);
        console.log(`[Extensions] Watching for changes: ${dir}`);
      } catch (error) {
        console.warn(`[Extensions] Failed to watch directory ${dir}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  stop(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleReload(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(async () => {
      console.log('[Extensions] Detected changes, reinitializing registry...');
      try {
        await ExtensionRegistry.hotReload();
        console.log('[Extensions] Hot-reload complete.');
      } catch (error) {
        console.error('[Extensions] Hot-reload failed:', error);
      }
    }, DEBOUNCE_MS);
  }
}
