/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';
import { getDataPath } from '@process/utils';
import * as path from 'path';
import type { ExtensionSource } from './types';
export const WAYLAND_EXTENSIONS_PATH_ENV = 'WAYLAND_EXTENSIONS_PATH';
export const WAYLAND_STRICT_ENV_ENV = 'WAYLAND_STRICT_ENV';
export const EXTENSION_MANIFEST_FILE = 'aion-extension.json';
export const EXTENSIONS_DIR_NAME = 'extensions';
export const PATH_SEPARATOR = process.platform === 'win32' ? ';' : ':';

export function getUserExtensionsDir(): string {
  return path.join(getDataPath(), EXTENSIONS_DIR_NAME);
}

export function getAppDataExtensionsDir(): string {
  return path.join(getPlatformServices().paths.getDataDir(), EXTENSIONS_DIR_NAME);
}

/**
 * Read-only directory holding the bundled business-pack extensions that ship
 * inside the app. These are read in place (the main process's patched fs reads
 * inside app.asar transparently) instead of being copied out as loose files —
 * loose .md skill bodies were tripping AV content heuristics (#275).
 *
 * Packaged: viteStaticCopy maps resources/bundled-extensions/* into the asar at
 *           <appPath>/bundled-extensions (mirrors the skills/ + assistant/ copy).
 * Dev:      viteStaticCopy doesn't run; resolve from the on-disk source under
 *           <appPath>/resources/bundled-extensions (appPath = project root).
 */
export function getBundledExtensionsDir(): string {
  const platform = getPlatformServices().paths;
  const appPath = platform.getAppPath();
  if (!appPath) return '';
  return platform.isPackaged()
    ? path.join(appPath, 'bundled-extensions')
    : path.join(appPath, 'resources', 'bundled-extensions');
}

export function getEnvExtensionsDirs(): string[] {
  const envPath = process.env[WAYLAND_EXTENSIONS_PATH_ENV];
  if (!envPath) return [];
  return envPath.split(PATH_SEPARATOR).filter(Boolean);
}
/**
 * The maximum hub index schemaVersion this app version can understand.
 * Bump only when the app adds support for a new breaking schema version.
 * Remote indexes with schemaVersion > this value are considered incompatible.
 */
export const HUB_SUPPORTED_SCHEMA_VERSION = 1;

/**
 * Remote mirror base URLs for the WaylandHub repository (tried in order).
 * Set WAYLAND_HUB_URL to prepend custom URLs (comma-separated, highest priority).
 * Example: WAYLAND_HUB_URL=http://localhost:3000/,http://staging.example.com/
 */
const HUB_DEFAULT_URLS = [
  'https://raw.githubusercontent.com/FerroxLabs/waylandHub/dist-latest/',
  'https://cdn.jsdelivr.net/gh/FerroxLabs/waylandHub@dist-latest/',
];

function resolveHubRemoteUrls(): string[] {
  const envUrls = process.env.WAYLAND_HUB_URL;
  if (!envUrls) return HUB_DEFAULT_URLS;
  const custom = envUrls
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  return [...custom, ...HUB_DEFAULT_URLS];
}

export const HUB_REMOTE_URLS = resolveHubRemoteUrls();

export const HUB_INDEX_FILE = 'index.json';

/** Path to the bundled hub resources directory. */
export function getHubResourcesDir(): string {
  const resourcesPath = getPlatformServices().paths.isPackaged()
    ? process.resourcesPath
    : path.join(process.cwd(), 'resources');
  return path.join(resourcesPath, 'hub');
}

/**
 * Path to the bundled voice-models directory (Whisper-tiny STT model etc.).
 * Packaged: <resourcesPath>/voice-models. Dev: <cwd>/resources/voice-models.
 * The renderer reaches these files through the wayland-asset:// protocol, so
 * this dir is added to the asset allowlist.
 */
export function getVoiceModelsDir(): string {
  const resourcesPath = getPlatformServices().paths.isPackaged()
    ? process.resourcesPath
    : path.join(process.cwd(), 'resources');
  return path.join(resourcesPath, 'voice-models');
}

export type ExtensionScanSource = { dir: string; source: ExtensionSource };

/**
 * Returns the ordered list of extension directories to scan, with deduplication.
 *
 * Priority order:
 *   1. Environment variable (`WAYLAND_EXTENSIONS_PATH`) - highest
 *   2. User data dir (`~/.wayland/extensions`)
 *   3. Electron appData dir
 *
 * E2E test mode (`WAYLAND_E2E_TEST=1`) only scans env dirs for hermetic runs.
 */
export function getExtensionScanSources(): ExtensionScanSource[] {
  const sources: ExtensionScanSource[] = [];
  const seen = new Set<string>();
  const isE2ETest = process.env.WAYLAND_E2E_TEST === '1';

  const push = (dir: string, source: ExtensionSource) => {
    const normalized = path.resolve(dir);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    sources.push({ dir: normalized, source });
  };

  // Explicit extension paths should always win over implicit/default locations.
  for (const dir of getEnvExtensionsDirs()) {
    push(dir, 'env');
  }

  // Keep E2E runs hermetic so local/user-installed extensions do not affect results.
  if (!isE2ETest) {
    const userDir = getUserExtensionsDir();
    push(userDir, 'local');

    const appDataDir = getAppDataExtensionsDir();
    if (appDataDir !== userDir) {
      push(appDataDir, 'appdata');
    }

    // Read-only bundled business packs shipped inside the app (asar in packaged
    // builds). Appended LAST so writable dirs win for dedup and so this never
    // becomes the install target (getInstallTargetDir returns sources[0]).
    const bundledDir = getBundledExtensionsDir();
    if (bundledDir) {
      push(bundledDir, 'bundled');
    }
  }

  return sources;
}

/**
 * Returns the first writable extensions directory from scan sources.
 * Hub installs, downloads, etc. should write to this directory so that
 * ExtensionLoader can discover them on the next scan / hot-reload.
 */
export function getInstallTargetDir(): string {
  const sources = getExtensionScanSources();
  // First WRITABLE source has the highest priority - install there. The
  // 'bundled' source is read-only (ships inside the asar), so it can never be
  // an install target even if it sorts first.
  const writable = sources.find((s) => s.source !== 'bundled');
  return writable?.dir ?? getUserExtensionsDir();
}
