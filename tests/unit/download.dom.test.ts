/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/common', () => ({
  ipcBridge: {
    fs: {
      getImageBase64: {
        invoke: vi.fn(),
      },
      readFileBuffer: {
        invoke: vi.fn(),
      },
    },
  },
}));

import { downloadFileFromPath, downloadTextContent } from '../../src/renderer/utils/file/download';
import { ipcBridge } from '@/common';

const mockReadFileBuffer = ipcBridge.fs.readFileBuffer.invoke as ReturnType<typeof vi.fn>;

/** Build a small ArrayBuffer to stand in for real file bytes returned over the IPC bridge. */
function bytes(...values: number[]): ArrayBuffer {
  return new Uint8Array(values).buffer;
}

function setupDomMocks() {
  const mockLink = { href: '', download: '', click: vi.fn() };
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
  vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as unknown as Node);
  vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as unknown as Node);
  return mockLink;
}

describe('downloadFileFromPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads a zip file with correct MIME type using the real file bytes', async () => {
    const mockLink = setupDomMocks();
    // 'PK\x03\x04' - the ZIP local-file-header magic, standing in for real archive bytes.
    mockReadFileBuffer.mockResolvedValue(bytes(0x50, 0x4b, 0x03, 0x04));

    await downloadFileFromPath('/workspace/archive.zip', 'archive.zip');

    expect(mockReadFileBuffer).toHaveBeenCalledWith({ path: '/workspace/archive.zip' });
    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/zip');
    expect(blob.size).toBe(4);
    expect(mockLink.download).toBe('archive.zip');
    expect(mockLink.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('downloads an xlsx file with correct MIME type', async () => {
    setupDomMocks();
    mockReadFileBuffer.mockResolvedValue(bytes(0x50, 0x4b, 0x03, 0x04));

    await downloadFileFromPath('/workspace/data.xlsx', 'data.xlsx');

    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('uses application/octet-stream for unknown file extensions', async () => {
    setupDomMocks();
    mockReadFileBuffer.mockResolvedValue(bytes(0x00, 0x01, 0x02));

    await downloadFileFromPath('/workspace/file.xyz', 'file.xyz');

    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/octet-stream');
  });

  it('rejects when ipcBridge throws', async () => {
    setupDomMocks();
    mockReadFileBuffer.mockRejectedValue(new Error('IPC error'));

    await expect(downloadFileFromPath('/workspace/file.zip', 'file.zip')).rejects.toThrow('IPC error');
  });

  it('throws when readFileBuffer resolves null (read failure)', async () => {
    setupDomMocks();
    mockReadFileBuffer.mockResolvedValue(null);

    await expect(downloadFileFromPath('/workspace/missing.zip', 'missing.zip')).rejects.toThrow(
      'Failed to read file for download: /workspace/missing.zip'
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('throws when the file exceeds the fsBridge size cap (readFileBuffer returns null)', async () => {
    setupDomMocks();
    // fsBridge caps reads at 64MB and returns null past the limit; surface that as a download failure.
    mockReadFileBuffer.mockResolvedValue(null);

    await expect(downloadFileFromPath('/workspace/huge.zip', 'huge.zip')).rejects.toThrow(
      'Failed to read file for download: /workspace/huge.zip'
    );
  });
});

describe('downloadTextContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a blob with the given content and triggers download', () => {
    const mockLink = setupDomMocks();

    downloadTextContent('# Hello', 'readme.md', 'text/markdown;charset=utf-8');

    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/markdown;charset=utf-8');
    expect(mockLink.download).toBe('readme.md');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('revokes the object URL after download', () => {
    setupDomMocks();

    downloadTextContent('content', 'file.txt', 'text/plain;charset=utf-8');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
