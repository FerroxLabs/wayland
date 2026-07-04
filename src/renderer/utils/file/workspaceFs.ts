/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';

interface IBridgeResponse<D = unknown> {
  success: boolean;
  data?: D;
  msg?: string;
}

/**
 * Remove a file or directory from the workspace using the main-process bridge.
 */
export const removeWorkspaceEntry = (path: string) => {
  return ipcBridge.fs.removeEntry.invoke({ path }) as Promise<IBridgeResponse>;
};

/**
 * Rename a file or directory inside the workspace.
 */
export const renameWorkspaceEntry = (path: string, newName: string) => {
  return ipcBridge.fs.renameEntry.invoke({ path, newName }) as Promise<IBridgeResponse<{ newPath: string }>>;
};

/**
 * Move a file or directory into another directory inside the workspace.
 */
export const moveWorkspaceEntry = (sourcePath: string, targetDir: string) => {
  return ipcBridge.fs.moveEntry.invoke({ sourcePath, targetDir }) as Promise<IBridgeResponse<{ newPath: string }>>;
};
