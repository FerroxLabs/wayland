/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Document Conversion Bridge Module
 *
 * Handles various office document format conversion requests by bridging
 * renderer process conversion needs to the main process conversion service via IPC
 */

import { ipcBridge } from '@/common';
import type { DocumentConversionTarget } from '@/common/types/conversion';
import path from 'path';
import { conversionService } from '../services/conversionService';

// Supported file extension sets
const WORD_EXTENSIONS = new Set(['.doc', '.docx']); // Word document extensions
const EXCEL_EXTENSIONS = new Set(['.xls', '.xlsx']); // Excel workbook extensions
const PPT_EXTENSIONS = new Set(['.ppt', '.pptx']); // PowerPoint presentation extensions

/**
 * Generate unsupported conversion result
 *
 * @param to - Target conversion format
 * @param message - Error message
 * @returns Conversion result with error information
 */
const unsupportedResult = (to: DocumentConversionTarget, message: string) => ({
  to,
  result: {
    success: false,
    error: message,
  },
});

/**
 * Check if file extension is in the allowed set
 *
 * @param filePath - File path
 * @param allowed - Set of allowed extensions
 * @returns Whether the file extension is allowed
 */
const ensureExtension = (filePath: string, allowed: Set<string>) => {
  const ext = path.extname(filePath).toLowerCase();
  return allowed.has(ext);
};

/**
 * Initialize document conversion bridge
 *
 * Register IPC handler to respond to document conversion requests from renderer process.
 * Supports the following conversion types:
 * - Word -> Markdown
 * - Excel -> JSON
 * - PowerPoint -> JSON
 */
export function initDocumentBridge(): void {
  ipcBridge.document.convert.provider(async ({ filePath, to }) => {
    switch (to) {
      case 'markdown': {
        // Word document to Markdown
        if (!ensureExtension(filePath, WORD_EXTENSIONS)) {
          return unsupportedResult(to, 'Only Word documents can be converted to markdown');
        }
        const result = await conversionService.wordToMarkdown(filePath);
        return { to, result };
      }
      case 'excel-json': {
        // Excel workbook to JSON
        if (!ensureExtension(filePath, EXCEL_EXTENSIONS)) {
          return unsupportedResult(to, 'Only Excel workbooks can be converted to JSON');
        }
        const result = await conversionService.excelToJson(filePath);
        return { to, result };
      }
      case 'ppt-json': {
        // PowerPoint presentation to JSON
        if (!ensureExtension(filePath, PPT_EXTENSIONS)) {
          return unsupportedResult(to, 'Only PowerPoint files can be converted to JSON');
        }
        const result = await conversionService.pptToJson(filePath);
        return { to, result };
      }
      default:
        // Unsupported conversion format
        return unsupportedResult(to, `Unsupported target format: ${to}`);
    }
  });
}
