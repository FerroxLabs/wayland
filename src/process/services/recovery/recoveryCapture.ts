/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { WaylandReleaseTrack } from '@/common/releaseTrack';
import { nativeConfigDir, profilesRoot } from '@process/agent/wcore/profilePaths';
import { createDriver } from '@process/services/database/drivers/createDriver';
import { readDatabaseSchemaVersionStrict } from './startupCompatibility';
import { sealRecoveryFile } from './recoverySealing';
import { buildRecoveryPoint, type BuiltRecoveryPoint } from './recoveryPointBuilder';
import { inventoryRecoveryAuthorities, type RecoveryInventory } from './stateAuthorityInventory';

export type ProductionRecoveryCaptureInputs = {
  destinationRoot: string;
  userDataRoot: string;
  sourceAppVersion: string;
  sourceReleaseTrack: WaylandReleaseTrack;
  /** Must be true only while bootstrap owns the ordinary Desktop profile lock. */
  desktopProfileLockHeld: true;
};

const EPOCH_AUTHORITIES = new Set([
  'desktop.config',
  'desktop.runtime-files',
  'credentials.key-material',
  'updater.state',
]);

function pathsOverlap(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);
  const relativeAB = path.relative(a, b);
  const relativeBA = path.relative(b, a);
  return (
    a === b ||
    (relativeAB !== '' && !relativeAB.startsWith('..') && !path.isAbsolute(relativeAB)) ||
    (relativeBA !== '' && !relativeBA.startsWith('..') && !path.isAbsolute(relativeBA))
  );
}

async function addFileToEpoch(hash: ReturnType<typeof createHash>, filePath: string, root: string): Promise<void> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error(`Recovery mutation epoch found unsafe file: ${filePath}`);
  hash.update(`file\0${path.relative(root, filePath)}\0${stat.size}\0`);
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
}

async function addPathToEpoch(hash: ReturnType<typeof createHash>, candidate: string): Promise<void> {
  let stat: Awaited<ReturnType<typeof lstat>>;
  try {
    stat = await lstat(candidate);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      hash.update(`absent\0${candidate}\0`);
      return;
    }
    throw error;
  }
  if (stat.isSymbolicLink()) throw new Error(`Recovery mutation epoch refuses symlink: ${candidate}`);
  if (stat.isFile()) {
    await addFileToEpoch(hash, candidate, path.dirname(candidate));
    return;
  }
  if (!stat.isDirectory()) throw new Error(`Recovery mutation epoch found unsupported path: ${candidate}`);

  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    hash.update(`dir\0${path.relative(candidate, directory)}\0`);
    for (const entry of entries) {
      const child = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Recovery mutation epoch refuses symlink: ${child}`);
      // Sequential traversal is required because this is one ordered hash stream.
      // oxlint-disable-next-line no-await-in-loop
      if (entry.isDirectory()) await visit(child);
      // oxlint-disable-next-line no-await-in-loop
      else if (entry.isFile()) await addFileToEpoch(hash, child, candidate);
      else throw new Error(`Recovery mutation epoch found unsupported entry: ${child}`);
    }
  };
  await visit(candidate);
}

/** Content-bound epoch for Desktop-owned copied state; SQLite has its own online-backup authority. */
export async function fingerprintDesktopRecoveryState(inventory: RecoveryInventory): Promise<string> {
  const hash = createHash('sha256');
  for (const authority of inventory.authorities.filter(({ id }) => EPOCH_AUTHORITIES.has(id))) {
    hash.update(`authority\0${authority.id}\0`);
    for (const evidence of authority.evidence) {
      // Sequential traversal is required because this is one ordered hash stream.
      // oxlint-disable-next-line no-await-in-loop
      await addPathToEpoch(hash, evidence.path);
    }
  }
  return `sha256:${hash.digest('hex')}`;
}

/**
 * Capture live Desktop state only while bootstrap owns the normal profile lock.
 * Core state deliberately blocks in recoveryPointBuilder until #896 publishes a
 * producer-owned quiescence lease; filesystem hashing is not a substitute.
 */
export async function captureProductionRecoveryPoint(
  inputs: ProductionRecoveryCaptureInputs
): Promise<BuiltRecoveryPoint> {
  if (!inputs.desktopProfileLockHeld) throw new Error('Desktop recovery capture requires the live profile lock.');
  const defaultCoreRoot = nativeConfigDir();
  const namedCoreRoot = profilesRoot();
  for (const protectedRoot of [inputs.userDataRoot, defaultCoreRoot, namedCoreRoot]) {
    if (pathsOverlap(inputs.destinationRoot, protectedRoot)) {
      throw new Error(`Recovery destination must be disjoint from live state: ${protectedRoot}`);
    }
  }

  const inventory = await inventoryRecoveryAuthorities({
    userDataRoot: inputs.userDataRoot,
    coreDefaultProfileRoot: defaultCoreRoot,
    coreNamedProfilesRoot: namedCoreRoot,
    sourceReleaseTrack: inputs.sourceReleaseTrack,
  });
  const databasePath = inventory.authorities.find(({ id }) => id === 'desktop.database')?.evidence[0]?.path;
  if (!databasePath) throw new Error('Desktop recovery capture could not resolve the authoritative database.');
  const schemaDriver = await createDriver(databasePath, { readonly: true, fileMustExist: true });
  let desktopSchemaVersion: number;
  try {
    desktopSchemaVersion = readDatabaseSchemaVersionStrict(schemaDriver);
  } finally {
    schemaDriver.close();
  }

  return buildRecoveryPoint(
    {
      inventory,
      destinationRoot: inputs.destinationRoot,
      reason: 'manual',
      sourceAppVersion: inputs.sourceAppVersion,
      desktopSchemaVersion,
    },
    {
      captureSqliteOnline: async (sourcePath, destinationPath) => {
        const driver = await createDriver(sourcePath, { readonly: true, fileMustExist: true });
        try {
          await driver.backup(destinationPath);
        } finally {
          driver.close();
        }
      },
      sealFile: sealRecoveryFile,
      acquireDesktopQuiescence: async () => ({ release: async () => undefined }),
      // Intentionally absent until FerroxLabs/wayland#896 is accepted.
      acquireCoreQuiescence: undefined,
      readMutationEpoch: () => fingerprintDesktopRecoveryState(inventory),
    }
  );
}
