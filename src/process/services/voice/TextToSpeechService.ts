/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';
import { getPlatformServices } from '@/common/platform';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { readConnectedProviderKeyResult, type ConnectedProviderKeyResult } from '@process/connectors/providerKey';
import { synthesizeWindowsNative, type WindowsNativeTtsRuntime } from '@process/services/voice/WindowsNativeTts';
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

/**
 * `say` needs a *seekable* sink and a container/PCM pair it actually understands.
 * `--data-format=aiff` was never a valid PCM specifier ("The format 'aiff' is
 * unknown or an unparseable PCM format specifier") and `/dev/stdout` fails with
 * CoreAudio `-54` for every container, so the previous invocation could never
 * produce a byte. WAVE + LEI16@22050 writes a real RIFF/WAVE file that Chromium
 * decodes natively, which is what the renderer's `<audio>` element needs to ever
 * reach its `ended` event.
 */
export const buildSystemNativeSayArgs = (text: string, config: TextToSpeechConfig, outputPath: string): string[] => {
  const rate = Math.round(config.speed * 175);
  return [
    '-r',
    String(rate),
    ...(config.voice && config.voice !== 'default' ? ['-v', config.voice] : []),
    '-o',
    outputPath,
    '--file-format=WAVE',
    '--data-format=LEI16@22050',
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
  /**
   * Optional richer form of `resolveApiKey`. When present it is preferred,
   * because it can tell "no OpenAI connected" apart from "OpenAI is connected
   * but its stored credential cannot be decrypted on this machine" - two
   * conditions with completely different fixes that used to produce the same
   * "go connect OpenAI" message. Optional so existing test runtimes that only
   * stub `resolveApiKey` keep working unchanged.
   */
  resolveApiKeyResult?: () => Promise<ConnectedProviderKeyResult>;
  fetch: (input: string, init: RequestInit) => Promise<Response>;
};

export const defaultOpenAITtsRuntime: OpenAITtsRuntime = {
  resolveApiKey: async () => {
    const result = await readConnectedProviderKeyResult('openai');
    return result.status === 'ok' ? result.key : undefined;
  },
  resolveApiKeyResult: () => readConnectedProviderKeyResult('openai'),
  fetch: (input, init) => getPlatformServices().network.fetch(input, init),
};

/**
 * Turns a credential-read outcome into the coded error the user will actually
 * read. Every branch names a cause and implies a different next action, which
 * is the whole point: a silent or misattributed failure here is indistinguishable
 * from "the Test voice button does nothing".
 */
const openAiCredentialError = (result: ConnectedProviderKeyResult): TextToSpeechUnavailableError | null => {
  switch (result.status) {
    case 'ok':
      return null;
    case 'undecryptable':
      return new TextToSpeechUnavailableError(
        'TTS_OPENAI_CREDENTIAL_UNREADABLE',
        'OpenAI is connected but its saved credential cannot be decrypted on this machine; re-enter the key in Models and Providers'
      );
    case 'error':
      return new TextToSpeechUnavailableError(
        'TTS_CREDENTIAL_STORE_UNAVAILABLE',
        `the credential store could not be read: ${result.message}`
      );
    default:
      return new TextToSpeechUnavailableError(
        'TTS_OPENAI_NOT_CONFIGURED',
        'connect OpenAI in Models and Providers before selecting OpenAI speech'
      );
  }
};

export const synthesizeOpenAI = async (
  text: string,
  config: TextToSpeechConfig,
  runtime: OpenAITtsRuntime = defaultOpenAITtsRuntime
): Promise<TextToSpeechAudio> => {
  const credential: ConnectedProviderKeyResult = runtime.resolveApiKeyResult
    ? await runtime.resolveApiKeyResult()
    : await (async () => {
        const key = await runtime.resolveApiKey();
        return key ? ({ status: 'ok', key } as const) : ({ status: 'not-connected' } as const);
      })();

  const credentialError = openAiCredentialError(credential);
  if (credentialError) throw credentialError;
  const apiKey = (credential as { status: 'ok'; key: string }).key;

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
  if (process.platform !== 'darwin') {
    throw new TextToSpeechUnavailableError(
      'TTS_SYSTEM_NATIVE_UNAVAILABLE',
      'system-native speech is available only on macOS'
    );
  }

  // `say` cannot stream to a pipe, so synthesis goes through a private temp file
  // that is removed on every exit path (including the throw path).
  const directory = await mkdtemp(join(tmpdir(), 'wayland-tts-'));
  const outputPath = join(directory, 'speech.wav');
  try {
    await execFileAsync('say', buildSystemNativeSayArgs(text, config, outputPath), {
      encoding: 'buffer',
      maxBuffer: 1024 * 1024,
    });
    return { data: new Uint8Array(await readFile(outputPath)), mimeType: 'audio/wav' };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

/** Injectable runtimes threaded to whichever adapter a turn resolves to. */
export type TextToSpeechRuntimes = {
  windowsNative?: WindowsNativeTtsRuntime;
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
    provider: 'system-native',
    onDevice: true,
    synthesize: (text, config) => synthesizeSystemNative(text, config),
  })
  .register({
    provider: 'windows-native',
    onDevice: true,
    synthesize: (text, config, runtimes) => synthesizeWindowsNative(text, config, runtimes.windowsNative),
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
 * - `'system-native'`  → macOS `say` command (zero-download fallback)
 * - `'windows-native'` → Windows System.Speech via PowerShell (zero-download fallback)
 * - `'openai'`         → OpenAI speech using the connected provider credential
 *
 * @param text   Plain text to synthesize.
 * @param config TTS configuration (provider, voice, speed, …).
 * @param windowsNativeRuntime Injectable seam for unit tests; defaults to production runtime.
 */
export const synthesize = async (
  text: string,
  config: TextToSpeechConfig,
  windowsNativeRuntime?: WindowsNativeTtsRuntime,
  openAIRuntime?: OpenAITtsRuntime
): Promise<TextToSpeechAudio> => {
  const { audio } = await synthesizeTurn(text, config, {
    windowsNative: windowsNativeRuntime,
    openai: openAIRuntime,
  });
  return audio;
};
