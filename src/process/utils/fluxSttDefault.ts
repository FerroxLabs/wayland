/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * When FluxRouter is the connected provider and the user has NOT configured any
 * STT engine, default speech-to-text to Flux Voice so it "just works" without
 * setup. Pure resolution logic (deps injected) so it can be unit-tested without
 * the DB.
 *
 * Invariant: only ever SEEDS — never overrides an explicit user choice and never
 * fires unless Flux is genuinely connected (a key is present).
 */

import type { SpeechToTextConfig } from '@/common/types/speech';

const FLUX_VOICE_BASE_URL = 'https://api.fluxrouter.ai/v1';
const FLUX_VOICE_MODEL = 'flux-voice';

export type FluxSttDefaultDeps = {
  /** Current `tools.speechToText`, or undefined when never set. */
  current: SpeechToTextConfig | undefined;
  /** The connected Flux key, or undefined when Flux isn't connected. */
  fluxKey: string | undefined;
};

/**
 * Returns a seeded `tools.speechToText` pointed at Flux Voice, or null to
 * leave things unchanged. Seeds ONLY when: Flux is connected (`fluxKey`
 * present) AND the current config either does not exist or uses an unconfigured
 * OpenAI provider (the factory default, indicating the user has never touched
 * the STT settings).
 *
 * An explicit user choice of any provider — including setting an OpenAI API key
 * or switching to Deepgram — is treated as intentional and is never replaced.
 */
export function resolveFluxSttDefault(deps: FluxSttDefaultDeps): SpeechToTextConfig | null {
  const { current, fluxKey } = deps;
  if (!fluxKey) return null;

  // Already explicitly configured: an openai config with an apiKey means the
  // user entered credentials; deepgram/whisper-local presence means they
  // actively chose that provider. flux-voice means already seeded.
  if (current) {
    if (current.provider === 'flux-voice') return null;
    if (current.provider === 'deepgram' || current.provider === 'whisper-local') return null;
    if (current.provider === 'openai' && current.openai?.apiKey?.trim()) return null;
  }

  return {
    enabled: current?.enabled ?? false,
    autoSend: current?.autoSend,
    provider: 'flux-voice',
    fluxVoice: {
      apiKey: fluxKey,
      baseUrl: FLUX_VOICE_BASE_URL,
      model: FLUX_VOICE_MODEL,
    },
  };
}
