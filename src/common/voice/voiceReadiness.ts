/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig, SpeechToTextProvider } from '@/common/types/speech';
import type { TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';
import { isLocalTtsProvider, resolveLocalTtsProvider } from '@/common/types/ttsTypes';
import { hostedVoiceConsentGranted, isHostedVoiceProvider, type HostedVoiceConsent } from '@/common/types/voiceConsent';

/**
 * Can a voice conversation actually happen right now, and if not, what is the
 * one thing the user has to fix?
 *
 * A conversation needs BOTH legs. The session speaks (text-to-speech) and it
 * listens (speech-to-text), and they are two different providers, two different
 * failure modes, and potentially two different companies receiving data. The
 * inline check this replaces looked at the speaking leg only, so on macOS a
 * default user could enter a session that was ready to speak and then begin
 * continuously re-arming a microphone routed to a hosted transcriber, with the
 * entry flow having disclosed only the quieter of the two.
 *
 * A bare boolean is not enough. "Voice setup is incomplete" is a dead end; the
 * composer needs to know WHICH leg failed so it can offer the one tap that
 * fixes it. That is the whole reason this returns a named reason.
 *
 * This is advisory, not a security boundary. The real gates are main-side,
 * per-provider, version-bound and fail-closed (`voiceSynthBridge` for speech
 * out, `SpeechToTextService` for audio in). Nothing here may ever be used to
 * skip them - it exists so the user is told the truth before they start
 * talking, not to decide what is allowed.
 */

export type VoiceReadinessReason =
  | 'ok'
  /** The user turned speech output off themselves. Their choice; offer the route back. */
  | 'tts-disabled-by-user'
  /**
   * No local synthesizer exists for this OS. macOS has `say`, Windows has
   * System.Speech; Linux has neither in this build and is named, not silent.
   */
  | 'no-local-adapter'
  /** Speaking would POST the reply off-device and the disclosure is unaccepted. */
  | 'tts-needs-consent'
  /** Speech-to-text is off, which is the factory default. */
  | 'stt-disabled'
  /** The chosen transcriber cannot run - typically a hosted provider with no key. */
  | 'stt-unavailable'
  /** Transcribing would POST microphone audio off-device, disclosure unaccepted. */
  | 'stt-needs-consent'
  /** The AudioContext is suspended or closed, so scheduled audio would never sound. */
  | 'audio-blocked';

export type VoiceSessionReadiness = {
  ready: boolean;
  reason: VoiceReadinessReason;
  ttsProvider: TextToSpeechProvider;
  sttProvider: SpeechToTextProvider;
};

/**
 * Credentials the app holds in the shared provider registry (what
 * Models/Providers shows as "Connected"), which main will fall back to when the
 * voice config carries no key of its own. Absent/undefined means "not known
 * here" and is treated as not connected - the conservative direction, since it
 * only ever withholds readiness it cannot vouch for.
 */
export type ConnectedVoiceCredentials = {
  openai?: boolean;
  flux?: boolean;
};

export type VoiceReadinessInput = {
  ttsConfig?: Partial<TextToSpeechConfig> | null;
  sttConfig?: Partial<SpeechToTextConfig> | null;
  /** `process.platform`. Only `darwin` has a local synthesizer today. */
  platform?: string;
  consent?: Partial<HostedVoiceConsent> | null;
  /**
   * `undefined` means the context has not been created yet, which is the normal
   * state before the entry gesture and is NOT a blocker. Only a context that
   * exists and is not running blocks.
   */
  audioContextState?: AudioContextState;
  /** @see ConnectedVoiceCredentials */
  connectedCredentials?: ConnectedVoiceCredentials;
};

const DEFAULT_TTS_PROVIDER: TextToSpeechProvider = 'system-native';
const DEFAULT_STT_PROVIDER: SpeechToTextProvider = 'openai';

/**
 * True when this provider has a usable credential.
 *
 * The STT config is not the only place a credential can live, and for the two
 * providers the app connects on the user's behalf it is the least likely one.
 * Main resolves both OpenAI and Flux Voice from the shared provider registry
 * when the STT block is empty, so judging readiness on the STT block alone
 * reports "unavailable" for a provider that would transcribe perfectly well -
 * blocking a session main was ready to serve.
 */
const hostedSttHasCredential = (
  provider: SpeechToTextProvider,
  config?: Partial<SpeechToTextConfig> | null,
  connected?: ConnectedVoiceCredentials
): boolean => {
  if (provider === 'openai') return Boolean(config?.openai?.apiKey?.trim() || connected?.openai);
  if (provider === 'deepgram') return Boolean(config?.deepgram?.apiKey?.trim());
  if (provider === 'flux-voice') return Boolean(config?.fluxVoice?.apiKey?.trim() || connected?.flux);
  return true;
};

/**
 * The speaking leg. Ordered so the first thing returned is the first thing the
 * user has to do something about.
 */
const resolveTtsReason = (
  provider: TextToSpeechProvider,
  ttsConfig: VoiceReadinessInput['ttsConfig'],
  platform: string,
  consent: VoiceReadinessInput['consent']
): VoiceReadinessReason => {
  if (ttsConfig?.enabled === false) return 'tts-disabled-by-user';
  // A local synthesizer throws on the wrong OS before it reaches any engine:
  // `say` off darwin, System.Speech off win32. Linux has neither, so every
  // local provider lands here - which is the named Linux answer, not silence.
  if (isLocalTtsProvider(provider) && provider !== resolveLocalTtsProvider(platform)) return 'no-local-adapter';
  if (isHostedVoiceProvider(provider) && !hostedVoiceConsentGranted(provider, consent)) return 'tts-needs-consent';
  return 'ok';
};

/** The listening leg. Same ordering rule. */
const resolveSttReason = (
  provider: SpeechToTextProvider,
  sttConfig: VoiceReadinessInput['sttConfig'],
  consent: VoiceReadinessInput['consent'],
  connected: ConnectedVoiceCredentials | undefined
): VoiceReadinessReason => {
  if (!sttConfig?.enabled) return 'stt-disabled';
  // A provider with no credential cannot transcribe even once consent is given,
  // so it is reported before the disclosure - fixing consent first would just
  // produce a second failure.
  if (!hostedSttHasCredential(provider, sttConfig, connected)) return 'stt-unavailable';
  if (isHostedVoiceProvider(provider) && !hostedVoiceConsentGranted(provider, consent)) return 'stt-needs-consent';
  return 'ok';
};

/**
 * Both legs are always evaluated; the returned `reason` is the first blocker in
 * a fixed order: audio, then speaking, then listening.
 *
 * Speaking is reported before listening because its failure is the silent one -
 * a session that cannot speak looks identical to a session that is working,
 * which is exactly the bug this plan exists to fix. A listening failure at
 * least shows up as "nothing I said appeared".
 */
export const resolveVoiceSessionReadiness = ({
  ttsConfig,
  sttConfig,
  platform = 'darwin',
  consent,
  audioContextState,
  connectedCredentials,
}: VoiceReadinessInput = {}): VoiceSessionReadiness => {
  const ttsProvider = (ttsConfig?.provider ?? DEFAULT_TTS_PROVIDER) as TextToSpeechProvider;
  const sttProvider = (sttConfig?.provider ?? DEFAULT_STT_PROVIDER) as SpeechToTextProvider;

  const reason: VoiceReadinessReason =
    audioContextState && audioContextState !== 'running'
      ? 'audio-blocked'
      : ((): VoiceReadinessReason => {
          const tts = resolveTtsReason(ttsProvider, ttsConfig, platform, consent);
          if (tts !== 'ok') return tts;
          return resolveSttReason(sttProvider, sttConfig, consent, connectedCredentials);
        })();

  return { ready: reason === 'ok', reason, ttsProvider, sttProvider };
};
