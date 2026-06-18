/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { createKokoroEngine } from '@process/services/voice/engine/tts/kokoroEngine';
import { createSystemNativeEngine } from '@process/services/voice/engine/tts/systemNativeEngine';
import { createMlxAudioEngine } from '@process/services/voice/engine/tts/mlxAudioEngine';
import type { TtsChunk } from '@process/services/voice/engine/types';
import { writeFileSync } from 'node:fs';

const collect = () => {
  const chunks: TtsChunk[] = [];
  return { chunks, onChunk: (c: TtsChunk) => chunks.push(c) };
};

describe('kokoro engine adapter', () => {
  it('emits exactly one final WAV chunk from the runtime seam', async () => {
    const engine = createKokoroEngine({
      resolveUv: () => '/fake/uv',
      resolveModel: () => '/fake/model.onnx',
      resolveVoices: () => '/fake/voices.bin',
      run: vi.fn(async (_uv: string, args: string[]) => {
        writeFileSync(args[args.length - 1], Buffer.from([82, 73, 70, 70]));
      }),
    });
    const { chunks, onChunk } = collect();
    await engine.synthesize('hi', { voice: 'af_sky', speed: 1 }, onChunk);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].final).toBe(true);
    expect(chunks[0].mimeType).toBe('audio/wav');
    expect(chunks[0].data.length).toBeGreaterThan(0);
  });

  it('warmup is a no-op on an injected (non-default) runtime - never touches the worker', async () => {
    const ensureStarted = vi.fn(async () => {});
    const engine = createKokoroEngine(
      {
        resolveUv: () => '/fake/uv',
        resolveModel: () => '/fake/model.onnx',
        resolveVoices: () => '/fake/voices.bin',
        run: vi.fn(),
      },
      { ensureStarted, synthesize: vi.fn(), shutdown: vi.fn() } as never,
    );
    await expect(engine.warmup?.()).resolves.toBeUndefined();
    expect(ensureStarted).not.toHaveBeenCalled();
  });

  it('voices() returns the curated kokoro list', async () => {
    const engine = createKokoroEngine();
    const voices = await engine.voices();
    expect(voices.some((v) => v.id === 'af_sky')).toBe(true);
    expect(voices.length).toBeGreaterThanOrEqual(20);
  });
});

describe('system-native engine adapter', () => {
  it('is always available and emits one final chunk (empty off-macOS)', async () => {
    const engine = createSystemNativeEngine();
    expect((await engine.available()).ok).toBe(true);
    const { chunks, onChunk } = collect();
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      await engine.synthesize('hi', { speed: 1 }, onChunk);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0].final).toBe(true);
  });
});

describe('mlx engine adapter', () => {
  it('available() is false off Apple Silicon', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      const engine = createMlxAudioEngine();
      expect((await engine.available()).ok).toBe(false);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
  });
});
