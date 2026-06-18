/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_TTS_CONFIG, normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
import {
  KokoroLocal,
  KokoroLocalUnavailableError,
  type KokoroLocalRuntime,
} from '@process/services/voice/KokoroLocal';
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseConfig = (overrides: Partial<TextToSpeechConfig> = {}): TextToSpeechConfig => ({
  ...DEFAULT_TTS_CONFIG,
  enabled: true,
  provider: 'kokoro-local',
  ...overrides,
});

// KokoroLocal reads the synthesized WAV back from the output file (last
// positional arg of the uv command), so the fake run must create it.
const writeWavFixture = async (_uv: string, args: string[]) => {
  writeFileSync(args[args.length - 1], Buffer.from([82, 73, 70, 70])); // fake WAV header bytes
};

const fakeKokoroRuntime = (overrides: Partial<KokoroLocalRuntime> = {}): KokoroLocalRuntime => ({
  resolveUv: () => '/fake/bin/uv',
  resolveModel: () => '/fake/kokoro/kokoro-v1.0.onnx',
  resolveVoices: () => '/fake/kokoro/voices-v1.0.bin',
  run: vi.fn(writeWavFixture),
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

  it('migrates a v1 config (provider/voice/speed) to a chain', () => {
    const config = normalizeTextToSpeechConfig({
      enabled: true, provider: 'kokoro-local', voice: 'af_sky', speed: 1.5, autoReadResponses: true,
    });
    expect(config.chain).toEqual(['kokoro-local', 'system-native']);
    expect(config.engines['kokoro-local']).toEqual({ voice: 'af_sky', speed: 1.5 });
    expect(config.autoReadDefault).toBe(true);
  });

  it('passes a v2 config through unchanged', () => {
    const v2 = {
      enabled: true, provider: 'piper-local' as const, voice: 'x', speed: 1,
      autoReadResponses: false, autoReadDefault: false,
      chain: ['piper-local', 'system-native'] as ('piper-local' | 'system-native')[],
      engines: { 'piper-local': { voice: 'en_US-lessac-medium', speed: 1 } },
    };
    const config = normalizeTextToSpeechConfig(v2);
    expect(config.chain).toEqual(['piper-local', 'system-native']);
    expect(config.engines['piper-local']?.voice).toBe('en_US-lessac-medium');
  });

  it('defaults to the offline chain with a valid kokoro voice (no "default" placeholder)', () => {
    const config = normalizeTextToSpeechConfig();
    expect(config.chain).toEqual(['kokoro-local', 'system-native']);
    expect(config.engines['kokoro-local']?.voice).toBe('af_sky');
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

  it('passes model path, voices path, voice, speed, and text to the uv command', async () => {
    const run = vi.fn(writeWavFixture);
    const runtime = fakeKokoroRuntime({ run });
    await KokoroLocal.synthesize('Test', baseConfig({ voice: 'en-us', speed: 1.25 }), runtime);
    const [uv, args] = run.mock.calls[0] as unknown as [string, string[]];
    expect(uv).toBe('/fake/bin/uv');
    expect(args).toContain('/fake/kokoro/kokoro-v1.0.onnx');
    expect(args).toContain('/fake/kokoro/voices-v1.0.bin');
    expect(args).toContain('en-us');
    expect(args).toContain('1.25');
    expect(args).toContain('Test');
  });

  it('throws KokoroLocalUnavailableError when the uv runtime is missing', async () => {
    const runtime = fakeKokoroRuntime({ resolveUv: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
  });

  it('throws KokoroLocalUnavailableError when the model is missing', async () => {
    const runtime = fakeKokoroRuntime({ resolveModel: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
  });

  it('throws KokoroLocalUnavailableError when the voice embeddings are missing', async () => {
    const runtime = fakeKokoroRuntime({ resolveVoices: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
  });

  it('uses a coded error message the TTS service can surface to the user', async () => {
    const runtime = fakeKokoroRuntime({ resolveUv: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toThrow(
      /^TTS_KOKORO_LOCAL_UNAVAILABLE/,
    );
  });

  it('does not invoke run when the uv runtime is missing', async () => {
    const run = vi.fn(writeWavFixture);
    const runtime = fakeKokoroRuntime({ resolveUv: () => null, run });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
    expect(run).not.toHaveBeenCalled();
  });
});
