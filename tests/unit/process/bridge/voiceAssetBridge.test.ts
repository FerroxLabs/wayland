/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The local voice-model "Download Model" bar was hardcoded to 0% because the
 * bridge never passed an onProgress callback into VoiceAssetManager.download,
 * and no progress emitter existed. These tests pin the wiring: the download
 * provider must feed an onProgress that re-emits each DownloadProgress over the
 * `voiceAsset.downloadProgress` emitter so the renderer can drive <Progress/>.
 */

import type { DownloadProgress } from '@/common/types/voiceAsset';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/common', () => ({
  ipcBridge: {
    voiceAsset: {
      download: { provider: vi.fn() },
      cancel: { provider: vi.fn() },
      exists: { provider: vi.fn() },
      localModelBase: { provider: vi.fn() },
      downloadProgress: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/services/voice/VoiceAssetManager', () => ({
  VoiceAssetManager: {
    download: vi.fn(async () => ({
      assetId: 'kokoro-onnx-model',
      destPath: '/p',
      cached: false,
      bytesWritten: 5,
      sha256: 'abc',
    })),
    cancel: vi.fn(() => true),
  },
}));

vi.mock('@process/services/voice/voiceAssetRegistry', () => ({
  resolveVoiceAsset: vi.fn((asset: { id: string }) => ({ ...asset, destPath: '/resolved', sha256: 'deadbeef' })),
}));

vi.mock('@process/extensions/constants', () => ({ getVoiceModelsDir: () => '/models' }));
vi.mock('@process/extensions/protocol/assetProtocol', () => ({ toAssetUrl: (p: string) => `wayland-asset://${p}` }));

import { ipcBridge } from '@/common';
import { initVoiceAssetBridge } from '@process/bridge/voiceAssetBridge';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';

const downloadProviderFn = ipcBridge.voiceAsset.download.provider as unknown as ReturnType<typeof vi.fn>;
const downloadFn = VoiceAssetManager.download as unknown as ReturnType<typeof vi.fn>;
const emitFn = ipcBridge.voiceAsset.downloadProgress.emit as unknown as ReturnType<typeof vi.fn>;

let downloadCallback:
  | ((asset: { id: string; url: string; destPath: string; sha256: string }) => Promise<unknown>)
  | null = null;

describe('voiceAssetBridge - download progress wiring', () => {
  beforeEach(() => {
    downloadCallback = null;
    downloadProviderFn.mockReset();
    downloadFn.mockClear();
    emitFn.mockReset();
    downloadProviderFn.mockImplementation(
      (cb: (asset: { id: string; url: string; destPath: string; sha256: string }) => Promise<unknown>) => {
        downloadCallback = cb;
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes an onProgress callback into VoiceAssetManager.download', async () => {
    initVoiceAssetBridge();
    expect(downloadCallback).toBeTruthy();

    await downloadCallback!({ id: 'kokoro-onnx-model', url: 'https://x.test/model.onnx', destPath: '', sha256: '' });

    expect(downloadFn).toHaveBeenCalledTimes(1);
    const onProgress = downloadFn.mock.calls[0][1];
    expect(typeof onProgress).toBe('function');
  });

  it('re-emits each DownloadProgress over the downloadProgress emitter', async () => {
    initVoiceAssetBridge();
    await downloadCallback!({ id: 'kokoro-onnx-model', url: 'https://x.test/model.onnx', destPath: '', sha256: '' });

    const onProgress = downloadFn.mock.calls[0][1] as (p: DownloadProgress) => void;
    const progress: DownloadProgress = { assetId: 'kokoro-onnx-model', bytesDownloaded: 3, totalBytes: 10 };
    onProgress(progress);

    expect(emitFn).toHaveBeenCalledWith(progress);
  });
});
