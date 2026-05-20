/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextRequest } from '@/common/types/speech';
import {
  WhisperLocal,
  WhisperLocalUnavailableError,
  type WhisperLocalRuntime,
} from '@process/services/voice/WhisperLocal';
import { describe, expect, it, vi } from 'vitest';

const sampleRequest = (overrides: Partial<SpeechToTextRequest> = {}): SpeechToTextRequest => ({
  audioBuffer: new Uint8Array([1, 2, 3, 4]),
  fileName: 'audio.wav',
  mimeType: 'audio/wav',
  ...overrides,
});

const fakeRuntime = (overrides: Partial<WhisperLocalRuntime> = {}): WhisperLocalRuntime => ({
  resolveBinary: () => '/fake/bin/whisper-cli',
  resolveModel: (model) => `/fake/models/ggml-${model}.bin`,
  run: vi.fn(async () => 'hello world\n'),
  stageAudio: vi.fn(async () => ({
    filePath: '/tmp/wayland-whisper-x/audio.wav',
    cleanup: vi.fn(async () => undefined),
  })),
  ...overrides,
});

describe('WhisperLocal.transcribe', () => {
  it('transcribes via the whisper.cpp binary and parses stdout', async () => {
    const runtime = fakeRuntime({ run: vi.fn(async () => '  hello \n world  \n') });
    const result = await WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime);
    expect(result.provider).toBe('whisper-local');
    expect(result.text).toBe('hello world');
    expect(result.model).toBe('base');
    expect(runtime.run).toHaveBeenCalledOnce();
  });

  it('passes the resolved model path and staged audio file to the binary', async () => {
    const run = vi.fn(async () => 'ok\n');
    const runtime = fakeRuntime({ run });
    await WhisperLocal.transcribe(sampleRequest(), { model: 'small' }, runtime);
    const [binary, args] = run.mock.calls[0] as [string, string[]];
    expect(binary).toBe('/fake/bin/whisper-cli');
    expect(args).toContain('/fake/models/ggml-small.bin');
    expect(args).toContain('/tmp/wayland-whisper-x/audio.wav');
  });

  it('passes an ISO 639-1 language code derived from the language hint', async () => {
    const run = vi.fn(async () => 'ok\n');
    const runtime = fakeRuntime({ run });
    await WhisperLocal.transcribe(sampleRequest({ languageHint: 'en-US' }), { model: 'base' }, runtime);
    const [, args] = run.mock.calls[0] as [string, string[]];
    expect(args).toContain('-l');
    expect(args).toContain('en');
  });

  it('throws WhisperLocalUnavailableError when the binary is not installed', async () => {
    const runtime = fakeRuntime({ resolveBinary: () => null });
    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toBeInstanceOf(
      WhisperLocalUnavailableError
    );
  });

  it('throws WhisperLocalUnavailableError when the model is not installed', async () => {
    const runtime = fakeRuntime({ resolveModel: () => null });
    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toBeInstanceOf(
      WhisperLocalUnavailableError
    );
  });

  it('uses a coded error message the STT service can surface to the user', async () => {
    const runtime = fakeRuntime({ resolveBinary: () => null });
    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toThrow(
      /^STT_WHISPER_LOCAL_UNAVAILABLE/
    );
  });

  it('does not stage audio or run the binary when the runtime is unavailable', async () => {
    const stageAudio = vi.fn(async () => ({ filePath: '/tmp/x', cleanup: vi.fn(async () => undefined) }));
    const run = vi.fn(async () => '');
    const runtime = fakeRuntime({ resolveBinary: () => null, stageAudio, run });
    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toBeInstanceOf(
      WhisperLocalUnavailableError
    );
    expect(stageAudio).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('cleans up the staged audio file even when transcription fails', async () => {
    const cleanup = vi.fn(async () => undefined);
    const runtime = fakeRuntime({
      stageAudio: vi.fn(async () => ({ filePath: '/tmp/wayland-whisper-x/audio.wav', cleanup })),
      run: vi.fn(async () => {
        throw new Error('whisper crashed');
      }),
    });
    await expect(WhisperLocal.transcribe(sampleRequest(), { model: 'base' }, runtime)).rejects.toThrow(
      'whisper crashed'
    );
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
