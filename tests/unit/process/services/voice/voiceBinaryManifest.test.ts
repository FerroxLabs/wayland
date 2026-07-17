/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextRequest } from '@/common/types/speech';
import { DEFAULT_TTS_CONFIG, type TextToSpeechConfig } from '@/common/types/ttsTypes';
import { KokoroLocal, KokoroLocalUnavailableError, type KokoroLocalRuntime } from '@process/services/voice/KokoroLocal';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import {
  WhisperLocal,
  WhisperLocalUnavailableError,
  type WhisperLocalRuntime,
} from '@process/services/voice/WhisperLocal';
import {
  BinaryAcquisitionError,
  acquireBinary,
  pickManifestEntry,
  resolveBinaryAsset,
  type BinaryKind,
} from '@process/services/voice/voiceBinaryManifest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const previouslyDeclaredPlatforms: ReadonlyArray<[BinaryKind, string, string]> = [
  ['whisper-cpp', 'darwin', 'arm64'],
  ['whisper-cpp', 'darwin', 'x64'],
  ['whisper-cpp', 'win32', 'x64'],
  ['whisper-cpp', 'linux', 'x64'],
  ['onnx-runtime', 'darwin', 'arm64'],
  ['onnx-runtime', 'darwin', 'x64'],
  ['onnx-runtime', 'win32', 'x64'],
  ['onnx-runtime', 'linux', 'x64'],
];

describe('voice native binary manifest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(previouslyDeclaredPlatforms)('returns null for the unverified %s %s-%s artifact', (kind, platform, arch) => {
    expect(pickManifestEntry(kind, platform, arch)).toBeNull();
  });

  it('reports both native binary kinds unavailable on the current platform', () => {
    expect(resolveBinaryAsset('whisper-cpp')).toBeNull();
    expect(resolveBinaryAsset('onnx-runtime')).toBeNull();
  });

  it.each(['whisper-cpp', 'onnx-runtime'] as const)(
    'throws before starting a download when %s is unavailable',
    async (kind) => {
      vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
      vi.spyOn(process, 'arch', 'get').mockReturnValue('x64');
      const download = vi.spyOn(VoiceAssetManager, 'download').mockRejectedValue(new Error('must not download'));

      await expect(acquireBinary(kind)).rejects.toBeInstanceOf(BinaryAcquisitionError);
      expect(download).not.toHaveBeenCalled();
    }
  );
});

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
    };

    await expect(KokoroLocal.synthesize('Hello', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
  });
});
