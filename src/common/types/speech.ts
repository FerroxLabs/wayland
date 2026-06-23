/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeechToTextProvider = 'openai' | 'deepgram' | 'whisper-local' | 'flux-voice';

export type OpenAISpeechToTextConfig = {
  apiKey: string;
  baseUrl?: string;
  language?: string;
  model: string;
  prompt?: string;
  temperature?: number;
};

export type DeepgramSpeechToTextConfig = {
  apiKey: string;
  baseUrl?: string;
  detectLanguage?: boolean;
  language?: string;
  model: string;
  punctuate?: boolean;
  smartFormat?: boolean;
};

/**
 * Flux Voice STT config. Mirrors the OpenAI-compatible transcription shape Flux
 * Router exposes, but lives in its own block so the Flux key/model are scoped to
 * Flux rather than sharing the `openai` config. For backward compatibility a key
 * previously stored under `openai` still resolves (see SpeechToTextService).
 */
export type FluxSpeechToTextConfig = {
  apiKey: string;
  baseUrl?: string;
  language?: string;
  model: string;
  prompt?: string;
  temperature?: number;
};

export type WhisperLocalSpeechToTextConfig = {
  /** whisper.cpp model identifier, e.g. 'base', 'small'. The binary and model
   *  are acquired at runtime by VoiceAssetManager (task D2); absent until then. */
  model: string;
  language?: string;
};

export type SpeechToTextConfig = {
  autoSend?: boolean;
  enabled: boolean;
  provider: SpeechToTextProvider;
  deepgram?: DeepgramSpeechToTextConfig;
  flux?: FluxSpeechToTextConfig;
  openai?: OpenAISpeechToTextConfig;
  whisperLocal?: WhisperLocalSpeechToTextConfig;
};

export type SpeechToTextAudioBuffer = Uint8Array | number[] | Record<string, number>;

export type SpeechToTextRequest = {
  audioBuffer: SpeechToTextAudioBuffer;
  fileName: string;
  languageHint?: string;
  mimeType: string;
};

export type SpeechToTextResult = {
  language?: string;
  model: string;
  provider: SpeechToTextProvider;
  text: string;
};
