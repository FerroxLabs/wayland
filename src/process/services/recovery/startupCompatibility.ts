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
import {
  authorityRank,
  canonicalizeAuthority,
  parseAuthorityDowngradeDelta,
  type AuthorityDowngradeDelta,
  type AuthoritySourceIdentity,
  type CanonicalAuthorityLevel,
} from './recoveryStateTransformer';

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

/* ------------------------------------------------------------------------- *
 * Classic startup + delta-safe re-upgrade gate (SAF-03, D-01, D-07)
 *
 * Signed Classic v0.11.8 supports schema 52 only. It must never open the newer,
 * unclassified schema-53 state directly, nor any live/direct binary path — only
 * an isolated, transformed tree. On re-upgrade the current app reapplies the
 * source-bound authority delta produced at downgrade time and fails closed on a
 * missing/malformed delta, a stale source epoch, an unknown schema, a direct
 * state path, or any effective-authority increase over the source.
 * ------------------------------------------------------------------------- */

/** Schema the signed Classic v0.11.8 recovery binary natively supports. */
export const CLASSIC_RECOVERY_SCHEMA_VERSION = 52;
/** The newer Desktop schema a Classic downgrade is produced FROM. */
export const DOWNGRADE_SOURCE_SCHEMA_VERSION = 53;

export type StartupStatePathKind = 'isolated-transformed-tree' | 'direct-binary-path';

export type ClassicStartupIsolationCode =
  | 'CLASSIC_DIRECT_STATE_PATH'
  | 'CLASSIC_UNCLASSIFIED_FUTURE_SCHEMA'
  | 'CLASSIC_SCHEMA_INCOMPATIBLE';

export class ClassicStartupIsolationError extends Error {
  constructor(
    readonly code: ClassicStartupIsolationCode,
    message: string
  ) {
    super(message);
    this.name = 'ClassicStartupIsolationError';
  }
}

export type ClassicStartupRequest = {
  /** Where the signed Classic binary is being pointed. */
  path: StartupStatePathKind;
  /** Schema version of the state the binary would open. */
  schemaVersion: number;
};

/**
 * Fail closed unless signed Classic v0.11.8 opens an isolated transformed tree
 * at exactly schema 52. A direct/live path, or unclassified schema 53+, is
 * rejected before any historical binary can execute.
 */
export function assertClassicStartupIsolated(request: ClassicStartupRequest): void {
  if (request.path !== 'isolated-transformed-tree') {
    throw new ClassicStartupIsolationError(
      'CLASSIC_DIRECT_STATE_PATH',
      'Signed Classic v0.11.8 may only open an isolated transformed tree, never live or direct state.'
    );
  }
  if (!Number.isSafeInteger(request.schemaVersion)) {
    throw new ClassicStartupIsolationError(
      'CLASSIC_SCHEMA_INCOMPATIBLE',
      `Classic startup schema version is not a safe integer: ${String(request.schemaVersion)}.`
    );
  }
  if (request.schemaVersion >= DOWNGRADE_SOURCE_SCHEMA_VERSION) {
    throw new ClassicStartupIsolationError(
      'CLASSIC_UNCLASSIFIED_FUTURE_SCHEMA',
      `Signed Classic v0.11.8 cannot open unclassified schema ${request.schemaVersion} state; ` +
        `transform to schema ${CLASSIC_RECOVERY_SCHEMA_VERSION} first.`
    );
  }
  if (request.schemaVersion !== CLASSIC_RECOVERY_SCHEMA_VERSION) {
    throw new ClassicStartupIsolationError(
      'CLASSIC_SCHEMA_INCOMPATIBLE',
      `Signed Classic v0.11.8 requires schema ${CLASSIC_RECOVERY_SCHEMA_VERSION}, received ${request.schemaVersion}.`
    );
  }
}

export type ReupgradeAdmissionCode =
  | 'REUPGRADE_DIRECT_STATE_PATH'
  | 'REUPGRADE_UNKNOWN_SCHEMA'
  | 'REUPGRADE_MISSING_DELTA'
  | 'REUPGRADE_STALE_SOURCE_EPOCH'
  | 'REUPGRADE_AUTHORITY_INCREASE';

export class ReupgradeAdmissionError extends Error {
  constructor(
    readonly code: ReupgradeAdmissionCode,
    message: string
  ) {
    super(message);
    this.name = 'ReupgradeAdmissionError';
  }
}

export type ReupgradeAdmissionRequest = {
  /** Where the current app is re-adopting state from. */
  path: StartupStatePathKind;
  /** Schema of the isolated transformed tree Classic ran on (must be schema 52). */
  treeSchemaVersion: number;
  /** Source-bound authority delta produced at downgrade time. */
  reupgradeDelta: unknown;
  /** Source identity the current app expects to re-adopt (schema 53 + its epoch). */
  expectedSource: AuthoritySourceIdentity;
  /**
   * Authority Classic left in the transformed tree, per workspace. Re-upgrade
   * NEVER derives authority from this — it is compared against the source-bound
   * delta purely to reject any attempted widening.
   */
  classicObservedAuthority?: Readonly<Record<string, unknown>>;
};

