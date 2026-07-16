/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
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
            channelPluginsDisabled: driver
              .prepare('UPDATE assistant_plugins SET enabled = 0 WHERE enabled != 0')
              .run().changes,
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
