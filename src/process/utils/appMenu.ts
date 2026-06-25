/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { MenuItemConstructorOptions } from 'electron';
import { BrowserWindow, Menu, shell } from 'electron';

/**
 * The macOS app menu title + the About/Hide/Quit role labels default to
 * `app.name`, which is "Electron" in the unpackaged dev app (the dev build
 * sets its own name for data isolation). Use an explicit display name so the
 * menu always reads "Wayland" without touching app.name / the dev data dir.
 */
const APP_DISPLAY_NAME = 'Wayland';
const GITHUB_URL = 'https://github.com/FerroxLabs/wayland';

function openUpdates(): void {
  ipcBridge.update.open.emit({ source: 'menu' });
}

function openSettings(): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  // The renderer is a hash-routed SPA; navigate it to the settings route.
  void win?.webContents.executeJavaScript("window.location.hash = '#/settings';").catch(() => {});
}

export function setupApplicationMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push({
      label: APP_DISPLAY_NAME,
      submenu: [
        { role: 'about', label: `About ${APP_DISPLAY_NAME}` },
        { type: 'separator' },
        { label: 'Check for Updates...', click: openUpdates },
        { label: 'Settings...', accelerator: 'CmdOrCtrl+,', click: openSettings },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: `Hide ${APP_DISPLAY_NAME}` },
        { role: 'hideOthers' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: `Quit ${APP_DISPLAY_NAME}` },
      ],
    });
  }

  template.push({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? ([{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }] as MenuItemConstructorOptions[])
        : ([{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }] as MenuItemConstructorOptions[])),
    ],
  });

  template.push({
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  });

  template.push({
    label: 'Help',
    submenu: [
      // On macOS these live in the app menu; on Windows/Linux there is no app
      // menu, so surface them here.
      ...(isMac
        ? []
        : ([
            { label: 'Check for Updates...', click: openUpdates },
            { label: 'Settings...', accelerator: 'CmdOrCtrl+,', click: openSettings },
            { type: 'separator' },
          ] as MenuItemConstructorOptions[])),
      { label: 'Wayland on GitHub', click: () => void shell.openExternal(GITHUB_URL) },
    ],
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