export type ReupgradeAdmission = {
  schemaVersion: number;
  sourceEpoch: number;
  entries: Array<{ workspace: string; restoredAuthority: CanonicalAuthorityLevel }>;
};

/**
 * Admit a delta-safe re-upgrade or fail closed. On success the returned entries
 * are the ONLY authority the current app reapplies — exactly the source-bound
 * authority, never widened by anything Classic left behind.
 */
export function assertReupgradeAdmissible(request: ReupgradeAdmissionRequest): ReupgradeAdmission {
  if (request.path !== 'isolated-transformed-tree') {
    throw new ReupgradeAdmissionError(
      'REUPGRADE_DIRECT_STATE_PATH',
      'Re-upgrade may only re-adopt an isolated transformed tree, never live or direct state.'
    );
  }
  if (
    !Number.isSafeInteger(request.treeSchemaVersion) ||
    request.treeSchemaVersion !== CLASSIC_RECOVERY_SCHEMA_VERSION
  ) {
    throw new ReupgradeAdmissionError(
      'REUPGRADE_UNKNOWN_SCHEMA',
      `Re-upgrade requires the transformed tree at schema ${CLASSIC_RECOVERY_SCHEMA_VERSION}, ` +
        `received ${String(request.treeSchemaVersion)}.`
    );
  }
  if (request.expectedSource?.schemaVersion !== DOWNGRADE_SOURCE_SCHEMA_VERSION) {
    throw new ReupgradeAdmissionError(
      'REUPGRADE_UNKNOWN_SCHEMA',
      `Re-upgrade only re-adopts schema ${DOWNGRADE_SOURCE_SCHEMA_VERSION} source state, ` +
        `received ${String(request.expectedSource?.schemaVersion)}.`
    );
  }
  if (request.reupgradeDelta == null) {
    throw new ReupgradeAdmissionError('REUPGRADE_MISSING_DELTA', 'Re-upgrade requires a source-bound authority delta.');
  }

  let delta: AuthorityDowngradeDelta;
  try {
    delta = parseAuthorityDowngradeDelta(request.reupgradeDelta);
  } catch (error) {
    throw new ReupgradeAdmissionError(
      'REUPGRADE_MISSING_DELTA',
      `Re-upgrade authority delta is unusable: ${errorMessage(error)}`
    );
  }
  if (delta.source.schemaVersion !== request.expectedSource.schemaVersion) {
    throw new ReupgradeAdmissionError(
      'REUPGRADE_UNKNOWN_SCHEMA',
      `Re-upgrade delta binds schema ${delta.source.schemaVersion}, expected ${request.expectedSource.schemaVersion}.`
    );
  }
  if (delta.source.sourceEpoch !== request.expectedSource.sourceEpoch) {
    throw new ReupgradeAdmissionError(
      'REUPGRADE_STALE_SOURCE_EPOCH',
      `Re-upgrade delta binds source epoch ${delta.source.sourceEpoch}, expected ${request.expectedSource.sourceEpoch}.`
    );
  }

  const sourceByWorkspace = new Map<string, CanonicalAuthorityLevel>();
  for (const entry of delta.entries) {
    // parseAuthorityDowngradeDelta already rejects classicAuthority above
    // sourceAuthority; this guards the invariant at the admission boundary too.
    if (authorityRank(entry.classicAuthority) > authorityRank(entry.sourceAuthority)) {
      throw new ReupgradeAdmissionError(
        'REUPGRADE_AUTHORITY_INCREASE',
        `Re-upgrade delta widens ${entry.workspace} above its source authority.`
      );
    }
    sourceByWorkspace.set(entry.workspace, entry.sourceAuthority);
  }

  const observed = request.classicObservedAuthority ?? {};
  for (const [workspace, rawAuthority] of Object.entries(observed)) {
    const bound = sourceByWorkspace.get(workspace) ?? AUTHORITY_FLOOR_FOR_UNKNOWN_WORKSPACE;
    if (authorityRank(canonicalizeAuthority(rawAuthority)) > authorityRank(bound)) {
      throw new ReupgradeAdmissionError(
        'REUPGRADE_AUTHORITY_INCREASE',
        `Re-upgrade rejected an effective-authority increase for ${workspace} left by Classic.`
      );
    }
  }

  return {
    schemaVersion: delta.source.schemaVersion,
    sourceEpoch: delta.source.sourceEpoch,
    entries: delta.entries.map((entry) => ({ workspace: entry.workspace, restoredAuthority: entry.sourceAuthority })),
  };
}

/** A workspace absent from the source-bound delta may not be re-widened past the floor. */
const AUTHORITY_FLOOR_FOR_UNKNOWN_WORKSPACE: CanonicalAuthorityLevel = 'ask';
