/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import {
  HOSTED_VOICE_CONSENT_VERSION,
  grantHostedVoiceConsent,
  hostedVoiceConsentGranted,
  isHostedVoiceProvider,
  normalizeHostedVoiceConsent,
} from '@/common/types/voiceConsent';

describe('hostedVoiceConsentGranted (fail-closed gate)', () => {
  it('denies when consent is missing/null/undefined', () => {
    expect(hostedVoiceConsentGranted('openai', null)).toBe(false);
    expect(hostedVoiceConsentGranted('openai', undefined)).toBe(false);
    expect(hostedVoiceConsentGranted('deepgram', {})).toBe(false);
  });

  it('grants only the explicitly accepted provider', () => {
    const consent = {
      version: HOSTED_VOICE_CONSENT_VERSION,
      acceptedProviders: ['openai' as const],
      updatedAt: 1,
    };
    expect(hostedVoiceConsentGranted('openai', consent)).toBe(true);
    expect(hostedVoiceConsentGranted('deepgram', consent)).toBe(false);
    expect(hostedVoiceConsentGranted('flux-voice', consent)).toBe(false);
  });

  it('denies when the stored version is stale (disclosure changed)', () => {
    const staleButAccepted = {
      version: HOSTED_VOICE_CONSENT_VERSION - 1,
      acceptedProviders: ['openai' as const],
      updatedAt: 1,
    };
    expect(hostedVoiceConsentGranted('openai', staleButAccepted)).toBe(false);
  });

  it('denies when acceptedProviders is malformed', () => {
    // @ts-expect-error deliberately malformed persisted input
    expect(
      hostedVoiceConsentGranted('openai', { version: HOSTED_VOICE_CONSENT_VERSION, acceptedProviders: 'openai' })
    ).toBe(false);
  });

  it('ignores unknown provider names in the accepted set', () => {
    const consent = {
      version: HOSTED_VOICE_CONSENT_VERSION,
      acceptedProviders: ['openai', 'evil-corp', 'deepgram'] as unknown as ('openai' | 'deepgram')[],
      updatedAt: 1,
    };
    const normalized = normalizeHostedVoiceConsent(consent);
    expect(normalized.acceptedProviders).toEqual(['openai', 'deepgram']);
  });
});

describe('grantHostedVoiceConsent', () => {
  it('adds a provider at the current version without duplicating', () => {
    const first = grantHostedVoiceConsent('openai', 1000, null);
    expect(first).toEqual({ version: HOSTED_VOICE_CONSENT_VERSION, acceptedProviders: ['openai'], updatedAt: 1000 });

    const second = grantHostedVoiceConsent('openai', 2000, first);
    expect(second.acceptedProviders).toEqual(['openai']);
    expect(second.updatedAt).toBe(2000);

    const third = grantHostedVoiceConsent('deepgram', 3000, second);
    expect(third.acceptedProviders).toEqual(['openai', 'deepgram']);
  });

  it('drops previously-accepted providers when upgrading from a stale version', () => {
    const stale = { version: HOSTED_VOICE_CONSENT_VERSION - 1, acceptedProviders: ['deepgram' as const], updatedAt: 5 };
    const granted = grantHostedVoiceConsent('openai', 9000, stale);
    // Stale acceptance is discarded by normalization; only the fresh grant remains.
    expect(granted.acceptedProviders).toEqual(['openai']);
  });
});

describe('isHostedVoiceProvider', () => {
  it('recognizes the three hosted providers and rejects local/unknown ones', () => {
    expect(isHostedVoiceProvider('openai')).toBe(true);
    expect(isHostedVoiceProvider('deepgram')).toBe(true);
    expect(isHostedVoiceProvider('flux-voice')).toBe(true);
    expect(isHostedVoiceProvider('system-native')).toBe(false);
    expect(isHostedVoiceProvider('whisper-local')).toBe(false);
    expect(isHostedVoiceProvider('kokoro-local')).toBe(false);
    expect(isHostedVoiceProvider(42)).toBe(false);
  });
});
