/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BrowserWindow } from 'electron';
import { app } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ipcBridge } from '@/common';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import { ProcessConfig } from '@process/utils/initStorage';
import { getZoomFactor, setZoomFactor } from '@process/utils/zoom';
import { getCdpStatus, updateCdpConfig } from '@process/utils/configureChromium';
import { initApplicationBridgeCore } from './applicationBridgeCore';
import type { IStartOnBootStatus } from '@/common/adapter/ipcBridge';

let mainWindowRef: BrowserWindow | null = null;

const START_ON_BOOT_UNSUPPORTED_MESSAGE =
  'Start on boot requires a packaged macOS, Windows, or Linux app.';
export const START_ON_BOOT_WINDOWS_ARG = '--start-on-boot';
const START_ON_BOOT_LINUX_ARG = '--start-on-boot';
const LINUX_DESKTOP_FILE_NAME = 'wayland.desktop';

const isStartOnBootSupported = (): boolean => {
  if (!app.isPackaged) return false;
  return (
    process.platform === 'darwin' ||
    process.platform === 'win32' ||
    process.platform === 'linux'
  );
};

const getStartOnBootWindowsArgs = (): string[] => [START_ON_BOOT_WINDOWS_ARG];

const getLoginItemSettings = () => {
  return process.platform === 'win32'
    ? app.getLoginItemSettings({ args: getStartOnBootWindowsArgs() })
    : app.getLoginItemSettings();
};

// ---------- Linux XDG autostart (~/.config/autostart/wayland.desktop) ----------
const getLinuxAutostartPath = (): string => {
  const xdg = process.env['XDG_CONFIG_HOME'];
  const base = xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), '.config');
  return path.join(base, 'autostart', LINUX_DESKTOP_FILE_NAME);
};

const getLinuxExecPath = (): string => {
  // AppImage mounts at a temp path each launch; $APPIMAGE points at the stable file.
  return process.env['APPIMAGE'] || process.execPath;
};

const getLinuxAutostartEnabled = (): boolean => {
  try {
    const file = getLinuxAutostartPath();
    if (!fs.existsSync(file)) return false;
    const contents = fs.readFileSync(file, 'utf8');
    // Honor explicit X-GNOME-Autostart-enabled=false override; presence of the file alone is "enabled".
    return !/^\s*X-GNOME-Autostart-enabled\s*=\s*false\s*$/im.test(contents);
  } catch {
    return false;
  }
};

const setLinuxAutostart = (enabled: boolean): void => {
  const file = getLinuxAutostartPath();
  if (!enabled) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const exec = getLinuxExecPath();
  const body = `[Desktop Entry]
Type=Application
Name=Wayland
Comment=Wayland AI Agent
Exec="${exec}" ${START_ON_BOOT_LINUX_ARG}
Terminal=false
X-GNOME-Autostart-enabled=true
NoDisplay=false
`;
  fs.writeFileSync(file, body, 'utf8');
};

export function wasLaunchedAtLogin(): boolean {
  if (!app.isPackaged) {
    return false;
  }

  if (process.platform === 'darwin') {
    return Boolean(getLoginItemSettings().wasOpenedAtLogin);
  }

  if (process.platform === 'win32') {
    return process.argv.includes(START_ON_BOOT_WINDOWS_ARG);
  }

  if (process.platform === 'linux') {
    return process.argv.includes(START_ON_BOOT_LINUX_ARG);
  }

  return false;
}

export function getStartOnBootStatus(): IStartOnBootStatus {
  if (!isStartOnBootSupported()) {
    return {
      supported: false,
      enabled: false,
      isPackaged: app.isPackaged,
      platform: process.platform,
    };
  }

  let enabled = false;
  if (process.platform === 'linux') {
    enabled = getLinuxAutostartEnabled();
  } else {
    const settings = getLoginItemSettings();
    enabled =
      process.platform === 'win32'
        ? Boolean(settings.openAtLogin || settings.executableWillLaunchAtLogin)
        : Boolean(settings.openAtLogin);
  }

  return {
    supported: true,
    enabled,
    isPackaged: app.isPackaged,
    platform: process.platform,
  };
}

