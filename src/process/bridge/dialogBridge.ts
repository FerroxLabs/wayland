/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { BrowserWindow, dialog } from 'electron';
import { ipcBridge } from '@/common';
import { registerApprovedDirectory } from './userApprovedPaths';

export function initDialogBridge(): void {
  ipcBridge.dialog.showOpen.provider((options) => {
    // Get the focused window or the first available window as parent
    // This ensures the dialog appears in front on Windows and has proper modal behavior
    const parentWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const dialogOptions = {
      defaultPath: options?.defaultPath,
      properties: options?.properties,
    };

    const showDialogPromise = parentWindow
      ? dialog.showOpenDialog(parentWindow, dialogOptions)
      : dialog.showOpenDialog(dialogOptions);

    return showDialogPromise.then((res) => {
      // The user explicitly picked these paths through the native dialog (runs
      // in MAIN - the renderer cannot spoof them). Approve them as write
      // destinations so a subsequent main-mediated write (e.g. createZip export
      // to a user-chosen folder) is accepted while arbitrary renderer-supplied
      // destinations remain rejected.
      const pickedDirectory = options?.properties?.includes('openDirectory');
      for (const filePath of res.filePaths) {
        registerApprovedDirectory(pickedDirectory ? filePath : path.dirname(filePath));
      }
      return res.filePaths;
    });
  });
}
