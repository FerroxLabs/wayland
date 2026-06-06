/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { trackUpload, type UploadSource } from '@/renderer/hooks/file/useUploadState';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Upload a file to the server via HTTP multipart (WebUI mode).
 * Conversation-bound uploads go to the workspace uploads directory; pre-conversation uploads go to temp storage.
 *
 * @param onProgress Optional callback receiving upload percentage (0-100).
 */
export async function uploadFileViaHttp(
  file: File,
  conversationId?: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      reject(new Error('CSRF token not available - please refresh login'));
      return;
    }

    // tiny-csrf only validates req.body._csrf - the x-csrf-token header is
    // silently ignored on multipart uploads. Append the token to the form
    // body so the middleware sees it after busboy/multer parses the upload.
    const formData = new FormData();
    formData.append('_csrf', csrfToken);
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 413) {
        reject(new Error('FILE_TOO_LARGE'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        return;
      }
      try {
        const result = JSON.parse(xhr.responseText) as { success: boolean; data?: { path: string } };
        if (!result.success || !result.data) {
          reject(new Error('Upload failed: server returned unsuccessful response'));
        } else {
          resolve(result.data.path);
        }
      } catch {
        reject(new Error('Upload failed: invalid server response'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.send(formData);
  });
}
// Simple formatBytes implementation moved from deleted updateConfig
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ===== File type support config =====
// Note: current design accepts all file types; constants below are reserved
// for a future file-type filtering feature.

/** Supported image file extensions */
export const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

/** Supported document file extensions */
export const documentExts = ['.pdf', '.doc', '.docx', '.pptx', '.xlsx', '.odt', '.odp', '.ods'];

/** Supported text file extensions */
export const textExts = [
  '.txt',
  '.md',
  '.json',
  '.xml',
  '.csv',
  '.log',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.html',
  '.css',
  '.scss',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.h',
  '.go',
  '.rs',
  '.yml',
  '.yaml',
  '.toml',
  '.ini',
  '.conf',
  '.config',
];

/** All supported file extensions (designed ahead; currently all file types are accepted) */
export const allSupportedExts = [...imageExts, ...documentExts, ...textExts];

// File metadata interface
export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Check whether a file is supported.
 * Note: current implementation is designed ahead and accepts all file types;
 * supportedExts is reserved for a future file-type filtering feature.
 *
 * @param _fileName File name (reserved)
 * @param _supportedExts Supported extensions array (reserved)
 * @returns Always true; all file types are supported
 */
export function isSupportedFile(_fileName: string, _supportedExts: string[]): boolean {
  return true; // Designed ahead: all file types are currently supported
}

// Get file extension
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
}

import { WAYLAND_TIMESTAMP_REGEX } from '@/common/config/constants';

// Strip Wayland timestamp suffix to return the original file name
export function cleanWaylandTimestamp(fileName: string): string {
  return fileName.replace(WAYLAND_TIMESTAMP_REGEX, '$1');
}

// Get the cleaned file name from a file path (used for UI display)
export function getCleanFileName(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() || '';
  return cleanWaylandTimestamp(fileName);
}

// Get cleaned file names for an array of file paths (used in message formatting)
export function getCleanFileNames(filePaths: string[]): string[] {
  return filePaths.map(getCleanFileName);
}

/**
 * Filter supported files.
 * Note: since isSupportedFile currently always returns true, this function does not actually filter anything.
 * Designed ahead, reserved for a future file-type filtering feature.
 *
 * @param files Array of file metadata
 * @param supportedExts Supported extensions array (reserved)
 * @returns Currently returns all files without filtering
 */
export function filterSupportedFiles(files: FileMetadata[], supportedExts: string[]): FileMetadata[] {
  return files.filter((file) => isSupportedFile(file.name, supportedExts));
}

// Extract files from a drag event (pure utility; no business logic)
export function getFilesFromDropEvent(event: DragEvent): FileMetadata[] {
  const files: FileMetadata[] = [];

  if (!event.dataTransfer?.files) {
    return files;
  }

  for (let i = 0; i < event.dataTransfer.files.length; i++) {
    const file = event.dataTransfer.files[i];
    // In Electron, dragged files carry an extra `path` property
    const electronFile = file as File & { path?: string };

    files.push({
      name: file.name,
      path: electronFile.path || '', // Original path; may be empty
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });
  }

  return files;
}

// Extract text from a drag event
export function getTextFromDropEvent(event: DragEvent): string {
  return event.dataTransfer?.getData('text/plain') || '';
}

// Format file size (uses the shared formatBytes implementation)
export function formatFileSize(bytes: number): string {
  return formatBytes(bytes, 2); // Keep 2-digit precision for backward compatibility
}

/**
 * Check whether a file is an image file.
 * Note: since isSupportedFile currently always returns true, this also always returns true.
 * Designed ahead, reserved for a future file-type detection feature.
 * Currently unused; kept for future extension.
 */
export function isImageFile(fileName: string): boolean {
  return isSupportedFile(fileName, imageExts);
}

/**
 * Check whether a file is a document file.
 * Note: since isSupportedFile currently always returns true, this also always returns true.
 * Designed ahead, reserved for a future file-type detection feature.
 * Currently unused; kept for future extension.
 */
export function isDocumentFile(fileName: string): boolean {
  return isSupportedFile(fileName, documentExts);
}

/**
 * Check whether a file is a text file.
 * Note: since isSupportedFile currently always returns true, this also always returns true.
 * Designed ahead, reserved for a future file-type detection feature.
 * Currently unused; kept for future extension.
 */
export function isTextFile(fileName: string): boolean {
  return isSupportedFile(fileName, textExts);
}

class FileServiceClass {
  /**
   * Process files from drag and drop events, creating temporary files for files without valid paths.
   * In WebUI mode, uploads files via HTTP to the conversation workspace uploads directory.
   */
  async processDroppedFiles(
    files: FileList,
    conversationId?: string,
    source: UploadSource = 'sendbox'
  ): Promise<FileMetadata[]> {
    const processedFiles: FileMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // In Electron environment, dragged files have additional path property
      const electronFile = file as File & { path?: string };

      let filePath = electronFile.path || '';

      // If no valid path (WebUI or some dragged files may not have paths), create temporary file
      if (!filePath) {
        try {
          if (!isElectronDesktop()) {
            // WebUI: upload via HTTP multipart to the conversation workspace uploads directory
            const tracker = trackUpload(file.size, source);
            try {
              filePath = await uploadFileViaHttp(file, conversationId || '', tracker.onProgress);
            } finally {
              tracker.finish();
            }
          } else {
            // Electron: use IPC to create upload file (respects saveToWorkspace setting)
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const uploadPath = await ipcBridge.fs.createUploadFile.invoke({ fileName: file.name, conversationId });
            if (uploadPath) {
              await ipcBridge.fs.writeFile.invoke({ path: uploadPath, data: uint8Array });
              filePath = uploadPath;
            }
          }
        } catch (error) {
          // Re-throw size errors so caller can show user-facing toast
          if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
            throw error;
          }
          console.error('Failed to create temp file for dragged file:', error);
          continue;
        }
      }

      processedFiles.push({
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    }

    return processedFiles;
  }
}

export const FileService = new FileServiceClass();
