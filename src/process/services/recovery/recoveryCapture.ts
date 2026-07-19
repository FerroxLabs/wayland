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
import {
  assertRecoveryDestinationDisjoint,
  buildRecoveryPoint,
  RecoveryPointBuildBlockedError,
  type BuiltRecoveryPoint,
} from './recoveryPointBuilder';
import { evaluateRecoveryDryRun, type RecoveryDryRun } from './recoveryDryRun';
import { inventoryRecoveryAuthorities, type RecoveryInventory } from './stateAuthorityInventory';
import {
  loadOrCreateExternalRecoveryAuthority,
  type ExternalRecoveryVaultBackend,
  type LoadedExternalRecoveryAuthority,
} from './externalRecoveryAuthority';

export type HealthyV2ExternalRecoveryAuthorityCapture = {
  /** Explicit caller assertion; absence preserves the legacy capture path without provisioning authority. */
  confirmed: true;
  /** Complete inventory from the caller's external-recovery record/history store. */
  existingRecordDigests: readonly string[];
};

export type ProductionRecoveryCaptureInputs = {
  destinationRoot: string;
  userDataRoot: string;
  sourceAppVersion: string;
  sourceReleaseTrack: WaylandReleaseTrack;
  /** Must be true only while bootstrap owns the ordinary Desktop profile lock. */
  desktopProfileLockHeld: true;
  /** Authority provisioning is opt-in and valid only for a proven healthy v2 source. */
  externalRecoveryAuthority?: HealthyV2ExternalRecoveryAuthorityCapture;
};

export type ProductionRecoveryCaptureDependencies = {
  externalRecoveryVault?: ExternalRecoveryVaultBackend;
  loadOrCreateExternalRecoveryAuthority?: typeof loadOrCreateExternalRecoveryAuthority;
  resolveCoreRoots?: () => {
    defaultCoreRoot: string;
    namedCoreRoot: string;
    constitutionRoot: string;
  };
  createDatabaseDriver?: typeof createDriver;
  sealFile?: typeof sealRecoveryFile;
};

const EPOCH_AUTHORITIES = new Set([
  'desktop.config',
  'desktop.runtime-files',
  'constitution.filesystem',
  'constitution.revision-authority',
  'credentials.key-material',
  'updater.state',
]);

const EXTERNAL_RECOVERY_SAFE_STORAGE_REF = 'electron-safe-storage:wayland-external-recovery-authority-v1';

export async function createProductionExternalRecoveryVaultBackend(): Promise<ExternalRecoveryVaultBackend> {
  const { safeStorage } = await import('electron');
  const requireAvailable = (): void => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('External recovery authority requires an available OS credential store; fallback is forbidden.');
    }
  };
  return {
    provider: 'electron-safe-storage',
    async wrap({ secret }) {
      requireAvailable();
      return {
        vaultRef: EXTERNAL_RECOVERY_SAFE_STORAGE_REF,
        wrappedSecret: safeStorage.encryptString(secret.toString('base64url')),
      };
    },
    async unwrap({ wrappedSecret }) {
      requireAvailable();
      const encoded = safeStorage.decryptString(wrappedSecret);
      if (!/^[A-Za-z0-9_-]{43}$/.test(encoded)) {
        throw new Error('External recovery OS vault returned a malformed secret.');
      }
      const secret = Buffer.from(encoded, 'base64url');
      if (secret.length !== 32 || secret.toString('base64url') !== encoded) {
        secret.fill(0);
        throw new Error('External recovery OS vault returned a noncanonical secret.');
      }
      return secret;
    },
  };
}

export type ProvisionHealthyV2ExternalRecoveryAuthorityInput = {
  userDataRoot: string;
  desktopSchemaVersion: number;
  inventory: RecoveryInventory;
  request: HealthyV2ExternalRecoveryAuthorityCapture;
};

/**
 * Provision or reconcile only at the explicit healthy-v2 capture boundary. The returned active secret is wiped here;
 * capture owns lifecycle validation, not record encryption, until the new record codec is wired separately.
 */
export async function provisionHealthyV2ExternalRecoveryAuthority(
  input: ProvisionHealthyV2ExternalRecoveryAuthorityInput,
  dependencies: ProductionRecoveryCaptureDependencies = {}
): Promise<Omit<LoadedExternalRecoveryAuthority, 'activeSecret'>> {
  if (input.request.confirmed !== true || input.desktopSchemaVersion !== 53) {
    throw new Error('External recovery authority provisioning requires an explicit healthy v2 capture.');
  }
  const revisionAuthority = input.inventory.authorities.find(({ id }) => id === 'constitution.revision-authority');
  if (revisionAuthority?.state !== 'present') {
    throw new Error('External recovery authority provisioning requires a present v2 revision authority.');
  }
  const vault = dependencies.externalRecoveryVault ?? (await createProductionExternalRecoveryVaultBackend());
  const provision = dependencies.loadOrCreateExternalRecoveryAuthority ?? loadOrCreateExternalRecoveryAuthority;
  const loaded = await provision({
    userDataRoot: input.userDataRoot,
    vault,
    existingRecordDigests: async () => input.request.existingRecordDigests,
  });
  const { activeSecret, ...receipt } = loaded;
  activeSecret.fill(0);
  return receipt;
}

