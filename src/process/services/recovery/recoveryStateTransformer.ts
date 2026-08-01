/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_WORKSPACE_ACCESS_LEVEL,
  type LegacyWorkspaceTrustLevel,
  type WorkspaceAccessLevel,
} from '@/common/security/workspaceTrust';
import { createDriver } from '../database/drivers/createDriver';
import { getMigrationsToRollback } from '../database/migrations';
import { readDatabaseSchemaVersionStrict } from './startupCompatibility';

const SUPPORTED_SOURCE_SCHEMA = 53;
const SUPPORTED_TARGET_SCHEMA = 52;

export type CustomModelRecoveryExport = {
  providerId: string;
  modelId: string;
  createdAt: number;
};

export type RecoveryTransformReceipt = {
  formatVersion: 1;
  transform: 'desktop-schema-53-to-52';
  transformedAt: string;
  liveStateTouched: false;
  source: { schemaVersion: 53; sha256: string };
  target: { schemaVersion: 52; sha256: string; integrity: 'ok'; foreignKeys: 'ok' };
  customModels: {
    count: number;
    exportPath: 'post-baseline/custom-models.json';
    sha256: string;
    reimportRequired: boolean;
  };
  safety: {
    cronJobsDisabled: number;
    channelPluginsDisabled: number;
    workflowSessionsParked: number;
  };
};

