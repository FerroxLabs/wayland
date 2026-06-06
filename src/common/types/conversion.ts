/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConversionResult<T> {
  success: boolean; // Whether successful
  data?: T; // Conversion result data
  error?: string; // Error message
}

// Excel Intermediate Format (JSON)
export interface ExcelSheetImage {
  row: number; // Image row index (0-based)
  col: number; // Image column index (0-based)
  src: string; // Image data (typically data URL)
  width?: number; // Estimated width (px)
  height?: number; // Estimated height (px)
  alt?: string; // Optional description
}

export interface ExcelSheetData {
  name: string; // Sheet name
  data: any[][]; // 2D array of cell values
  merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[]; // Merge ranges
  images?: ExcelSheetImage[]; // Embedded images info
}

export interface ExcelWorkbookData {
  sheets: ExcelSheetData[]; // List of sheets
}

// PowerPoint Intermediate Format (PPTX JSON structure)
export interface PPTSlideData {
  slideNumber: number;
  content: any; // PPTX JSON structure
}

export interface PPTJsonData {
  slides: PPTSlideData[];
  raw?: any; // Raw PPTX JSON (optional, usually not needed in frontend)
}

export interface ConversionServiceApi {
  // Word
  wordToMarkdown: (filePath: string) => Promise<ConversionResult<string>>;
  markdownToWord: (markdown: string, targetPath: string) => Promise<ConversionResult<void>>;

  // Excel
  excelToJson: (filePath: string) => Promise<ConversionResult<ExcelWorkbookData>>;
  jsonToExcel: (data: ExcelWorkbookData, targetPath: string) => Promise<ConversionResult<void>>;

  // PowerPoint
  pptToJson: (filePath: string) => Promise<ConversionResult<PPTJsonData>>;

  // PDF
  markdownToPdf: (markdown: string, targetPath: string) => Promise<ConversionResult<void>>;
  htmlToPdf: (html: string, targetPath: string) => Promise<ConversionResult<void>>;
}

// Supported document conversion targets
export type DocumentConversionTarget = 'markdown' | 'excel-json' | 'ppt-json';

// Unified document conversion request payload
export interface DocumentConversionRequest {
  filePath: string; // Absolute file path to convert
  to: DocumentConversionTarget; // Desired target format
}

// Result payload differs per target format
export type DocumentConversionResponse =
  | { to: 'markdown'; result: ConversionResult<string> }
  | { to: 'excel-json'; result: ConversionResult<ExcelWorkbookData> }
  | { to: 'ppt-json'; result: ConversionResult<PPTJsonData> };
