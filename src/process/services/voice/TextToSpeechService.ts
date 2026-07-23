/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';
import { getPlatformServices } from '@/common/platform';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readConnectedProviderKey } from '@process/connectors/providerKey';
import { KokoroLocal, type KokoroLocalRuntime } from '@process/services/voice/KokoroLocal';
import { VoiceAdapterRegistry, type VoiceAdapter } from '@/common/voice/adapterRegistry';
import type { VoiceReceipt } from '@/common/voice/voiceReceipt';
import { buildTtsTurnReceipt } from '@process/services/voice/voiceReceiptFactory';
import { mainLog } from '@process/utils/mainLogger';

const TTS_LOG_TAG = '[TextToSpeech]';

const createTtsTurnId = () => `tts-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;

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

/** Injectable runtimes threaded to whichever adapter a turn resolves to. */
export type TextToSpeechRuntimes = {
  kokoro?: KokoroLocalRuntime;
  openai?: OpenAITtsRuntime;
};

/**
 * VOC-04 speech adapter contract. A provider is registered against this contract
 * (see `textToSpeechRegistry`), never hard-coded into a switch. `onDevice`
 * feeds the VoiceReceipt cost derivation (on-device → estimated 0; hosted →
 * cost honestly unavailable).
 */
export interface TextToSpeechAdapter extends VoiceAdapter<TextToSpeechProvider> {
  readonly onDevice: boolean;
  synthesize(text: string, config: TextToSpeechConfig, runtimes: TextToSpeechRuntimes): Promise<TextToSpeechAudio>;
}

export const textToSpeechRegistry = new VoiceAdapterRegistry<TextToSpeechProvider, TextToSpeechAdapter>();

textToSpeechRegistry
  .register({
    provider: 'kokoro-local',
    onDevice: true,
    synthesize: (text, config, runtimes) => KokoroLocal.synthesize(text, config, runtimes.kokoro),
  })
  .register({
    provider: 'system-native',
    onDevice: true,
    synthesize: (text, config) => synthesizeSystemNative(text, config),
  })
  .register({
    provider: 'openai',
    onDevice: false,
    synthesize: (text, config, runtimes) => synthesizeOpenAI(text, config, runtimes.openai),
  });

/** The model/voice identity the desktop actually called, for the receipt. */
const resolveTtsModel = (config: TextToSpeechConfig): string => {
  if (config.provider === 'openai') {
    return config.model || DEFAULT_OPENAI_TTS_MODEL;
  }
  return `${config.provider}:${config.voice}`;
};

export type TextToSpeechTurn = {
  audio: TextToSpeechAudio;
  receipt: VoiceReceipt;
};

/**
 * Canonical text-to-speech turn. Resolves the provider adapter through the
 * registry, measures the observed boundary, and returns the audio together with
 * an authoritative VoiceReceipt — a turn cannot complete without emitting one.
 */
export const synthesizeTurn = async (
  text: string,
  config: TextToSpeechConfig,
  runtimes: TextToSpeechRuntimes = {}
): Promise<TextToSpeechTurn> => {
  const turnId = createTtsTurnId();
  const adapter = textToSpeechRegistry.resolve(config.provider);
  const startedAt = Date.now();
  const audio = await adapter.synthesize(text, config, runtimes);
  const completedAt = Date.now();

  const receipt = buildTtsTurnReceipt({
    turnId,
    provider: config.provider,
    model: resolveTtsModel(config),
    onDevice: adapter.onDevice,
    text,
    audio: audio.data,
    startedAt,
    completedAt,
    terminalState: 'completed',
  });

  mainLog(TTS_LOG_TAG, 'Synthesis turn completed', {
    turnId,
    provider: receipt.provider,
    model: receipt.model,
    durationMs: receipt.timing.durationMs,
    audioOutputBytes: receipt.usage.audioOutputBytes,
    terminalState: receipt.terminalState,
  });

  return { audio, receipt };
};

/**
 * Routes synthesis requests to the registered provider adapter and returns the
 * audio. Preserved signature for the IPC bridge; the receipt is emitted by the
 * underlying `synthesizeTurn`.
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
  const { audio } = await synthesizeTurn(text, config, { kokoro: kokoroRuntime, openai: openAIRuntime });
  return audio;
};
