/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MlxAudioLocal,
  MLX_AUDIO_DEFAULT_MODEL,
  defaultMlxAudioLocalRuntime,
  type MlxAudioLocalRuntime,
} from '@process/services/voice/MlxAudioLocal';
import { existsSync } from 'node:fs';
import { getBinaryPath } from '@process/services/voice/voiceBinaryManifest';
import type { TtsEngine } from '../types';

export const createMlxAudioEngine = (runtime: MlxAudioLocalRuntime = defaultMlxAudioLocalRuntime): TtsEngine => ({
  id: 'mlx-audio-local',
  local: true,
  streaming: false,
  available: async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') {
      return { ok: false, reason: 'mlx-audio requires Apple Silicon (darwin/arm64)' };
    }
    const uv = getBinaryPath('uv-runtime');
    if (!uv || !existsSync(uv)) return { ok: false, reason: 'uv runtime not installed' };
    return { ok: true };
  },
  voices: async () => [{ id: MLX_AUDIO_DEFAULT_MODEL, label: 'F5-TTS (default)' }],
  synthesize: async (text, opts, onChunk) => {
    const audio = await MlxAudioLocal.synthesize(
      text,
      { voice: opts.voice ?? MLX_AUDIO_DEFAULT_MODEL, speed: opts.speed ?? 1.0 } as Parameters<typeof MlxAudioLocal.synthesize>[1],
      runtime,
    );
    onChunk({ data: audio.data, mimeType: audio.mimeType, seq: 0, final: true });
  },
});
