/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Privacy regression for GitHub issue #19.
 *
 * When a user copies a CROPPED screenshot region, the clipboard carries the
 * cropped image bytes, but some crop tools ALSO place a file URL pointing at
 * the original (uncropped) file on the pasteboard. The earlier paste path
 * (`if (!filePath && file.type.startsWith('image/'))`) skipped the image
 * branch whenever such a `filePath` existed and fell through to the file-path
 * branch, attaching the uncropped original and leaking everything the user
 * cropped out.
 *
 * The fix: an `image/*` clipboard entry is ALWAYS read from the File's own
 * bytes (`file.arrayBuffer()`), never from `filePath`. These tests pin that
 * behavior so it cannot regress.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ─── mocks ───────────────────────────────────────────────────────────────────

const createUploadFile = vi.fn();
const writeFile = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    fs: {
      createUploadFile: { invoke: (...args: unknown[]) => createUploadFile(...args) },
      writeFile: { invoke: (...args: unknown[]) => writeFile(...args) },
    },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
}));

vi.mock('@/renderer/hooks/file/useUploadState', () => ({
  trackUpload: vi.fn(() => ({ id: 1, onProgress: vi.fn(), finish: vi.fn() })),
}));

import { PasteService } from '@/renderer/services/PasteService';
import type { FileMetadata } from '@/renderer/services/FileService';

const UNCROPPED_ORIGINAL_PATH = '/private/var/screenshots/full-uncropped-original.png';
const TEMP_PATH = '/tmp/wayland-upload/cropped.png';

/**
 * Build a clipboard image File that mimics a cropped-screenshot paste: the File
 * carries the cropped bytes AND an Electron `path` pointing at the uncropped
 * original on disk.
 */
function makeClipboardImageWithPath(): File & { path: string } {
  const croppedBytes = new Uint8Array([1, 2, 3, 4]);
  const file = new File([croppedBytes], 'Screenshot.png', { type: 'image/png' }) as File & { path: string };
  Object.defineProperty(file, 'path', { value: UNCROPPED_ORIGINAL_PATH, configurable: true });
  return file;
}

function makePasteEvent(file: File): ClipboardEvent {
  const fileList = {
    length: 1,
    0: file,
    item: (i: number) => (i === 0 ? file : null),
  } as unknown as FileList;
  return {
    clipboardData: {
      getData: () => '',
      files: fileList,
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ClipboardEvent;
}

describe('PasteService - cropped screenshot privacy (issue #19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUploadFile.mockResolvedValue(TEMP_PATH);
    writeFile.mockResolvedValue(undefined);
  });

  it('attaches the cropped clipboard bytes via a temp file, never the original file path', async () => {
    const file = makeClipboardImageWithPath();
    const event = makePasteEvent(file);

    let added: FileMetadata[] = [];
    const handled = await PasteService.handlePaste(event, ['.png'], (files) => {
      added = files;
    });

    expect(handled).toBe(true);
    // Bytes were written to a fresh temp file (the cropped content).
    expect(createUploadFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(1);

    // Exactly one attachment, pointing at the temp file, NOT the uncropped original.
    expect(added).toHaveLength(1);
    expect(added[0].path).toBe(TEMP_PATH);
    expect(added[0].path).not.toBe(UNCROPPED_ORIGINAL_PATH);
  });

  it('writes the File bytes, not a read of the original path', async () => {
    const file = makeClipboardImageWithPath();
    const event = makePasteEvent(file);

    await PasteService.handlePaste(event, ['.png'], () => {});

    // The bytes written are the cropped clipboard bytes, sourced from the File
    // itself. The original on-disk path is never read back as the source.
    const writeArg = writeFile.mock.calls[0][0] as { path: string; data: Uint8Array };
    expect(writeArg.path).toBe(TEMP_PATH);
    expect(Array.from(writeArg.data)).toEqual([1, 2, 3, 4]);
  });
});
