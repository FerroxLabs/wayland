/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_TTS_CONFIG, normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
import { KokoroLocal, KokoroLocalUnavailableError, type KokoroLocalRuntime } from '@process/services/voice/KokoroLocal';
import {
  buildSystemNativeSayArgs,
  synthesize,
  synthesizeOpenAI,
  synthesizeTurn,
  textToSpeechRegistry,
} from '@process/services/voice/TextToSpeechService';
import type { OpenAITtsRuntime, TextToSpeechUnavailableError } from '@process/services/voice/TextToSpeechService';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseConfig = (overrides: Partial<TextToSpeechConfig> = {}): TextToSpeechConfig => ({
  ...DEFAULT_TTS_CONFIG,
  enabled: true,
  provider: 'kokoro-local',
  ...overrides,
});

const fakeKokoroRuntime = (overrides: Partial<KokoroLocalRuntime> = {}): KokoroLocalRuntime => ({
  resolveBinary: () => '/fake/bin/kokoro-cli',
  resolveModel: (voice) => `/fake/kokoro-models/${voice}.onnx`,
  run: vi.fn(async () => new Uint8Array([82, 73, 70, 70])), // fake WAV header bytes
  ...overrides,
});

const fakeOpenAIRuntime = (overrides: Partial<OpenAITtsRuntime> = {}): OpenAITtsRuntime => ({
  resolveApiKey: vi.fn(async () => 'sk-test'),
  fetch: vi.fn(
    async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
  ),
  ...overrides,
});

// ---------------------------------------------------------------------------
// normalizeTextToSpeechConfig
// ---------------------------------------------------------------------------

describe('normalizeTextToSpeechConfig', () => {
  it('returns full defaults when called with no arguments', () => {
    const config = normalizeTextToSpeechConfig();
    expect(config).toEqual(DEFAULT_TTS_CONFIG);
  });

  it('fills missing fields with defaults', () => {
    const config = normalizeTextToSpeechConfig({ enabled: true });
    expect(config.enabled).toBe(true);
    expect(config.provider).toBe(DEFAULT_TTS_CONFIG.provider);
    expect(config.voice).toBe(DEFAULT_TTS_CONFIG.voice);
    expect(config.speed).toBe(DEFAULT_TTS_CONFIG.speed);
    expect(config.autoReadResponses).toBe(DEFAULT_TTS_CONFIG.autoReadResponses);
  });

  it('preserves supplied values over defaults', () => {
    const config = normalizeTextToSpeechConfig({ provider: 'system-native', speed: 1.5, voice: 'en-us' });
    expect(config.provider).toBe('system-native');
    expect(config.speed).toBe(1.5);
    expect(config.voice).toBe('en-us');
  });

  it('preserves a supported OpenAI provider and bounds its model identifier', () => {
    const config = normalizeTextToSpeechConfig({ provider: 'openai', model: '  ' + 'm'.repeat(200) + '  ' });
    expect(config.provider).toBe('openai');
    expect(config.model).toHaveLength(128);
  });

  it.each(['grok', 'unknown'])('rejects the previously persisted unsupported provider %s', (provider) => {
    const config = normalizeTextToSpeechConfig({
      provider: provider as TextToSpeechConfig['provider'],
    });
    expect(config.provider).toBe(DEFAULT_TTS_CONFIG.provider);
  });

  it('clamps speed and bounds the voice identifier', () => {
    const config = normalizeTextToSpeechConfig({
      speed: 99,
      voice: '  ' + 'v'.repeat(200) + '  ',
    });
    expect(config.speed).toBe(2);
    expect(config.voice).toHaveLength(128);
  });
});

// ---------------------------------------------------------------------------
// OpenAI speech
// ---------------------------------------------------------------------------

