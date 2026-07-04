/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { BINARY_MIME_MAP } from './base64';

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a file by reading its raw bytes from disk (works in both Electron and WebUI).
 *
 * Reads the real file contents via `fs.readFileBuffer` (an ArrayBuffer over the
 * IPC bridge - no network fetch, so no CSP connect-src concern). The previous
 * implementation routed every file through `fs.getImageBase64`, which only
 * accepts image extensions and returns a placeholder SVG for anything else, so
 * downloading a text/code file silently saved the placeholder bytes (#616).
 */
export async function downloadFileFromPath(filePath: string, fileName: string): Promise<void> {
  const buffer = (await ipcBridge.fs.readFileBuffer.invoke({ path: filePath })) as ArrayBuffer | null;
  if (!buffer) {
    throw new Error(`Failed to read file for download: ${filePath}`);
  }
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = BINARY_MIME_MAP[ext] ?? 'application/octet-stream';
  const blob = new Blob([buffer], { type: mimeType });
  triggerBlobDownload(blob, fileName);
}

/**
 * Download in-memory text content as a file.
 */
export function downloadTextContent(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(blob, fileName);
}
