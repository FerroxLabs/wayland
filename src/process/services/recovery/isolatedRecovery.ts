/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { constants, createReadStream, type Stats } from 'node:fs';
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type RecoveryManifest, verifyRecoverySnapshot } from './recoveryManifest';

export type RestoredDatabaseValidation = {
  schemaVersion: number;
  integrity: 'ok';
};

export type IsolatedRecoveryDependencies = {
  /** Authenticated decryption. It must fail when the envelope or key is invalid. */
  unsealFile: (sourcePath: string, destinationPath: string) => Promise<void>;
  validateDesktopDatabase: (
    databasePath: string,
    expectedSchemaVersion: number
  ) => Promise<RestoredDatabaseValidation>;
  now?: () => Date;
};

export type IsolatedRecoveryReceipt = {
  formatVersion: 1;
  snapshotId: string;
  sourceAppVersion: string;
  desktopSchemaVersion: number;
  materializedAt: string;
  liveStateTouched: false;
  database: RestoredDatabaseValidation;
  files: Array<{
    authority: RecoveryManifest['files'][number]['authority'];
    restorePath: string;
    size: number;
    sha256: string;
  }>;
};

export type MaterializedIsolatedRecovery = {
  destinationRoot: string;
  receiptPath: string;
  receipt: IsolatedRecoveryReceipt;
};

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function assertRegularFile(filePath: string, label: string): Promise<Stats> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file: ${filePath}`);
  return stat;
}

async function assertPathSegmentsNotSymlinks(candidatePath: string): Promise<void> {
  const resolved = path.resolve(candidatePath);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  for (const segment of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error(`Recovery destination contains a symbolic link: ${current}`);
  }
}

/**
 * Decrypt and validate a recovery point into a brand-new isolated tree. This
 * function never derives destinations from sourcePath and never writes to live
 * Desktop/Core roots. Promotion into live state is a separate, gated journey.
 */
export async function materializeIsolatedRecovery(
  snapshotRootInput: string,
  destinationRootInput: string,
  dependencies: IsolatedRecoveryDependencies
): Promise<MaterializedIsolatedRecovery> {
  // Canonicalize platform aliases such as macOS /var -> /private/var before
  // enforcing the no-symlink rule. Any symlink below the canonical root still
  // fails closed.
  const snapshotRoot = await realpath(path.resolve(snapshotRootInput));
  const requestedDestinationRoot = path.resolve(destinationRootInput);

  const manifestPath = path.join(snapshotRoot, 'manifest.json');
  await assertPathSegmentsNotSymlinks(snapshotRoot);
  await assertRegularFile(manifestPath, 'Recovery manifest');
  const manifestValue: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
  const verification = await verifyRecoverySnapshot(manifestValue, snapshotRoot);
  if (!verification.valid) {
    throw new Error(`Recovery snapshot verification failed: ${verification.errors.map(({ code }) => code).join(', ')}`);
  }
  const manifest = manifestValue as RecoveryManifest;

  try {
    await lstat(requestedDestinationRoot);
    throw new Error(`Isolated restore destination already exists: ${requestedDestinationRoot}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const requestedParent = path.dirname(requestedDestinationRoot);
  await mkdir(requestedParent, { recursive: true });
  const parent = await realpath(requestedParent);
  await assertPathSegmentsNotSymlinks(parent);
  const destinationRoot = path.join(parent, path.basename(requestedDestinationRoot));
  if (snapshotRoot === destinationRoot) throw new Error('Isolated restore destination must differ from the snapshot.');
  const stagingRoot = await mkdtemp(path.join(parent, `.${manifest.snapshotId}.restore-`));

  try {
    const restoredFiles: IsolatedRecoveryReceipt['files'] = [];
    for (const file of manifest.files) {
      const sourcePath = path.join(snapshotRoot, ...file.snapshotPath.split('/'));
      const destinationPath = path.join(stagingRoot, ...file.restorePath.split('/'));
      await mkdir(path.dirname(destinationPath), { recursive: true });
      if (file.copyPolicy === 'encrypted-copy') {
        await dependencies.unsealFile(sourcePath, destinationPath);
      } else {
        await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL);
      }
      const stat = await assertRegularFile(destinationPath, 'Materialized recovery file');
      if (process.platform !== 'win32') await chmod(destinationPath, 0o600);
      restoredFiles.push({
        authority: file.authority,
        restorePath: file.restorePath,
        size: stat.size,
        sha256: await sha256File(destinationPath),
      });
    }

    const databasePath = path.join(stagingRoot, 'desktop', 'database', 'wayland.db');
    const database = await dependencies.validateDesktopDatabase(databasePath, manifest.desktopSchemaVersion);
    if (database.schemaVersion !== manifest.desktopSchemaVersion || database.integrity !== 'ok') {
      throw new Error('Materialized database validation did not match the recovery manifest.');
    }

    const receipt: IsolatedRecoveryReceipt = {
      formatVersion: 1,
      snapshotId: manifest.snapshotId,
      sourceAppVersion: manifest.sourceAppVersion,
      desktopSchemaVersion: manifest.desktopSchemaVersion,
      materializedAt: (dependencies.now?.() ?? new Date()).toISOString(),
      liveStateTouched: false,
      database,
      files: restoredFiles,
    };
    const receiptName = 'isolated-recovery-receipt.json';
    await writeFile(path.join(stagingRoot, receiptName), JSON.stringify(receipt, null, 2), {
      flag: 'wx',
      mode: 0o600,
    });
    await rename(stagingRoot, destinationRoot);
    return { destinationRoot, receiptPath: path.join(destinationRoot, receiptName), receipt };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}
