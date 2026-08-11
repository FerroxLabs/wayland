/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

export const SPEECH_TO_TEXT_PROVIDERS = ['openai', 'deepgram', 'whisper-local', 'flux-voice'] as const;

export type SpeechToTextProvider = (typeof SPEECH_TO_TEXT_PROVIDERS)[number];

export const isSpeechToTextProvider = (value: unknown): value is SpeechToTextProvider =>
  typeof value === 'string' && (SPEECH_TO_TEXT_PROVIDERS as readonly string[]).includes(value);

/**
 * Who wrote this speech-to-text config: the factory floor, or the user.
 *
 * `'user'` is set ONLY when a control in the Voice panel is changed. Everything
 * else - including every config that predates this field - is `'default'`, and
 * a `'default'` config may be re-seeded to whatever the current floor is.
 *
 * MIGRATION, stated plainly: ALL pre-origin stored configs become
 * `origin:'default'`, including ones a user deliberately pointed at keyless
 * OpenAI. That is not a compromise, it is the only truthful reading. The
 * normalizer spreads `DEFAULT_SPEECH_TO_TEXT_CONFIG` over every stored config,
 * so a factory profile and a deliberate keyless-OpenAI choice are LITERALLY
 * INDISTINGUISHABLE on disk - both read back as `provider:'openai'` with no key.
 * There is no bit anywhere that separates them, so no migration can preserve the
 * second. The "an explicit user choice is never re-seeded" guarantee is
 * therefore FORWARD-ONLY: it holds for configs written after this ships.
 */
export type SpeechToTextConfigOrigin = 'default' | 'user';

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
  /**
   * UNSET means "the floor", which is the bundled on-device Whisper. It must
   * never be read as a hosted service: an absent provider that resolves to a
   * keyless `openai` is exactly the state that made speech-in unusable out of
   * the box.
   */
  provider?: SpeechToTextProvider;
  /** @see SpeechToTextConfigOrigin */
  origin?: SpeechToTextConfigOrigin;
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
 *
 * Declared as a runtime array rather than a bare type union so the renderer's
 * failure vocabulary can be DERIVED from it instead of re-typed beside it. A
 * hand-copied second list is what let seven speech codes reach a user as raw
 * enum text.
 */
export const SPEECH_TO_TEXT_ERROR_CODES = [
  'STT_DISABLED',
  'STT_OPENAI_NOT_CONFIGURED',
  'STT_DEEPGRAM_NOT_CONFIGURED',
  'STT_FLUX_NOT_CONFIGURED',
  'STT_FLUX_AUTH_ERROR',
  'STT_FLUX_PREMIUM_LOCKED',
  'STT_HOSTED_CONSENT_REQUIRED',
  'STT_FILE_TOO_LARGE',
  'STT_RATE_LIMITED',
  'STT_REQUEST_FAILED',
] as const;

export type SpeechToTextErrorCode = (typeof SPEECH_TO_TEXT_ERROR_CODES)[number];

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
