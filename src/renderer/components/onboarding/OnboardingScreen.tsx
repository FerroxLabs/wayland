/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Right } from '@icon-park/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classifyScenario } from '@/common/types/onboarding';
import type { DetectionResult, OnboardingScenario } from '@/common/types/onboarding';
import { openExternalUrl } from '@renderer/utils/platform';
import ConnectFluxStep from './ConnectFluxStep';
import OnboardingChips from './OnboardingChips';
import styles from './OnboardingOverlay.module.css';

const OLLAMA_URL = 'https://ollama.com';

type OnboardingScreenProps = {
  detection: DetectionResult;
  /** Dismiss onboarding (sets the completed flag). Used by skip + ghost CTAs. */
  onDismiss: () => void;
  /** Connect succeeded - dismiss and let the user start chatting. */
  onConnected: () => void;
};

const BrandRow: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.brandRow}>
      <span className={styles.brandGlyph}>
        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
          <path
            d='M4 16L8 8L12 14L16 6L20 16'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </span>
      <span className={styles.brandName}>{t('onboarding.brand')}</span>
    </div>
  );
};

/** Greeting headline with the orange period, using the detected name when present. */
const Greeting: React.FC<{ scenario: OnboardingScenario; name: string }> = ({ scenario, name }) => {
  const { t } = useTranslation();
  // Without a name, fall back to the neutral "Welcome to Wayland." for the
  // personalised scenarios (A/C/D) - never render "undefined" or an empty name.
  const useName = name.trim().length > 0;
  let text: string;
  if (scenario === 'B' || !useName) {
    text = t('onboarding.welcome');
  } else if (scenario === 'A') {
    text = t('onboarding.scenarioA.greeting', { name });
  } else if (scenario === 'C') {
    text = t('onboarding.scenarioC.greeting', { name });
  } else {
    text = t('onboarding.scenarioD.greeting', { name });
  }
  return (
    <h1 className={styles.greeting}>
      {text}
      <span className={styles.greetingPunct}>.</span>
    </h1>
  );
};

/**
 * Scenario-driven onboarding content. Classifies the detection result into
 * A/B/C/D and renders the matching V4-locked copy, CTAs, and (when the user
 * asks to connect) the inline Connect Flux Router step.
 */
const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ detection, onDismiss, onConnected }) => {
  const { t } = useTranslation();
  const [showConnect, setShowConnect] = useState(false);
  const scenario = classifyScenario(detection);

  const openConnect = () => setShowConnect(true);

  if (showConnect) {
    return (
      <div className={styles.surface}>
        <BrandRow />
        <ConnectFluxStep onConnected={onConnected} onBack={() => setShowConnect(false)} />
      </div>
    );
  }

  return (
    <div className={styles.surface}>
      <BrandRow />
      <Greeting scenario={scenario} name={detection.name} />

      {scenario === 'A' && (
        <>
          <p className={styles.greetingSub}>{t('onboarding.scenarioA.subGeneric')}</p>
          <OnboardingChips detection={detection} />
          <div className={styles.sutherland}>
            <p className={styles.sutherlandLede}>{t('onboarding.scenarioA.sutherlandLede')}</p>
            <p className={styles.sutherlandBody}>{t('onboarding.scenarioA.sutherlandBody')}</p>
            <p className={styles.microTrust}>{t('onboarding.scenarioA.microTrust')}</p>
          </div>
          <div className={styles.ctaRow}>
            <Button type='primary' icon={<Right />} onClick={openConnect}>
              {t('onboarding.scenarioA.primary')}
            </Button>
            <Button type='text' onClick={onDismiss}>
              {t('onboarding.scenarioA.ghost')}
            </Button>
          </div>
        </>
      )}

      {scenario === 'B' && (
        <>
          <p className={styles.greetingSub}>{t('onboarding.scenarioB.sub')}</p>
          <div className={styles.heroCard}>
            <div className={styles.heroLeft}>
              <span className={styles.recommendedTag}>{t('onboarding.scenarioB.heroTag')}</span>
              <h3 className={styles.heroTitle}>{t('onboarding.scenarioB.heroTitle')}</h3>
              <p className={styles.heroBody}>{t('onboarding.scenarioB.heroBody')}</p>
              <div className={styles.heroFoot}>{t('onboarding.scenarioB.heroFoot')}</div>
            </div>
            <div className={styles.heroRight}>
              <Button type='primary' size='large' icon={<Right />} onClick={openConnect}>
                {t('onboarding.scenarioB.heroCta')}
              </Button>
            </div>
          </div>
          <div className={styles.secondaryGrid}>
            <div className={styles.pathCard} role='button' tabIndex={0} onClick={openConnect}>
              <h4 className={styles.pathTitle}>{t('onboarding.scenarioB.pasteKeyTitle')}</h4>
              <p className={styles.pathBody}>{t('onboarding.scenarioB.pasteKeyBody')}</p>
              <div className={styles.pathFoot}>{t('onboarding.scenarioB.pasteKeyFoot')}</div>
            </div>
            <div
              className={`${styles.pathCard} ${styles.pathCardMuted}`}
              role='button'
              tabIndex={0}
              onClick={() => void openExternalUrl(OLLAMA_URL)}
            >
              <h4 className={styles.pathTitle}>{t('onboarding.scenarioB.ollamaTitle')}</h4>
              <p className={styles.pathBody}>{t('onboarding.scenarioB.ollamaBody')}</p>
              <div className={styles.pathFoot}>{t('onboarding.scenarioB.ollamaFoot')}</div>
            </div>
          </div>
        </>
      )}

      {scenario === 'C' && (
        <>
          <p className={styles.greetingSub}>{t('onboarding.scenarioC.subGeneric')}</p>
          <OnboardingChips detection={detection} />
          <div className={styles.sutherland}>
            <p className={styles.sutherlandLede}>{t('onboarding.scenarioC.sutherlandLede')}</p>
            <p className={styles.sutherlandBody}>{t('onboarding.scenarioC.sutherlandBody')}</p>
            <p className={styles.microTrust}>{t('onboarding.scenarioC.microTrust')}</p>
          </div>
          <div className={styles.ctaRow}>
            <Button type='primary' icon={<Right />} onClick={openConnect}>
              {t('onboarding.scenarioC.primary')}
            </Button>
            <Button type='text' onClick={onDismiss}>
              {t('onboarding.scenarioC.ghost')}
            </Button>
          </div>
        </>
      )}

      {scenario === 'D' && (
        <>
          <p className={styles.greetingSub}>{t('onboarding.scenarioD.sub')}</p>
          <OnboardingChips detection={detection} />
          <div className={styles.sutherland}>
            <p className={styles.sutherlandBody}>{t('onboarding.scenarioD.body')}</p>
          </div>
          <div className={styles.ctaRow}>
            <Button type='primary' icon={<Right />} onClick={onDismiss}>
              {t('onboarding.scenarioD.primary')}
            </Button>
          </div>
        </>
      )}

      <div className={styles.footer}>
        {scenario === 'B' ? (
          <span>{t('onboarding.footer.noLockIn')}</span>
        ) : scenario === 'C' ? (
          <span>{t('onboarding.footer.keysKeepWorking')}</span>
        ) : (
          <span>{t('onboarding.footer.manage')}</span>
        )}
        {scenario !== 'D' && (
          <Button type='text' size='mini' onClick={onDismiss}>
            {t('onboarding.footer.skip')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
