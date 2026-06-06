/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { acquireBinary } from '@process/services/voice/voiceBinaryManifest';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Thrown when the Kokoro ONNX binary or model is not installed. The TTS service
 * surfaces this as a normal coded error - it never crashes the process.
 */
export class KokoroLocalUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KokoroLocalUnavailableError';
  }
}

/**
 * On-disk locations for the local Kokoro runtime. Task D2 (runtime binary
 * acquisition) downloads the binary and models into these exact paths.
 */
export const KOKORO_BIN_DIR = path.join(
  homedir(),
  '.wayland',
  'voice',
  'bin',
  `${process.platform}-${process.arch}`,
);
export const KOKORO_MODEL_DIR = path.join(homedir(), '.wayland', 'voice', 'kokoro-models');

const KOKORO_BINARY_NAME = process.platform === 'win32' ? 'kokoro-cli.exe' : 'kokoro-cli';

/**
 * Injectable runtime seam. Production wires it to the filesystem and a real
 * subprocess; unit tests substitute fakes so no binary is required. Task D2
 * adds `acquireBinary` - an optional async hook that downloads the binary when
 * it is not yet cached; when absent the provider hard-disables on missing binary.
 */
export type KokoroLocalRuntime = {
  /** Absolute path to the kokoro-cli binary, or null when not installed. */
  resolveBinary: () => string | null;
  /** Absolute path to the ONNX model file, or null when not installed. */
  resolveModel: (voice: string) => string | null;
  /** Run the binary; resolves raw audio bytes (WAV). */
  run: (binary: string, args: string[]) => Promise<Uint8Array>;
  /**
   * Optional: download the binary on demand. When provided and `resolveBinary`
   * returns null, `synthesize` calls this to attempt acquisition before giving up.
   * If acquisition fails the error is caught and re-thrown as KokoroLocalUnavailableError.
   * Unit tests omit this member to test the hard-disable path without network access.
   */
  acquireBinary?: () => Promise<string>;
};

export const defaultKokoroLocalRuntime: KokoroLocalRuntime = {
  resolveBinary: () => {
    const binaryPath = path.join(KOKORO_BIN_DIR, KOKORO_BINARY_NAME);
    return existsSync(binaryPath) ? binaryPath : null;
  },
  acquireBinary: () => acquireBinary('onnx-runtime'),
  resolveModel: (voice) => {
    const modelPath = path.join(KOKORO_MODEL_DIR, `${voice}.onnx`);
    return existsSync(modelPath) ? modelPath : null;
  },
  run: async (binary, args) => {
    const { stdout } = await execFileAsync(binary, args, {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    });
    return new Uint8Array(stdout);
  },
};

/**
 * Local, offline text-to-speech via a Kokoro ONNX binary. No API key. When
 * the binary or model is missing the provider hard-disables itself by throwing
 * KokoroLocalUnavailableError, which the caller surfaces as a user message.
 */
export class KokoroLocal {
  static async synthesize(
    text: string,
    config: TextToSpeechConfig,
    runtime: KokoroLocalRuntime = defaultKokoroLocalRuntime,
  ): Promise<TextToSpeechAudio> {
    let binary = runtime.resolveBinary();
    if (!binary) {
      if (runtime.acquireBinary) {
        try {
          binary = await runtime.acquireBinary();
        } catch {
          throw new KokoroLocalUnavailableError(
            'TTS_KOKORO_LOCAL_UNAVAILABLE: kokoro-cli binary could not be acquired',
          );
        }
      }
      if (!binary) {
        throw new KokoroLocalUnavailableError(
          'TTS_KOKORO_LOCAL_UNAVAILABLE: kokoro-cli binary is not installed',
        );
      }
    }

    const voice = config.voice || 'default';
    const modelPath = runtime.resolveModel(voice);
    if (!modelPath) {
      throw new KokoroLocalUnavailableError(
        `TTS_KOKORO_LOCAL_UNAVAILABLE: Kokoro voice model "${voice}" is not installed`,
      );
    }

    const args = ['--model', modelPath, '--voice', voice, '--speed', String(config.speed), '--text', text];

    const data = await runtime.run(binary, args);
    return { data, mimeType: 'audio/wav' };
  }
}
