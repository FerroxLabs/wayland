/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const TEXT_TO_SPEECH_PROVIDERS = ['system-native', 'windows-native', 'openai'] as const;
export type TextToSpeechProvider = (typeof TEXT_TO_SPEECH_PROVIDERS)[number];

export const isTextToSpeechProvider = (value: unknown): value is TextToSpeechProvider =>
  typeof value === 'string' && TEXT_TO_SPEECH_PROVIDERS.includes(value as TextToSpeechProvider);

/**
 * The zero-download synthesizer that ships with the operating system, or `null`
 * where none exists.
 *
 * This is the speech-out FLOOR: the provider a user reaches with no key, no
 * consent and no download. macOS has `say`; Windows has System.Speech through
 * PowerShell. Linux has neither in this build, and saying so by name is the
 * point - `null` here is what makes the readiness layer able to report
 * "no local adapter" instead of letting a session enter, look ready, and
 * fail mid-turn with nothing audible.
 *
 * `kokoro-local` used to sit in this slot and never once produced a byte: its
 * `resolveBinary` returned null unconditionally, so every call threw. It is
 * gone rather than disabled, because an option that can never work is worse
 * than an option that is absent.
 */
export const resolveLocalTtsProvider = (platform: string): TextToSpeechProvider | null => {
  if (platform === 'darwin') return 'system-native';
  if (platform === 'win32') return 'windows-native';
  return null;
};

/** OS-bundled synthesizers: no key, no consent, no download, no network. */
export const LOCAL_TTS_PROVIDERS = ['system-native', 'windows-native'] as const;

export const isLocalTtsProvider = (provider: TextToSpeechProvider): boolean =>
  (LOCAL_TTS_PROVIDERS as readonly TextToSpeechProvider[]).includes(provider);

export type TextToSpeechConfig = {
  enabled: boolean;
  provider: TextToSpeechProvider;
  voice: string;
  speed: number; // 0.5–2.0
  autoReadResponses: boolean;
  model?: string;
};

/**
 * `enabled` defaults ON.
 *
 * It reads like a privacy switch and is not one: no synthesis path consults it.
 * `voiceSynthBridge` normalizes the stored config and then synthesizes without
 * ever reading this field, and `autoReadResponses` - the field that would speak
 * without being asked - has no runtime consumer at all and stays `false`. The
 * only thing `enabled: false` ever gated was the renderer's own
 * `ttsProviderReady` check, so its single observable effect was that a user who
 * had never opened settings entered a voice conversation that could never make
 * a sound: the UI advanced to "Speaking", `playback_completed` never fired, and
 * the session never re-armed. That reads as a broken microphone.
 *
 * Reach, stated honestly: the normalizer preserves an explicitly stored
 * `false`, and both writers persist the whole object - changing any TTS field,
 * or merely pressing Test voice, writes `enabled` along with it. So this fixes
 * users who never touched a TTS field and never pressed Test voice. Everyone
 * else is fixed by a named readiness reason and a one-tap route to settings,
 * deliberately not by rewriting a stored preference they may have set on purpose.
 */
export const DEFAULT_TTS_CONFIG: TextToSpeechConfig = {
  enabled: true,
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
export const normalizeTextToSpeechConfig = (
  config?: Partial<TextToSpeechConfig>,
  /**
   * `process.platform`, supplied only by main-process callers.
   *
   * It changes the DEFAULT, never a stored choice. `DEFAULT_TTS_CONFIG.provider`
   * is `system-native`, which does not exist off macOS, so a Windows user who
   * had never opened Voice settings resolved to a provider that throws before
   * it reaches a synthesizer - zero speech out, no key, no way to tell. With
   * the platform known, the default becomes the local provider that platform
   * actually has. Renderer callers omit it (there is no `process` there) and
   * keep the previous behaviour exactly.
   */
  platform?: string
): TextToSpeechConfig => ({
  enabled: typeof config?.enabled === 'boolean' ? config.enabled : DEFAULT_TTS_CONFIG.enabled,
  provider: isTextToSpeechProvider(config?.provider)
    ? config.provider
    : (platform && resolveLocalTtsProvider(platform)) || DEFAULT_TTS_CONFIG.provider,
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
      errorCode: TextToSpeechErrorCode;
      /**
       * Free-form provider/runtime detail for the codes that carry one. Never
       * a stack or a filesystem path - `voiceSynthBridge` is the only writer
       * and it only ever forwards a message it composed itself.
       */
      detail?: string;
    };

/**
 * The complete failure vocabulary of `voiceSynth.speak`.
 *
 * `TTS_SYNTHESIS_FAILED` is the catch-all and is deliberately last: anything
 * that lands there is a failure whose cause was not named, which is the
 * condition this list exists to keep shrinking.
 */
export const TEXT_TO_SPEECH_ERROR_CODES = [
  'TTS_SYSTEM_NATIVE_UNAVAILABLE',
  /** The Windows System.Speech path could not run, or produced no audio. */
  'TTS_WINDOWS_NATIVE_UNAVAILABLE',
  'TTS_OPENAI_NOT_CONFIGURED',
  /** Connected, but the stored credential could not be decrypted on this machine. */
  'TTS_OPENAI_CREDENTIAL_UNREADABLE',
  /** The credential store itself could not be opened or read. */
  'TTS_CREDENTIAL_STORE_UNAVAILABLE',
  'TTS_OPENAI_AUTH_ERROR',
  'TTS_OPENAI_RATE_LIMITED',
  'TTS_OPENAI_REQUEST_FAILED',
  'TTS_HOSTED_CONSENT_REQUIRED',
  'TTS_SYNTHESIS_FAILED',
] as const;

export type TextToSpeechErrorCode = (typeof TEXT_TO_SPEECH_ERROR_CODES)[number];
