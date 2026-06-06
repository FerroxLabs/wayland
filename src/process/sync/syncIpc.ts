import { ipcBridge } from '@/common';
import { syncManager } from './SyncManager';

export function initSyncIpc(): void {
  ipcBridge.sync.enable.provider(async ({ passphrase, backendType, backendPath }) => {
    await syncManager.enable(passphrase, backendType, backendPath);
    return { ok: true };
  });

  ipcBridge.sync.disable.provider(async () => {
    await syncManager.disable();
  });

  ipcBridge.sync.status.provider(async () => {
    return syncManager.status();
  });

  ipcBridge.sync.forceSync.provider(async () => {
    return syncManager.forceSync();
  });
}