describe('synthesizeOpenAI', () => {
  it('fails before making a request when OpenAI is not connected', async () => {
    const fetch = vi.fn();
    const runtime = fakeOpenAIRuntime({ resolveApiKey: vi.fn(async () => undefined), fetch });

    await expect(synthesizeOpenAI('Hello', baseConfig({ provider: 'openai' }), runtime)).rejects.toMatchObject({
      name: 'TextToSpeechUnavailableError',
      code: 'TTS_OPENAI_NOT_CONFIGURED',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the official speech endpoint with the selected voice, model, speed, and bounded input', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([7, 8, 9]), {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        })
    );
    const runtime = fakeOpenAIRuntime({ fetch });
    const text = 'x'.repeat(5000);

    await expect(
      synthesizeOpenAI(
        text,
        baseConfig({ provider: 'openai', voice: 'cedar', model: 'gpt-4o-mini-tts', speed: 1.25 }),
        runtime
      )
    ).resolves.toEqual({ data: new Uint8Array([7, 8, 9]), mimeType: 'audio/mpeg' });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/audio/speech');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer sk-test', 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'gpt-4o-mini-tts',
      input: 'x'.repeat(4096),
      voice: 'cedar',
      response_format: 'mp3',
      speed: 1.25,
    });
  });

  it('maps authentication and rate-limit responses to stable public error codes', async () => {
    const config = baseConfig({ provider: 'openai' });
    await expect(
      synthesizeOpenAI(
        'Hello',
        config,
        fakeOpenAIRuntime({ fetch: vi.fn(async () => new Response('', { status: 401 })) })
      )
    ).rejects.toMatchObject({ code: 'TTS_OPENAI_AUTH_ERROR' });
    await expect(
      synthesizeOpenAI(
        'Hello',
        config,
        fakeOpenAIRuntime({ fetch: vi.fn(async () => new Response('', { status: 429 })) })
      )
    ).rejects.toMatchObject({ code: 'TTS_OPENAI_RATE_LIMITED' });
  });
});

// ---------------------------------------------------------------------------
// KokoroLocal.synthesize
// ---------------------------------------------------------------------------