export type RecoveryTransformResult = {
  destinationRoot: string;
  databasePath: string;
  customModelExportPath: string;
  receiptPath: string;
  receipt: RecoveryTransformReceipt;
};

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function assertRegularFile(filePath: string, label: string): Promise<void> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file: ${filePath}`);
}

async function assertDestinationAbsent(destinationRoot: string): Promise<void> {
  try {
    await lstat(destinationRoot);
    throw new Error(`Recovery transform destination already exists: ${destinationRoot}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function assertPathAbsent(candidate: string, message: string): Promise<void> {
  try {
    await lstat(candidate);
    throw new Error(message);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function assertQuiescentSqliteImage(databasePath: string, label: string): Promise<void> {
  await Promise.all(
    ['-wal', '-shm', '-journal'].map((suffix) =>
      assertPathAbsent(
        `${databasePath}${suffix}`,
        `${label} is not a quiescent single-file SQLite image: ${databasePath}${suffix}`
      )
    )
  );
}

function integrityResult(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 1) return null;
  const row = value[0];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const fields = Object.values(row as Record<string, unknown>);
  return fields.length === 1 && typeof fields[0] === 'string' ? fields[0] : null;
}

/**
 * Produce a schema-52 launch database from a schema-53 isolated copy. The
 * source is never modified. Publication is one directory rename after the
 * downgrade, export, integrity checks, and receipt are complete.
 */
export async function transformDesktopState53To52(
  sourceDatabaseInput: string,
  destinationRootInput: string,
  options: { now?: () => Date; createTransformId?: () => string } = {}
): Promise<RecoveryTransformResult> {
  const sourceDatabasePath = await realpath(path.resolve(sourceDatabaseInput));
  const requestedDestinationRoot = path.resolve(destinationRootInput);
  await assertRegularFile(sourceDatabasePath, 'Recovery source database');
  await assertQuiescentSqliteImage(sourceDatabasePath, 'Recovery source database');
  await assertDestinationAbsent(requestedDestinationRoot);

  const requestedDestinationParent = path.dirname(requestedDestinationRoot);
  await mkdir(requestedDestinationParent, { recursive: true });
  const destinationParent = await realpath(requestedDestinationParent);
  const destinationRoot = path.join(destinationParent, path.basename(requestedDestinationRoot));
  if (destinationRoot === sourceDatabasePath) {
    throw new Error('Recovery transform destination must differ from the source database.');
  }
  const requestedTransformId = (options.createTransformId?.() ?? randomUUID()).replace(/[^a-zA-Z0-9._-]+/g, '-');
  const transformId = requestedTransformId || 'recovery-transform';
  const stagingRoot = await mkdtemp(path.join(destinationParent, `.${transformId}.schema52-`));
  const stagingDatabasePath = path.join(stagingRoot, 'wayland', 'wayland.db');
  const stagingExportPath = path.join(stagingRoot, 'post-baseline', 'custom-models.json');
  const stagingReceiptPath = path.join(stagingRoot, 'recovery-transform-receipt.json');

  try {
    await mkdir(path.dirname(stagingDatabasePath), { recursive: true });
    await mkdir(path.dirname(stagingExportPath), { recursive: true });
    const sourceSha256BeforeCopy = await sha256File(sourceDatabasePath);
    await copyFile(sourceDatabasePath, stagingDatabasePath, constants.COPYFILE_EXCL);
    if (process.platform !== 'win32') await chmod(stagingDatabasePath, 0o600);
    await assertRegularFile(stagingDatabasePath, 'Recovery transform database');
    const [sourceSha256AfterCopy, copiedSha256] = await Promise.all([
      sha256File(sourceDatabasePath),
      sha256File(stagingDatabasePath),
    ]);
    if (sourceSha256BeforeCopy !== sourceSha256AfterCopy || sourceSha256BeforeCopy !== copiedSha256) {
      throw new Error('Recovery source database changed while the isolated transform copy was created.');
    }

    const sourceSha256 = sourceSha256BeforeCopy;
    const driver = await createDriver(stagingDatabasePath, { fileMustExist: true });
    let customModels: CustomModelRecoveryExport[] = [];
    let safety: RecoveryTransformReceipt['safety'] = {
      cronJobsDisabled: 0,
      channelPluginsDisabled: 0,
      workflowSessionsParked: 0,
    };
    try {
      const sourceSchemaVersion = readDatabaseSchemaVersionStrict(driver);
      if (sourceSchemaVersion !== SUPPORTED_SOURCE_SCHEMA) {
        throw new Error(
          `Recovery transformer requires schema ${SUPPORTED_SOURCE_SCHEMA}, received ${sourceSchemaVersion}.`
        );
      }

      customModels = driver
        .prepare(
          `SELECT provider_id AS providerId, model_id AS modelId, created_at AS createdAt
           FROM model_registry_custom_models
           ORDER BY provider_id, model_id`
        )
        .all() as CustomModelRecoveryExport[];

      const migrations = getMigrationsToRollback(SUPPORTED_SOURCE_SCHEMA, SUPPORTED_TARGET_SCHEMA);
      if (migrations.length !== 1 || migrations[0]?.version !== SUPPORTED_SOURCE_SCHEMA) {
        throw new Error('The schema 53 to 52 rollback contract is not uniquely defined.');
      }

      driver.pragma('foreign_keys = OFF');
      try {
        driver.transaction(() => {
          migrations[0].down(driver);
          driver.pragma(`user_version = ${SUPPORTED_TARGET_SCHEMA}`);

          // A rollback copy must not wake real external side effects merely
          // because the older app starts successfully. Classic v0.11.8 loads
          // enabled cron jobs and channel plugins during process bootstrap and
          // may re-poke interrupted workflow sessions. Preserve the rows for
          // inspection, but force every automatic execution surface to require
          // an explicit human re-enable in the isolated copy.
          safety = {
            cronJobsDisabled: driver.prepare('UPDATE cron_jobs SET enabled = 0 WHERE enabled != 0').run().changes,
            channelPluginsDisabled: driver.prepare('UPDATE assistant_plugins SET enabled = 0 WHERE enabled != 0').run()
              .changes,
            workflowSessionsParked: driver
              .prepare(
                "UPDATE workflow_sessions SET run_mode = 'awaiting_input' WHERE status = 'active' AND run_mode = 'running'"
              )
              .run().changes,
          };
        })();
      } finally {
        driver.pragma('foreign_keys = ON');
      }

      if (readDatabaseSchemaVersionStrict(driver) !== SUPPORTED_TARGET_SCHEMA) {
        throw new Error('Recovery transform did not produce the requested schema version.');
      }
      const foreignKeyViolations = driver.pragma('foreign_key_check') as unknown[];
      if (foreignKeyViolations.length > 0) {
        throw new Error(`Recovery transform has ${foreignKeyViolations.length} foreign-key violation(s).`);
      }
      if (integrityResult(driver.pragma('integrity_check')) !== 'ok') {
        throw new Error('Recovery transform failed SQLite integrity validation.');
      }
      driver.pragma('wal_checkpoint(TRUNCATE)');
    } finally {
      driver.close();
    }
    await assertQuiescentSqliteImage(stagingDatabasePath, 'Recovery transform database');

    const exportDocument = {
      formatVersion: 1,
      sourceSchemaVersion: SUPPORTED_SOURCE_SCHEMA,
      targetSchemaVersion: SUPPORTED_TARGET_SCHEMA,
      reimportRequired: customModels.length > 0,
      reason:
        'Wayland v0.11.8 schema 52 cannot read model_registry_custom_models. Preserve these rows and re-import them after re-upgrade.',
      customModels,
    };
    await writeFile(stagingExportPath, JSON.stringify(exportDocument, null, 2), { flag: 'wx', mode: 0o600 });
    const exportSha256 = await sha256File(stagingExportPath);
    const targetSha256 = await sha256File(stagingDatabasePath);

    const receipt: RecoveryTransformReceipt = {
      formatVersion: 1,
      transform: 'desktop-schema-53-to-52',
      transformedAt: (options.now?.() ?? new Date()).toISOString(),
      liveStateTouched: false,
      source: { schemaVersion: SUPPORTED_SOURCE_SCHEMA, sha256: sourceSha256 },
      target: {
        schemaVersion: SUPPORTED_TARGET_SCHEMA,
        sha256: targetSha256,
        integrity: 'ok',
        foreignKeys: 'ok',
      },
      customModels: {
        count: customModels.length,
        exportPath: 'post-baseline/custom-models.json',
        sha256: exportSha256,
        reimportRequired: customModels.length > 0,
      },
      safety,
    };
    await writeFile(stagingReceiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 });
    // Narrow the absent-check/rename window. Node does not expose
    // renameat2(RENAME_NOREPLACE), so the external launcher also serializes one
    // transform per destination. This second check prevents ordinary clobbering.
    await assertDestinationAbsent(destinationRoot);
    await rename(stagingRoot, destinationRoot);

    const receiptPath = path.join(destinationRoot, 'recovery-transform-receipt.json');
    const publishedReceipt = JSON.parse(await readFile(receiptPath, 'utf8')) as RecoveryTransformReceipt;
    return {
      destinationRoot,
      databasePath: path.join(destinationRoot, 'wayland', 'wayland.db'),
      customModelExportPath: path.join(destinationRoot, 'post-baseline', 'custom-models.json'),
      receiptPath,
      receipt: publishedReceipt,
    };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

/* ------------------------------------------------------------------------- *
 * Canonical authority downgrade / re-upgrade transform (SAF-03, D-01, D-07)
 *
 * The per-workspace access axis persists exactly two canonical authority
 * levels: `ask` and `trusted-edits` (see `@/common/security/workspaceTrust`).
 * Signed Classic v0.11.8 predates that vocabulary and persisted the legacy
 * `chat` / `cowork` tokens. Downgrading into Classic and re-upgrading back must
 * be MONOTONICALLY NON-WIDENING: every legacy, unknown, or future authority
 * maps to equal-or-less authority in Classic, and re-upgrade reapplies only the
 * source-bound authority — it never re-widens from whatever Classic left behind.
 * Authority is derived SOLELY from the persisted authority token; model, mode,
 * and feature labels never widen it.
 * ------------------------------------------------------------------------- */

export type CanonicalAuthorityLevel = WorkspaceAccessLevel;

/** Ordered authority lattice. `ask` (0) is the conservative floor. */
const AUTHORITY_RANK: Record<CanonicalAuthorityLevel, number> = { ask: 0, 'trusted-edits': 1 };

/** The least-authority canonical level; unknown/future/malformed clamp here. */
export const AUTHORITY_FLOOR: CanonicalAuthorityLevel = DEFAULT_WORKSPACE_ACCESS_LEVEL;

/** Highest canonical authority signed Classic v0.11.8 (`cowork`) can honor. */
const CLASSIC_MAX_AUTHORITY: CanonicalAuthorityLevel = 'trusted-edits';

/** Legacy Classic vocabulary → canonical authority. */
const LEGACY_AUTHORITY_MIGRATION: Record<LegacyWorkspaceTrustLevel, CanonicalAuthorityLevel> = {
  chat: 'ask',
  cowork: 'trusted-edits',
};

export function authorityRank(level: CanonicalAuthorityLevel): number {
  return AUTHORITY_RANK[level];
}

export type AuthorityRejectionReason = 'unknown-vocabulary' | 'empty' | 'non-string';

/**
 * Classify one persisted authority token. Only `ask`/`trusted-edits` are
 * canonical; `chat`/`cowork` migrate to their canonical equivalent; ANY other
 * persistent vocabulary (unknown string, future token, malformed non-string) is
 * rejected AS AUTHORITY and conservatively projected to the `ask` floor.
 */
export type PersistedAuthorityClassification =
  | { disposition: 'canonical'; level: CanonicalAuthorityLevel }
  | { disposition: 'legacy-migrated'; from: LegacyWorkspaceTrustLevel; level: CanonicalAuthorityLevel }
  | { disposition: 'rejected'; reason: AuthorityRejectionReason; rawType: string; level: CanonicalAuthorityLevel };

export function classifyPersistedAuthority(raw: unknown): PersistedAuthorityClassification {
  if (raw === 'ask' || raw === 'trusted-edits') {
    return { disposition: 'canonical', level: raw };
  }
  if (raw === 'chat' || raw === 'cowork') {
    return { disposition: 'legacy-migrated', from: raw, level: LEGACY_AUTHORITY_MIGRATION[raw] };
  }
  if (typeof raw !== 'string') {
    return {
      disposition: 'rejected',
      reason: 'non-string',
      rawType: raw === null ? 'null' : typeof raw,
      level: AUTHORITY_FLOOR,
    };
  }
  return {
    disposition: 'rejected',
    reason: raw.length === 0 ? 'empty' : 'unknown-vocabulary',
    rawType: 'string',
    level: AUTHORITY_FLOOR,
  };
}

/** Canonical authority for any persisted value; unknown/future/malformed → `ask`. */
export function canonicalizeAuthority(raw: unknown): CanonicalAuthorityLevel {
  return classifyPersistedAuthority(raw).level;
}

/** Identity that binds a downgrade delta to the exact source state it came from. */
export type AuthoritySourceIdentity = {
  /** Desktop schema version of the source state (e.g. 53). */
  schemaVersion: number;
  /** Monotonic mutation epoch of the source authority store at capture time. */
  sourceEpoch: number;
};

/** One source authority record. Adjacent labels never widen authority. */
export type SourceAuthorityRecord = {
  /** Stable workspace identity (normalized cwd). */
  workspace: string;
  /** The persisted authority token exactly as stored. */
  authority: unknown;
  /**
   * Carried for receipts only. The transform NEVER reads these to infer broader
   * authority (SAF-03): authority derives solely from the `authority` token.
   */
  labels?: { model?: string; mode?: string; features?: readonly string[] };
};

export type AuthorityDowngradeEntry = {
  workspace: string;
  disposition: PersistedAuthorityClassification['disposition'];
  /** Canonicalized source authority; the source-bound value re-upgrade restores. */
  sourceAuthority: CanonicalAuthorityLevel;
  /** Authority signed Classic may honor — always rank <= sourceAuthority. */
  classicAuthority: CanonicalAuthorityLevel;
};

export type AuthorityDowngradeDelta = {
  formatVersion: 1;
  kind: 'canonical-authority-downgrade';
  source: AuthoritySourceIdentity;
  entries: AuthorityDowngradeEntry[];
  /** sha256 over the canonicalized {source, entries}; binds the delta to its source. */
  digest: string;
};

function assertSourceIdentity(source: AuthoritySourceIdentity, label: string): void {
  if (!source || typeof source !== 'object') throw new Error(`${label} is missing.`);
  if (!Number.isSafeInteger(source.schemaVersion) || source.schemaVersion < 0) {
    throw new Error(`${label} has an invalid schema version.`);
  }
  if (!Number.isSafeInteger(source.sourceEpoch) || source.sourceEpoch < 0) {
    throw new Error(`${label} has an invalid source epoch.`);
  }
}

function authorityDeltaDigest(source: AuthoritySourceIdentity, entries: readonly AuthorityDowngradeEntry[]): string {
  const canonical = {
    schemaVersion: source.schemaVersion,
    sourceEpoch: source.sourceEpoch,
    entries: entries.map((entry) => ({
      workspace: entry.workspace,
      disposition: entry.disposition,
      sourceAuthority: entry.sourceAuthority,
      classicAuthority: entry.classicAuthority,
    })),
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

/**
 * Produce the conservative, source-bound authority delta for a Classic
 * downgrade. Every record maps to a Classic-honorable canonical level whose
 * rank never exceeds the source's own recognized rank; unknown/future/malformed
 * tokens floor to `ask`. The returned delta is the only re-upgrade authority.
 */
export function downgradeAuthorityForClassic(
  source: AuthoritySourceIdentity,
  records: readonly SourceAuthorityRecord[]
): AuthorityDowngradeDelta {
  assertSourceIdentity(source, 'Authority downgrade source identity');
  const seen = new Set<string>();
  const entries = records.map((record) => {
    if (typeof record.workspace !== 'string' || record.workspace.length === 0) {
      throw new Error('Authority downgrade record has an invalid workspace identity.');
    }
    if (seen.has(record.workspace)) {
      throw new Error(`Authority downgrade has a duplicate workspace: ${record.workspace}`);
    }
    seen.add(record.workspace);
    const classification = classifyPersistedAuthority(record.authority);
    const sourceAuthority = classification.level;
    // Conservative downgrade: never emit an authority Classic cannot honor.
    const classicAuthority =
      authorityRank(sourceAuthority) > authorityRank(CLASSIC_MAX_AUTHORITY) ? AUTHORITY_FLOOR : sourceAuthority;
    return {
      workspace: record.workspace,
      disposition: classification.disposition,
      sourceAuthority,
      classicAuthority,
    };
  });
  const identity: AuthoritySourceIdentity = { schemaVersion: source.schemaVersion, sourceEpoch: source.sourceEpoch };
  return {
    formatVersion: 1,
    kind: 'canonical-authority-downgrade',
    source: identity,
    entries,
    digest: authorityDeltaDigest(identity, entries),
  };
}

function asAuthorityObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function isCanonicalAuthorityLevel(value: unknown): value is CanonicalAuthorityLevel {
  return value === 'ask' || value === 'trusted-edits';
}

function parseAuthorityDowngradeEntry(value: unknown, index: number): AuthorityDowngradeEntry {
  const entry = asAuthorityObject(value, `Authority downgrade entry ${index}`);
  if (typeof entry.workspace !== 'string' || entry.workspace.length === 0) {
    throw new Error(`Authority downgrade entry ${index} has an invalid workspace identity.`);
  }
  if (
    entry.disposition !== 'canonical' &&
    entry.disposition !== 'legacy-migrated' &&
    entry.disposition !== 'rejected'
  ) {
    throw new Error(`Authority downgrade entry ${index} has an unknown disposition.`);
  }
  if (!isCanonicalAuthorityLevel(entry.sourceAuthority) || !isCanonicalAuthorityLevel(entry.classicAuthority)) {
    throw new Error(`Authority downgrade entry ${index} has a non-canonical authority level.`);
  }
  if (authorityRank(entry.classicAuthority) > authorityRank(entry.sourceAuthority)) {
    throw new Error(`Authority downgrade entry ${index} widens Classic authority above its source.`);
  }
  return {
    workspace: entry.workspace,
    disposition: entry.disposition,
    sourceAuthority: entry.sourceAuthority,
    classicAuthority: entry.classicAuthority,
  };
}

/** Structurally validate a downgrade delta and verify its source-binding digest. */
export function parseAuthorityDowngradeDelta(value: unknown): AuthorityDowngradeDelta {
  const record = asAuthorityObject(value, 'Authority downgrade delta');
  if (record.formatVersion !== 1) throw new Error('Authority downgrade delta has an unsupported format version.');
  if (record.kind !== 'canonical-authority-downgrade') {
    throw new Error('Authority downgrade delta has an unexpected kind.');
  }
  const sourceRecord = asAuthorityObject(record.source, 'Authority downgrade delta source');
  const source: AuthoritySourceIdentity = {
    schemaVersion: sourceRecord.schemaVersion as number,
    sourceEpoch: sourceRecord.sourceEpoch as number,
  };
  assertSourceIdentity(source, 'Authority downgrade delta source');
  if (!Array.isArray(record.entries)) throw new Error('Authority downgrade delta entries must be an array.');
  const entries = record.entries.map(parseAuthorityDowngradeEntry);
  const workspaces = new Set<string>();
  for (const entry of entries) {
    if (workspaces.has(entry.workspace)) {
      throw new Error(`Authority downgrade delta has a duplicate workspace: ${entry.workspace}`);
    }
    workspaces.add(entry.workspace);
  }
  const expectedDigest = authorityDeltaDigest(source, entries);
  if (typeof record.digest !== 'string' || record.digest !== expectedDigest) {
    throw new Error('Authority downgrade delta digest does not bind its source-bound content.');
  }
  return { formatVersion: 1, kind: 'canonical-authority-downgrade', source, entries, digest: expectedDigest };
}

export type AuthorityReupgradeEntry = { workspace: string; restoredAuthority: CanonicalAuthorityLevel };

export type AuthorityReupgradeResult = {
  schemaVersion: number;
  sourceEpoch: number;
  entries: AuthorityReupgradeEntry[];
};

/**
 * Reapply a source-bound downgrade delta on re-upgrade. Restores exactly the
 * source authority per workspace or fails closed. Never widens: a delta whose
 * schema or epoch does not match the expected source, or whose digest does not
 * bind its content, is rejected.
 */
export function reapplyAuthorityDelta(
  deltaInput: unknown,
  expected: AuthoritySourceIdentity
): AuthorityReupgradeResult {
  assertSourceIdentity(expected, 'Authority re-upgrade expected source');
  const delta = parseAuthorityDowngradeDelta(deltaInput);
  if (delta.source.schemaVersion !== expected.schemaVersion) {
    throw new Error(
      `Authority re-upgrade schema mismatch: delta ${delta.source.schemaVersion}, expected ${expected.schemaVersion}.`
    );
  }
  if (delta.source.sourceEpoch !== expected.sourceEpoch) {
    throw new Error(
      `Authority re-upgrade rejected a stale source epoch: delta ${delta.source.sourceEpoch}, expected ${expected.sourceEpoch}.`
    );
  }
  return {
    schemaVersion: delta.source.schemaVersion,
    sourceEpoch: delta.source.sourceEpoch,
    entries: delta.entries.map((entry) => ({ workspace: entry.workspace, restoredAuthority: entry.sourceAuthority })),
  };
}
