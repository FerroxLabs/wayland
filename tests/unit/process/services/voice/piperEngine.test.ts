/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { createPiperEngine, PIPER_VOICES } from '@process/services/voice/engine/tts/piperEngine';

describe('piper engine adapter', () => {
  it('lists curated multilingual voices', () => {
    expect(PIPER_VOICES.some((v) => v.id === 'en_US-lessac-medium')).toBe(true);
    expect(PIPER_VOICES.some((v) => v.id.startsWith('fr_FR'))).toBe(true);
  });

  it('synthesizes one final wav chunk via the runtime seam', async () => {
    const run = vi.fn(async (_uv: string, args: string[], _cwd: string, _input?: string) => {
      writeFileSync(args[args.indexOf('--output_file') + 1], Buffer.from([82, 73, 70, 70]));
    });
    const engine = createPiperEngine({
      resolveUv: () => '/fake/uv',
      resolveVoiceModel: (v) => `/fake/piper/${v}.onnx`,
      run,
    });
    const chunks: { final: boolean }[] = [];
    await engine.synthesize('bonjour', { voice: 'fr_FR-siwis-medium' }, (c) => chunks.push(c));
    expect(chunks).toHaveLength(1);
    expect(chunks[0].final).toBe(true);
    const args = run.mock.calls[0][1] as string[];
    expect(args).toContain('--model');
    expect(args).toContain('/fake/piper/fr_FR-siwis-medium.onnx');
    // Text travels on stdin (the form the Task 8 shell proof validated), not argv.
    expect(args).not.toContain('bonjour');
    expect(run.mock.calls[0][3]).toBe('bonjour');
  });

  it('maps speed onto length_scale (inverse tempo)', async () => {
    const run = vi.fn(async (_uv: string, args: string[]) => {
      writeFileSync(args[args.indexOf('--output_file') + 1], Buffer.from([82, 73, 70, 70]));
    });
    const engine = createPiperEngine({
      resolveUv: () => '/fake/uv',
      resolveVoiceModel: (v) => `/fake/piper/${v}.onnx`,
      run,
    });
    await engine.synthesize('hello', { speed: 2 }, () => {});
    const args = run.mock.calls[0][1] as string[];
    expect(args[args.indexOf('--length_scale') + 1]).toBe('0.5');
  });

  it('available() is false when the default voice model is missing', async () => {
    const engine = createPiperEngine({
      resolveUv: () => '/fake/uv',
      resolveVoiceModel: () => null,
      run: vi.fn(),
    });
    expect((await engine.available()).ok).toBe(false);
  });

  it('available() is false when uv is missing', async () => {
    const engine = createPiperEngine({
      resolveUv: () => null,
      resolveVoiceModel: (v) => `/fake/piper/${v}.onnx`,
      run: vi.fn(),
    });
    const res = await engine.available();
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('uv');
  });

  it('warmup is a no-op on an injected (non-default) runtime - never touches the worker', async () => {
    const ensureStarted = vi.fn(async () => {});
    const engine = createPiperEngine(
      {
        resolveUv: () => '/fake/uv',
        resolveVoiceModel: (v) => `/fake/piper/${v}.onnx`,
        run: vi.fn(),
      },
      { ensureStarted, synthesize: vi.fn(), shutdown: vi.fn() } as never,
    );
    await expect(engine.warmup?.()).resolves.toBeUndefined();
    expect(ensureStarted).not.toHaveBeenCalled();
  });
});
