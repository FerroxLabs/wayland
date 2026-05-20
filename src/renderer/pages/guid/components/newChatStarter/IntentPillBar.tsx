/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { INTENT_KEYS, INTENTS, type IntentKey } from '../../intents';
import styles from './IntentPillBar.module.css';

export type IntentPillBarProps = {
  /** Currently active intent, or null when no pill is selected. */
  activeIntent: IntentKey | null;
  /** Fires with the intent key on click, or null when the active pill is re-clicked (toggle off). */
  onSelect: (intent: IntentKey | null) => void;
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
    <div className={styles.pillBar} role='tablist' aria-label={t('guid.newChat.pillBar.label', { defaultValue: 'Choose an intent' })}>
      {INTENT_KEYS.map((key) => {
        const intent = INTENTS[key];
        const isActive = activeIntent === key;
        const label = t(`guid.newChat.intent.${key}`, { defaultValue: intent.label });
        return (
          <Button
            key={key}
            size='default'
            shape='round'
            type={isActive ? 'primary' : 'secondary'}
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
            {label}
          </Button>
        );
      })}
    </div>
  );
};

export default IntentPillBar;
