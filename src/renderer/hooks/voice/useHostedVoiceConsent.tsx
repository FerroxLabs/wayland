/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * VOC-03 renderer consent path.
 *
 * `ensureConsent(provider)` resolves `true` immediately for a local provider or
 * one already acknowledged; otherwise it opens a disclosure modal and resolves
 * `true` only if the user accepts. On acceptance it persists the acknowledgment
 * to `tools.voiceHostedConsent`, which the main-process fail-closed gate reads
 * before any hosted TTS/STT call. Render `consentModal` somewhere in the
 * section that uses the hook.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '@arco-design/web-react';
import { ConfigStorage } from '@/common/config/storage';
import {
  grantHostedVoiceConsent,
  hostedVoiceConsentGranted,
  isHostedVoiceProvider,
  type HostedVoiceConsent,
  type HostedVoiceProvider,
} from '@/common/types/voiceConsent';

export const VOICE_HOSTED_CONSENT_CHANGED_EVENT = 'wayland:voice-hosted-consent-changed';

type ProviderDisclosure = { label: string; endpoint: string };

const PROVIDER_DISCLOSURE: Record<HostedVoiceProvider, ProviderDisclosure> = {
  openai: { label: 'OpenAI', endpoint: 'api.openai.com' },
  deepgram: { label: 'Deepgram', endpoint: 'api.deepgram.com' },
  'flux-voice': { label: 'Flux Router', endpoint: 'api.fluxrouter.ai' },
};

type PendingRequest = { provider: HostedVoiceProvider; resolve: (accepted: boolean) => void };

export function useHostedVoiceConsent(): {
  ensureConsent: (provider: string) => Promise<boolean>;
  /**
   * Reactive: true when `provider` is hosted AND not yet consented, so a section
   * can render an inline "review consent" affordance. Re-selecting the already
   * selected hosted provider fires no Select onChange, so without this the only
   * recovery for an existing hosted-but-unconsented user is switch-away-and-back.
   */
  needsConsent: (provider: string) => boolean;
  consentModal: React.ReactNode;
} {
  const consentRef = useRef<HostedVoiceConsent | null>(null);
  const [consent, setConsent] = useState<HostedVoiceConsent | null>(null);
  // Gates the affordance until the stored consent has been read once, so an
  // already-consented user never sees a spurious "review consent" flash on the
  // first render (when `consent` is still null before the async load resolves).
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<PendingRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void ConfigStorage.get('tools.voiceHostedConsent').then((stored) => {
        if (cancelled) return;
        const next = (stored as HostedVoiceConsent | undefined) ?? null;
        consentRef.current = next;
        setConsent(next);
        setLoaded(true);
      });
    };
    load();
    window.addEventListener(VOICE_HOSTED_CONSENT_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(VOICE_HOSTED_CONSENT_CHANGED_EVENT, load);
    };
  }, []);

  const ensureConsent = useCallback((provider: string): Promise<boolean> => {
    // Local providers never leave the device — no consent surface.
    if (!isHostedVoiceProvider(provider)) return Promise.resolve(true);
    if (hostedVoiceConsentGranted(provider, consentRef.current)) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => setPending({ provider, resolve }));
  }, []);

  const needsConsent = useCallback(
    (provider: string): boolean =>
      loaded && isHostedVoiceProvider(provider) && !hostedVoiceConsentGranted(provider, consent),
    [consent, loaded]
  );

  const settle = useCallback(
    async (accepted: boolean) => {
      const request = pending;
      if (!request) return;
      setPending(null);
      if (accepted) {
        const next = grantHostedVoiceConsent(request.provider, Date.now(), consentRef.current);
        consentRef.current = next;
        setConsent(next);
        try {
          await ConfigStorage.set('tools.voiceHostedConsent', next);
          window.dispatchEvent(new CustomEvent(VOICE_HOSTED_CONSENT_CHANGED_EVENT));
        } catch (error) {
          console.error('[useHostedVoiceConsent] persist failed:', error);
        }
      }
      request.resolve(accepted);
    },
    [pending]
  );

  const disclosure = pending ? PROVIDER_DISCLOSURE[pending.provider] : null;

  const consentModal = (
    <Modal
      visible={pending !== null}
      title='Use hosted voice?'
      okText='I understand, enable it'
      cancelText='Cancel'
      onOk={() => void settle(true)}
      onCancel={() => void settle(false)}
      okButtonProps={{ 'data-testid': 'voice-consent-accept' } as Record<string, unknown>}
      cancelButtonProps={{ 'data-testid': 'voice-consent-cancel' } as Record<string, unknown>}
      maskClosable={false}
      escToExit
      className='hosted-voice-consent-modal'
    >
      {disclosure && (
        <div className='space-y-8px text-14px text-t-primary'>
          <p>
            This voice provider processes your audio and/or text <strong>off your device</strong>. Enabling it sends
            that data to <strong>{disclosure.label}</strong> ({disclosure.endpoint}) over your connected credential.
          </p>
          <p className='text-13px text-t-secondary'>
            Retention, usage, and any per-request cost are governed by {disclosure.label}&rsquo;s terms, not by
            Wayland. Wayland does not store the audio or text it forwards. Prefer a local provider (system voice,
            Whisper, Kokoro) to keep everything on your machine.
          </p>
        </div>
      )}
    </Modal>
  );

  return { ensureConsent, needsConsent, consentModal };
}

/**
 * Maps the fail-closed hosted-consent error codes surfaced by the TTS/STT bridges
 * to human guidance. Returns null for any other code so callers fall back to the
 * raw code. Kept here so both settings sections and voice surfaces share one map.
 */
export function hostedVoiceConsentErrorGuidance(errorCode: string): string | null {
  // Normalize: the STT service throws a verbose `CODE: message` form while the
  // TTS bridge returns the bare code. Match on the leading code either way.
  const code = String(errorCode).split(':')[0]?.trim();
  if (code === 'TTS_HOSTED_CONSENT_REQUIRED' || code === 'STT_HOSTED_CONSENT_REQUIRED') {
    return 'Hosted voice needs your consent. Open Voice settings and accept the disclosure for this provider, then try again.';
  }
  return null;
}
