/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PreviewContentType } from '@/common/types/preview';

/**
 * Mapping configuration from file extensions to content types
 */
export const FILE_EXTENSION_MAP: Record<PreviewContentType, readonly string[]> = {
  markdown: ['md', 'markdown'],
  html: ['html', 'htm'],
  pdf: ['pdf'],
  word: ['doc', 'docx'],
  ppt: ['ppt', 'pptx'],
  excel: ['xls', 'xlsx'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'],
  code: [], // code is the default type, no explicit mapping needed
  diff: [], // diff type is usually determined by other means
  url: [], // url type for web preview, no extension mapping
};

/**
 * Extract file extension from file path
 *
 * @param filePath - File path
 * @returns File extension in lowercase, or empty string if no extension
 *
 * @example
 * ```ts
 * getFileExtension('document.pdf') // => 'pdf'
 * getFileExtension('archive.tar.gz') // => 'gz'
 * getFileExtension('noextension') // => ''
 * getFileExtension('image.PNG') // => 'png'
 * ```
 */
export const getFileExtension = (filePath: string): string => {
  if (!filePath) return '';

  const lastDotIndex = filePath.lastIndexOf('.');
  // No dot, or dot at the end (e.g., "file."), return empty string
  if (lastDotIndex === -1 || lastDotIndex === filePath.length - 1) {
    return '';
  }

  return filePath.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Determine preview content type based on file extension
 *
 * @param filePath - File path
 * @returns Preview content type
 *
 * @example
 * ```ts
 * getContentTypeByExtension('README.md') // => 'markdown'
 * getContentTypeByExtension('index.html') // => 'html'
 * getContentTypeByExtension('report.pdf') // => 'pdf'
 * getContentTypeByExtension('script.ts') // => 'code'
 * getContentTypeByExtension('image.png') // => 'image'
 * ```
 */
export const getContentTypeByExtension = (filePath: string): PreviewContentType => {
  const ext = getFileExtension(filePath);
  if (!ext) return 'code'; // No extension, default to code

  // Iterate through mapping to find matching content type
  for (const [contentType, extensions] of Object.entries(FILE_EXTENSION_MAP)) {
    if (extensions.includes(ext)) {
      return contentType as PreviewContentType;
    }
  }

  // No matching extension found, default to code
  return 'code';
};

/**
 * Check if file is an image type
 *
 * @param filePath - File path
 * @returns Whether it's an image
 */
export const isImageFile = (filePath: string): boolean => {
  return getContentTypeByExtension(filePath) === 'image';
};

/**
 * Check if file is a text type (editable)
 *
 * @param filePath - File path
 * @returns Whether it's a text type
 */
export const isTextFile = (filePath: string): boolean => {
  const contentType = getContentTypeByExtension(filePath);
  return ['markdown', 'html', 'code'].includes(contentType);
};

/**
 * Check if file is an Office document type
 *
 * @param filePath - File path
 * @returns Whether it's an Office document
 */
export const isOfficeFile = (filePath: string): boolean => {
  const contentType = getContentTypeByExtension(filePath);
  return ['word', 'excel', 'ppt'].includes(contentType);
};
