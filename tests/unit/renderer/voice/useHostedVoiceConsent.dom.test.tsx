/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * B-01: covers the VOC-03 follow-up affordance logic — reactive `needsConsent`
 * (drives the inline "Review consent" affordance for an existing hosted-but-
 * unconsented user) and the shared error-guidance mapping.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(() => Promise.resolve()) }));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: (...a: unknown[]) => storage.get(...a), set: (...a: unknown[]) => storage.set(...a) },
}));

import {
  useHostedVoiceConsent,
  hostedVoiceConsentErrorGuidance,
  VOICE_HOSTED_CONSENT_CHANGED_EVENT,
} from '@/renderer/hooks/voice/useHostedVoiceConsent';

describe('hostedVoiceConsentErrorGuidance', () => {
  it('maps both fail-closed consent codes to human guidance', () => {
    expect(hostedVoiceConsentErrorGuidance('TTS_HOSTED_CONSENT_REQUIRED')).toMatch(/Voice settings/);
    expect(hostedVoiceConsentErrorGuidance('STT_HOSTED_CONSENT_REQUIRED')).toMatch(/Voice settings/);
  });

  it('returns null for unrelated codes so callers keep the raw code', () => {
    expect(hostedVoiceConsentErrorGuidance('STT_RATE_LIMITED')).toBeNull();
    expect(hostedVoiceConsentErrorGuidance('TTS_EMPTY_AUDIO')).toBeNull();
  });

  it('matches the verbose STT `CODE: message` form the service throws', () => {
    expect(hostedVoiceConsentErrorGuidance('STT_HOSTED_CONSENT_REQUIRED: accept the disclosure')).toMatch(
      /Voice settings/
    );
  });
});

describe('useHostedVoiceConsent — needsConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stays false until the stored consent has loaded (no first-render flash)', async () => {
    let resolveGet!: (v: unknown) => void;
    storage.get.mockReturnValue(new Promise((r) => (resolveGet = r)));
    const { result } = renderHook(() => useHostedVoiceConsent());

    // Before the async load resolves, the affordance must not show even for a
    // hosted provider — otherwise an already-consented user sees a flash.
    expect(result.current.needsConsent('openai')).toBe(false);

    await act(async () => {
      resolveGet(undefined); // no stored consent
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.needsConsent('openai')).toBe(true));
  });

  it('is true for a hosted+unconsented provider and false for a local one', async () => {
    storage.get.mockResolvedValue(undefined); // no stored consent
    const { result } = renderHook(() => useHostedVoiceConsent());
    await waitFor(() => expect(result.current.needsConsent('openai')).toBe(true));

    expect(result.current.needsConsent('deepgram')).toBe(true);
    expect(result.current.needsConsent('flux-voice')).toBe(true);
    expect(result.current.needsConsent('system-native')).toBe(false);
    expect(result.current.needsConsent('whisper-local')).toBe(false);
    expect(result.current.needsConsent('kokoro-local')).toBe(false);
  });

  it('ensureConsent resolves true for local and already-consented providers without opening the modal', async () => {
    storage.get.mockResolvedValue({ version: 1, acceptedProviders: ['openai'], updatedAt: 1 });
    const { result } = renderHook(() => useHostedVoiceConsent());
    await waitFor(() => expect(storage.get).toHaveBeenCalled());

    await expect(result.current.ensureConsent('system-native')).resolves.toBe(true); // local bypass
    await expect(result.current.ensureConsent('openai')).resolves.toBe(true); // already consented
    // deepgram is hosted+unconsented → ensureConsent must NOT auto-resolve true (opens modal).
    let settled: boolean | 'pending' = 'pending';
    void result.current.ensureConsent('deepgram').then((v) => (settled = v));
    await Promise.resolve();
    expect(settled).toBe('pending');
  });

  it('flips to false once consent for that provider is stored and the changed-event fires', async () => {
    storage.get.mockResolvedValue(undefined);
    const { result } = renderHook(() => useHostedVoiceConsent());
    await waitFor(() => expect(result.current.needsConsent('openai')).toBe(true));

    // Simulate consent granted elsewhere, then the cross-section refresh event.
    storage.get.mockResolvedValue({ version: 1, acceptedProviders: ['openai'], updatedAt: 1 });
    act(() => {
      window.dispatchEvent(new CustomEvent(VOICE_HOSTED_CONSENT_CHANGED_EVENT));
    });

    await waitFor(() => expect(result.current.needsConsent('openai')).toBe(false));
    // deepgram was not accepted, so it still needs consent.
    expect(result.current.needsConsent('deepgram')).toBe(true);
  });
});
