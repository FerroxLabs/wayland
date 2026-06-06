/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BinaryAcquisitionError,
  acquireBinary,
  pickManifestEntry,
  resolveBinaryAsset,
  type BinaryPostInstallIo,
} from '@process/services/voice/voiceBinaryManifest';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import { getPlatformServices } from '@/common/platform';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// pickManifestEntry - manifest lookup without mocking process
// ---------------------------------------------------------------------------

describe('pickManifestEntry', () => {
  it('resolves whisper-cpp for darwin-arm64', () => {
    const entry = pickManifestEntry('whisper-cpp', 'darwin', 'arm64');
    expect(entry).not.toBeNull();
    expect(entry?.url).toContain('whisper');
    expect(entry?.sha256).toBe('');
    expect(entry?.filename).toBe('whisper-cli');
  });

  it('resolves whisper-cpp for darwin-x64', () => {
    const entry = pickManifestEntry('whisper-cpp', 'darwin', 'x64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
    expect(entry?.filename).toBe('whisper-cli');
  });

  it('resolves whisper-cpp for win32-x64 with .exe filename', () => {
    const entry = pickManifestEntry('whisper-cpp', 'win32', 'x64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
    expect(entry?.filename).toBe('whisper-cli.exe');
  });

  it('resolves whisper-cpp for linux-x64', () => {
    const entry = pickManifestEntry('whisper-cpp', 'linux', 'x64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
    expect(entry?.filename).toBe('whisper-cli');
  });

  it('resolves onnx-runtime for darwin-arm64', () => {
    const entry = pickManifestEntry('onnx-runtime', 'darwin', 'arm64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
    expect(entry?.filename).toBe('onnxruntime');
  });

  it('resolves onnx-runtime for darwin-x64', () => {
    const entry = pickManifestEntry('onnx-runtime', 'darwin', 'x64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
  });

  it('resolves onnx-runtime for win32-x64 with .exe filename', () => {
    const entry = pickManifestEntry('onnx-runtime', 'win32', 'x64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
    expect(entry?.filename).toBe('onnxruntime.exe');
  });

  it('resolves onnx-runtime for linux-x64', () => {
    const entry = pickManifestEntry('onnx-runtime', 'linux', 'x64');
    expect(entry).not.toBeNull();
    expect(entry?.sha256).toBe('');
  });

  it('returns null for an unsupported platform/arch combo', () => {
    expect(pickManifestEntry('whisper-cpp', 'freebsd', 'arm')).toBeNull();
  });

  it('returns null for an unsupported arch on a supported platform', () => {
    expect(pickManifestEntry('whisper-cpp', 'linux', 'arm64')).toBeNull();
  });

  it('returns null for an unsupported platform on a supported arch', () => {
    expect(pickManifestEntry('onnx-runtime', 'aix', 'x64')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveBinaryAsset - delegates to pickManifestEntry with process values
// ---------------------------------------------------------------------------

describe('resolveBinaryAsset', () => {
  it('returns a non-null entry for the current process.platform/arch when it is a supported combo', () => {
    // The CI host is one of the four supported combos.
    const supportedCombos = new Set(['darwin-arm64', 'darwin-x64', 'win32-x64', 'linux-x64']);
    const current = `${process.platform}-${process.arch}`;
    if (supportedCombos.has(current)) {
      expect(resolveBinaryAsset('whisper-cpp')).not.toBeNull();
      expect(resolveBinaryAsset('onnx-runtime')).not.toBeNull();
    } else {
      expect(resolveBinaryAsset('whisper-cpp')).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// acquireBinary - dependency-injection tests (no network, no filesystem)
// ---------------------------------------------------------------------------

const fakeIo = (overrides: Partial<BinaryPostInstallIo> = {}): BinaryPostInstallIo => ({
  chmodExec: vi.fn(async () => undefined),
  removeQuarantine: vi.fn(async () => undefined),
  ...overrides,
});

// Stub VoiceAssetManager.download throughout this suite. The afterEach
// vi.restoreAllMocks() tears down the spy, so we re-create it before each
// test rather than relying on a single module-level spy.
let mockDownload = vi.spyOn(VoiceAssetManager, 'download');

beforeEach(() => {
  mockDownload = vi.spyOn(VoiceAssetManager, 'download');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('acquireBinary - fresh download path', () => {
  beforeEach(() => {
    // Pretend we are on darwin-arm64 so the manifest entry is always found.
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    vi.spyOn(process, 'arch', 'get').mockReturnValue('arm64');
  });

  it('calls VoiceAssetManager.download with the manifest URL and sha256', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'whisper-cli');
    mockDownload.mockResolvedValue({
      assetId: 'whisper-cpp-darwin-arm64',
      destPath,
      cached: false,
      bytesWritten: 1024,
      sha256: 'TBD-darwin-arm64-whisper',
    });

    const io = fakeIo();
    const result = await acquireBinary('whisper-cpp', io);

    expect(mockDownload).toHaveBeenCalledOnce();
    const [asset] = mockDownload.mock.calls[0] as Parameters<typeof VoiceAssetManager.download>;
    expect(asset.url).toContain('whisper');
    expect(asset.sha256).toBe('');
    expect(asset.destPath).toBe(destPath);
    expect(result).toBe(destPath);
  });

  it('sets the executable bit (chmod) after a fresh download', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'whisper-cli');
    mockDownload.mockResolvedValue({
      assetId: 'whisper-cpp-darwin-arm64',
      destPath,
      cached: false,
      bytesWritten: 1024,
      sha256: 'TBD-darwin-arm64-whisper',
    });

    const io = fakeIo();
    await acquireBinary('whisper-cpp', io);

    expect(io.chmodExec).toHaveBeenCalledOnce();
    expect(io.chmodExec).toHaveBeenCalledWith(destPath);
  });

  it('runs xattr quarantine removal on darwin after a fresh download', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'whisper-cli');
    mockDownload.mockResolvedValue({
      assetId: 'whisper-cpp-darwin-arm64',
      destPath,
      cached: false,
      bytesWritten: 1024,
      sha256: 'TBD-darwin-arm64-whisper',
    });

    const io = fakeIo();
    await acquireBinary('whisper-cpp', io);

    expect(io.removeQuarantine).toHaveBeenCalledOnce();
    expect(io.removeQuarantine).toHaveBeenCalledWith(destPath);
  });

  it('skips chmod and xattr when the asset is already cached', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'whisper-cli');
    mockDownload.mockResolvedValue({
      assetId: 'whisper-cpp-darwin-arm64',
      destPath,
      cached: true,
      bytesWritten: 0,
      sha256: 'TBD-darwin-arm64-whisper',
    });

    const io = fakeIo();
    await acquireBinary('whisper-cpp', io);

    expect(io.chmodExec).not.toHaveBeenCalled();
    expect(io.removeQuarantine).not.toHaveBeenCalled();
  });

  it('uses the manifest URL and sha256 for onnx-runtime', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'onnxruntime');
    mockDownload.mockResolvedValue({
      assetId: 'onnx-runtime-darwin-arm64',
      destPath,
      cached: false,
      bytesWritten: 2048,
      sha256: 'TBD-darwin-arm64-onnx',
    });

    const io = fakeIo();
    await acquireBinary('onnx-runtime', io);

    const [asset] = mockDownload.mock.calls[0] as Parameters<typeof VoiceAssetManager.download>;
    expect(asset.sha256).toBe('');
    expect(asset.url).toContain('onnxruntime');
  });
});

describe('acquireBinary - failure paths', () => {
  beforeEach(() => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    vi.spyOn(process, 'arch', 'get').mockReturnValue('arm64');
  });

  it('throws BinaryAcquisitionError when VoiceAssetManager.download rejects', async () => {
    mockDownload.mockRejectedValue(new Error('VOICE_ASSET_OFFLINE: network unreachable'));

    const io = fakeIo();
    await expect(acquireBinary('whisper-cpp', io)).rejects.toBeInstanceOf(BinaryAcquisitionError);
  });

  it('includes the kind in the BinaryAcquisitionError for download failure', async () => {
    mockDownload.mockRejectedValue(new Error('VOICE_ASSET_HASH_MISMATCH'));

    const io = fakeIo();
    const err = await acquireBinary('onnx-runtime', io).catch((e) => e);
    expect(err).toBeInstanceOf(BinaryAcquisitionError);
    expect(err.kind).toBe('onnx-runtime');
  });

  it('throws BinaryAcquisitionError when chmod fails', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'whisper-cli');
    mockDownload.mockResolvedValue({
      assetId: 'whisper-cpp-darwin-arm64',
      destPath,
      cached: false,
      bytesWritten: 512,
      sha256: 'TBD-darwin-arm64-whisper',
    });

    const io = fakeIo({
      chmodExec: vi.fn(async () => {
        throw new Error('EPERM');
      }),
    });
    await expect(acquireBinary('whisper-cpp', io)).rejects.toBeInstanceOf(BinaryAcquisitionError);
  });

  it('does not throw when xattr removal fails (best-effort)', async () => {
    const destPath = path.join(getPlatformServices().paths.getDataDir(), 'voice', 'bin', 'darwin-arm64', 'whisper-cli');
    mockDownload.mockResolvedValue({
      assetId: 'whisper-cpp-darwin-arm64',
      destPath,
      cached: false,
      bytesWritten: 512,
      sha256: 'TBD-darwin-arm64-whisper',
    });

    // removeQuarantine swallows errors internally - this verifies acquireBinary doesn't re-throw.
    const io = fakeIo({ removeQuarantine: vi.fn(async () => undefined) });
    await expect(acquireBinary('whisper-cpp', io)).resolves.toBe(destPath);
  });
});

describe('acquireBinary - unsupported platform', () => {
  it('throws BinaryAcquisitionError immediately without calling download', async () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('freebsd');
    vi.spyOn(process, 'arch', 'get').mockReturnValue('arm');

    const io = fakeIo();
    await expect(acquireBinary('whisper-cpp', io)).rejects.toBeInstanceOf(BinaryAcquisitionError);
    expect(mockDownload).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// WhisperLocal / KokoroLocal - acquisition failure surfaces as *UnavailableError
// ---------------------------------------------------------------------------

import {
  WhisperLocal,
  WhisperLocalUnavailableError,
  type WhisperLocalRuntime,
} from '@process/services/voice/WhisperLocal';
import { KokoroLocal, KokoroLocalUnavailableError, type KokoroLocalRuntime } from '@process/services/voice/KokoroLocal';
import type { SpeechToTextRequest } from '@/common/types/speech';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
import { DEFAULT_TTS_CONFIG } from '@/common/types/ttsTypes';

const sampleRequest = (): SpeechToTextRequest => ({
  audioBuffer: new Uint8Array([1, 2, 3, 4]),
  fileName: 'audio.wav',
  mimeType: 'audio/wav',
});

const baseConfig = (): TextToSpeechConfig => ({
  ...DEFAULT_TTS_CONFIG,
  enabled: true,
  provider: 'kokoro-local',
});

describe('WhisperLocal - acquisition via runtime seam', () => {
  it('uses the acquired binary path when acquireBinary succeeds', async () => {
    const run = vi.fn(async () => 'transcribed text\n');
    const runtime: WhisperLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/models/ggml-base.bin',
      run,
      stageAudio: vi.fn(async () => ({
        filePath: '/tmp/audio.wav',
        cleanup: vi.fn(async () => undefined),
      })),
      acquireBinary: vi.fn(async () => '/acquired/whisper-cli'),
    };

    const result = await WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime);
    expect(result.text).toBe('transcribed text');
    expect(run).toHaveBeenCalledWith('/acquired/whisper-cli', expect.any(Array));
  });

  it('throws WhisperLocalUnavailableError when acquireBinary rejects', async () => {
    const runtime: WhisperLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/models/ggml-base.bin',
      run: vi.fn(async () => ''),
      stageAudio: vi.fn(async () => ({
        filePath: '/tmp/audio.wav',
        cleanup: vi.fn(async () => undefined),
      })),
      acquireBinary: vi.fn(async () => {
        throw new BinaryAcquisitionError('whisper-cpp', 'offline');
      }),
    };

    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toBeInstanceOf(
      WhisperLocalUnavailableError
    );
  });

  it('throws WhisperLocalUnavailableError with STT_ prefix when acquireBinary rejects', async () => {
    const runtime: WhisperLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/models/ggml-base.bin',
      run: vi.fn(async () => ''),
      stageAudio: vi.fn(async () => ({
        filePath: '/tmp/audio.wav',
        cleanup: vi.fn(async () => undefined),
      })),
      acquireBinary: vi.fn(async () => {
        throw new BinaryAcquisitionError('whisper-cpp', 'offline');
      }),
    };

    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toThrow(
      /^STT_WHISPER_LOCAL_UNAVAILABLE/
    );
  });

  it('throws WhisperLocalUnavailableError (hard-disable) when acquireBinary is absent and binary is null', async () => {
    const runtime: WhisperLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/models/ggml-base.bin',
      run: vi.fn(async () => ''),
      stageAudio: vi.fn(async () => ({
        filePath: '/tmp/audio.wav',
        cleanup: vi.fn(async () => undefined),
      })),
      // no acquireBinary member - tests existing graceful-degradation path
    };

    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toBeInstanceOf(
      WhisperLocalUnavailableError
    );
  });
});

describe('KokoroLocal - acquisition via runtime seam', () => {
  it('uses the acquired binary path when acquireBinary succeeds', async () => {
    const run = vi.fn(async () => new Uint8Array([82, 73, 70, 70]));
    const runtime: KokoroLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/kokoro-models/default.onnx',
      run,
      acquireBinary: vi.fn(async () => '/acquired/kokoro-cli'),
    };

    const result = await KokoroLocal.synthesize('Hello', baseConfig(), runtime);
    expect(result.data.length).toBeGreaterThan(0);
    expect(run).toHaveBeenCalledWith('/acquired/kokoro-cli', expect.any(Array));
  });

  it('throws KokoroLocalUnavailableError when acquireBinary rejects', async () => {
    const runtime: KokoroLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/kokoro-models/default.onnx',
      run: vi.fn(async () => new Uint8Array(0)),
      acquireBinary: vi.fn(async () => {
        throw new BinaryAcquisitionError('onnx-runtime', 'offline');
      }),
    };

    await expect(KokoroLocal.synthesize('Hello', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
  });

  it('throws KokoroLocalUnavailableError with TTS_ prefix when acquireBinary rejects', async () => {
    const runtime: KokoroLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/kokoro-models/default.onnx',
      run: vi.fn(async () => new Uint8Array(0)),
      acquireBinary: vi.fn(async () => {
        throw new BinaryAcquisitionError('onnx-runtime', 'offline');
      }),
    };

    await expect(KokoroLocal.synthesize('Hello', baseConfig(), runtime)).rejects.toThrow(
      /^TTS_KOKORO_LOCAL_UNAVAILABLE/
    );
  });

  it('throws KokoroLocalUnavailableError (hard-disable) when acquireBinary is absent and binary is null', async () => {
    const runtime: KokoroLocalRuntime = {
      resolveBinary: () => null,
      resolveModel: () => '/fake/kokoro-models/default.onnx',
      run: vi.fn(async () => new Uint8Array(0)),
      // no acquireBinary member
    };

    await expect(KokoroLocal.synthesize('Hello', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
  });
});
