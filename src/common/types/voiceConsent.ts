/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hosted-voice consent (VOC-03).
 *
 * Some voice providers process audio and/or text OFF the user's device:
 *   - Text-to-speech `openai`   → response text is POSTed to api.openai.com.
 *   - Speech-to-text `openai`   → microphone audio is POSTed to api.openai.com.
 *   - Speech-to-text `deepgram` → microphone audio is POSTed to api.deepgram.com.
 *   - Speech-to-text `flux-voice`→ microphone audio is POSTed to Flux Router.
 *
 * The user must be told this and must accept it BEFORE any hosted call runs.
 * Consent is recorded per provider (the party that receives the data) and is
 * version-bound: bumping `HOSTED_VOICE_CONSENT_VERSION` invalidates every prior
 * acceptance so a changed disclosure is re-acknowledged. The gate is
 * fail-closed — absence, corruption, or a stale version all mean "not granted".
 *
 * Local providers (`system-native`, `kokoro-local`, `whisper-local`) never send
 * data off-device and are intentionally NOT part of this consent surface.
 */

export const HOSTED_VOICE_PROVIDERS = ['openai', 'deepgram', 'flux-voice'] as const;
export type HostedVoiceProvider = (typeof HOSTED_VOICE_PROVIDERS)[number];

/**
 * Bump when the disclosure materially changes (new endpoint, new data category,
 * new retention terms). A bump forces every user to re-accept.
 */
export const HOSTED_VOICE_CONSENT_VERSION = 1;

export type HostedVoiceConsent = {
  /** The disclosure version the user accepted. */
  version: number;
  /** Providers the user has explicitly acknowledged sending data to. */
  acceptedProviders: HostedVoiceProvider[];
  /** Epoch ms of the most recent acceptance (informational). */
  updatedAt: number;
};

export const isHostedVoiceProvider = (value: unknown): value is HostedVoiceProvider =>
  typeof value === 'string' && (HOSTED_VOICE_PROVIDERS as readonly string[]).includes(value);

/**
 * Coerces arbitrary persisted input into a well-formed consent record. A record
 * whose version does not match the current disclosure is treated as no consent
 * (empty accepted set) so a disclosure change re-gates every provider.
 */
export const normalizeHostedVoiceConsent = (
  input?: Partial<HostedVoiceConsent> | null
): HostedVoiceConsent => {
  const version =
    typeof input?.version === 'number' && Number.isFinite(input.version) ? input.version : 0;
  const updatedAt =
    typeof input?.updatedAt === 'number' && Number.isFinite(input.updatedAt) ? input.updatedAt : 0;

  if (version !== HOSTED_VOICE_CONSENT_VERSION) {
    return { version: HOSTED_VOICE_CONSENT_VERSION, acceptedProviders: [], updatedAt };
  }

  const acceptedProviders = Array.isArray(input?.acceptedProviders)
    ? [...new Set(input.acceptedProviders.filter(isHostedVoiceProvider))]
    : [];

  return { version: HOSTED_VOICE_CONSENT_VERSION, acceptedProviders, updatedAt };
};

/**
 * Fail-closed gate. Returns true only when the stored consent — after
 * normalization — explicitly authorizes THIS hosted provider at the current
 * disclosure version. Any malformed, missing, or stale input returns false.
 */
export const hostedVoiceConsentGranted = (
  provider: HostedVoiceProvider,
  consent?: Partial<HostedVoiceConsent> | null
): boolean => normalizeHostedVoiceConsent(consent).acceptedProviders.includes(provider);

/**
 * Returns a new consent record with `provider` added at the current version.
 * Used by the renderer when the user accepts the disclosure. `now` is injected
 * so callers control the timestamp (and tests stay deterministic).
 */
export const grantHostedVoiceConsent = (
  provider: HostedVoiceProvider,
  now: number,
  existing?: Partial<HostedVoiceConsent> | null
): HostedVoiceConsent => {
  const current = normalizeHostedVoiceConsent(existing);
  return {
    version: HOSTED_VOICE_CONSENT_VERSION,
    acceptedProviders: [...new Set([...current.acceptedProviders, provider])],
    updatedAt: now,
  };
};
