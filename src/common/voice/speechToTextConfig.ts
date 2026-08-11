/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The stored speech-to-text config, and how to make it trustworthy.
 *
 * This lives in `common` rather than in the Voice settings panel because the
 * composer mic reads it too, and importing a settings MODAL into a leaf button
 * dragged the whole Arco form surface in with it - five unrelated suites
 * stopped loading before a single assertion ran.
 */

import {
  isSpeechToTextProvider,
  type SpeechToTextConfig,
  type SpeechToTextConfigOrigin,
} from '@/common/types/speech';

/**
 * The factory floor for speech-to-text.
 *
 * `enabled: true` with the provider deliberately UNSET. Unset resolves to the
 * bundled on-device Whisper (see `resolveVoiceLeg`), which is always present,
 * needs no key, owes no disclosure and sends no audio off the machine - so
 * turning it on by default costs the user nothing and asks them nothing.
 *
 * The previous floor was `{enabled:false, provider:'openai'}`, which is the
 * worst of both: speech-in was off, and the one thing waiting behind the switch
 * was a hosted transcriber with no key. There must be no path where an absent
 * provider means "a hosted service with no key".
 */
export const DEFAULT_SPEECH_TO_TEXT_CONFIG: SpeechToTextConfig = {
  enabled: true,
  origin: 'default',
  openai: {
    apiKey: '',
    baseUrl: '',
    language: '',
    model: 'whisper-1',
  },
  fluxVoice: {
    apiKey: '',
    baseUrl: '',
    language: '',
    model: 'flux-voice',
  },
  deepgram: {
    apiKey: '',
    baseUrl: '',
    detectLanguage: true,
    language: '',
    model: 'nova-2',
    punctuate: true,
    smartFormat: true,
  },
};

/**
 * Coerces arbitrary stored input into a config the ladder can trust.
 *
 * Two coercions, both deliberate:
 *
 * 1. ORIGIN. Every config that arrives without an `origin` is a pre-origin
 *    config and becomes `origin:'default'`. See `SpeechToTextConfigOrigin` for
 *    why that is the only honest migration and why the never-re-seed guarantee
 *    is forward-only.
 *
 * 2. PROVIDER VALIDITY. `provider` used to be spread straight through with no
 *    validation at all, unlike its TTS sibling, so a garbage or retired value
 *    reached the resolver and matched nothing. A provider that is not a member
 *    of the union is dropped AND forces `origin:'default'` regardless of prior
 *    intent - a stored intent naming an engine that does not exist is not an
 *    intent that can be honoured, and the floor is the only safe landing.
 */
export const normalizeSpeechToTextConfig = (
  /**
   * Deliberately `Partial` and nullable. What is on disk is whatever some
   * earlier version wrote, and the shape that actually broke voice out of the
   * box - `{enabled:false, provider:'openai'}` with no `origin` at all - is not
   * a `SpeechToTextConfig`. Typing the parameter as the finished config forced
   * every caller into a cast, and a cast at a call site is exactly where a raw
   * value slips past. Accepting the honest input type is what lets the resolver
   * call this on its own arguments.
   */
  config?: Partial<SpeechToTextConfig> | null
): SpeechToTextConfig & { origin: SpeechToTextConfigOrigin } => {
  const storedProvider = config?.provider;
  const providerIsValid = storedProvider === undefined || isSpeechToTextProvider(storedProvider);
  const isUserOrigin = providerIsValid && config?.origin === 'user';

  return {
    ...DEFAULT_SPEECH_TO_TEXT_CONFIG,
    ...config,
    provider: providerIsValid ? storedProvider : undefined,
    origin: isUserOrigin ? 'user' : 'default',
    /**
     * 3. ENABLED. A default-origin config's `enabled` is not the user's answer,
     *    it is whatever the factory floor happened to be when it was written -
     *    and the pre-origin floor was `false`. A stored `false` there is
     *    indistinguishable from "never touched", so it is re-seeded from the
     *    CURRENT floor rather than honoured. A user-origin `false` is a real
     *    answer and is kept.
     */
    enabled: isUserOrigin ? (config?.enabled ?? DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled) : DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled,
    openai: {
      ...DEFAULT_SPEECH_TO_TEXT_CONFIG.openai,
      ...config?.openai,
    },
    fluxVoice: {
      ...DEFAULT_SPEECH_TO_TEXT_CONFIG.fluxVoice,
      ...config?.fluxVoice,
    },
    deepgram: {
      ...DEFAULT_SPEECH_TO_TEXT_CONFIG.deepgram,
      ...config?.deepgram,
    },
  };
};
