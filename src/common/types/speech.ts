/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
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
  fluxVoice?: OpenAISpeechToTextConfig;
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

/**
 * The public failure vocabulary of a transcription turn. Same strings the
 * service throws, so `mapSpeechInputError` keeps working unchanged.
 */
export type SpeechToTextErrorCode =
  | 'STT_DISABLED'
  | 'STT_OPENAI_NOT_CONFIGURED'
  | 'STT_DEEPGRAM_NOT_CONFIGURED'
  | 'STT_FLUX_NOT_CONFIGURED'
  | 'STT_FLUX_AUTH_ERROR'
  | 'STT_FLUX_PREMIUM_LOCKED'
  | 'STT_HOSTED_CONSENT_REQUIRED'
  | 'STT_FILE_TOO_LARGE'
  | 'STT_RATE_LIMITED'
  | 'STT_REQUEST_FAILED';

/**
 * Why transcription crosses the bridge as a RESULT and never as a rejection.
 *
 * The bridge has no error channel at all. `buildProvider(...).provider(fn)`
 * calls `fn(data).then(emitCallback)` with no `.catch`, and the matching
 * `invoke` is a `new Promise(resolve)` with no reject and no timeout. So a
 * provider that throws produces an unhandledRejection in main and an `await`
 * in the renderer that NEVER SETTLES - the mic sits on the transcribing
 * spinner forever, with no message, until the window is reloaded.
 *
 * `voiceSynth.speak` already returns `{ok:false, errorCode}` for exactly this
 * reason. Speech-to-text is its sibling and must do the same.
 */
export type SpeechToTextBridgeResult =
  | { ok: true; result: SpeechToTextResult }
  | {
      ok: false;
      errorCode: SpeechToTextErrorCode;
      /** Provider-supplied detail, carried only for `STT_REQUEST_FAILED`. */
      detail?: string;
    };
