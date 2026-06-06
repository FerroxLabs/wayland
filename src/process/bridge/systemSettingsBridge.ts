/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * System Settings Bridge Module
 *
 * Handles read/write operations for system-level settings (e.g. close to tray)
 */

import { ipcBridge } from '@/common';
import { getPlatformServices } from '@/common/platform';
import { ProcessConfig } from '@process/utils/initStorage';
import { changeLanguage } from '@process/services/i18n';

// Keep-awake power blocker state
let _keepAwakeBlockerId: number | null = null;

type CloseToTrayChangeListener = (enabled: boolean) => void;
let _changeListener: CloseToTrayChangeListener | null = null;

type LanguageChangeListener = () => void;
let _languageChangeListener: LanguageChangeListener | null = null;

/**
 * Register a listener for close-to-tray setting changes (used by main process index.ts)
 */
export function onCloseToTrayChanged(listener: CloseToTrayChangeListener): void {
  _changeListener = listener;
}

/**
 * Register a listener for language changes (used by main process index.ts)
 */
export function onLanguageChanged(listener: LanguageChangeListener): void {
  _languageChangeListener = listener;
}

export function initSystemSettingsBridge(): void {
  // Get "close to tray" setting
  ipcBridge.systemSettings.getCloseToTray.provider(async () => {
    const value = await ProcessConfig.get('system.closeToTray');
    return value ?? false;
  });

  // Set "close to tray", persist first then notify main process
  ipcBridge.systemSettings.setCloseToTray.provider(async ({ enabled }) => {
    // Persist to config storage first
    await ProcessConfig.set('system.closeToTray', enabled);
    // Then notify the main process to update tray state
    _changeListener?.(enabled);
  });

  // Get "task completion notification" setting
  ipcBridge.systemSettings.getNotificationEnabled.provider(async () => {
    const value = await ProcessConfig.get('system.notificationEnabled');
    return value ?? true; // Default enabled
  });

  // Set "task completion notification"
  ipcBridge.systemSettings.setNotificationEnabled.provider(async ({ enabled }) => {
    // Persist to config storage first
    await ProcessConfig.set('system.notificationEnabled', enabled);
  });

  // Get "scheduled task notification" setting
  ipcBridge.systemSettings.getCronNotificationEnabled.provider(async () => {
    const value = await ProcessConfig.get('system.cronNotificationEnabled');
    return value ?? false; // Default disabled
  });

  // Set "scheduled task notification"
  ipcBridge.systemSettings.setCronNotificationEnabled.provider(async ({ enabled }) => {
    // Persist to config storage first
    await ProcessConfig.set('system.cronNotificationEnabled', enabled);
  });

  // Get "keep awake" setting
  ipcBridge.systemSettings.getKeepAwake.provider(async () => {
    const value = await ProcessConfig.get('system.keepAwake');
    return value ?? false;
  });

  // Set "keep awake" - toggle prevent-display-sleep blocker
  ipcBridge.systemSettings.setKeepAwake.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.keepAwake', enabled);
    const power = getPlatformServices().power;
    if (enabled && _keepAwakeBlockerId === null) {
      _keepAwakeBlockerId = power.preventDisplaySleep();
    } else if (!enabled && _keepAwakeBlockerId !== null) {
      power.allowSleep(_keepAwakeBlockerId);
      _keepAwakeBlockerId = null;
    }
  });

  // Get "route through Flux" setting
  ipcBridge.systemSettings.getRouteThroughFlux.provider(async () => {
    const value = await ProcessConfig.get('system.routeThroughFlux');
    return value ?? false;
  });

  // Set "route through Flux"
  ipcBridge.systemSettings.setRouteThroughFlux.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.routeThroughFlux', enabled);
  });

  // Language change notification, sync main process i18n and notify tray rebuild
  ipcBridge.systemSettings.changeLanguage.provider(async ({ language }) => {
    // Broadcast to all renderers FIRST (desktop + WebUI) for real-time sync.
    // This must happen before the potentially slow main-process i18n switch.
    ipcBridge.systemSettings.languageChanged.emit({ language });
    _languageChangeListener?.();

    // Update main process i18n (non-blocking – don't let a hang here block the provider)
    changeLanguage(language).catch((error) => {
      console.error('[SystemSettings] Main process changeLanguage failed:', error);
    });
  });

  // Restore keep-awake state on startup
  ProcessConfig.get('system.keepAwake')
    .then((enabled) => {
      if (enabled) {
        _keepAwakeBlockerId = getPlatformServices().power.preventDisplaySleep();
        console.log('[SystemSettings] Keep-awake restored on startup');
      }
    })
    .catch((err) => {
      console.warn('[SystemSettings] Failed to restore keep-awake:', err);
    });

  // Get "save uploads to workspace" setting
  ipcBridge.systemSettings.getSaveUploadToWorkspace.provider(async () => {
    const value = await ProcessConfig.get('upload.saveToWorkspace');
    return value ?? true; // Default enabled
  });

  // Set "save uploads to workspace"
  ipcBridge.systemSettings.setSaveUploadToWorkspace.provider(async ({ enabled }) => {
    await ProcessConfig.set('upload.saveToWorkspace', enabled);
  });

  // Get "auto preview new Office files" setting
  ipcBridge.systemSettings.getAutoPreviewOfficeFiles.provider(async () => {
    const value = await ProcessConfig.get('system.autoPreviewOfficeFiles');
    return value ?? true; // Default enabled
  });

  // Set "auto preview new Office files"
  ipcBridge.systemSettings.setAutoPreviewOfficeFiles.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.autoPreviewOfficeFiles', enabled);
  });
}
