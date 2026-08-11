/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig, SpeechToTextConfigOrigin, SpeechToTextProvider } from '@/common/types/speech';
import type { TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';
import { hostedVoiceConsentGranted, isHostedVoiceProvider, type HostedVoiceConsent } from '@/common/types/voiceConsent';
import { normalizeSpeechToTextConfig } from '@/common/voice/speechToTextConfig';

/**
 * Can a voice conversation actually happen right now, and if not, what is the
 * one thing the user has to fix?
 *
 * A conversation needs THREE things. The session speaks (text-to-speech), it
 * listens (speech-to-text), and something has to answer. The two speech legs are
 * two different providers, two different failure modes and potentially two
 * different companies receiving data, so they are resolved SEPARATELY, by
 * direction - `resolveVoiceLeg('in')` and `resolveVoiceLeg('out')`. The third
 * leg is the model: on a fresh install with no keys the old resolver reported
 * ready, greeted, opened the microphone and transcribed, and then nothing
 * answered, because no model was connected.
 *
 * A bare boolean is not enough. "Voice setup is incomplete" is a dead end; every
 * surface needs to know WHICH leg failed so it can offer the one tap that fixes
 * it. That is the whole reason this returns a named cause.
 *
 * This is advisory, not a security boundary. The real gates are main-side,
 * per-provider, version-bound and fail-closed (`voiceSynthBridge` for speech
 * out, `SpeechToTextService` for audio in). Nothing here may ever be used to
 * skip them - it exists so the user is told the truth before they start
 * talking, not to decide what is allowed.
 */

/**
 * The CLOSED failure vocabulary. Every consumer switches on this exhaustively
 * with a compile-time `never` check, so adding a member without handling it is
 * a typecheck failure rather than the word "unknown" in front of a user.
 */
export type VoiceFailureCause =
  | 'ok'
  /** The user turned speech output off themselves. Their choice; offer the route back. */
  | 'tts-disabled-by-user'
  /** No local synthesizer exists on this OS - `say` is macOS-only. */
  | 'no-local-adapter'
  /** kokoro-local is selected but has never had a working binary. */
  | 'kokoro-unavailable'
  /** Speaking would POST the reply off-device and the disclosure is unaccepted. */
  | 'tts-needs-consent'
  /** Speech-to-text was switched off deliberately, after this shipped. */
  | 'stt-disabled'
  /** The chosen transcriber cannot run - typically a hosted provider with no key. */
  | 'stt-unavailable'
  /** Transcribing would POST microphone audio off-device, disclosure unaccepted. */
  | 'stt-needs-consent'
  /** The AudioContext is suspended or closed, so scheduled audio would never sound. */
  | 'audio-blocked'
  /** The bundled on-device model is still loading. Transient, never a dead end. */
  | 'local-engine-warming'
  /** Nothing is connected that could answer. Voice is not the thing to fix. */
  | 'no-model-connected';

/** @deprecated Kept as the pre-ladder name so existing copy tables still bind. */
export type VoiceReadinessReason = VoiceFailureCause;

export type VoiceSessionReadiness = {
  ready: boolean;
  reason: VoiceFailureCause;
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
  /**
   * `isLocalWhisperReady()`. The bundled model costs a one-time 5-10 SECOND
   * warmup, and the ladder now makes it the default, which relocates that
   * latency onto the first tap of the mic unless it is surfaced. `undefined`
   * means "not known here" and does not warm-block.
   */
  localSttReady?: boolean;
  /**
   * Is any model or agent connected that could answer? `undefined` means "not
   * known here" and never blocks; only an explicit `false` does.
   */
  modelConnected?: boolean;
};

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

/* ============================================================================
 * The per-direction ladder
 * ==========================================================================*/

/**
 * How a direction is doing, and whether the control may be clicked.
 *
 * `ready` is the only clickable state. `warming` and `preparing` are on their
 * way to ready and must show hover copy instead of accepting a click - a click
 * they cannot serve is exactly the dead end this replaces. `needsSetup`,
 * `unsupported` and `failed` all name their cause.
 */
export type VoiceLegStatus = 'ready' | 'warming' | 'preparing' | 'needsSetup' | 'unsupported' | 'failed';

export type VoiceLegDirection = 'in' | 'out';

export type VoiceLeg = {
  direction: VoiceLegDirection;
  status: VoiceLegStatus;
  /** `'ok'` when and only when `status === 'ready'`. */
  cause: VoiceFailureCause;
  /** The provider that will actually serve this leg, or null when none can. */
  provider: string | null;
  /** No control may EVER be clickable into a dead end. */
  clickable: boolean;
};

/** The bundled on-device transcriber. Always present, no key, no disclosure. */
export const ON_DEVICE_STT_PROVIDER: SpeechToTextProvider = 'whisper-local';
/** The platform-native synthesizer. `say`, and `say` is macOS-only. */
export const ON_DEVICE_TTS_PROVIDER: TextToSpeechProvider = 'system-native';

/**
 * THE WINDOWS/LINUX SEAM. Which synthesizer the OS itself provides, by platform.
 *
 * Today: macOS only. `synthesizeSystemNative` shells out to `say`, which exists
 * nowhere else, so on Windows and Linux the speaking leg of EVERY otherwise
 * working configuration is `unsupported` / `no-local-adapter` / not clickable.
 * That is a real, currently shipped hole and the acceptance table asserts it by
 * name rather than testing macOS and calling it "voice works".
 *
 * `packet/wl-voice-wintts` is adding a Windows-native provider. When it lands,
 * this function is the ONLY thing that has to change - return that provider for
 * `win32` and every consumer, every leg and every table cell follows, because
 * nothing else in this file compares a platform string.
 */
export const platformNativeTtsProvider = (platform: string): TextToSpeechProvider | null =>
  platform === 'darwin' ? ON_DEVICE_TTS_PROVIDER : null;

const leg = (
  direction: VoiceLegDirection,
  status: VoiceLegStatus,
  cause: VoiceFailureCause,
  provider: string | null
): VoiceLeg => ({ direction, status, cause, provider, clickable: status === 'ready' });

/**
 * Speech IN, resolved ON-DEVICE FIRST.
 *
 * The obvious ladder - Flux, then OpenAI, then local - is wrong, and this is the
 * correction the whole lane turns on. `hostedVoiceConsentGranted` is fail-closed
 * and `HOSTED_VOICE_PROVIDERS` contains flux-voice, so "prefer Flux when it is
 * connected" hands the MOST COMMON fresh-install user - someone who connected
 * Flux Router and has never opened Voice settings - a LEGAL DISCLOSURE MODAL on
 * their very first tap of the mic. That is the opposite of working out of the
 * box, and it also falsifies the privacy argument for defaulting speech-in on:
 * you cannot justify an on-by-default microphone by saying nothing leaves the
 * machine and then route the first utterance to a hosted transcriber.
 *
 * So for `origin:'default'` the floor is the only rung. Hosted rungs exist, but
 * the user climbs onto them deliberately, from the Voice panel, where the
 * disclosure belongs - never from the composer.
 */
const resolveSttLeg = ({
  sttConfig: storedSttConfig,
  consent,
  connectedCredentials,
  localSttReady,
}: VoiceReadinessInput): VoiceLeg => {
  /**
   * NORMALIZE HERE, not at the call sites.
   *
   * This used to trust its caller, and every caller that mattered handed it the
   * raw bytes off disk. A real upgraded profile holds
   * `{enabled:false, provider:'openai'}` with no `origin` field, which is the
   * pre-origin factory default - not a decision anyone made - and read raw it
   * says `stt-disabled` and every acceptance cell built on it is describing a
   * config the app never produces.
   *
   * Doing it at the one place that decides means there is no call site left to
   * forget: `normalizeSpeechToTextConfig` is idempotent, so the settings panels
   * that already normalize are unaffected, and a caller that does not normalize
   * physically cannot get an unnormalized answer.
   */
  const sttConfig = normalizeSpeechToTextConfig(storedSttConfig);
  const origin: SpeechToTextConfigOrigin = sttConfig.origin;

  /**
   * `enabled` is honoured for BOTH origins, and it is `normalizeSpeechToTextConfig`
   * that decides what a default-origin config's `enabled` even is: it re-seeds
   * it from the current factory floor, because a stored `false` on a
   * default-origin config is indistinguishable from the pre-origin factory
   * value, which WAS false. Keeping the decision there rather than here means
   * the floor is a single fact in a single place - lower the floor and every
   * default-origin profile follows it, which is what makes the acceptance table
   * actually depend on the default instead of quietly routing around it.
   */
  if (sttConfig.enabled === false) return leg('in', 'needsSetup', 'stt-disabled', null);

  // For a default origin the floor is the ONLY rung. Hosted rungs are climbed
  // deliberately, from the Voice panel, where the disclosure belongs.
  // An unset provider on a user-origin config also means the floor - never a
  // hosted service with no key.
  const provider = origin === 'default' ? ON_DEVICE_STT_PROVIDER : (sttConfig.provider ?? ON_DEVICE_STT_PROVIDER);

  if (provider === ON_DEVICE_STT_PROVIDER) {
    return localSttReady === false
      ? leg('in', 'warming', 'local-engine-warming', provider)
      : leg('in', 'ready', 'ok', provider);
  }

  if (!hostedSttHasCredential(provider, sttConfig, connectedCredentials)) {
    return leg('in', 'needsSetup', 'stt-unavailable', provider);
  }
  if (!hostedVoiceConsentGranted(provider, consent)) {
    return leg('in', 'needsSetup', 'stt-needs-consent', provider);
  }
  return leg('in', 'ready', 'ok', provider);
};

/**
 * Speech OUT, platform-native first.
 *
 * There is no `origin` field on the TTS config and none is needed: its factory
 * provider is already `system-native`, the platform-native floor, so a hosted
 * value can only be there because someone selected it in the panel. Presence of
 * a hosted provider IS the explicit choice, which is exactly the signal
 * `origin` has to reconstruct on the speech-in side.
 *
 * Flux Voice is SPEECH-TO-TEXT ONLY and is not a member of
 * `TextToSpeechProvider` at all, so it can never appear here.
 */
const resolveTtsLeg = ({ ttsConfig, platform = 'darwin', consent }: VoiceReadinessInput): VoiceLeg => {
  const provider = (ttsConfig?.provider ?? ON_DEVICE_TTS_PROVIDER) as TextToSpeechProvider;

  if (ttsConfig?.enabled === false) return leg('out', 'needsSetup', 'tts-disabled-by-user', provider);

  if (provider === ON_DEVICE_TTS_PROVIDER) {
    // `synthesizeSystemNative` throws off darwin before it ever reaches `say`.
    const native = platformNativeTtsProvider(platform);
    return native ? leg('out', 'ready', 'ok', native) : leg('out', 'unsupported', 'no-local-adapter', null);
  }

  // `resolveBinary` returns null unconditionally and `synthesize` always throws.
  if (provider === 'kokoro-local') return leg('out', 'failed', 'kokoro-unavailable', provider);

  if (isHostedVoiceProvider(provider) && !hostedVoiceConsentGranted(provider, consent)) {
    return leg('out', 'needsSetup', 'tts-needs-consent', provider);
  }
  return leg('out', 'ready', 'ok', provider);
};

/**
 * ONE readiness answer, for one direction.
 *
 * Both the voice-mode hook and the composer mic resolve through this. The
 * composer used to have ZERO references to readiness - `SpeechInputButton` took
 * a bare `disabled` prop from its parent and `useSpeechInput` never consulted a
 * resolver at all - which matters because the composer mic, not the orb, is the
 * shipped voice surface.
 */
export const resolveVoiceLeg = (direction: VoiceLegDirection, input: VoiceReadinessInput = {}): VoiceLeg => {
  // A session with nothing to answer it is not a working session in either
  // direction, so this outranks both ladders. `modelConnected === undefined`
  // means "not known here" and never blocks.
  if (input.modelConnected === false) return leg(direction, 'needsSetup', 'no-model-connected', null);

  if (input.audioContextState && input.audioContextState !== 'running') {
    return leg(direction, 'preparing', 'audio-blocked', null);
  }

  return direction === 'in' ? resolveSttLeg(input) : resolveTtsLeg(input);
};

/**
 * Both directions at once, for the callers that need a single verdict.
 *
 * The returned `cause` is the first blocker in a fixed order: model, then
 * speaking, then listening. Speaking is reported before listening because its
 * failure is the silent one - a session that cannot speak looks identical to a
 * session that is working. A listening failure at least shows up as "nothing I
 * said appeared".
 */
export const resolveVoiceSessionReadiness = (input: VoiceReadinessInput = {}): VoiceSessionReadiness => {
  const out = resolveVoiceLeg('out', input);
  const inbound = resolveVoiceLeg('in', input);

  /**
   * `warming` is NOT a blocker for the session.
   *
   * It is an AFFORDANCE state: the composer mic must not be clickable while the
   * on-device model loads, because a click there looks ignored. But the session
   * is a different question, and the existing greeting suite caught the bug -
   * gating the whole session on it meant a warming TRANSCRIBER silenced the
   * GREETING, which is the speaking leg and has nothing to do with it. Two
   * independent ladders means exactly that.
   *
   * It is also safe to capture during a warmup: `transcribeLocally` awaits
   * `ensureWorker()` itself, so a turn started mid-warm transcribes late rather
   * than failing. A slower first turn beats a refused one.
   */
  const blocking = (leg: VoiceLeg): VoiceFailureCause => (leg.status === 'warming' ? 'ok' : leg.cause);
  const reason: VoiceFailureCause = blocking(out) !== 'ok' ? blocking(out) : blocking(inbound);

  return {
    ready: reason === 'ok',
    reason,
    /**
     * The providers the LADDER resolved, not the ones stored.
     *
     * These strings are shown to the user ("Listening would send your audio to
     * X"), so reporting the stored value while the ladder routes elsewhere is
     * how a disclosure ends up naming the wrong company - the exact failure
     * `sttProviderResolution` exists to prevent. When a leg resolves to no
     * provider at all the floor is reported, because that is what the copy
     * needs to name.
     *
     * There is deliberately no hosted fallback: an absent provider is the
     * on-device floor, full stop. The old `DEFAULT_STT_PROVIDER = 'openai'` was
     * the single line that made "unset" mean "a hosted service with no key".
     */
    ttsProvider: (out.provider ?? ON_DEVICE_TTS_PROVIDER) as TextToSpeechProvider,
    sttProvider: (inbound.provider ?? ON_DEVICE_STT_PROVIDER) as SpeechToTextProvider,
  };
};
