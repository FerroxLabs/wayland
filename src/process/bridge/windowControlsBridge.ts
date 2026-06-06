/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Window Controls Bridge Module
 *
 * Handles window minimize, maximize, close and other control operations
 */

import { BrowserWindow } from 'electron';
import { ipcBridge } from '@/common';

/**
 * Register maximize state listeners for a specific window
 *
 * @param window - BrowserWindow instance to listen to
 */
export function registerWindowMaximizeListeners(window: BrowserWindow): void {
  // Notify renderer when window is maximized
  window.on('maximize', () => {
    ipcBridge.windowControls.maximizedChanged.emit({ isMaximized: true });
  });

  // Notify renderer when window is unmaximized
  window.on('unmaximize', () => {
    ipcBridge.windowControls.maximizedChanged.emit({ isMaximized: false });
  });
}

/**
 * Initialize window controls bridge
 *
 * Register IPC handlers to respond to window control requests from renderer process
 */
export function initWindowControlsBridge(): void {
  // Minimize window
  ipcBridge.windowControls.minimize.provider(() => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.minimize();
    }
    return Promise.resolve();
  });

  // Maximize window
  ipcBridge.windowControls.maximize.provider(() => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.maximize();
    }
    return Promise.resolve();
  });

  // Unmaximize window
  ipcBridge.windowControls.unmaximize.provider(() => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.unmaximize();
    }
    return Promise.resolve();
  });

  // Close window
  ipcBridge.windowControls.close.provider(() => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.close();
    }
    return Promise.resolve();
  });

  // Get window maximized state
  ipcBridge.windowControls.isMaximized.provider(() => {
    const window = BrowserWindow.getFocusedWindow();
    return Promise.resolve(window?.isMaximized() ?? false);
  });

  // Register listeners for all existing windows
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    registerWindowMaximizeListeners(window);
  });
}
