/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

const mocks = vi.hoisted(() => ({
  handler: undefined as ((request: { filePath: string; to: string }) => Promise<unknown>) | undefined,
  wordToMarkdown: vi.fn(),
  excelToJson: vi.fn(),
  pptToJson: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    document: {
      convert: {
        provider: vi.fn((handler: (request: { filePath: string; to: string }) => Promise<unknown>) => {
          mocks.handler = handler;
        }),
      },
    },
  },
}));

vi.mock('@process/services/conversionService', () => ({
  conversionService: {
    wordToMarkdown: mocks.wordToMarkdown,
    excelToJson: mocks.excelToJson,
    pptToJson: mocks.pptToJson,
  },
}));

import { initDocumentBridge } from '@process/bridge/documentBridge';

describe('document conversion bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handler = undefined;
    initDocumentBridge();
  });

  it('routes supported Word documents to Markdown extraction', async () => {
    const result = { success: true, data: '# Extracted' };
    mocks.wordToMarkdown.mockResolvedValue(result);

    await expect(mocks.handler?.({ filePath: '/work/Report.DOCX', to: 'markdown' })).resolves.toEqual({
      to: 'markdown',
      result,
    });
    expect(mocks.wordToMarkdown).toHaveBeenCalledWith('/work/Report.DOCX');
  });

  it('routes supported Excel workbooks to JSON extraction', async () => {
    const result = { success: true, data: { sheets: [] } };
    mocks.excelToJson.mockResolvedValue(result);

    await expect(mocks.handler?.({ filePath: '/work/data.xls', to: 'excel-json' })).resolves.toEqual({
      to: 'excel-json',
      result,
    });
    expect(mocks.excelToJson).toHaveBeenCalledWith('/work/data.xls');
  });

  it('routes supported PowerPoint files to JSON extraction', async () => {
    const result = { success: true, data: { slides: [] } };
    mocks.pptToJson.mockResolvedValue(result);

    await expect(mocks.handler?.({ filePath: '/work/deck.ppt', to: 'ppt-json' })).resolves.toEqual({
      to: 'ppt-json',
      result,
    });
    expect(mocks.pptToJson).toHaveBeenCalledWith('/work/deck.ppt');
  });

  it.each([
    ['markdown', '/work/not-word.pdf', 'Only Word documents can be converted to markdown'],
    ['excel-json', '/work/not-excel.csv', 'Only Excel workbooks can be converted to JSON'],
    ['ppt-json', '/work/not-ppt.key', 'Only PowerPoint files can be converted to JSON'],
  ])('rejects a mismatched %s source before reading it', async (to, filePath, error) => {
    await expect(mocks.handler?.({ filePath, to })).resolves.toEqual({
      to,
      result: { success: false, error },
    });
    expect(mocks.wordToMarkdown).not.toHaveBeenCalled();
    expect(mocks.excelToJson).not.toHaveBeenCalled();
    expect(mocks.pptToJson).not.toHaveBeenCalled();
  });

  it('fails closed on an unknown conversion target', async () => {
    await expect(mocks.handler?.({ filePath: '/work/report.docx', to: 'native-edit' })).resolves.toEqual({
      to: 'native-edit',
      result: { success: false, error: 'Unsupported target format: native-edit' },
    });
  });

  it('denies the local-file conversion namespace to paired remote callers', () => {
    expect(isAllowedForRemote('subscribe-document.convert')).toBe(false);
    expect(isAllowedForRemote('subscribe-document.future-converter')).toBe(false);
  });
});
