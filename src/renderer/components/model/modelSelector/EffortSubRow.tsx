/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trigger } from '@arco-design/web-react';
import { Check, ChevronRight, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EffortLevel } from './modelSelectorTypes';
import styles from './ModelSelectorFlyout.module.css';

type Props = {
  level: EffortLevel;
  onChange: (level: EffortLevel) => void;
};

const LEVELS: EffortLevel[] = ['low', 'medium', 'high'];

/**
 * Conditional "Effort: <level> >" sub-row shown only for effort-capable backends
 * (Codex / WCore / Claude-ACP). Opens an Arco popover with low/medium/high and
 * the reasoning descriptors mirrored from `src/process/task/codexConfig.ts`.
 * Mounted by the flyout only when `vm.effortSupported`.
 */
const EffortSubRow: React.FC<Props> = ({ level, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Descriptors mirror codexConfig.ts:140-142 (the codex reasoning-level catalog).
  const meta: Record<EffortLevel, { name: string; desc: string }> = {
    low: {
      name: t('conversation.modelSelector.effortLow', { defaultValue: 'Low' }),
      desc: t('conversation.modelSelector.effortLowDesc', {
        defaultValue: 'Fast responses with lighter reasoning',
      }),
    },
    medium: {
      name: t('conversation.modelSelector.effortMedium', { defaultValue: 'Medium' }),
      desc: t('conversation.modelSelector.effortMediumDesc', {
        defaultValue: 'Balances speed and reasoning depth',
      }),
    },
    high: {
      name: t('conversation.modelSelector.effortHigh', { defaultValue: 'High' }),
      desc: t('conversation.modelSelector.effortHighDesc', {
        defaultValue: 'Greater reasoning depth for complex problems',
      }),
    },
  };

  const popup = (
    <div className={styles.effortPop} role='menu'>
      {LEVELS.map((lvl) => (
        <div
          key={lvl}
          className={`${styles.effortOpt} ${lvl === level ? styles.effortOptOn : ''}`}
          role='menuitemradio'
          aria-checked={lvl === level}
          tabIndex={0}
          onClick={() => {
            onChange(lvl);
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onChange(lvl);
              setOpen(false);
            }
          }}
        >
          <div>
            <div className={styles.effortOptName}>{meta[lvl].name}</div>
            <div className={styles.effortOptDesc}>{meta[lvl].desc}</div>
          </div>
          {lvl === level && (
            <span className={styles.effortOptCheck}>
              <Check size={16} strokeWidth={2.6} />
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Trigger popup={() => popup} trigger='click' position='bottom' popupVisible={open} onVisibleChange={setOpen}>
      <div
        className={styles.effortRow}
        role='button'
        tabIndex={0}
        aria-haspopup='menu'
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
        }}
      >
        <Zap size={14} color='var(--color-text-2)' strokeWidth={1.9} />
        <span className={styles.effortLbl}>{t('conversation.modelSelector.effort', { defaultValue: 'Effort' })}</span>
        <span className={styles.effortVal}>{meta[level].name}</span>
        <span className={styles.effortChev}>
          <ChevronRight size={13} strokeWidth={2} />
        </span>
      </div>
    </Trigger>
  );
};

export default EffortSubRow;
