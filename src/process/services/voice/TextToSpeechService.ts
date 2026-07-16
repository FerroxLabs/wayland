/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { getPlatformServices } from '@/common/platform';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readConnectedProviderKey } from '@process/connectors/providerKey';
import { KokoroLocal, type KokoroLocalRuntime } from '@process/services/voice/KokoroLocal';

const execFileAsync = promisify(execFile);
const DEFAULT_OPENAI_TTS_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_OPENAI_TTS_VOICE = 'marin';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

export const buildSystemNativeSayArgs = (text: string, config: TextToSpeechConfig): string[] => {
  const rate = Math.round(config.speed * 175);
  return [
    '-r',
    String(rate),
    ...(config.voice && config.voice !== 'default' ? ['-v', config.voice] : []),
    '--output-file=/dev/stdout',
    '--data-format=aiff',
    text,
  ];
};

export class TextToSpeechUnavailableError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(code + ': ' + message);
    this.name = 'TextToSpeechUnavailableError';
    this.code = code;
  }
}

export type OpenAITtsRuntime = {
  resolveApiKey: () => Promise<string | undefined>;
  fetch: (input: string, init: RequestInit) => Promise<Response>;
};

export const defaultOpenAITtsRuntime: OpenAITtsRuntime = {
  resolveApiKey: () => readConnectedProviderKey('openai'),
  fetch: (input, init) => getPlatformServices().network.fetch(input, init),
};

export const synthesizeOpenAI = async (
  text: string,
  config: TextToSpeechConfig,
  runtime: OpenAITtsRuntime = defaultOpenAITtsRuntime
): Promise<TextToSpeechAudio> => {
  const apiKey = await runtime.resolveApiKey();
  if (!apiKey) {
    throw new TextToSpeechUnavailableError(
      'TTS_OPENAI_NOT_CONFIGURED',
      'connect OpenAI in Models and Providers before selecting OpenAI speech'
    );
  }

  const response = await runtime.fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_OPENAI_TTS_MODEL,
      input: text.slice(0, 4096),
      voice: config.voice === 'default' ? DEFAULT_OPENAI_TTS_VOICE : config.voice,
      response_format: 'mp3',
      speed: config.speed,
    }),
  });

  if (!response.ok) {
    const code =
      response.status === 401
        ? 'TTS_OPENAI_AUTH_ERROR'
        : response.status === 429
          ? 'TTS_OPENAI_RATE_LIMITED'
          : 'TTS_OPENAI_REQUEST_FAILED';
    throw new TextToSpeechUnavailableError(code, `OpenAI speech request failed with HTTP ${response.status}`);
  }

  return { data: new Uint8Array(await response.arrayBuffer()), mimeType: 'audio/mpeg' };
};

/**
 * Synthesizes speech via the macOS `say` command, capturing audio output.
 * Zero-download fallback - available on every macOS install.
 */
const synthesizeSystemNative = async (text: string, config: TextToSpeechConfig): Promise<TextToSpeechAudio> => {
  // `say` writes AIFF to stdout when given `-o /dev/stdout --data-format=aiff`.
  if (process.platform === 'darwin') {
    const args = buildSystemNativeSayArgs(text, config);
    const { stdout } = await execFileAsync('say', args, {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    });
    return { data: new Uint8Array(stdout), mimeType: 'audio/aiff' };
  }

  throw new TextToSpeechUnavailableError(
    'TTS_SYSTEM_NATIVE_UNAVAILABLE',
    'system-native speech is available only on macOS'
  );
};

/**
 * Routes synthesis requests to the appropriate backend based on `config.provider`.
 *
 * - `'kokoro-local'`  → KokoroLocal (offline ONNX; unavailable until its runtime is installed)
 * - `'system-native'` → macOS `say` command (zero-download fallback)
 * - `'openai'`        → OpenAI speech using the connected provider credential
 *
 * @param text   Plain text to synthesize.
 * @param config TTS configuration (provider, voice, speed, …).
 * @param kokoroRuntime Injectable seam for unit tests; defaults to production runtime.
 */
export const synthesize = async (
  text: string,
  config: TextToSpeechConfig,
  kokoroRuntime?: KokoroLocalRuntime,
  openAIRuntime?: OpenAITtsRuntime
): Promise<TextToSpeechAudio> => {
  switch (config.provider) {
    case 'kokoro-local':
      return KokoroLocal.synthesize(text, config, kokoroRuntime);
    case 'system-native':
      return synthesizeSystemNative(text, config);
    case 'openai':
      return synthesizeOpenAI(text, config, openAIRuntime);
  }
};
