/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const TEXT_TO_SPEECH_PROVIDERS = ['system-native', 'openai', 'kokoro-local'] as const;
export type TextToSpeechProvider = (typeof TEXT_TO_SPEECH_PROVIDERS)[number];

export const isTextToSpeechProvider = (value: unknown): value is TextToSpeechProvider =>
  typeof value === 'string' && TEXT_TO_SPEECH_PROVIDERS.includes(value as TextToSpeechProvider);

export type TextToSpeechConfig = {
  enabled: boolean;
  provider: TextToSpeechProvider;
  voice: string;
  speed: number; // 0.5–2.0
  autoReadResponses: boolean;
  model?: string;
};

export const DEFAULT_TTS_CONFIG: TextToSpeechConfig = {
  enabled: false,
  provider: 'system-native',
  voice: 'default',
  speed: 1.0,
  autoReadResponses: false,
};

/**
 * Runtime normalization is intentionally stricter than the TypeScript type.
 * Older builds could persist unsupported hosted provider names through a cast;
 * those values must fall back to a provider the synthesizer actually owns.
 */
export const normalizeTextToSpeechConfig = (config?: Partial<TextToSpeechConfig>): TextToSpeechConfig => ({
  enabled: typeof config?.enabled === 'boolean' ? config.enabled : DEFAULT_TTS_CONFIG.enabled,
  provider: isTextToSpeechProvider(config?.provider) ? config.provider : DEFAULT_TTS_CONFIG.provider,
  voice:
    typeof config?.voice === 'string' && config.voice.trim()
      ? config.voice.trim().slice(0, 128)
      : DEFAULT_TTS_CONFIG.voice,
  speed:
    typeof config?.speed === 'number' && Number.isFinite(config.speed)
      ? Math.min(2, Math.max(0.5, config.speed))
      : DEFAULT_TTS_CONFIG.speed,
  autoReadResponses:
    typeof config?.autoReadResponses === 'boolean' ? config.autoReadResponses : DEFAULT_TTS_CONFIG.autoReadResponses,
  model:
    typeof config?.model === 'string' && config.model.trim()
      ? config.model.trim().slice(0, 128)
      : DEFAULT_TTS_CONFIG.model,
});

/** Audio bytes returned from any TTS synthesis call. */
export type TextToSpeechAudio = {
  /** Raw PCM / encoded audio data. */
  data: Uint8Array;
  /** MIME type of the audio, e.g. 'audio/wav'. */
  mimeType: string;
};

export type TextToSpeechBridgeResult =
  | {
      ok: true;
      data: number[];
      mimeType: string;
    }
  | {
      ok: false;
      errorCode:
        | 'TTS_KOKORO_LOCAL_UNAVAILABLE'
        | 'TTS_SYSTEM_NATIVE_UNAVAILABLE'
        | 'TTS_OPENAI_NOT_CONFIGURED'
        | 'TTS_OPENAI_AUTH_ERROR'
        | 'TTS_OPENAI_RATE_LIMITED'
        | 'TTS_OPENAI_REQUEST_FAILED'
        | 'TTS_SYNTHESIS_FAILED';
    };
