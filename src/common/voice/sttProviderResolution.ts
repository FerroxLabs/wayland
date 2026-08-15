/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig, SpeechToTextProvider } from '@/common/types/speech';

/**
 * Which transcriber will actually receive the microphone audio.
 *
 * This is not always the one stored in settings. When Flux is connected and the
 * user has never configured an STT engine, main transparently seeds Flux Voice
 * (zero-config, so dictation "just works"). Settings kept displaying OpenAI, and
 * the consequence was not cosmetic: the consent affordance offered the OpenAI
 * disclosure, the user accepted it, and every transcription still failed closed
 * with STT_HOSTED_CONSENT_REQUIRED because main was asking about Flux Voice. The
 * user was told to accept a disclosure they had no way to reach, and dictation
 * was permanently broken with no way to fix it from the UI.
 *
 * The rule lives here so the renderer and main answer the same question the same
 * way. Consent is per-recipient - offering it for the wrong company is both a
 * broken feature and a broken disclosure.
 *
 * Deliberately NOT handled here: a stored config whose `provider` is unset. Main
 * defaults that to `openai` while the renderer's transcribe path treats it as
 * local whisper. That divergence is real, predates this, and is its own packet -
 * papering over it here would hide it.
 */

export type SttProviderResolutionInput = {
  stored: Pick<SpeechToTextConfig, 'provider'> & { openai?: SpeechToTextConfig['openai'] };
  /** An OpenAI key in the shared provider registry (Models/Providers "Connected"). */
  hasConnectedOpenAIKey: boolean;
  /** A Flux key in the same registry. */
  hasConnectedFluxKey: boolean;
};

export const resolveEffectiveSttProvider = ({
  stored,
  hasConnectedOpenAIKey,
  hasConnectedFluxKey,
}: SttProviderResolutionInput): SpeechToTextProvider => {
  // An explicit choice of any non-default engine is intentional and is never
  // reinterpreted - the seed only ever fills a vacuum.
  if (stored.provider === 'deepgram' || stored.provider === 'whisper-local' || stored.provider === 'flux-voice') {
    return stored.provider;
  }

  // A key typed into the STT panel is the most explicit signal there is.
  if (stored.openai?.apiKey?.trim()) return 'openai';

  // A connected OpenAI provider is resolved BEFORE the Flux seed, so an explicit
  // OpenAI choice backed by a connected key is never silently rerouted.
  if (hasConnectedOpenAIKey) return 'openai';

  if (hasConnectedFluxKey) return 'flux-voice';

  return 'openai';
};
