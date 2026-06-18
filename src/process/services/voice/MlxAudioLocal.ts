/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getBinaryPath } from '@process/services/voice/voiceBinaryManifest';

const execFileAsync = promisify(execFile);

// F5-TTS MLX weights live under the author's repo; the old mlx-community id
// 401'd (no such mirror). Verified to resolve.
export const MLX_AUDIO_DEFAULT_MODEL = 'lucasnewman/f5-tts-mlx';

export class MlxAudioLocalUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MlxAudioLocalUnavailableError';
  }
}

export type MlxAudioLocalRuntime = {
  resolveUv: () => string | null;
  run: (uv: string, args: string[], cwd: string) => Promise<void>;
};

export const defaultMlxAudioLocalRuntime: MlxAudioLocalRuntime = {
  resolveUv: () => {
    const p = getBinaryPath('uv-runtime');
    return p && existsSync(p) ? p : null;
  },
  run: async (uv, args, cwd) => {
    await execFileAsync(uv, args, {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
      timeout: 120_000,
      cwd,
    });
  },
};

/**
 * Local, offline TTS via the mlx-audio Python package (Apple Silicon MLX).
 * Requires the uv runtime binary and `uv tool install mlx-audio`.
 * Models are downloaded from HuggingFace on first use; `config.voice` is the
 * HuggingFace model ID.
 */
export class MlxAudioLocal {
  static async synthesize(
    text: string,
    config: TextToSpeechConfig,
    runtime: MlxAudioLocalRuntime = defaultMlxAudioLocalRuntime,
  ): Promise<TextToSpeechAudio> {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') {
      throw new MlxAudioLocalUnavailableError(
        'TTS_MLX_AUDIO_UNAVAILABLE: mlx-audio requires Apple Silicon (darwin/arm64)',
      );
    }

    const uv = runtime.resolveUv();
    if (!uv) {
      throw new MlxAudioLocalUnavailableError(
        'TTS_MLX_AUDIO_UNAVAILABLE: uv runtime not installed. Use Settings › Tools to install it.',
      );
    }

    const model = config.voice?.trim() || MLX_AUDIO_DEFAULT_MODEL;
    const outDir = await mkdtemp(path.join(tmpdir(), 'wayland-tts-'));

    const args = [
      'run', '--with', 'mlx-audio',
      'python', '-m', 'mlx_audio.tts.generate',
      '--model', model,
      '--text', text,
      '--speed', String(config.speed ?? 1.0),
      '--output_path', outDir,
      '--file_prefix', 'out',
      '--join_audio',
    ];

    try {
      await runtime.run(uv, args, outDir);

      const outFile = path.join(outDir, 'out.wav');
      if (!existsSync(outFile)) {
        throw new MlxAudioLocalUnavailableError(
          'TTS_MLX_AUDIO_UNAVAILABLE: synthesis produced no output file',
        );
      }

      const data = new Uint8Array(readFileSync(outFile));
      return { data, mimeType: 'audio/wav' };
    } finally {
      await rm(outDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