export function setStartOnBootEnabled(enabled: boolean): IStartOnBootStatus {
  const currentStatus = getStartOnBootStatus();
  if (!currentStatus.supported) {
    return currentStatus;
  }

  if (process.platform === 'linux') {
    setLinuxAutostart(enabled);
  } else {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      ...(process.platform === 'win32'
        ? {
            args: getStartOnBootWindowsArgs(),
            enabled: true,
          }
        : {}),
    });
  }

  return getStartOnBootStatus();
}

export function setApplicationMainWindow(win: BrowserWindow): void {
  mainWindowRef = win;
}

export function initApplicationBridge(workerTaskManager: IWorkerTaskManager): void {
  // Platform-agnostic handlers: systemInfo, updateSystemInfo, getPath
  initApplicationBridgeCore();

  ipcBridge.application.restart.provider(async () => {
    // Clean up all worker processes and wait for child processes to exit
    await workerTaskManager.clear();
    // Restart the app - using the standard Electron restart approach
    app.relaunch();
    app.exit(0);
  });

  ipcBridge.application.isDevToolsOpened.provider(() => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      return Promise.resolve(mainWindowRef.webContents.isDevToolsOpened());
    }
    return Promise.resolve(false);
  });

  ipcBridge.application.openDevTools.provider(() => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      const win = mainWindowRef;
      const wasOpen = win.webContents.isDevToolsOpened();

      if (wasOpen) {
        win.webContents.closeDevTools();
        return Promise.resolve(false);
      } else {
        return new Promise((resolve) => {
          const onOpened = () => {
            win.webContents.off('devtools-opened', onOpened);
            resolve(true);
          };

          win.webContents.once('devtools-opened', onOpened);
          win.webContents.openDevTools();

          setTimeout(() => {
            win.webContents.off('devtools-opened', onOpened);
            if (win.isDestroyed()) {
              resolve(false);
              return;
            }
            resolve(win.webContents.isDevToolsOpened());
          }, 500);
        });
      }
    }
    return Promise.resolve(false);
  });

  ipcBridge.application.getZoomFactor.provider(() => Promise.resolve(getZoomFactor()));

  ipcBridge.application.setZoomFactor.provider(async ({ factor }) => {
    const updatedFactor = setZoomFactor(factor);
    try {
      await ProcessConfig.set('ui.zoomFactor', updatedFactor);
    } catch (error) {
      console.error('[ApplicationBridge] Failed to persist zoom factor:', error);
    }
    return updatedFactor;
  });

  // CDP status and configuration
  ipcBridge.application.getCdpStatus.provider(async () => {
    try {
      const status = getCdpStatus();
      // If port is set, CDP is considered enabled (verification is optional)
      return { success: true, data: status };
    } catch (e) {
      return { success: false, msg: e.message || e.toString() };
    }
  });

  ipcBridge.application.updateCdpConfig.provider(async (config) => {
    try {
      const updatedConfig = updateCdpConfig(config);
      return { success: true, data: updatedConfig };
    } catch (e) {
      return { success: false, msg: e.message || e.toString() };
    }
  });

  ipcBridge.application.getStartOnBootStatus.provider(async () => {
    try {
      return { success: true, data: getStartOnBootStatus() };
    } catch (e) {
      return { success: false, msg: e.message || e.toString() };
    }
  });

  ipcBridge.application.setStartOnBoot.provider(async ({ enabled }) => {
    try {
      const status = setStartOnBootEnabled(enabled);
      if (!status.supported) {
        return { success: false, msg: START_ON_BOOT_UNSUPPORTED_MESSAGE, data: status };
      }
      return { success: true, data: status };
    } catch (e) {
      return { success: false, msg: e.message || e.toString() };
    }
  });
}
