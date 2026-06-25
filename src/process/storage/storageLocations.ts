/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { invalidateUsageCache } from './computeUsage';

/**
 * Single source of truth for the storage directory locations and the
 * cache/log clear operation, shared by the Electron IPC handlers
 * (`storageIpc.ts`) and the WebUI HTTP routes (`storageRoutes.ts`) so both
 * surfaces resolve and clear exactly the same paths (#83).
 */

export type StorageDirKind = 'workspace' | 'cache' | 'logs';
export type ClearableDirKind = 'cache' | 'logs';

export function getUserDataDir(): string {
  return app.getPath('userData');
}

export function getLogsDir(): string {
  try {
    return app.getPath('logs');
  } catch {
    return path.join(getUserDataDir(), 'logs');
  }
}

/** Resolve all known storage directories. */
export function getStorageDirs(): Record<StorageDirKind, string> {
  const userData = getUserDataDir();
  return {
    workspace: userData,
    cache: path.join(userData, 'cache'),
    logs: getLogsDir(),
  };
}

/**
 * Clear a clearable directory (cache or logs only - the workspace is never
 * clearable). Idempotent: a missing directory is a no-op. Recreates the empty
 * directory and invalidates the usage cache.
 */
export function clearStorageDir(kind: ClearableDirKind): void {
  const dirs = getStorageDirs();
  const dirPath = kind === 'cache' ? dirs.cache : dirs.logs;
  if (!dirPath || !fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
  invalidateUsageCache();
}
