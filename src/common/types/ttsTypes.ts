/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type TextToSpeechProvider = 'kokoro-local' | 'system-native';

export type TextToSpeechConfig = {
  enabled: boolean;
  provider: TextToSpeechProvider;
  voice: string;
  speed: number; // 0.5–2.0
  autoReadResponses: boolean;
};

export const DEFAULT_TTS_CONFIG: TextToSpeechConfig = {
  enabled: false,
  provider: 'kokoro-local',
  voice: 'default',
  speed: 1.0,
  autoReadResponses: false,
};

/** Merges supplied config over defaults so old/absent configs upgrade cleanly. */
export const normalizeTextToSpeechConfig = (config?: Partial<TextToSpeechConfig>): TextToSpeechConfig => ({
  ...DEFAULT_TTS_CONFIG,
  ...config,
});

/** Audio bytes returned from any TTS synthesis call. */
export type TextToSpeechAudio = {
  /** Raw PCM / encoded audio data. */
  data: Uint8Array;
  /** MIME type of the audio, e.g. 'audio/wav'. */
  mimeType: string;
};
