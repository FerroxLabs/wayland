/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { ipcBridge } from '@/common';

// Store all file watchers
const watchers = new Map<string, fs.FSWatcher>();

/**
 * Close and drain every active file watcher. REL-WATCH-01: each `fs.watch`
 * holds a native OS handle (inotify on Linux, FSEvents/kqueue on macOS,
 * ReadDirectoryChangesW on Windows) - these must be released deterministically
 * on app quit, not left to the renderer's best-effort stopWatch. Idempotent and
 * safe to call from the before-quit cleanup path.
 */
export function stopAllFileWatchers(): void {
  watchers.forEach((watcher) => {
    try {
      watcher.close();
    } catch (error) {
      console.error('[FileWatch] Failed to close watcher during drain:', error);
    }
  });
  watchers.clear();
}

const WORKSPACE_OFFICE_RE = /\.(pptx|docx|xlsx)$/i;
const WORKSPACE_OFFICE_TEMP_RE = /^(~\$|~|～)/;
const WORKSPACE_SCAN_IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'out',
  'target',
  'vendor',
  'bin',
  'obj',
]);

export const isIgnoredOfficeTempFileName = (fileName: string): boolean => WORKSPACE_OFFICE_TEMP_RE.test(fileName);

export const shouldSkipWorkspaceOfficeScanDir = (dirName: string): boolean =>
  dirName.startsWith('.') || WORKSPACE_SCAN_IGNORED_DIRS.has(dirName);

export async function scanWorkspaceOfficeFiles(workspace: string): Promise<string[]> {
  const discovered = new Set<string>();
  const pendingDirs = [workspace];

  while (pendingDirs.length > 0) {
    const currentDir = pendingDirs.pop();
    if (!currentDir) continue;

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (shouldSkipWorkspaceOfficeScanDir(entry.name)) continue;
        pendingDirs.push(entryPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!WORKSPACE_OFFICE_RE.test(entry.name)) continue;
      if (isIgnoredOfficeTempFileName(entry.name)) continue;

      discovered.add(entryPath);
    }
  }

  return [...discovered].toSorted();
}

// Initialize file watch bridge to manage start/stop of watchers
export function initFileWatchBridge(): void {
  // Start watching file
  ipcBridge.fileWatch.startWatch.provider(({ filePath }) => {
    try {
      // Stop existing watcher if any
      if (watchers.has(filePath)) {
        watchers.get(filePath)?.close();
        watchers.delete(filePath);
      }

      // Create file watcher
      const watcher = fs.watch(filePath, (eventType) => {
        // Notify renderer process on file change
        ipcBridge.fileWatch.fileChanged.emit({ filePath, eventType });
      });

      watchers.set(filePath, watcher);

      return Promise.resolve({ success: true });
    } catch (error) {
      // REL-WATCH-01: surface the OS resource-exhaustion errno (inotify
      // max_user_watches on Linux → ENOSPC, EMFILE on any platform) instead of
      // burying it in a generic "Unknown error" - these are actionable.
      const code = (error as NodeJS.ErrnoException)?.code;
      const detail =
        code === 'ENOSPC'
          ? 'Watcher limit reached (ENOSPC: inotify max_user_watches exhausted)'
          : code === 'EMFILE'
            ? 'Too many open file handles (EMFILE)'
            : error instanceof Error
              ? error.message
              : 'Unknown error';
      console.error('[FileWatch] Failed to start watching:', error);
      return Promise.resolve({ success: false, msg: detail });
    }
  });

  // Stop watching file
  ipcBridge.fileWatch.stopWatch.provider(({ filePath }) => {
    try {
      if (watchers.has(filePath)) {
        watchers.get(filePath)?.close();
        watchers.delete(filePath);
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false, msg: 'No watcher found for this file' });
    } catch (error) {
      console.error('[FileWatch] Failed to stop watching:', error);
      return Promise.resolve({ success: false, msg: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Stop all watchers
  ipcBridge.fileWatch.stopAllWatches.provider(() => {
    try {
      stopAllFileWatchers();
      return Promise.resolve({ success: true });
    } catch (error) {
      console.error('[FileWatch] Failed to stop all watches:', error);
      return Promise.resolve({ success: false, msg: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Scan auto-previewable Office files in workspace
  ipcBridge.workspaceOfficeWatch.scan.provider(async ({ workspace }) => {
    try {
      return await scanWorkspaceOfficeFiles(workspace);
    } catch (error) {
      console.error('[WorkspaceOfficeWatch] Failed to scan workspace office files:', error);
      return [];
    }
  });
}
