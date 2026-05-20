/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SpeechToTextAudioBuffer,
  SpeechToTextRequest,
  SpeechToTextResult,
  WhisperLocalSpeechToTextConfig,
} from '@/common/types/speech';
import { acquireBinary } from '@process/services/voice/voiceBinaryManifest';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_WHISPER_LOCAL_MODEL = 'base';

/**
 * Thrown when the whisper.cpp binary or model is not installed. The STT service
 * surfaces this as a normal coded error — it never crashes the process.
 */
export class WhisperLocalUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhisperLocalUnavailableError';
  }
}

/**
 * On-disk locations for the local whisper runtime. Task D2 (runtime binary
 * acquisition) downloads the binary and models into these exact paths.
 */
export const WHISPER_BIN_DIR = path.join(homedir(), '.wayland', 'voice', 'bin', `${process.platform}-${process.arch}`);
export const WHISPER_MODEL_DIR = path.join(homedir(), '.wayland', 'voice', 'models');

const WHISPER_BINARY_NAME = process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli';

/**
 * Injectable runtime seam. Production wires it to the filesystem and a real
 * subprocess; unit tests substitute fakes so no binary is required. Task D2
 * adds `acquireBinary` — an optional async hook that downloads the binary when
 * it is not yet cached; when absent the provider hard-disables on missing binary.
 */
export type WhisperLocalRuntime = {
  /** Absolute path to the whisper.cpp binary, or null when not installed. */
  resolveBinary: () => string | null;
  /** Absolute path to the model file, or null when not installed. */
  resolveModel: (model: string) => string | null;
  /** Run the binary; resolves the captured stdout. */
  run: (binary: string, args: string[]) => Promise<string>;
  /** Persist the request audio to a temp file; returns the path and a cleanup fn. */
  stageAudio: (request: SpeechToTextRequest) => Promise<{ filePath: string; cleanup: () => Promise<void> }>;
  /**
   * Optional: download the binary on demand. When provided and `resolveBinary`
   * returns null, `transcribe` calls this to attempt acquisition before giving up.
   * If acquisition fails the error is caught and re-thrown as WhisperLocalUnavailableError.
   * Unit tests omit this member to test the hard-disable path without network access.
   */
  acquireBinary?: () => Promise<string>;
};

const toBuffer = (audioBuffer: SpeechToTextAudioBuffer): Buffer => {
  if (audioBuffer instanceof Uint8Array) {
    return Buffer.from(audioBuffer);
  }
  if (Array.isArray(audioBuffer)) {
    return Buffer.from(audioBuffer);
  }
  const ordered = Object.keys(audioBuffer)
    .filter((key) => /^\d+$/.test(key))
    .toSorted((a, b) => Number(a) - Number(b))
    .map((key) => audioBuffer[key] ?? 0);
  return Buffer.from(ordered);
};

export const defaultWhisperLocalRuntime: WhisperLocalRuntime = {
  resolveBinary: () => {
    const binaryPath = path.join(WHISPER_BIN_DIR, WHISPER_BINARY_NAME);
    return existsSync(binaryPath) ? binaryPath : null;
  },
  acquireBinary: () => acquireBinary('whisper-cpp'),
  resolveModel: (model) => {
    const modelPath = path.join(WHISPER_MODEL_DIR, `ggml-${model}.bin`);
    return existsSync(modelPath) ? modelPath : null;
  },
  run: async (binary, args) => {
    const { stdout } = await execFileAsync(binary, args, { maxBuffer: 32 * 1024 * 1024 });
    return stdout;
  },
  stageAudio: async (request) => {
    const dir = await mkdtemp(path.join(tmpdir(), 'wayland-whisper-'));
    const filePath = path.join(dir, request.fileName || 'audio.wav');
    await writeFile(filePath, toBuffer(request.audioBuffer));
    return {
      filePath,
      cleanup: () => rm(dir, { recursive: true, force: true }),
    };
  },
};

/** whisper.cpp stdout (plain text under `-nt`) collapsed into a single line. */
const parseTranscript = (stdout: string): string =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .trim();

/**
 * Local, offline speech-to-text via a whisper.cpp binary. No API key. When the
 * binary or model is missing the provider hard-disables itself by throwing
 * WhisperLocalUnavailableError, which the caller surfaces as a user message.
 */
export class WhisperLocal {
  static async transcribe(
    request: SpeechToTextRequest,
    config: WhisperLocalSpeechToTextConfig,
    runtime: WhisperLocalRuntime = defaultWhisperLocalRuntime
  ): Promise<SpeechToTextResult> {
    const model = config.model || DEFAULT_WHISPER_LOCAL_MODEL;

    let binary = runtime.resolveBinary();
    if (!binary) {
      if (runtime.acquireBinary) {
        try {
          binary = await runtime.acquireBinary();
        } catch {
          throw new WhisperLocalUnavailableError(
            'STT_WHISPER_LOCAL_UNAVAILABLE: whisper.cpp binary could not be acquired',
          );
        }
      }
      if (!binary) {
        throw new WhisperLocalUnavailableError(
          'STT_WHISPER_LOCAL_UNAVAILABLE: whisper.cpp binary is not installed',
        );
      }
    }
    const modelPath = runtime.resolveModel(model);
    if (!modelPath) {
      throw new WhisperLocalUnavailableError(
        `STT_WHISPER_LOCAL_UNAVAILABLE: whisper model "${model}" is not installed`
      );
    }

    const { filePath, cleanup } = await runtime.stageAudio(request);
    try {
      const language = request.languageHint || config.language;
      const args = ['-m', modelPath, '-f', filePath, '-nt'];
      if (language) {
        // whisper.cpp expects ISO 639-1 (e.g. "en"), not BCP 47 (e.g. "en-us").
        args.push('-l', language.split('-')[0].toLowerCase());
      }
      const stdout = await runtime.run(binary, args);
      return {
        language,
        model,
        provider: 'whisper-local',
        text: parseTranscript(stdout),
      };
    } finally {
      try {
        await cleanup();
      } catch {
        // Best-effort cleanup — never mask the original result or error.
      }
    }
  }
}
