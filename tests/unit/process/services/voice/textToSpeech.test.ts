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
import { synthesize } from '@process/services/voice/TextToSpeechService';
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

const fakeKokoroRuntime = (overrides: Partial<KokoroLocalRuntime> = {}): KokoroLocalRuntime => ({
  resolveBinary: () => '/fake/bin/kokoro-cli',
  resolveModel: (voice) => `/fake/kokoro-models/${voice}.onnx`,
  run: vi.fn(async () => new Uint8Array([82, 73, 70, 70])), // fake WAV header bytes
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
      KokoroLocalUnavailableError,
    );
  });

  it('throws KokoroLocalUnavailableError when the model is missing', async () => {
    const runtime = fakeKokoroRuntime({ resolveModel: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
  });

  it('uses a coded error message the TTS service can surface to the user', async () => {
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toThrow(
      /^TTS_KOKORO_LOCAL_UNAVAILABLE/,
    );
  });

  it('does not invoke run when the binary is missing', async () => {
    const run = vi.fn(async () => new Uint8Array(0));
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null, run });
    await expect(KokoroLocal.synthesize('hi', baseConfig(), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
    expect(run).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TextToSpeechService.synthesize - provider routing
// ---------------------------------------------------------------------------

describe('synthesize (TextToSpeechService)', () => {
  it('routes kokoro-local to KokoroLocal and returns audio', async () => {
    const runtime = fakeKokoroRuntime();
    const result = await synthesize('Hello', baseConfig({ provider: 'kokoro-local' }), runtime);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('routes system-native on non-macOS without crashing and returns empty audio', async () => {
    // Guard: skip the real `say` invocation by only asserting the fallback path shape.
    // On macOS in CI the `say` binary is present, but we only test the non-macOS branch here
    // by mocking process.platform.
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      const result = await synthesize('Hello', baseConfig({ provider: 'system-native' }));
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.mimeType).toBe('audio/wav');
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
  });

  it('propagates KokoroLocalUnavailableError from the kokoro-local provider', async () => {
    const runtime = fakeKokoroRuntime({ resolveBinary: () => null });
    await expect(synthesize('Hi', baseConfig({ provider: 'kokoro-local' }), runtime)).rejects.toBeInstanceOf(
      KokoroLocalUnavailableError,
    );
  });
});
