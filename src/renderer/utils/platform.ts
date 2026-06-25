/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Platform detection utilities
 */

import { isAllowedExternalUrl } from '@/common/utils/urlValidation';

/**
 * Check if running in Electron desktop environment
 */
export const isElectronDesktop = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
};

/**
 * Check if running on macOS
 */
export const isMacOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform);
};

/**
 * Render a modifier-key shortcut label for the current platform: the Command
 * glyph on macOS, "Ctrl+" elsewhere. Use instead of hardcoding "⌘K" so Windows
 * and Linux see the correct modifier.
 */
export const formatModifierShortcut = (key: string): string => {
  return isMacOS() ? `⌘${key}` : `Ctrl+${key}`;
};

/**
 * Check if running on Windows
 */
export const isWindows = (): boolean => {
  return typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent);
};

/**
 * Check if running on Linux
 */
export const isLinux = (): boolean => {
  return typeof navigator !== 'undefined' && /linux/i.test(navigator.userAgent);
};

const ASSET_PROTOCOL_PREFIX = 'wayland-asset://asset/';

const shouldKeepAssetProtocolInElectron = (): boolean => {
  if (!isElectronDesktop() || typeof window === 'undefined') return false;
  const protocol = window.location.protocol;
  return protocol === 'http:' || protocol === 'https:';
};

const getAssetAbsolutePath = (url: string): string | undefined => {
  if (!url.startsWith(ASSET_PROTOCOL_PREFIX)) return undefined;

  let absPath = decodeURIComponent(url.slice(ASSET_PROTOCOL_PREFIX.length));
  if (/^\/[A-Za-z]:/.test(absPath)) {
    absPath = absPath.slice(1);
  }
  return absPath;
};

const toFileUrl = (absPath: string): string => {
  const normalized = absPath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${encodeURI(normalized)}`;
  }
  return `file://${encodeURI(normalized)}`;
};

/**
 * Resolve an extension asset URL for the current environment.
 * - In Electron dev / any HTTP(S)-served renderer: keep `wayland-asset://` because direct `file://` is blocked.
 * - In Electron packaged / local-protocol renderers: convert `wayland-asset://asset/{path}` to `file://` for reliable image loading.
 * - In a regular browser (WebUI): convert `wayland-asset://asset/{path}` to `/api/ext-asset?path={encodedPath}`.
 */
export const resolveExtensionAssetUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;

  const absPath = getAssetAbsolutePath(url);

  if (isElectronDesktop()) {
    if (absPath && !shouldKeepAssetProtocolInElectron()) {
      return toFileUrl(absPath);
    }
    return url;
  }

  if (absPath) {
    return `/api/ext-asset?path=${encodeURIComponent(absPath)}`;
  }

  // WebUI: file:///{absPath} -> /api/ext-asset
  if (url.startsWith('file://')) {
    let filePath = decodeURIComponent(url.replace(/^file:\/\/\/?/, ''));
    // On Windows, file:///C:/path → C:/path (strip leading / before drive letter)
    if (/^\/[A-Za-z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }
    return `/api/ext-asset?path=${encodeURIComponent(filePath)}`;
  }

  return url;
};

/**
 * Open external URL in the appropriate context
 * - Electron: uses shell.openExternal via IPC (opens on local machine)
 * - WebUI: uses window.open in client browser (opens on remote client)
 *
 * Scheme is allowlisted (https:/http:/mailto: and the app's own wayland:
 * deep-link scheme) before opening; file:, smb:, ms-* , vbscript:, and any
 * custom-protocol URLs from model-rendered markdown links are rejected. Mirrors
 * the gate in the main-process shell bridges so the WebUI window.open path is
 * protected too.
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  if (!url) return;

  if (!isAllowedExternalUrl(url)) {
    console.warn(`[platform] Rejected openExternalUrl for disallowed scheme: ${url}`);
    return;
  }

  if (isElectronDesktop()) {
    const { ipcBridge } = await import('@/common');
    await ipcBridge.shell.openExternal.invoke(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
