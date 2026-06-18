/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type TextToSpeechProvider = 'kokoro-local' | 'mlx-audio-local' | 'piper-local' | 'system-native';

export type TtsEngineSettings = { voice?: string; speed?: number };

export type TextToSpeechConfig = {
  enabled: boolean;
  /** v1 field - kept for back-compat reads; v2 authority is `chain`+`engines`. */
  provider: TextToSpeechProvider;
  /** v1 field - kept for back-compat reads. */
  voice: string;
  speed: number; // 0.5–2.0
  /** v1 field - superseded by autoReadDefault but still written by old builds. */
  autoReadResponses: boolean;
  /** System-wide default for reading replies aloud (per-chat override lives on the conversation). */
  autoReadDefault: boolean;
  /** Ordered engine preference; the chain runner walks this list. */
  chain: TextToSpeechProvider[];
  /** Per-engine settings keyed by engine id. */
  engines: Partial<Record<TextToSpeechProvider, TtsEngineSettings>>;
};

export const KOKORO_DEFAULT_VOICE_ID = 'af_sky';

export const DEFAULT_TTS_CONFIG: TextToSpeechConfig = {
  enabled: false,
  provider: 'kokoro-local',
  voice: KOKORO_DEFAULT_VOICE_ID,
  speed: 1.0,
  autoReadResponses: false,
  autoReadDefault: false,
  chain: ['kokoro-local', 'system-native'],
  engines: { 'kokoro-local': { voice: KOKORO_DEFAULT_VOICE_ID, speed: 1.0 } },
};

/**
 * Merges supplied config over defaults AND migrates v1 shapes
 * ({provider, voice, speed, autoReadResponses}) to v2 chains. Old installs
 * upgrade silently; v2 configs pass through.
 */
export const normalizeTextToSpeechConfig = (config?: Partial<TextToSpeechConfig>): TextToSpeechConfig => {
  const merged: TextToSpeechConfig = { ...DEFAULT_TTS_CONFIG, ...config };
  const isV1 = !config?.chain || config.chain.length === 0;
  if (isV1) {
    const provider = merged.provider ?? 'kokoro-local';
    const voice =
      merged.voice && merged.voice !== 'default'
        ? merged.voice
        : provider === 'kokoro-local'
          ? KOKORO_DEFAULT_VOICE_ID
          : merged.voice;
    merged.chain = provider === 'system-native' ? ['system-native'] : [provider, 'system-native'];
    merged.engines = { [provider]: { voice, speed: merged.speed ?? 1.0 } };
    merged.autoReadDefault = Boolean(merged.autoReadResponses);
  }
  return merged;
};

/** Audio bytes returned from any TTS synthesis call. */
export type TextToSpeechAudio = {
  /** Raw PCM / encoded audio data. */
  data: Uint8Array;
  /** MIME type of the audio, e.g. 'audio/wav'. */
  mimeType: string;
};
