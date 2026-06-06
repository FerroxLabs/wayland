/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared constants for the Wayland application
 */

// ===== File handling constants =====

/** Timestamp separator for temporary files */
export const WAYLAND_TIMESTAMP_SEPARATOR = '_wayland_';

/** Regular expression for matching and stripping timestamp suffixes */
export const WAYLAND_TIMESTAMP_REGEX = /_wayland_\d{13}(\.\w+)?$/;
export const WAYLAND_FILES_MARKER = '[[AION_FILES]]';

// ===== Media type constants =====

/** Supported image file extensions */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'] as const;

/** Mapping from file extension to MIME type */
export const MIME_TYPE_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.svg': 'image/svg+xml',
};

/** Mapping from MIME type to file extension */
export const MIME_TO_EXT_MAP: Record<string, string> = {
  jpeg: '.jpg',
  jpg: '.jpg',
  png: '.png',
  gif: '.gif',
  webp: '.webp',
  bmp: '.bmp',
  tiff: '.tiff',
  'svg+xml': '.svg',
};

/** Default image file extension */
export const DEFAULT_IMAGE_EXTENSION = '.png';

// ===== WebUI constants =====

/** WebUI default port: 25808 for production, 25809 for development, 25810 for multi-instance dev */
export const WEBUI_DEFAULT_PORT = (() => {
  if (process.env.NODE_ENV === 'production') return 25808;
  if (process.env.WAYLAND_MULTI_INSTANCE === '1') return 25810;
  return 25809;
})();

export const TEAM_MODE_ENABLED = true;

// ===== AI Provider constants =====

// Stable ID for the Google Auth virtual provider.
// Shared between frontend (useModelProviderList) and backend (SystemActions).
export const GOOGLE_AUTH_PROVIDER_ID = 'google-auth-gemini';
