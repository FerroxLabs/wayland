/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { commitAndPr, buildRelease, syncForks } from '@process/services/devActions';

/**
 * IPC surface for the one-click Dev Actions panel. Each provider forwards its
 * streamed progress to the shared `devActions.log` emitter (tagged by action)
 * so the renderer can show a live log while the git/gh work runs.
 */
export function initDevActionsBridge(): void {
  ipcBridge.devActions.commitAndPr.provider((params) =>
    commitAndPr(params, (line) => ipcBridge.devActions.log.emit({ action: 'commitAndPr', line }))
  );

  ipcBridge.devActions.buildRelease.provider((params) =>
    buildRelease(params, (line) => ipcBridge.devActions.log.emit({ action: 'buildRelease', line }))
  );

  ipcBridge.devActions.syncForks.provider((params) =>
    syncForks(params, (line) => ipcBridge.devActions.log.emit({ action: 'syncForks', line }))
  );
}
