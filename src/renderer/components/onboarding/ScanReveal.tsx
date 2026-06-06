/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Boxes, Check, KeyRound, Radio, Terminal, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DetectionResult } from '@/common/types/onboarding';
import { providerLabel } from './providerLabel';
import styles from './OnboardingFlow.module.css';

type RevealItem = { key: string; label: string; icon: React.ReactNode };

const pretty = (id: string): string =>
  id
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

type ScanRevealProps = { detection: DetectionResult };

/**
 * Reveals what detection already found - staggered fade-in, never a fake
 * "scanning…" wait (detection has resolved before the overlay opens; a spinner
 * here would be a dark pattern). The drama is in the findings, not the wait.
 */
const ScanReveal: React.FC<ScanRevealProps> = ({ detection }) => {
  const { t } = useTranslation();

  const items = useMemo<RevealItem[]>(() => {
    const out: RevealItem[] = [];
    for (const cli of detection.clis) {
      out.push({ key: `cli-${cli}`, label: pretty(cli), icon: <Terminal size={14} /> });
    }
    if (detection.claudePro) out.push({ key: 'claude-pro', label: 'Claude · Pro', icon: <Check size={14} /> });
    for (const k of detection.envKeys) {
      out.push({ key: `env-${k}`, label: `${providerLabel(k)} key`, icon: <KeyRound size={14} /> });
    }
    if (detection.ollama.running) {
      out.push({
        key: 'ollama',
        label: t('onboarding.scan.ollama', {
          defaultValue: 'Ollama · {{count}} local',
          count: detection.ollama.models.length,
        }),
        icon: <Boxes size={14} />,
      });
    }
    if (detection.fluxConnected) out.push({ key: 'flux', label: 'Flux Router · connected', icon: <Zap size={14} /> });
    if (detection.fluxDesktop.running) out.push({ key: 'flux-desktop', label: 'Flux Desktop', icon: <Radio size={14} /> });
    return out;
  }, [detection, t]);

  return (
    <div className='flex flex-col gap-12px'>
      {items.length > 0 ? (
        <div className={styles.revealGrid}>
          {items.map((item, i) => (
            <span key={item.key} className={styles.revealChip} style={{ animationDelay: `${i * 70}ms` }}>
              <span className={styles.revealChipIcon}>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.revealEmpty}>
          {t('onboarding.scan.empty', { defaultValue: 'Fresh machine, clean slate. Let us get you powered up in about a minute.' })}
        </p>
      )}
    </div>
  );
};

export default ScanReveal;
