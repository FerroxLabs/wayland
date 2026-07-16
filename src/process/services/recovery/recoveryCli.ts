/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { verifyRecoverySnapshotRoot, type RecoveryManifestValidation } from './recoveryManifest';
import type { MaterializedIsolatedRecovery } from './isolatedRecovery';

export const VERIFY_RECOVERY_SNAPSHOT_FLAG = '--verify-recovery-snapshot';
export const CREATE_RECOVERY_SNAPSHOT_FLAG = '--create-recovery-snapshot';
export const DOWNLOAD_CLASSIC_RECOVERY_RELEASE_FLAG = '--download-classic-recovery-release';
export const PREPARE_CLASSIC_RECOVERY_BINARY_FLAG = '--prepare-classic-recovery-binary';
export const MATERIALIZE_RECOVERY_SNAPSHOT_FLAG = '--materialize-recovery-snapshot';
export const LAUNCH_CLASSIC_RECOVERY_FLAG = '--launch-classic-recovery';
export const LAUNCH_CLASSIC_RECOVERY_SNAPSHOT_FLAG = '--launch-classic-recovery-snapshot';
export const CLASSIC_BINARY_FLAG = '--classic-binary';
export const CLASSIC_BINARY_SHA256_FLAG = '--classic-binary-sha256';
export const USE_PINNED_CLASSIC_RELEASE_FLAG = '--use-pinned-classic-release';
export const RECOVERY_DESTINATION_FLAG = '--recovery-destination';

export type RecoveryVerificationCommand = {
  kind: 'verify-recovery-snapshot';
  snapshotRoot: string;
};

export type RecoveryCaptureCommand = {
  kind: 'create-recovery-snapshot';
  destinationRoot: string;
};

export type ClassicRecoveryReleaseDownloadCommand = {
  kind: 'download-classic-recovery-release';
  destinationDirectory: string;
};

export type ClassicRecoveryBinaryPreparationCommand = {
  kind: 'prepare-classic-recovery-binary';
  artifactPath: string;
  destinationParent: string;
};

export type ClassicRecoveryLaunchCommand = {
  kind: 'launch-classic-recovery';
  materializedRoot: string;
  classicBinaryPath: string;
  classicBinarySha256: string;
  destinationRoot: string;
};

export type RecoveryMaterializationCommand = {
  kind: 'materialize-recovery-snapshot';
  snapshotRoot: string;
  destinationRoot: string;
};

export type ClassicRecoverySnapshotLaunchCommand =
  | {
      kind: 'launch-classic-recovery-snapshot';
      binarySource: 'provided';
      snapshotRoot: string;
      classicBinaryPath: string;
      classicBinarySha256: string;
      destinationRoot: string;
    }
  | {
      kind: 'launch-classic-recovery-snapshot';
      binarySource: 'pinned-release';
      snapshotRoot: string;
      destinationRoot: string;
    };

