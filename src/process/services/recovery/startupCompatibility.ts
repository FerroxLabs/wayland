/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { createDriver } from '../database/drivers/createDriver';
import type { ISqliteDriver } from '../database/drivers/ISqliteDriver';
import { CURRENT_DB_VERSION } from '../database/schema';

export type DatabaseSchemaCompatibilityStatus =
  | 'new'
  | 'compatible'
  | 'upgrade-required'
  | 'future-schema'
  | 'corrupt'
  | 'native-driver-failure'
  | 'startup-failure';

export type DatabaseSchemaCompatibility = {
  status: DatabaseSchemaCompatibilityStatus;
  currentVersion: number | null;
  supportedVersion: number;
  databasePath: string;
  reason?: string;
};

export class DatabaseSchemaCompatibilityError extends Error {
  readonly code:
    | 'DATABASE_SCHEMA_NEWER_THAN_APP'
    | 'DATABASE_CORRUPT'
    | 'DATABASE_NATIVE_DRIVER_FAILURE'
    | 'DATABASE_STARTUP_FAILURE';

  constructor(readonly compatibility: DatabaseSchemaCompatibility) {
    const isFuture = compatibility.status === 'future-schema';
    super(
      isFuture
        ? `Database schema v${compatibility.currentVersion} is newer than this Wayland build supports ` +
            `(v${compatibility.supportedVersion}). Open it with a compatible version or use the recovery workflow.`
        : `Wayland could not safely read the database schema version (${compatibility.status}): ` +
            `${compatibility.reason ?? 'unknown error'}`
    );
    this.name = 'DatabaseSchemaCompatibilityError';
    this.code = isFuture
      ? 'DATABASE_SCHEMA_NEWER_THAN_APP'
      : compatibility.status === 'corrupt'
        ? 'DATABASE_CORRUPT'
        : compatibility.status === 'native-driver-failure'
          ? 'DATABASE_NATIVE_DRIVER_FAILURE'
          : 'DATABASE_STARTUP_FAILURE';
  }

  get currentVersion(): number | null {
    return this.compatibility.currentVersion;
  }

  get supportedVersion(): number {
    return this.compatibility.supportedVersion;
  }
}

/** Resolve the physical database path without creating or repairing CLI-safe symlinks. */
export function resolvePhysicalDesktopDatabasePath(userDataPath: string): string {
  return path.join(userDataPath, 'wayland', 'wayland.db');
}

export function readDatabaseSchemaVersionStrict(driver: ISqliteDriver): number {
  const version = driver.pragma('user_version', { simple: true });
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 0) {
    throw new Error(`invalid PRAGMA user_version value: ${String(version)}`);
  }
  return version;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const NATIVE_MODULE_LOAD_ERROR_PATTERNS = ['NODE_MODULE_VERSION', 'was compiled against', 'dlopen'];
const DATABASE_CORRUPTION_PATTERNS = [
  'SQLITE_CORRUPT',
  'SQLITE_NOTADB',
  'database disk image is malformed',
  'file is not a database',
  'malformed database schema',
  'unsupported file format',
];

export function isNativeModuleLoadError(message: string): boolean {
  return NATIVE_MODULE_LOAD_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function isDatabaseCorruptionError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return DATABASE_CORRUPTION_PATTERNS.some((pattern) => normalizedMessage.includes(pattern.toLowerCase()));
}

function classifyInspectionFailure(
  message: string
): Extract<DatabaseSchemaCompatibilityStatus, 'corrupt' | 'native-driver-failure' | 'startup-failure'> {
  if (isNativeModuleLoadError(message)) return 'native-driver-failure';
  if (isDatabaseCorruptionError(message)) return 'corrupt';
  return 'startup-failure';
}

/**
 * Inspect an existing Desktop database without schema writes, chmod, WAL
 * checkpointing, corruption recovery, sidecar deletion, or path creation.
 */
export async function inspectDatabaseSchemaCompatibility(databasePath: string): Promise<DatabaseSchemaCompatibility> {
  try {
    const stat = fs.lstatSync(databasePath);
    if (stat.isSymbolicLink()) throw new Error('database path is a symbolic link');
    if (!stat.isFile()) throw new Error('database path is not a regular file');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        status: 'new',
        currentVersion: null,
        supportedVersion: CURRENT_DB_VERSION,
        databasePath,
      };
    }
    const reason = errorMessage(error);
    return {
      status: 'startup-failure',
      currentVersion: null,
      supportedVersion: CURRENT_DB_VERSION,
      databasePath,
      reason,
    };
  }

  let driver: ISqliteDriver | null = null;
  try {
    driver = await createDriver(databasePath, { readonly: true, fileMustExist: true });
    const currentVersion = readDatabaseSchemaVersionStrict(driver);
    const status: DatabaseSchemaCompatibilityStatus =
      currentVersion > CURRENT_DB_VERSION
        ? 'future-schema'
        : currentVersion < CURRENT_DB_VERSION
          ? 'upgrade-required'
          : 'compatible';
    return { status, currentVersion, supportedVersion: CURRENT_DB_VERSION, databasePath };
  } catch (error) {
    const reason = errorMessage(error);
    return {
      status: classifyInspectionFailure(reason),
      currentVersion: null,
      supportedVersion: CURRENT_DB_VERSION,
      databasePath,
      reason,
    };
  } finally {
    if (driver) {
      try {
        driver.close();
      } catch {
        // The read result remains authoritative; startup will not write through this handle.
      }
    }
  }
}

export async function assertDatabaseSchemaCompatible(databasePath: string): Promise<DatabaseSchemaCompatibility> {
  const compatibility = await inspectDatabaseSchemaCompatibility(databasePath);
  if (
    compatibility.status === 'future-schema' ||
    compatibility.status === 'corrupt' ||
    compatibility.status === 'native-driver-failure' ||
    compatibility.status === 'startup-failure'
  ) {
    throw new DatabaseSchemaCompatibilityError(compatibility);
  }
  return compatibility;
}

export async function preflightDesktopState(userDataPath: string): Promise<DatabaseSchemaCompatibility> {
  return assertDatabaseSchemaCompatible(resolvePhysicalDesktopDatabasePath(userDataPath));
}
