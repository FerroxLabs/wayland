/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, KeyRound, Loader2, Zap } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { ConnectFluxResult, DetectionResult } from '@/common/types/onboarding';
import type { ProviderId } from '@process/providers/types';
import { providerLabel } from './providerLabel';
import styles from './OnboardingFlow.module.css';

/** Inline Google "G" mark - brand colors are intentional literals. */
const GoogleMark: React.FC = () => (
  <svg viewBox='0 0 24 24' width={20} height={20} aria-hidden focusable='false'>
    <path fill='#4285F4' d='M22.5 12.2c0-.7-.1-1.4-.2-2H12v4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-8Z' />
    <path
      fill='#34A853'
      d='M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23Z'
    />
    <path fill='#FBBC05' d='M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8l3.7-2.8Z' />
    <path fill='#EA4335' d='M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4Z' />
  </svg>
);

type DoorKey = 'flux' | 'google' | 'detected';

type ConnectDoorsProps = {
  detection: DetectionResult;
  /** A provider connected successfully - land the user operational. */
  onConnected: () => void;
  /** Switch to the paste-a-Flux-key fallback step. */
  onPasteKey: () => void;
};

/**
 * The single connect surface. Flux is the recommended hero (one key, every
 * model, free, no card - one-click PKCE). Beside it sit the genuinely-free
 * doors: Google (one click → Gemini models) and the user's own detected key.
 * Every door lands the user operational; nobody is forced onto Flux.
 */
const ConnectDoors: React.FC<ConnectDoorsProps> = ({ detection, onConnected, onPasteKey }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<DoorKey | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const detectedProvider = detection.envKeys[0];

  const connectFlux = useCallback(async () => {
    if (busy) return;
    setBusy('flux');
    setErrorKey(null);
    try {
      const res: ConnectFluxResult = await ipcBridge.onboarding.connectFlux.invoke();
      if (res.ok) {
        onConnected();
        return;
      }
      if ('error' in res && res.error !== 'cancelled') {
        setErrorKey(`onboarding.doors.error.${res.error}`);
      }
    } catch {
      setErrorKey('onboarding.doors.error.unknown');
    } finally {
      setBusy(null);
    }
  }, [busy, onConnected]);

  const connectGoogle = useCallback(async () => {
    if (busy) return;
    setBusy('google');
    setErrorKey(null);
    try {
      const auth = await ipcBridge.googleAuth.login.invoke({});
      if (!auth.success) {
        setErrorKey('onboarding.doors.error.unknown');
        return;
      }
      const res = await ipcBridge.modelRegistry.connect
        .invoke({ providerId: 'google-gemini', creds: { useGoogleAuth: true } })
        .catch(() => ({ ok: false as const, error: 'unknown' as const }));
      if (res.ok) return onConnected();
      setErrorKey('onboarding.doors.error.unknown');
    } catch {
      setErrorKey('onboarding.doors.error.unknown');
    } finally {
      setBusy(null);
    }
  }, [busy, onConnected]);

  const connectDetected = useCallback(async () => {
    if (busy || !detectedProvider) return;
    setBusy('detected');
    setErrorKey(null);
    try {
      const res = await ipcBridge.modelRegistry.connect
        .invoke({ providerId: detectedProvider as ProviderId, creds: { useDiscovered: true } })
        .catch(() => ({ ok: false as const, error: 'unknown' as const }));
      if (res.ok) return onConnected();
      setErrorKey(`onboarding.doors.error.${res.error ?? 'unknown'}`);
    } catch {
      setErrorKey('onboarding.doors.error.unknown');
    } finally {
      setBusy(null);
    }
  }, [busy, detectedProvider, onConnected]);

  return (
    <div className='flex flex-col gap-12px'>
      <div className={styles.doorGrid}>
        {/* Hero - Flux one-click. */}
        <button
          type='button'
          data-testid='connect-door-flux'
          className={`${styles.door} ${styles.doorHero}`}
          onClick={() => void connectFlux()}
          disabled={busy !== null}
        >
          <span className={styles.doorIcon}>{busy === 'flux' ? <Loader2 size={20} className='animate-spin' /> : <Zap size={20} />}</span>
          <span className={styles.doorMain}>
            <span className={styles.doorTitleRow}>
              <span className={styles.doorTitle}>{t('onboarding.doors.flux.title', { defaultValue: 'Connect Flux' })}</span>
              <span className={styles.recommendedTag}>{t('onboarding.doors.recommended', { defaultValue: 'Recommended' })}</span>
            </span>
            <span className={styles.doorBody}>
              {t('onboarding.doors.flux.body', {
                defaultValue: 'One key, every model. The right tool for each job, at the best price.',
              })}
            </span>
            <span className={styles.doorFoot}>
              {busy === 'flux'
                ? t('onboarding.doors.flux.connecting', { defaultValue: 'Opening your browser…' })
                : t('onboarding.doors.flux.foot', { defaultValue: 'Free · no card · opens your browser' })}
            </span>
          </span>
          <ArrowRight size={18} className={styles.doorArrow} />
        </button>

        {/* Free door - Google → Gemini. */}
        <button
          type='button'
          data-testid='connect-door-google'
          className={styles.door}
          onClick={() => void connectGoogle()}
          disabled={busy !== null}
        >
          <span className={styles.doorIcon}>{busy === 'google' ? <Loader2 size={20} className='animate-spin' /> : <GoogleMark />}</span>
          <span className={styles.doorMain}>
            <span className={styles.doorTitle}>{t('onboarding.doors.google.title', { defaultValue: 'Continue with Google' })}</span>
            <span className={styles.doorBody}>
              {t('onboarding.doors.google.body', { defaultValue: 'One click puts the Gemini models in your picker.' })}
            </span>
            <span className={styles.doorFoot}>{t('onboarding.doors.google.foot', { defaultValue: 'Free with your Google account' })}</span>
          </span>
          <ArrowRight size={18} className={styles.doorArrow} />
        </button>

        {/* Free door - the user's own detected key. */}
        {detectedProvider && (
          <button
            type='button'
            data-testid='connect-door-detected'
            className={styles.door}
            onClick={() => void connectDetected()}
            disabled={busy !== null}
          >
            <span className={styles.doorIcon}>{busy === 'detected' ? <Loader2 size={20} className='animate-spin' /> : <KeyRound size={20} />}</span>
            <span className={styles.doorMain}>
              <span className={styles.doorTitle}>
                {t('onboarding.doors.detected.title', {
                  defaultValue: 'Use your {{provider}} key',
                  provider: providerLabel(detectedProvider),
                })}
              </span>
              <span className={styles.doorBody}>
                {t('onboarding.doors.detected.body', { defaultValue: 'We found it in your environment. Tested before it is saved.' })}
              </span>
              <span className={styles.doorFoot}>{t('onboarding.doors.detected.foot', { defaultValue: 'Your key, your billing' })}</span>
            </span>
            <ArrowRight size={18} className={styles.doorArrow} />
          </button>
        )}
      </div>

      {errorKey && <p className={styles.doorError}>{t(errorKey, { defaultValue: 'That did not go through. Try again.' })}</p>}

      <button type='button' className='text-13px text-t-tertiary hover:text-t-secondary self-start bg-transparent border-none cursor-pointer p-0' onClick={onPasteKey} disabled={busy !== null}>
        {t('onboarding.doors.pasteInstead', { defaultValue: 'Paste a Flux key instead' })}
      </button>
    </div>
  );
};

export default ConnectDoors;
