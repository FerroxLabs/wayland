/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { InputNumber } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import {
  type OutputBudget,
  DEFAULT_FIXED_BUDGET,
  MIN_FIXED_BUDGET,
  MAX_FIXED_BUDGET,
} from '@/common/config/outputBudget';
import WcSegmented from './WcSegmented';
import styles from '../panes/Panes.module.css';

export { type OutputBudget, DEFAULT_FIXED_BUDGET, MIN_FIXED_BUDGET, MAX_FIXED_BUDGET };

export type OutputBudgetFieldProps = {
  /** Current preference (undefined / absent = Auto). */
  value: OutputBudget | undefined;
  /** Persist a new preference. */
  onChange: (next: OutputBudget) => void;
};

/**
 * Presentational Auto/Fixed output-budget control. Carries NO persistence, so
 * the host wires the store (RuntimePane → ConfigStorage). Kept presentational so
 * the same source can be reused by the edge/WebUI console (tracked in #473).
 */
const OutputBudgetField: React.FC<OutputBudgetFieldProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const mode = value?.mode === 'fixed' ? 'fixed' : 'auto';
  const fixedValue = typeof value?.value === 'number' && value.value > 0 ? value.value : DEFAULT_FIXED_BUDGET;

  const onModeChange = useCallback(
    (next: string): void => {
      if (next === 'fixed') onChange({ mode: 'fixed', value: fixedValue });
      else onChange({ mode: 'auto' });
    },
    [onChange, fixedValue]
  );

  const onValueChange = useCallback(
    (v: number | undefined): void => {
      const n = typeof v === 'number' && v > 0 ? v : DEFAULT_FIXED_BUDGET;
      onChange({ mode: 'fixed', value: n });
    },
    [onChange]
  );

  const options = [
    { value: 'auto', label: t('settings.wcoreConfig.runtime.outputBudgetAuto', { defaultValue: 'Auto' }) },
    { value: 'fixed', label: t('settings.wcoreConfig.runtime.outputBudgetFixed', { defaultValue: 'Fixed' }) },
  ];

  return (
    <div className={styles.listRow}>
      <div>
        <div className={styles.lrLabel}>
          {t('settings.wcoreConfig.runtime.outputBudget', { defaultValue: 'Output budget' })}
        </div>
        <div className={styles.lrDesc}>
          {mode === 'fixed'
            ? t('settings.wcoreConfig.runtime.outputBudgetFixedDesc', {
                defaultValue:
                  'Cap each reply at a fixed max output. The engine still clamps to the model’s real limit.',
              })
            : t('settings.wcoreConfig.runtime.outputBudgetAutoDesc', {
                defaultValue:
                  'The engine sizes each reply per-model. Anthropic models always get their required value automatically — no action needed.',
              })}
        </div>
      </div>
      <div className={styles.lrControl}>
        <div className={styles.sliderWrap}>
          <WcSegmented
            options={options}
            value={mode}
            onChange={onModeChange}
            label={t('settings.wcoreConfig.runtime.outputBudget', { defaultValue: 'Output budget' })}
          />
          {mode === 'fixed' && (
            <InputNumber
              aria-label={t('settings.wcoreConfig.runtime.outputBudgetValue', { defaultValue: 'Max output tokens' })}
              min={MIN_FIXED_BUDGET}
              max={MAX_FIXED_BUDGET}
              step={1024}
              value={fixedValue}
              onChange={onValueChange}
              style={{ width: 120 }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputBudgetField;