function singleFlagValue(argv: string[], flag: string, required: boolean): string | null {
  const indexes = argv.flatMap((argument, index) => (argument === flag ? [index] : []));
  if (indexes.length === 0) {
    if (required) throw new Error(`${flag} is required.`);
    return null;
  }
  if (indexes.length !== 1) throw new Error(`${flag} may be provided only once.`);
  const value = argv[indexes[0] + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a path.`);
  return value;
}

function singleBooleanFlag(argv: string[], flag: string): boolean {
  const count = argv.filter((argument) => argument === flag).length;
  if (count > 1) throw new Error(`${flag} may be provided only once.`);
  return count === 1;
}

export function parseRecoveryCaptureCommand(argv: string[]): RecoveryCaptureCommand | null {
  const destinationRoot = singleFlagValue(argv, CREATE_RECOVERY_SNAPSHOT_FLAG, false);
  if (destinationRoot === null) return null;
  return { kind: 'create-recovery-snapshot', destinationRoot };
}

export function parseClassicRecoveryReleaseDownloadCommand(
  argv: string[]
): ClassicRecoveryReleaseDownloadCommand | null {
  const destinationDirectory = singleFlagValue(argv, DOWNLOAD_CLASSIC_RECOVERY_RELEASE_FLAG, false);
  if (destinationDirectory === null) return null;
  return { kind: 'download-classic-recovery-release', destinationDirectory };
}

export function parseClassicRecoveryBinaryPreparationCommand(
  argv: string[]
): ClassicRecoveryBinaryPreparationCommand | null {
  const artifactPath = singleFlagValue(argv, PREPARE_CLASSIC_RECOVERY_BINARY_FLAG, false);
  if (artifactPath === null) return null;
  return {
    kind: 'prepare-classic-recovery-binary',
    artifactPath,
    destinationParent: singleFlagValue(argv, RECOVERY_DESTINATION_FLAG, true)!,
  };
}

/** Parse the dependency-light recovery verifier command without accepting ambiguous duplicates. */
export function parseRecoveryVerificationCommand(argv: string[]): RecoveryVerificationCommand | null {
  const indexes = argv.flatMap((argument, index) => (argument === VERIFY_RECOVERY_SNAPSHOT_FLAG ? [index] : []));
  if (indexes.length === 0) return null;
  if (indexes.length !== 1) throw new Error(`${VERIFY_RECOVERY_SNAPSHOT_FLAG} may be provided only once.`);

  const index = indexes[0];
  const snapshotRoot = argv[index + 1];
  if (!snapshotRoot || snapshotRoot.startsWith('--')) {
    throw new Error(`${VERIFY_RECOVERY_SNAPSHOT_FLAG} requires a snapshot directory.`);
  }
  return { kind: 'verify-recovery-snapshot', snapshotRoot };
}

export function runRecoveryVerificationCommand(
  command: RecoveryVerificationCommand
): Promise<RecoveryManifestValidation> {
  return verifyRecoverySnapshotRoot(command.snapshotRoot);
}

export function parseRecoveryMaterializationCommand(argv: string[]): RecoveryMaterializationCommand | null {
  const snapshotRoot = singleFlagValue(argv, MATERIALIZE_RECOVERY_SNAPSHOT_FLAG, false);
  if (snapshotRoot === null) return null;
  return {
    kind: 'materialize-recovery-snapshot',
    snapshotRoot,
    destinationRoot: singleFlagValue(argv, RECOVERY_DESTINATION_FLAG, true)!,
  };
}

/** Load native database and OS credential-store dependencies only for the explicit materialization command. */
export async function runRecoveryMaterializationCommand(
  command: RecoveryMaterializationCommand
): Promise<MaterializedIsolatedRecovery> {
  const [{ materializeIsolatedRecovery }, { unsealRecoveryFile }, { validateRestoredDatabase }] = await Promise.all([
    import('./isolatedRecovery'),
    import('./recoverySealing'),
    import('./restoredDatabaseValidation'),
  ]);
  return materializeIsolatedRecovery(command.snapshotRoot, command.destinationRoot, {
    unsealFile: unsealRecoveryFile,
    validateDesktopDatabase: validateRestoredDatabase,
  });
}

/** Parse the explicit three-path Classic launcher contract; partial or duplicate commands fail closed. */
export function parseClassicRecoveryLaunchCommand(argv: string[]): ClassicRecoveryLaunchCommand | null {
  const materializedRoot = singleFlagValue(argv, LAUNCH_CLASSIC_RECOVERY_FLAG, false);
  const hasCompanion =
    argv.includes(CLASSIC_BINARY_FLAG) ||
    argv.includes(CLASSIC_BINARY_SHA256_FLAG) ||
    argv.includes(RECOVERY_DESTINATION_FLAG);
  if (materializedRoot === null) {
    if (
      argv.includes(MATERIALIZE_RECOVERY_SNAPSHOT_FLAG) ||
      argv.includes(LAUNCH_CLASSIC_RECOVERY_SNAPSHOT_FLAG) ||
      argv.includes(PREPARE_CLASSIC_RECOVERY_BINARY_FLAG)
    ) {
      return null;
    }
    if (hasCompanion) throw new Error(`${LAUNCH_CLASSIC_RECOVERY_FLAG} is required with Classic recovery options.`);
    return null;
  }
  const classicBinaryPath = singleFlagValue(argv, CLASSIC_BINARY_FLAG, true)!;
  const classicBinarySha256 = singleFlagValue(argv, CLASSIC_BINARY_SHA256_FLAG, true)!;
  if (!/^[a-f0-9]{64}$/.test(classicBinarySha256)) {
    throw new Error(`${CLASSIC_BINARY_SHA256_FLAG} requires a lowercase 64-character SHA-256 digest.`);
  }
  return {
    kind: 'launch-classic-recovery',
    materializedRoot,
    classicBinaryPath,
    classicBinarySha256,
    destinationRoot: singleFlagValue(argv, RECOVERY_DESTINATION_FLAG, true)!,
  };
}

export function parseClassicRecoverySnapshotLaunchCommand(argv: string[]): ClassicRecoverySnapshotLaunchCommand | null {
  const snapshotRoot = singleFlagValue(argv, LAUNCH_CLASSIC_RECOVERY_SNAPSHOT_FLAG, false);
  const usePinnedRelease = singleBooleanFlag(argv, USE_PINNED_CLASSIC_RELEASE_FLAG);
  if (snapshotRoot === null) {
    if (usePinnedRelease) {
      throw new Error(`${LAUNCH_CLASSIC_RECOVERY_SNAPSHOT_FLAG} is required with ${USE_PINNED_CLASSIC_RELEASE_FLAG}.`);
    }
    return null;
  }
  const destinationRoot = singleFlagValue(argv, RECOVERY_DESTINATION_FLAG, true)!;
  const hasBinaryPath = argv.includes(CLASSIC_BINARY_FLAG);
  const hasBinaryDigest = argv.includes(CLASSIC_BINARY_SHA256_FLAG);
  if (usePinnedRelease) {
    if (hasBinaryPath || hasBinaryDigest) {
      throw new Error(
        `${USE_PINNED_CLASSIC_RELEASE_FLAG} cannot be combined with ${CLASSIC_BINARY_FLAG} or ${CLASSIC_BINARY_SHA256_FLAG}.`
      );
    }
    return {
      kind: 'launch-classic-recovery-snapshot',
      binarySource: 'pinned-release',
      snapshotRoot,
      destinationRoot,
    };
  }
  const classicBinaryPath = singleFlagValue(argv, CLASSIC_BINARY_FLAG, true)!;
  const classicBinarySha256 = singleFlagValue(argv, CLASSIC_BINARY_SHA256_FLAG, true)!;
  if (!/^[a-f0-9]{64}$/.test(classicBinarySha256)) {
    throw new Error(`${CLASSIC_BINARY_SHA256_FLAG} requires a lowercase 64-character SHA-256 digest.`);
  }
  return {
    kind: 'launch-classic-recovery-snapshot',
    binarySource: 'provided',
    snapshotRoot,
    classicBinaryPath,
    classicBinarySha256,
    destinationRoot,
  };
}
