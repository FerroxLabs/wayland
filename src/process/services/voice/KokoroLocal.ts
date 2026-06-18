/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { getPlatformServices } from '@/common/platform';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getBinaryPath } from '@process/services/voice/voiceBinaryManifest';

const execFileAsync = promisify(execFile);

export const KOKORO_DEFAULT_VOICE = 'af_sky';

export class KokoroLocalUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KokoroLocalUnavailableError';
  }
}

/** Returns the absolute path where the Kokoro ONNX model is expected on disk. */
export const getKokoroModelPath = (): string =>
  path.join(getPlatformServices().paths.getDataDir(), 'voice', 'kokoro', 'kokoro-v1.0.onnx');

/** Returns the absolute path where the Kokoro voice embeddings file is expected on disk. */
export const getKokoroVoicesPath = (): string =>
  path.join(getPlatformServices().paths.getDataDir(), 'voice', 'kokoro', 'voices-v1.0.bin');

export type KokoroLocalRuntime = {
  resolveUv: () => string | null;
  resolveModel: () => string | null;
  resolveVoices: () => string | null;
  run: (uv: string, args: string[], cwd: string) => Promise<void>;
};

export const defaultKokoroLocalRuntime: KokoroLocalRuntime = {
  resolveUv: () => {
    const p = getBinaryPath('uv-runtime');
    return p && existsSync(p) ? p : null;
  },
  resolveModel: () => {
    const p = getKokoroModelPath();
    return existsSync(p) ? p : null;
  },
  resolveVoices: () => {
    const p = getKokoroVoicesPath();
    return existsSync(p) ? p : null;
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

// Inline Python script: accepts positional args (model voices text voice speed outfile)
// and writes 16-bit PCM WAV via the stdlib `wave` module. kokoro-onnx does NOT
// bundle soundfile, so the float samples are converted with numpy (which it does
// bundle) - this keeps synthesis dependency-free beyond the package itself.
const SYNTH_SCRIPT = [
  'from kokoro_onnx import Kokoro',
  'import numpy as np, wave, sys',
  'samples, sr = Kokoro(sys.argv[1], sys.argv[2]).create(',
  '  sys.argv[3], voice=sys.argv[4], speed=float(sys.argv[5]))',
  'pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2")',
  'w = wave.open(sys.argv[6], "wb")',
  'w.setnchannels(1)',
  'w.setsampwidth(2)',
  'w.setframerate(sr)',
  'w.writeframes(pcm.tobytes())',
  'w.close()',
].join('\n');

/**
 * Local, offline TTS via the kokoro-onnx Python package.
 * Requires:
 *   1. The uv runtime binary (downloaded via Settings › Tools)
 *   2. `uv tool install kokoro-onnx` (via Settings › Tools)
 *   3. The ONNX model file (kokoro-v1.0.onnx) downloaded via Settings › Tools
 *   4. The voice embeddings file (voices-v1.0.bin) downloaded via Settings › Tools
 *
 * `config.voice` is a kokoro voice name (e.g. "af_sky", "bf_emma").
 * Defaults to KOKORO_DEFAULT_VOICE when unset.
 */
export class KokoroLocal {
  static async synthesize(
    text: string,
    config: TextToSpeechConfig,
    runtime: KokoroLocalRuntime = defaultKokoroLocalRuntime,
  ): Promise<TextToSpeechAudio> {
    const uv = runtime.resolveUv();
    if (!uv) {
      throw new KokoroLocalUnavailableError(
        'TTS_KOKORO_LOCAL_UNAVAILABLE: uv runtime not installed. Use Settings › Tools to download it.',
      );
    }

    const modelPath = runtime.resolveModel();
    if (!modelPath) {
      throw new KokoroLocalUnavailableError(
        'TTS_KOKORO_LOCAL_UNAVAILABLE: Kokoro ONNX model not downloaded. Use Settings › Tools to download it.',
      );
    }

    const voicesPath = runtime.resolveVoices();
    if (!voicesPath) {
      throw new KokoroLocalUnavailableError(
        'TTS_KOKORO_LOCAL_UNAVAILABLE: Kokoro voice embeddings not downloaded. Use Settings › Tools to download them.',
      );
    }

    const voice = config.voice?.trim() || KOKORO_DEFAULT_VOICE;
    const outDir = await mkdtemp(path.join(tmpdir(), 'wayland-tts-'));
    const outFile = path.join(outDir, 'out.wav');

    // --prerelease=allow matches voiceAssetBridge's uvInstall/uvStatus flags so
    // synthesis resolves the exact environment the install step pre-warmed,
    // instead of re-resolving (and re-downloading) a different one.
    const args = [
      'run', '--with', 'kokoro-onnx', '--prerelease=allow',
      'python', '-c', SYNTH_SCRIPT,
      modelPath, voicesPath, text, voice, String(config.speed ?? 1.0), outFile,
    ];

    try {
      await runtime.run(uv, args, outDir);

      if (!existsSync(outFile)) {
        throw new KokoroLocalUnavailableError(
          'TTS_KOKORO_LOCAL_UNAVAILABLE: synthesis produced no output file',
        );
      }

      const data = new Uint8Array(readFileSync(outFile));
      return { data, mimeType: 'audio/wav' };
    } finally {
      await rm(outDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
