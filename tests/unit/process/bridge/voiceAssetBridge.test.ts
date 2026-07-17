/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DownloadProgress, VoiceAsset } from '@/common/types/voiceAsset';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const canonicalAsset: VoiceAsset = {
    id: 'whisper-ggml-base',
    url: 'https://trusted.test/ggml-base.bin',
    destPath: '/trusted/voice/whisper/ggml-base.bin',
    sha256: 'a'.repeat(64),
    totalBytes: 147_951_465,
    maxBytes: 150_000_000,
  };

  return {
    canonicalAsset,
    download: vi.fn(),
    cancel: vi.fn(),
    getVoiceAsset: vi.fn(),
    existsSync: vi.fn(),
  };
});

vi.mock('node:fs', () => ({ existsSync: mocks.existsSync }));

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
  VoiceAssetDownloadError: class VoiceAssetDownloadError extends Error {
    constructor(
      public readonly code: string,
      message: string
    ) {
      super(`${code}: ${message}`);
    }
  },
  VoiceAssetManager: {
    download: mocks.download,
    cancel: mocks.cancel,
  },
}));

vi.mock('@process/services/voice/voiceAssetRegistry', () => ({
  getVoiceAsset: mocks.getVoiceAsset,
}));

vi.mock('@process/extensions/constants', () => ({ getVoiceModelsDir: () => '/models' }));
vi.mock('@process/extensions/protocol/assetProtocol', () => ({ toAssetUrl: (p: string) => `wayland-asset://${p}` }));

import { ipcBridge } from '@/common';
import { initVoiceAssetBridge } from '@process/bridge/voiceAssetBridge';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';

const downloadProviderFn = ipcBridge.voiceAsset.download.provider as unknown as ReturnType<typeof vi.fn>;
const existsProviderFn = ipcBridge.voiceAsset.exists.provider as unknown as ReturnType<typeof vi.fn>;
const downloadFn = VoiceAssetManager.download as unknown as ReturnType<typeof vi.fn>;
const emitFn = ipcBridge.voiceAsset.downloadProgress.emit as unknown as ReturnType<typeof vi.fn>;

let downloadCallback: ((request: { id: string }) => Promise<unknown>) | null = null;
let existsCallback: ((request: { id: string }) => Promise<unknown>) | null = null;

describe('voiceAssetBridge', () => {
  beforeEach(() => {
    downloadCallback = null;
    existsCallback = null;
    vi.clearAllMocks();

    mocks.download.mockResolvedValue({
      assetId: mocks.canonicalAsset.id,
      destPath: mocks.canonicalAsset.destPath,
      cached: false,
      bytesWritten: 5,
      sha256: mocks.canonicalAsset.sha256,
    });
    mocks.cancel.mockReturnValue(true);
    mocks.existsSync.mockReturnValue(true);
    mocks.getVoiceAsset.mockImplementation((id: unknown) =>
      id === mocks.canonicalAsset.id ? { ...mocks.canonicalAsset } : null
    );
    downloadProviderFn.mockImplementation((callback: (request: { id: string }) => Promise<unknown>) => {
      downloadCallback = callback;
    });
    existsProviderFn.mockImplementation((callback: (request: { id: string }) => Promise<unknown>) => {
      existsCallback = callback;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes only the canonical registry descriptor to the manager', async () => {
    initVoiceAssetBridge();
    expect(downloadCallback).toBeTruthy();
    const maliciousRequest = {
      id: mocks.canonicalAsset.id,
      url: 'https://attacker.test/payload',
      destPath: '/attacker/chosen/path',
      sha256: 'f'.repeat(64),
      totalBytes: 1,
      maxBytes: Number.MAX_SAFE_INTEGER,
    };

    await downloadCallback!(maliciousRequest);

    expect(downloadFn).toHaveBeenCalledWith(mocks.canonicalAsset, expect.any(Function));
  });

  it.each(['attacker-controlled', '', '__proto__', 'constructor'])(
    'rejects unknown id %j before starting a download',
    async (id) => {
      initVoiceAssetBridge();

      await expect(downloadCallback!({ id })).rejects.toMatchObject({ code: 'VOICE_ASSET_UNKNOWN' });
      expect(downloadFn).not.toHaveBeenCalled();
    }
  );

  it('re-emits each DownloadProgress over the downloadProgress emitter', async () => {
    initVoiceAssetBridge();
    await downloadCallback!({ id: mocks.canonicalAsset.id });

    const onProgress = downloadFn.mock.calls[0][1] as (progress: DownloadProgress) => void;
    const progress: DownloadProgress = {
      assetId: mocks.canonicalAsset.id,
      bytesDownloaded: 3,
      totalBytes: 10,
    };
    onProgress(progress);

    expect(emitFn).toHaveBeenCalledWith(progress);
  });

  it('reports install state without disclosing the destination path', async () => {
    initVoiceAssetBridge();

    await expect(existsCallback!({ id: mocks.canonicalAsset.id })).resolves.toEqual({ installed: true });
  });

  it('reports unknown assets as not installed', async () => {
    initVoiceAssetBridge();

    await expect(existsCallback!({ id: 'attacker-controlled' })).resolves.toEqual({ installed: false });
    expect(mocks.existsSync).not.toHaveBeenCalled();
  });
});
