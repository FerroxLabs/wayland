/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { KokoroLocal, type KokoroLocalRuntime } from '@process/services/voice/KokoroLocal';

const execFileAsync = promisify(execFile);

/**
 * Synthesizes speech via the macOS `say` command, capturing audio output.
 * Zero-download fallback - available on every macOS install.
 */
const synthesizeSystemNative = async (text: string, config: TextToSpeechConfig): Promise<TextToSpeechAudio> => {
  // `say` writes AIFF to stdout when given `-o /dev/stdout --data-format=aiff`
  // but that only works on macOS. On other platforms we return silent empty audio
  // rather than crashing - this is a best-effort fallback.
  if (process.platform === 'darwin') {
    const rate = Math.round(config.speed * 175); // macOS default ~175 wpm
    const args = ['-r', String(rate), '--output-file=/dev/stdout', '--data-format=aiff', text];
    const { stdout } = await execFileAsync('say', args, {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    });
    return { data: new Uint8Array(stdout), mimeType: 'audio/aiff' };
  }

  // Non-macOS: return empty audio so callers don't crash; voice settings UI
  // should gate system-native to macOS only.
  return { data: new Uint8Array(0), mimeType: 'audio/wav' };
};

/**
 * Routes synthesis requests to the appropriate backend based on `config.provider`.
 *
 * - `'kokoro-local'`  → KokoroLocal (offline ONNX, opt-in download via task D2)
 * - `'system-native'` → macOS `say` command (zero-download fallback)
 *
 * @param text   Plain text to synthesize.
 * @param config TTS configuration (provider, voice, speed, …).
 * @param kokoroRuntime Injectable seam for unit tests; defaults to production runtime.
 */
export const synthesize = async (
  text: string,
  config: TextToSpeechConfig,
  kokoroRuntime?: KokoroLocalRuntime,
): Promise<TextToSpeechAudio> => {
  switch (config.provider) {
    case 'kokoro-local':
      return KokoroLocal.synthesize(text, config, kokoroRuntime);
    case 'system-native':
      return synthesizeSystemNative(text, config);
  }
};
