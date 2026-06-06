/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DetectionResult } from '@/common/types/onboarding';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import styles from './OnboardingOverlay.module.css';

type ChipKind = 'success' | 'flux';

type Chip = {
  id: string;
  label: string;
  kind: ChipKind;
};

/**
 * The detected-environment chip row. Renders only what detection actually
 * found - CLIs, Claude Pro, Ollama, env keys, Flux. Never fabricates state.
 */
const OnboardingChips: React.FC<{ detection: DetectionResult }> = ({ detection }) => {
  const { t } = useTranslation();
  const chips: Chip[] = [];

  for (const cli of detection.clis) {
    chips.push({ id: `cli-${cli}`, label: t('onboarding.chips.cli', { name: cli }), kind: 'success' });
  }
  if (detection.claudePro) {
    chips.push({ id: 'claude-pro', label: t('onboarding.chips.claudePro'), kind: 'success' });
  }
  if (detection.ollama.running) {
    chips.push({
      id: 'ollama',
      label: t('onboarding.chips.ollama', { count: detection.ollama.models.length }),
      kind: 'success',
    });
  }
  for (const envKey of detection.envKeys) {
    chips.push({ id: `env-${envKey}`, label: t('onboarding.chips.envKey', { name: envKey }), kind: 'success' });
  }
  if (detection.fluxConnected) {
    chips.push({ id: 'flux-router', label: t('onboarding.chips.fluxRouter'), kind: 'flux' });
  }
  if (detection.fluxDesktop.running) {
    chips.push({ id: 'flux-desktop', label: t('onboarding.chips.fluxDesktop'), kind: 'success' });
  }

  if (chips.length === 0) return null;

  return (
    <div className={styles.detectedRow}>
      {chips.map((chip) => (
        <span key={chip.id} className={`${styles.chip} ${chip.kind === 'flux' ? styles.chipFlux : styles.chipSuccess}`}>
          <span className={styles.chipIcon}>
            {chip.kind === 'flux' ? <FluxRouterMark size={14} color='currentColor' /> : <Check size={14} />}
          </span>
          {chip.label}
        </span>
      ))}
    </div>
  );
};

export default OnboardingChips;