export { assertRecoveryDestinationDisjoint };

/**
 * Authenticate the bounded Desktop-only capture boundary. A caller-provided or
 * locally fabricated Core lease cannot pass this production preflight; plan
 * 01-18 owns the future producer-admitted Core path.
 */
export function assertDesktopOnlyRecoveryCaptureReady(inventory: RecoveryInventory): RecoveryDryRun {
  const dryRun = evaluateRecoveryDryRun(inventory, {
    sqliteOnlineBackup: true,
    desktopQuiescence: true,
    coreQuiescence: false,
    mutationEpoch: true,
    sealedSensitiveCopies: true,
  });
  if (!dryRun.readyToCapture) throw new RecoveryPointBuildBlockedError(dryRun);
  return dryRun;
}

async function addFileToEpoch(hash: ReturnType<typeof createHash>, filePath: string, root: string): Promise<void> {
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error(`Recovery mutation epoch found unsafe file: ${filePath}`);
  if (stat.nlink !== 1) throw new Error(`Recovery mutation epoch refuses hard-linked file: ${filePath}`);
  hash.update(`file\0${path.relative(root, filePath)}\0${stat.size}\0`);
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
}

async function addPathToEpoch(
  hash: ReturnType<typeof createHash>,
  candidate: string,
  excludedTopLevel: ReadonlySet<string> = new Set()
): Promise<void> {
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
    entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    hash.update(`dir\0${path.relative(candidate, directory)}\0`);
    for (const entry of entries) {
      if (directory === candidate && excludedTopLevel.has(entry.name)) continue;
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
      await addPathToEpoch(
        hash,
        evidence.path,
        authority.id === 'constitution.filesystem' ? new Set(['profiles']) : new Set()
      );
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
  inputs: ProductionRecoveryCaptureInputs,
  dependencies: ProductionRecoveryCaptureDependencies = {}
): Promise<BuiltRecoveryPoint> {
  if (!inputs.desktopProfileLockHeld) throw new Error('Desktop recovery capture requires the live profile lock.');
  const resolvedCoreRoots = dependencies.resolveCoreRoots?.() ?? {
    defaultCoreRoot: nativeConfigDir(),
    namedCoreRoot: profilesRoot(),
    constitutionRoot: path.dirname(profilesRoot()),
  };
  const { defaultCoreRoot, namedCoreRoot, constitutionRoot } = resolvedCoreRoots;
  const databaseDriverFactory = dependencies.createDatabaseDriver ?? createDriver;
  const recoverySealer = dependencies.sealFile ?? sealRecoveryFile;
  await assertRecoveryDestinationDisjoint(inputs.destinationRoot, [
    inputs.userDataRoot,
    constitutionRoot,
    defaultCoreRoot,
    namedCoreRoot,
  ]);

  const inventory = await inventoryRecoveryAuthorities({
    userDataRoot: inputs.userDataRoot,
    constitutionRoot,
    coreDefaultProfileRoot: defaultCoreRoot,
    coreNamedProfilesRoot: namedCoreRoot,
    sourceReleaseTrack: inputs.sourceReleaseTrack,
  });
  assertDesktopOnlyRecoveryCaptureReady(inventory);
  const databasePath = inventory.authorities.find(({ id }) => id === 'desktop.database')?.evidence[0]?.path;
  if (!databasePath) throw new Error('Desktop recovery capture could not resolve the authoritative database.');
  const schemaDriver = await databaseDriverFactory(databasePath, { readonly: true, fileMustExist: true });
  let desktopSchemaVersion: number;
  try {
    desktopSchemaVersion = readDatabaseSchemaVersionStrict(schemaDriver);
  } finally {
    schemaDriver.close();
  }

  if (inputs.externalRecoveryAuthority) {
    await provisionHealthyV2ExternalRecoveryAuthority(
      {
        userDataRoot: inputs.userDataRoot,
        desktopSchemaVersion,
        inventory,
        request: inputs.externalRecoveryAuthority,
      },
      dependencies
    );
  }

  return buildRecoveryPoint(
    {
      inventory,
      destinationRoot: inputs.destinationRoot,
      reason: 'manual',
      sourceAppVersion: inputs.sourceAppVersion,
      desktopSchemaVersion,
      protectedRoots: [inputs.userDataRoot, constitutionRoot, defaultCoreRoot, namedCoreRoot],
    },
    {
      captureSqliteOnline: async (sourcePath, destinationPath) => {
        const driver = await databaseDriverFactory(sourcePath, { readonly: true, fileMustExist: true });
        try {
          await driver.backup(destinationPath);
        } finally {
          driver.close();
        }
      },
      sealFile: recoverySealer,
      acquireDesktopQuiescence: async () => ({ release: async () => undefined }),
      // Intentionally absent until FerroxLabs/wayland#896 is accepted.
      acquireCoreQuiescence: undefined,
      readMutationEpoch: () => fingerprintDesktopRecoveryState(inventory),
    }
  );
}
