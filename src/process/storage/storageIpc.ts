import { app, dialog, shell } from 'electron';
import * as fs from 'fs';
import { ipcBridge } from '@/common';
import { computeUsage, invalidateUsageCache } from './computeUsage';
import { backupExport } from './backupExport';
import { backupImport } from './backupImport';
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

  // Export all data to a zip file
  ipcBridge.storage.exportAll.provider(async (opts) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Wayland data',
      defaultPath: `wayland-backup-${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false };
    await backupExport({
      userData: getUserData(),
      destPath: result.filePath,
      includeKeys: opts.includeKeys,
      passphrase: opts.passphrase,
    });
    return { ok: true, path: result.filePath };
  });

  // Import from a backup zip
  ipcBridge.storage.importBackup.provider(async (opts) => {
    const result = await dialog.showOpenDialog({
      title: 'Restore Wayland backup',
      filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return { ok: false };
    await backupImport({
      userData: getUserData(),
      srcPath: result.filePaths[0],
      passphrase: opts.passphrase,
    });
    invalidateUsageCache();
    return { ok: true };
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
