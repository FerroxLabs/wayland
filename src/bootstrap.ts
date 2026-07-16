/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Keep the boot entry dependency-light. The main module imports initStorage,
// whose module-level path setup can mutate application state. It must not load
// until compatibility has been proven against the physical Desktop database.
import './process/utils/configureChromium';
import { app, dialog, protocol } from 'electron';
import startupRecoveryMessages from '@renderer/services/i18n/locales/en-US/recovery.json';
import { preflightDesktopState } from './process/services/recovery/startupCompatibility';
import {
  parseRecoveryCaptureCommand,
  parseClassicRecoveryReleaseDownloadCommand,
  parseClassicRecoveryBinaryPreparationCommand,
  parseClassicRecoveryLaunchCommand,
  parseClassicRecoverySnapshotLaunchCommand,
  parseRecoveryMaterializationCommand,
  parseRecoveryVerificationCommand,
  runRecoveryMaterializationCommand,
  runRecoveryVerificationCommand,
} from './process/services/recovery/recoveryCli';
import { AION_ASSET_PROTOCOL } from './process/extensions/protocol/assetProtocol';

// Electron requires privileged schemes to be registered before app.whenReady().
// Keep this in the dependency-light bootstrap so startup compatibility can still
// run before the stateful main module is imported without breaking asset URLs.
protocol.registerSchemesAsPrivileged([
  {
    scheme: AION_ASSET_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

const isVersionMode = process.argv.includes('--version') || process.argv.includes('-v');

function formatMessage(template: string, values: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = values[key];
    return value === null || value === undefined ? 'unknown' : String(value);
  });
}

async function launchMain(): Promise<void> {
  let recoveryCaptureCommand;
  let classicRecoveryDownloadCommand;
  let classicRecoveryBinaryPreparationCommand;
  let recoveryCommand;
  let recoveryMaterializationCommand;
  let classicRecoveryCommand;
  let classicRecoverySnapshotCommand;
  try {
    recoveryCaptureCommand = parseRecoveryCaptureCommand(process.argv.slice(1));
    classicRecoveryDownloadCommand = parseClassicRecoveryReleaseDownloadCommand(process.argv.slice(1));
    classicRecoveryBinaryPreparationCommand = parseClassicRecoveryBinaryPreparationCommand(process.argv.slice(1));
    recoveryCommand = parseRecoveryVerificationCommand(process.argv.slice(1));
    recoveryMaterializationCommand = parseRecoveryMaterializationCommand(process.argv.slice(1));
    classicRecoveryCommand = parseClassicRecoveryLaunchCommand(process.argv.slice(1));
    classicRecoverySnapshotCommand = parseClassicRecoverySnapshotLaunchCommand(process.argv.slice(1));
    if (
      [
        recoveryCaptureCommand,
        classicRecoveryDownloadCommand,
        classicRecoveryBinaryPreparationCommand,
        recoveryCommand,
        recoveryMaterializationCommand,
        classicRecoveryCommand,
        classicRecoverySnapshotCommand,
      ].filter(Boolean).length > 1
    ) {
      throw new Error('Recovery verification, materialization, and Classic launch commands are mutually exclusive.');
    }
  } catch (error) {
    console.error(`[Wayland recovery] ${error instanceof Error ? error.message : String(error)}`);
    app.exit(64);
    return;
  }
  if (classicRecoveryBinaryPreparationCommand) {
    try {
      const { prepareClassicBinaryFromReleaseArtifact } =
        await import('./process/services/recovery/externalRecoveryLauncher');
      const prepared = await prepareClassicBinaryFromReleaseArtifact(classicRecoveryBinaryPreparationCommand);
      console.log(JSON.stringify(prepared, null, 2));
      app.exit(0);
    } catch (error) {
      console.error(`[Wayland recovery] ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    }
    return;
  }
  if (classicRecoveryDownloadCommand) {
    try {
      const { currentClassicRecoveryTarget, downloadClassicRecoveryReleaseArtifact } =
        await import('./process/services/recovery/classicReleaseTrust');
      const downloaded = await downloadClassicRecoveryReleaseArtifact({
        destinationDirectory: classicRecoveryDownloadCommand.destinationDirectory,
        ...currentClassicRecoveryTarget(),
      });
      console.log(JSON.stringify(downloaded, null, 2));
      app.exit(0);
    } catch (error) {
      console.error(`[Wayland recovery] ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    }
    return;
  }
  if (recoveryCaptureCommand) {
    const gotCaptureLock = app.requestSingleInstanceLock({ recovery: 'create-snapshot' });
    if (!gotCaptureLock) {
      console.error('[Wayland recovery] Close every running Wayland instance before creating a recovery point.');
      app.exit(3);
      return;
    }
    try {
      const [{ getReleaseTrack }, { captureProductionRecoveryPoint }] = await Promise.all([
        import('./common/releaseTrack'),
        import('./process/services/recovery/recoveryCapture'),
      ]);
      const result = await captureProductionRecoveryPoint({
        destinationRoot: recoveryCaptureCommand.destinationRoot,
        userDataRoot: app.getPath('userData'),
        sourceAppVersion: app.getVersion(),
        sourceReleaseTrack: getReleaseTrack(),
        desktopProfileLockHeld: true,
      });
      app.releaseSingleInstanceLock();
      console.log(
        JSON.stringify(
          {
            created: true,
            snapshotPath: result.snapshotPath,
            manifestPath: result.manifestPath,
            snapshotId: result.manifest.snapshotId,
          },
          null,
          2
        )
      );
      app.exit(0);
    } catch (error) {
      app.releaseSingleInstanceLock();
      console.error(`[Wayland recovery] ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    }
    return;
  }
  if (recoveryCommand) {
    const result = await runRecoveryVerificationCommand(recoveryCommand);
    console.log(JSON.stringify(result, null, 2));
    app.exit(result.valid ? 0 : 2);
    return;
  }
  if (recoveryMaterializationCommand) {
    try {
      const materialized = await runRecoveryMaterializationCommand(recoveryMaterializationCommand);
      console.log(JSON.stringify(materialized, null, 2));
      app.exit(0);
    } catch (error) {
      console.error(`[Wayland recovery] ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    }
    return;
  }
  if (classicRecoveryCommand || classicRecoverySnapshotCommand) {
    // Hold the ordinary live-profile lock until the isolated Classic child is
    // spawned. Its --user-data-dir gives it a different instance lock, so this
    // prevents a modern Wayland process from entering the live profile during
    // verification/preparation without blocking the isolated child.
    const gotRecoveryLock = app.requestSingleInstanceLock({ recovery: 'classic-v0.11.8' });
    if (!gotRecoveryLock) {
      console.error('[Wayland recovery] Close every running Wayland instance before launching Classic recovery.');
      app.exit(3);
      return;
    }
    try {
      const {
        launchPinnedClassicRecoverySnapshot,
        prepareClassicRecovery,
        prepareClassicRecoverySnapshot,
        spawnPreparedClassicRecovery,
      } = await import('./process/services/recovery/externalRecoveryLauncher');
      const liveUserDataRoot = app.getPath('userData');
      let binaryPreparationReceiptPath: string | undefined;
      let prepared: Awaited<ReturnType<typeof prepareClassicRecovery>>;
      if (classicRecoveryCommand) {
        prepared = await prepareClassicRecovery({
          destinationRoot: classicRecoveryCommand.destinationRoot,
          liveUserDataRoot,
          materializedRoot: classicRecoveryCommand.materializedRoot,
          classicBinaryPath: classicRecoveryCommand.classicBinaryPath,
          classicBinarySha256: classicRecoveryCommand.classicBinarySha256,
        });
        await spawnPreparedClassicRecovery(prepared);
      } else if (classicRecoverySnapshotCommand!.binarySource === 'pinned-release') {
        const launched = await launchPinnedClassicRecoverySnapshot({
          snapshotRoot: classicRecoverySnapshotCommand!.snapshotRoot,
          destinationRoot: classicRecoverySnapshotCommand!.destinationRoot,
          liveUserDataRoot,
        });
        prepared = launched.recovery;
        binaryPreparationReceiptPath = launched.binary.receiptPath;
      } else {
        prepared = await prepareClassicRecoverySnapshot({
          snapshotRoot: classicRecoverySnapshotCommand!.snapshotRoot,
          destinationRoot: classicRecoverySnapshotCommand!.destinationRoot,
          liveUserDataRoot,
          classicBinaryPath: classicRecoverySnapshotCommand!.classicBinaryPath,
          classicBinarySha256: classicRecoverySnapshotCommand!.classicBinarySha256,
        });
        await spawnPreparedClassicRecovery(prepared);
      }
      app.releaseSingleInstanceLock();
      console.log(
        JSON.stringify(
          {
            launched: true,
            recovery: prepared.receipt.recovery,
            destinationRoot: prepared.destinationRoot,
            receiptPath: prepared.receiptPath,
            ...(binaryPreparationReceiptPath ? { binaryPreparationReceiptPath } : {}),
          },
          null,
          2
        )
      );
      app.exit(0);
    } catch (error) {
      app.releaseSingleInstanceLock();
      console.error(`[Wayland recovery] ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    }
    return;
  }

  if (!isVersionMode) {
    try {
      await preflightDesktopState(app.getPath('userData'));
    } catch (error) {
      const compatibilityError = error as {
        code?: string;
        currentVersion?: number | null;
        supportedVersion?: number;
        message?: string;
      };
      const template =
        compatibilityError.code === 'DATABASE_SCHEMA_NEWER_THAN_APP'
          ? startupRecoveryMessages.startupCompatibility.futureSchema
          : startupRecoveryMessages.startupCompatibility.unreadable;
      const message = formatMessage(template, {
        currentVersion: compatibilityError.currentVersion,
        supportedVersion: compatibilityError.supportedVersion,
        reason: compatibilityError.message ?? String(error),
      });
      console.error('[Wayland] Startup compatibility preflight blocked launch:', error);
      dialog.showErrorBox(startupRecoveryMessages.startupCompatibility.title, message);
      app.exit(1);
      return;
    }
  }

  await import('./index');
}

void app
  .whenReady()
  .then(launchMain)
  .catch((error) => {
    console.error('[Wayland] Bootstrap failed:', error);
    app.exit(1);
  });