describe('KokoroLocal.synthesize', () => {
  it('returns non-empty audio for a fixture string via the mock runtime', async () => {
    const runtime = fakeKokoroRuntime();
    const result = await KokoroLocal.synthesize('Hello world', baseConfig(), runtime);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.mimeType).toBe('audio/wav');
  });

  it('passes model path, voice, speed, and text to the binary', async () => {
    const run = vi.fn(async () => new Uint8Array([1, 2, 3]));
    const runtime = fakeKokoroRuntime({ run });
    await KokoroLocal.synthesize('Test', baseConfig({ voice: 'en-us', speed: 1.25 }), runtime);
    const [binary, args] = run.mock.calls[0] as [string, string[]];
    expect(binary).toBe('/fake/bin/kokoro-cli');
    expect(args).toContain('/fake/kokoro-models/en-us.onnx');
    expect(args).toContain('en-us');
    expect(args).toContain('1.25');
    expect(args).toContain('Test');
  });

  it('throws KokoroLocalUnavailableError when the binary is missing', async () => {
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
  });

  it('throws KokoroLocalUnavailableError when the model is missing', async () => {
    const runtime = fakeKokoroRuntime({ resolveModel: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
  });

  it('uses a coded error message the TTS service can surface to the user', async () => {
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toThrow(/^TTS_KOKORO_LOCAL_UNAVAILABLE/);
  });

  it('does not invoke run when the binary is missing', async () => {
    const run = vi.fn(async () => new Uint8Array(0));
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null, run });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
    expect(run).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TextToSpeechService.synthesize - provider routing
// ---------------------------------------------------------------------------

describe('synthesize (TextToSpeechService)', () => {
  it('passes a selected macOS voice and bounded speaking rate to say', () => {
    expect(buildSystemNativeSayArgs('Hello', baseConfig({ voice: 'Samantha', speed: 1.25 }))).toEqual([
      '-r',
      '219',
      '-v',
      'Samantha',
      '--output-file=/dev/stdout',
      '--data-format=aiff',
      'Hello',
    ]);
  });

  it('lets macOS choose its default voice when no explicit voice is selected', () => {
    expect(buildSystemNativeSayArgs('Hello', baseConfig({ voice: 'default' }))).not.toContain('-v');
  });

  it('routes kokoro-local to KokoroLocal and returns audio', async () => {
    const runtime = fakeKokoroRuntime();
    const result = await synthesize('Hello', baseConfig({ provider: 'kokoro-local' }), runtime);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('routes OpenAI to its authenticated runtime', async () => {
    const runtime = fakeOpenAIRuntime();
    const result = await synthesize('Hello', baseConfig({ provider: 'openai' }), undefined, runtime);
    expect(result).toEqual({ data: new Uint8Array([1, 2, 3]), mimeType: 'audio/mpeg' });
    expect(runtime.fetch).toHaveBeenCalledOnce();
  });

  it('returns a typed unavailable error for system-native on non-macOS', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      await expect(synthesize('Hello', baseConfig({ provider: 'system-native' }))).rejects.toMatchObject({
        name: 'TextToSpeechUnavailableError',
        code: 'TTS_SYSTEM_NATIVE_UNAVAILABLE',
      } satisfies Partial<TextToSpeechUnavailableError>);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
  });

  it('propagates KokoroLocalUnavailableError from the kokoro-local provider', async () => {
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null });
    await expect(synthesize('Hi', baseConfig({ provider: 'kokoro-local' }), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError
    );
  });
});

// ---------------------------------------------------------------------------
// VOC-04: adapter registry + VoiceReceipt
// ---------------------------------------------------------------------------

describe('textToSpeechRegistry (VOC-04)', () => {
  it('registers every supported provider as an adapter', () => {
    expect(new Set(textToSpeechRegistry.providers())).toEqual(
      new Set(['kokoro-local', 'system-native', 'openai'])
    );
  });

  it('marks local engines on-device and hosted OpenAI off-device', () => {
    expect(textToSpeechRegistry.resolve('kokoro-local').onDevice).toBe(true);
    expect(textToSpeechRegistry.resolve('system-native').onDevice).toBe(true);
    expect(textToSpeechRegistry.resolve('openai').onDevice).toBe(false);
  });
});

describe('synthesizeTurn (VOC-04 VoiceReceipt)', () => {
  it('returns audio plus an on-device receipt for kokoro-local synthesis', async () => {
    const runtime = fakeKokoroRuntime({ run: vi.fn(async () => new Uint8Array([1, 2, 3, 4])) });
    const { audio, receipt } = await synthesizeTurn('Hello', baseConfig({ provider: 'kokoro-local', voice: 'en-us' }), {
      kokoro: runtime,
    });

    expect(audio.data.length).toBe(4);
    expect(receipt.modality).toBe('tts');
    expect(receipt.provider).toBe('kokoro-local');
    expect(receipt.model).toBe('kokoro-local:en-us');
    expect(receipt.terminalState).toBe('completed');
    // Observed usage: 'Hello' characters in, 4 audio bytes out.
    expect(receipt.usage.characterCount).toBe('Hello'.length);
    expect(receipt.usage.audioOutputBytes).toBe(4);
    // On-device → estimated zero cost.
    expect(receipt.cost).toEqual({
      status: 'estimated',
      amount: 0,
      currency: 'USD',
      basis: 'on-device inference; no marginal provider cost',
    });
    expect(receipt.content.responseDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns a hosted receipt with unavailable cost for OpenAI synthesis', async () => {
    const runtime = fakeOpenAIRuntime();
    const { receipt } = await synthesizeTurn(
      'Read this',
      baseConfig({ provider: 'openai', model: 'gpt-4o-mini-tts' }),
      { openai: runtime }
    );

    expect(receipt.provider).toBe('openai');
    expect(receipt.model).toBe('gpt-4o-mini-tts');
    expect(receipt.cost.status).toBe('unavailable');
    expect(receipt.usage.characterCount).toBe('Read this'.length);
  });
});
