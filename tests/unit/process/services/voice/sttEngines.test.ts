/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';

// No electron/electron-log mocks needed: the adapters lazy-import
// SpeechToTextService inside the default seam, and every test below injects a
// fake service, so the real service module is never loaded.
import { createWhisperLocalSttEngine } from '@process/services/voice/engine/stt/whisperLocalEngine';
import { createOpenaiSttEngine } from '@process/services/voice/engine/stt/openaiSttEngine';
import { createDeepgramSttEngine } from '@process/services/voice/engine/stt/deepgramSttEngine';
import type { SttEvent } from '@process/services/voice/engine/types';
import type { SpeechToTextConfig, SpeechToTextRequest, SpeechToTextResult } from '@/common/types/speech';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const AUDIO = { data: new Uint8Array([1, 2, 3]), mimeType: 'audio/webm', fileName: 'sample.webm' };

const collect = () => {
  const events: SttEvent[] = [];
  return { events, onEvent: (e: SttEvent) => events.push(e) };
};

const fakeTranscribe = (provider: SpeechToTextResult['provider'], text: string) =>
  vi.fn(
    async (_config: SpeechToTextConfig, _request: SpeechToTextRequest): Promise<SpeechToTextResult> => ({
      model: 'fake-model',
      provider,
      text,
    })
  );

describe('whisper-local STT engine adapter', () => {
  it('has the registry id and local/streaming flags', () => {
    const engine = createWhisperLocalSttEngine({ transcribeWithWhisperLocal: fakeTranscribe('whisper-local', '') });
    expect(engine.id).toBe('whisper-local');
    expect(engine.local).toBe(true);
    expect(engine.streaming).toBe(false);
  });

  it('delegates to the service with the forced provider and emits one final event', async () => {
    const transcribeWithWhisperLocal = fakeTranscribe('whisper-local', 'local transcript');
    const engine = createWhisperLocalSttEngine({ transcribeWithWhisperLocal });
    const { events, onEvent } = collect();
    await engine.transcribe(AUDIO, onEvent);

    expect(transcribeWithWhisperLocal).toHaveBeenCalledTimes(1);
    const [config, request] = transcribeWithWhisperLocal.mock.calls[0];
    expect(config.provider).toBe('whisper-local');
    expect(request.fileName).toBe('sample.webm');
    expect(request.mimeType).toBe('audio/webm');
    expect(request.audioBuffer).toBe(AUDIO.data);
    expect(events).toEqual([{ text: 'local transcript', final: true }]);
  });

  it('available() is false when the whisper binary does not exist on disk', async () => {
    // NodePlatformServices resolves the data dir from DATA_DIR - point it at an
    // empty temp dir so neither the binary nor the model can exist.
    const dir = mkdtempSync(path.join(tmpdir(), 'wayland-stt-engines-'));
    const previous = process.env.DATA_DIR;
    process.env.DATA_DIR = dir;
    try {
      const engine = createWhisperLocalSttEngine({ transcribeWithWhisperLocal: fakeTranscribe('whisper-local', '') });
      const availability = await engine.available();
      expect(availability.ok).toBe(false);
      expect(availability.reason).toContain('whisper');
    } finally {
      if (previous === undefined) {
        delete process.env.DATA_DIR;
      } else {
        process.env.DATA_DIR = previous;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('openai STT engine adapter', () => {
  it('has the registry id and cloud flags', () => {
    const engine = createOpenaiSttEngine({ transcribeWithOpenAI: fakeTranscribe('openai', '') });
    expect(engine.id).toBe('openai-whisper');
    expect(engine.local).toBe(false);
    expect(engine.streaming).toBe(false);
  });

  it('available() is true (keys live in per-provider config until Phase 2)', async () => {
    const engine = createOpenaiSttEngine({ transcribeWithOpenAI: fakeTranscribe('openai', '') });
    expect(await engine.available()).toEqual({ ok: true });
  });

  it('delegates to the service with the forced provider and emits one final event', async () => {
    const transcribeWithOpenAI = fakeTranscribe('openai', 'openai transcript');
    const engine = createOpenaiSttEngine({ transcribeWithOpenAI });
    const { events, onEvent } = collect();
    await engine.transcribe(AUDIO, onEvent);

    expect(transcribeWithOpenAI).toHaveBeenCalledTimes(1);
    const [config, request] = transcribeWithOpenAI.mock.calls[0];
    expect(config.provider).toBe('openai');
    expect(request.fileName).toBe('sample.webm');
    expect(request.mimeType).toBe('audio/webm');
    expect(request.audioBuffer).toBe(AUDIO.data);
    expect(events).toEqual([{ text: 'openai transcript', final: true }]);
  });
});

describe('deepgram STT engine adapter', () => {
  it('has the registry id and cloud flags', () => {
    const engine = createDeepgramSttEngine({ transcribeWithDeepgram: fakeTranscribe('deepgram', '') });
    expect(engine.id).toBe('deepgram');
    expect(engine.local).toBe(false);
    expect(engine.streaming).toBe(false);
  });

  it('available() is true (keys live in per-provider config until Phase 2)', async () => {
    const engine = createDeepgramSttEngine({ transcribeWithDeepgram: fakeTranscribe('deepgram', '') });
    expect(await engine.available()).toEqual({ ok: true });
  });

  it('delegates to the service with the forced provider and emits one final event', async () => {
    const transcribeWithDeepgram = fakeTranscribe('deepgram', 'deepgram transcript');
    const engine = createDeepgramSttEngine({ transcribeWithDeepgram });
    const { events, onEvent } = collect();
    await engine.transcribe(AUDIO, onEvent);

    expect(transcribeWithDeepgram).toHaveBeenCalledTimes(1);
    const [config, request] = transcribeWithDeepgram.mock.calls[0];
    expect(config.provider).toBe('deepgram');
    expect(request.fileName).toBe('sample.webm');
    expect(request.mimeType).toBe('audio/webm');
    expect(request.audioBuffer).toBe(AUDIO.data);
    expect(events).toEqual([{ text: 'deepgram transcript', final: true }]);
  });
});
