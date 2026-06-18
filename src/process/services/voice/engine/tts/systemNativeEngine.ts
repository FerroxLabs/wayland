/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { TtsEngine } from '../types';

const execFileAsync = promisify(execFile);

/**
 * Synthesizes speech via the macOS `say` command, capturing audio output.
 * Zero-download fallback - available on every macOS install.
 *
 * Writes WAV to a temp file: `say` cannot emit AIFF to stdout (the old
 * `--data-format=aiff` form is rejected as an invalid PCM specifier), and
 * Chromium cannot play AIFF anyway - 16-bit WAV is the one container both
 * `say` and the renderer agree on. Shell-proven form:
 *   say -r 175 -o out.wav --file-format=WAVE --data-format=LEI16@22050 "text"
 */
export const synthesizeSystemNative = async (text: string, config: TextToSpeechConfig): Promise<TextToSpeechAudio> => {
  if (process.platform === 'darwin') {
    const rate = Math.round(config.speed * 175); // macOS default ~175 wpm
    const outDir = await mkdtemp(path.join(tmpdir(), 'wayland-say-'));
    const outFile = path.join(outDir, 'out.wav');
    try {
      await execFileAsync('say', [
        '-r', String(rate),
        '-o', outFile,
        '--file-format=WAVE',
        '--data-format=LEI16@22050',
        text,
      ], { timeout: 60_000 });
      return { data: new Uint8Array(readFileSync(outFile)), mimeType: 'audio/wav' };
    } finally {
      await rm(outDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  // Non-macOS: return empty audio so callers don't crash; voice settings UI
  // should gate system-native to macOS only.
  return { data: new Uint8Array(0), mimeType: 'audio/wav' };
};

export const createSystemNativeEngine = (): TtsEngine => ({
  id: 'system-native',
  local: true,
  streaming: false,
  available: async () => ({ ok: true }), // zero-install floor on every platform (renderer speechSynthesis path)
  voices: async () => [{ id: 'default', label: 'System default' }],
  synthesize: async (text, opts, onChunk) => {
    const audio = await synthesizeSystemNative(text, { speed: opts.speed ?? 1.0 } as Parameters<typeof synthesizeSystemNative>[1]);
    onChunk({ data: audio.data, mimeType: audio.mimeType, seq: 0, final: true });
  },
});
