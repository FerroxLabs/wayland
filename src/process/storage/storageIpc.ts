import { app, dialog, shell } from 'electron';
import * as fs from 'fs';
import { ipcBridge } from '@/common';
import { publicBackupErrorCode } from '@/common/types/storageBackup';
import { computeUsage, invalidateUsageCache } from './computeUsage';
import { backupExport } from './backupExport';
import { backupImport } from './backupImport';
import { createLegacySafetyExport } from './legacySafetyExport';
import { resetAll } from './resetAll';
import { clearStorageDir, getLogsDir, getStorageDirs, getUserDataDir } from './storageLocations';

function getUserData(): string {
  return getUserDataDir();
}

export function initStorageBridge(): void {
  // Compute disk usage (cached in computeUsage)
  ipcBridge.storage.computeUsage.provider(async () => {
    return computeUsage(getUserData(), getLogsDir());
  });

  // Open a directory in the system file manager
  ipcBridge.storage.openDir.provider(async (kind) => {
    const k = kind as 'workspace' | 'cache' | 'logs';
    const dirs = getStorageDirs();
    const dirPath = dirs[k] ?? dirs.workspace;
    if (fs.existsSync(dirPath)) {
      await shell.openPath(dirPath);
    }
  });

  // Clear a directory (cache or logs only - workspace not clearable)
  ipcBridge.storage.clearDir.provider(async (kind) => {
    clearStorageDir(kind as 'cache' | 'logs');
  });

  // Change workspace directory (opens folder picker, returns chosen path)
  ipcBridge.storage.changeDir.provider(async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  // Legacy file-only export. This is deliberately not described as a full
  // backup: authoritative DB/Core/workspace state is outside its scope.
  ipcBridge.storage.exportAll.provider(async (opts) => {
    // Never let this reject. The bridge cannot transport a rejection: it becomes
    // an unhandledRejection here and a promise that never settles in the
    // renderer, leaving the Export button spinning with nothing said. Ticking
    // "include API keys" with an empty passphrase reaches that in one click.
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export legacy Wayland files',
        defaultPath: `wayland-legacy-files-${new Date().toISOString().slice(0, 10)}.zip`,
        filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
      });
      if (result.canceled || !result.filePath) return { ok: false };
      const report = await backupExport({
        userData: getUserData(),
        destPath: result.filePath,
        includeKeys: opts.includeKeys,
        passphrase: opts.passphrase,
      });
      return { ok: true, path: result.filePath, ...report };
    } catch (error) {
      // `failed` is what separates this from the cancel above, which must stay
      // silent. The error itself is classified to a fixed code and never echoed:
      // its text can carry a userData path or a passphrase fragment.
      console.error('[storage] Legacy file export failed:', error);
      return { ok: false, failed: true, errorCode: publicBackupErrorCode(error) };
    }
  });

  // Import a legacy file-only export.
  ipcBridge.storage.importBackup.provider(async (opts) => {
    // Never let this reject, for the same reason as the export above. A mistyped
    // backup passphrase is the everyday way in: `decipher.final()` throws, the
    // bridge drops the rejection, and the renderer's await never settles - so the
    // modal stays open on its spinner and the card's Restore button spins for the
    // rest of the session, even after Cancel.
    try {
      const result = await dialog.showOpenDialog({
        title: 'Restore legacy Wayland files',
        filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
        properties: ['openFile'],
      });
      if (result.canceled || !result.filePaths[0]) return { ok: false };
      const safetyBackupPath = await createLegacySafetyExport({
        userData: getUserData(),
        passphrase: opts.passphrase,
      });
      const report = await backupImport({
        userData: getUserData(),
        srcPath: result.filePaths[0],
        passphrase: opts.passphrase,
      });
      invalidateUsageCache();
      // Report what the import actually applied. `ok` only means the archive was
      // read and staged without error; an archive from a modern install can
      // legitimately carry nothing this importer can restore (#1021).
      return { ok: true, safetyBackupPath, ...report };
    } catch (error) {
      // A restore that got far enough to touch live files may have moved some of
      // them, so the usage cache is stale either way.
      invalidateUsageCache();
      console.error('[storage] Legacy file restore failed:', error);
      return { ok: false, failed: true, errorCode: publicBackupErrorCode(error) };
    }
  });

  // Full data reset (renderer must enforce double-confirm before calling)
  ipcBridge.storage.resetAll.provider(async () => {
    await resetAll(getUserData(), getLogsDir());
    invalidateUsageCache();
    // Relaunch so the app starts fresh
    app.relaunch();
    app.quit();
  });
}
