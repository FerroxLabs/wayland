/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, PenLine, Microscope, Hammer, Play, Map, GraduationCap } from 'lucide-react';
import { INTENT_KEYS, INTENTS, type IntentKey, type IntentDef } from '../../intents';
import styles from './IntentPillBar.module.css';

export type IntentPillBarProps = {
  /** Currently active intent, or null when no pill is selected. */
  activeIntent: IntentKey | null;
  /** Fires with the intent key on click, or null when the active pill is re-clicked (toggle off). */
  onSelect: (intent: IntentKey | null) => void;
};

const ICON_MAP: Record<IntentDef['icon'], React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  'dollar-sign': DollarSign,
  'pen-line': PenLine,
  microscope: Microscope,
  hammer: Hammer,
  play: Play,
  map: Map,
  'graduation-cap': GraduationCap,
};

const IntentPillBar: React.FC<IntentPillBarProps> = ({ activeIntent, onSelect }) => {
  const { t } = useTranslation();

  const handleClick = useCallback(
    (key: IntentKey) => {
      onSelect(activeIntent === key ? null : key);
    },
    [activeIntent, onSelect]
  );

  return (
    <div
      className={styles.pillBar}
      role='tablist'
      aria-label={t('guid.newChat.pillBar.label', { defaultValue: 'Choose an intent' })}
      data-testid='intent-pill-bar'
    >
      {INTENT_KEYS.map((key) => {
        const intent = INTENTS[key];
        const isActive = activeIntent === key;
        const label = t(`guid.newChat.intent.${key}`, { defaultValue: intent.label });
        const Icon = ICON_MAP[intent.icon];
        return (
          <button
            key={key}
            type='button'
            className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
            role='tab'
            aria-selected={isActive}
            aria-label={t('guid.newChat.pillBar.pillLabel', {
              defaultValue: '{{label}} intent',
              label,
            })}
            data-intent={key}
            onClick={() => handleClick(key)}
          >
            <Icon size={14} strokeWidth={2} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default IntentPillBar;
