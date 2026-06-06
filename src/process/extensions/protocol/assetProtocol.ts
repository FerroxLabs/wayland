/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom protocol for serving local extension assets in Electron.
 *
 * In dev mode, the renderer loads from http://localhost:5173/ (Vite dev server),
 * which blocks file:// URLs due to browser security policy.
 * The wayland-asset:// protocol serves local files through Electron's net module,
 * bypassing this restriction.
 *
 * URL format: wayland-asset://asset/C:/path/to/file.svg
 * - Uses `standard: true` so the URL parser correctly separates host and pathname.
 * - Fixed hostname "asset" prevents Windows drive letters (e.g. C:) from being
 *   misinterpreted as host:port by the URL parser.
 * - The handler uses Node's `pathToFileURL` for correct file:// URL construction.
 */
export const AION_ASSET_PROTOCOL = 'wayland-asset';

/** Fixed hostname used in wayland-asset:// URLs. */
export const AION_ASSET_HOST = 'asset';

/**
 * Convert an absolute file path to an wayland-asset:// URL.
 * Normalizes backslashes to forward slashes for cross-platform compatibility.
 */
export function toAssetUrl(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/');
  return `${AION_ASSET_PROTOCOL}://${AION_ASSET_HOST}/${normalized}`;
}
