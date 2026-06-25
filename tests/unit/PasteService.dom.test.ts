import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FileMetadata } from '@/renderer/services/FileService';

const isElectronDesktop = vi.fn(() => true);
const trackUpload = vi.fn(() => ({
  id: 1,
  onProgress: vi.fn(),
  finish: vi.fn(),
}));

// Mock dependencies before importing PasteService
vi.mock('@/common', () => ({
  ipcBridge: {
    fs: {
      createTempFile: { invoke: vi.fn() },
      createUploadFile: { invoke: vi.fn() },
      writeFile: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@/renderer/services/FileService', () => ({
  getFileExtension: (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(idx) : '';
  },
  uploadFileViaHttp: vi.fn(),
}));

vi.mock('@/renderer/hooks/file/useUploadState', () => ({
  trackUpload,
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop,
}));

const { ipcBridge } = await import('@/common');
const { uploadFileViaHttp } = await import('@/renderer/services/FileService');

function createMockClipboardEvent(files: File[]): ClipboardEvent {
  // jsdom doesn't support DataTransfer, so we create a minimal mock
  const fileList = Object.assign(files, { item: (i: number) => files[i] ?? null });
  const event = {
    type: 'paste',
    clipboardData: {
      getData: () => '',
      files: fileList,
    },
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent;
  return event;
}

function createImageFile(name: string, size = 100): File {
  const data = new Uint8Array(size);
  return new File([data], name, { type: 'image/png' });
}

/**
 * An image File that also carries a `path` (the Electron extra property).
 * This mirrors a cropped screenshot where the crop tool puts both the cropped
 * image bytes AND a file URL pointing at the original (uncropped) file on the
 * pasteboard.
 */
function createImageFileWithPath(name: string, path: string, size = 100): File {
  const file = createImageFile(name, size);
  Object.defineProperty(file, 'path', { value: path, configurable: true });
  return file;
}

describe('PasteService.handlePaste - filename deduplication', () => {
  let PasteService: typeof import('@/renderer/services/PasteService').PasteService;
  let tempFileCounter: number;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempFileCounter = 0;
    isElectronDesktop.mockReturnValue(true);
    trackUpload.mockReturnValue({
      id: 1,
      onProgress: vi.fn(),
      finish: vi.fn(),
    });

    // Each createTempFile call returns a unique path based on the fileName argument
    vi.mocked(ipcBridge.fs.createTempFile.invoke).mockImplementation(async ({ fileName }) => {
      tempFileCounter++;
      return `/tmp/temp-${tempFileCounter}/${fileName}`;
    });
    // Each createUploadFile call returns a unique path based on the fileName argument
    vi.mocked(ipcBridge.fs.createUploadFile.invoke).mockImplementation(async ({ fileName }) => {
      tempFileCounter++;
      return `/tmp/upload-${tempFileCounter}/${fileName}`;
    });
    vi.mocked(ipcBridge.fs.writeFile.invoke).mockResolvedValue(undefined as never);

    // Re-import to get a fresh singleton
    const mod = await import('@/renderer/services/PasteService');
    PasteService = mod.PasteService;
  });

  it('assigns unique filenames when pasting multiple images with the same generated name', async () => {
    // Both screenshots are system-generated, so PasteService rebuilds their
    // names as `pasted_image_<timeStr>` from `new Date()` (computed per file).
    // That millisecond-precision timestamp normally differs between the two
    // files, so freeze the clock (Date only - real timers/promises still run)
    // to force the SAME base name. That collision is exactly what the `_2`
    // dedup path resolves; without the freeze the dedup never runs and this
    // test is timing-flaky.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-30T14:30:25.123Z'));
    try {
      // Names matching /^[a-zA-Z]?_?\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/ are detected as system-generated
      const file1 = createImageFile('a_2026-03-30_14-30-25.png');
      const file2 = createImageFile('b_2026-03-30_14-30-25.png');

      const event = createMockClipboardEvent([file1, file2]);
      const addedFiles: FileMetadata[] = [];

      await PasteService.handlePaste(event, [], (files) => {
        addedFiles.push(...files);
      });

      expect(addedFiles).toHaveLength(2);
      // The two files must have different names
      expect(addedFiles[0].name).not.toBe(addedFiles[1].name);
      // Second file should have _2 suffix
      expect(addedFiles[1].name).toMatch(/_2\.png$/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps original names when they are already unique', async () => {
    const file1 = createImageFile('photo_a.png');
    const file2 = createImageFile('photo_b.png');

    const event = createMockClipboardEvent([file1, file2]);
    const addedFiles: FileMetadata[] = [];

    await PasteService.handlePaste(event, [], (files) => {
      addedFiles.push(...files);
    });

    expect(addedFiles).toHaveLength(2);
    expect(addedFiles[0].name).toBe('photo_a.png');
    expect(addedFiles[1].name).toBe('photo_b.png');
  });

  it('handles three images with the same name', async () => {
    const file1 = createImageFile('a_2026-03-30_14-30-25.png');
    const file2 = createImageFile('b_2026-03-30_14-30-25.png');
    const file3 = createImageFile('c_2026-03-30_14-30-25.png');

    const event = createMockClipboardEvent([file1, file2, file3]);
    const addedFiles: FileMetadata[] = [];

    await PasteService.handlePaste(event, [], (files) => {
      addedFiles.push(...files);
    });

    expect(addedFiles).toHaveLength(3);
    const names = addedFiles.map((f) => f.name);
    // All names must be unique
    expect(new Set(names).size).toBe(3);
  });

  it('uses the cropped clipboard bytes, not the original file path, for images carrying a path (privacy, #19)', async () => {
    // Cropped screenshot: clipboard has the cropped image bytes, but the crop tool
    // also placed a file URL for the original uncropped file on the pasteboard, so
    // the File exposes a `path`. Attaching that path would leak the uncropped image.
    const file = createImageFileWithPath('cropped.png', '/Users/me/Desktop/original-uncropped.png', 128);

    const event = createMockClipboardEvent([file]);
    const addedFiles: FileMetadata[] = [];

    await PasteService.handlePaste(event, [], (files) => {
      addedFiles.push(...files);
    });

    expect(addedFiles).toHaveLength(1);
    // Must NOT attach the original on-disk path
    expect(addedFiles[0].path).not.toBe('/Users/me/Desktop/original-uncropped.png');
    // Must write the clipboard image bytes to a temp file instead
    expect(ipcBridge.fs.createUploadFile.invoke).toHaveBeenCalledTimes(1);
    expect(ipcBridge.fs.writeFile.invoke).toHaveBeenCalledTimes(1);
    expect(addedFiles[0].path).toMatch(/^\/tmp\/upload-/);
  });

  it('renames the generic clipboard image name so repeated pastes do not collapse (#19)', async () => {
    // Chromium hands every pasted clipboard image the constant name `image.png`.
    // If kept verbatim, the on-disk `_wayland_<ts>` de-dup suffix is later
    // stripped before the path reaches the agent, so every paste collapses back
    // to the FIRST `image.png` on disk. The fix gives the generic name a unique
    // timestamped base instead.
    const event = createMockClipboardEvent([createImageFile('image.png')]);
    const addedFiles: FileMetadata[] = [];

    await PasteService.handlePaste(event, [], (files) => {
      addedFiles.push(...files);
    });

    expect(addedFiles).toHaveLength(1);
    expect(addedFiles[0].name).not.toBe('image.png');
    expect(addedFiles[0].name).toMatch(/^pasted_image_\d+\.png$/);
  });

  it('keeps a descriptive clipboard name (only the generic image.* is renamed) (#19)', async () => {
    // A non-generic name like `clipboard.png` is already distinct enough to
    // survive, so it must be preserved (no needless renaming).
    const event = createMockClipboardEvent([createImageFile('clipboard.png')]);
    const addedFiles: FileMetadata[] = [];

    await PasteService.handlePaste(event, [], (files) => {
      addedFiles.push(...files);
    });

    expect(addedFiles).toHaveLength(1);
    expect(addedFiles[0].name).toBe('clipboard.png');
  });

  it('tracks upload progress for WebUI pasted images', async () => {
    isElectronDesktop.mockReturnValue(false);
    const onProgress = vi.fn();
    const finish = vi.fn();
    trackUpload.mockReturnValue({
      id: 7,
      onProgress,
      finish,
    });
    vi.mocked(uploadFileViaHttp).mockResolvedValue('/tmp/pasted-image.png');

    const event = createMockClipboardEvent([createImageFile('clipboard.png', 256)]);
    const addedFiles: FileMetadata[] = [];

    await PasteService.handlePaste(
      event,
      [],
      (files) => {
        addedFiles.push(...files);
      },
      undefined,
      'conversation-1',
      'sendbox'
    );

    expect(trackUpload).toHaveBeenCalledWith(256, 'sendbox');
    expect(uploadFileViaHttp).toHaveBeenCalledTimes(1);
    expect(vi.mocked(uploadFileViaHttp).mock.calls[0]?.[0].name).toBe('clipboard.png');
    expect(vi.mocked(uploadFileViaHttp).mock.calls[0]?.[1]).toBe('conversation-1');
    expect(vi.mocked(uploadFileViaHttp).mock.calls[0]?.[2]).toBe(onProgress);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(addedFiles).toEqual([
      expect.objectContaining({
        name: 'clipboard.png',
        path: '/tmp/pasted-image.png',
        size: 256,
        type: 'image/png',
      }),
    ]);
  });
});
