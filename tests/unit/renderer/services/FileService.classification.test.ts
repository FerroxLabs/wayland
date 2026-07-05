/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #655 - file-type classification. isImageFile/isDocumentFile/isTextFile must do
 * REAL extension membership (they were no-op stubs that always returned true).
 * isSupportedFile stays accept-all (upload acceptance must not regress).
 */
import { describe, expect, it, vi } from 'vitest';

// FileService pulls electron/ipc/http deps at module top; stub them so the pure
// classification exports can be imported and exercised in a node test env.
vi.mock('@/common', () => ({ ipcBridge: {} }));
vi.mock('@/renderer/hooks/file/useUploadState', () => ({
  trackUpload: () => ({ onProgress: () => void 0, finish: () => void 0 }),
}));
vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));
vi.mock('@process/webserver/middleware/csrfClient', () => ({ getCsrfToken: () => '' }));

import {
  isImageFile,
  isDocumentFile,
  isTextFile,
  isLikelyTextFile,
  isSupportedFile,
  imageExts,
  documentExts,
  textExts,
} from '@/renderer/services/FileService';

describe('FileService classification (#655)', () => {
  it('isImageFile matches image extensions only', () => {
    for (const ext of imageExts) expect(isImageFile(`photo${ext}`)).toBe(true);
    expect(isImageFile('sheet.xlsx')).toBe(false);
    expect(isImageFile('notes.txt')).toBe(false);
    expect(isImageFile('noext')).toBe(false);
  });

  it('isDocumentFile matches office/pdf extensions only (the auto-ingest set)', () => {
    for (const ext of documentExts) expect(isDocumentFile(`report${ext}`)).toBe(true);
    // The headline office types the engine doc_extract targets.
    expect(isDocumentFile('q3.xlsx')).toBe(true);
    expect(isDocumentFile('memo.docx')).toBe(true);
    expect(isDocumentFile('deck.pptx')).toBe(true);
    expect(isDocumentFile('invoice.pdf')).toBe(true);
    // Not documents.
    expect(isDocumentFile('logo.png')).toBe(false);
    expect(isDocumentFile('data.csv')).toBe(false); // csv is text (read tool), not doc_extract
    expect(isDocumentFile('main.ts')).toBe(false);
  });

  it('isTextFile matches text/code extensions only', () => {
    for (const ext of textExts) expect(isTextFile(`file${ext}`)).toBe(true);
    expect(isTextFile('slides.pptx')).toBe(false);
    expect(isTextFile('pic.jpeg')).toBe(false);
  });

  it('is case-insensitive on extension', () => {
    expect(isImageFile('PHOTO.PNG')).toBe(true);
    expect(isDocumentFile('REPORT.DOCX')).toBe(true);
    expect(isTextFile('README.MD')).toBe(true);
  });

  it('the three classes are mutually exclusive for a given file', () => {
    const classify = (name: string) =>
      [isImageFile(name), isDocumentFile(name), isTextFile(name)].filter(Boolean).length;
    expect(classify('a.png')).toBe(1);
    expect(classify('a.xlsx')).toBe(1);
    expect(classify('a.md')).toBe(1);
    expect(classify('a.unknownext')).toBe(0);
  });

  it('isLikelyTextFile keeps every real text/code file diffable (regression guard for FileChangeList)', () => {
    // These are text/code files NOT in the finite textExts allowlist, plus
    // extension-less files. Pre-#655 they were all expandable via the always-true
    // gate; isLikelyTextFile must keep them true (not-image, not-binary-doc).
    for (const name of [
      'deploy.sh',
      'schema.sql',
      'App.vue',
      'main.rb',
      'Api.kt',
      '.env',
      'Dockerfile',
      'Makefile',
      'LICENSE',
      'README',
    ]) {
      expect(isLikelyTextFile(name)).toBe(true);
    }
    // Files in the allowlist stay true too.
    expect(isLikelyTextFile('index.ts')).toBe(true);
    expect(isLikelyTextFile('notes.md')).toBe(true);
  });

  it('isLikelyTextFile excludes genuine binaries (images + office docs)', () => {
    for (const name of ['logo.png', 'photo.jpeg']) expect(isLikelyTextFile(name)).toBe(false);
    for (const name of ['report.docx', 'q3.xlsx', 'deck.pptx', 'invoice.pdf'])
      expect(isLikelyTextFile(name)).toBe(false);
  });

  it('isLikelyTextFile treats SVG as text-diffable despite isImageFile matching it', () => {
    // 0.11.15 regression fix: SVG is XML text — the Workspace diff viewer must be
    // able to expand and diff it, even though the attach path classifies it as an
    // image (#655).
    expect(isImageFile('diagram.svg')).toBe(true);
    expect(isLikelyTextFile('diagram.svg')).toBe(true);
  });

  it('isSupportedFile stays accept-all (upload acceptance is NOT gated by type)', () => {
    // Regression guard: classification must not turn into an upload filter.
    expect(isSupportedFile('anything.zip', documentExts)).toBe(true);
    expect(isSupportedFile('weird.xyz', imageExts)).toBe(true);
  });
});
