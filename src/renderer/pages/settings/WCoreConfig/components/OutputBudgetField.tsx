/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { InputNumber } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import WcSegmented from './WcSegmented';
import styles from '../panes/Panes.module.css';

/**
 * Desktop "Output budget" preference shape (persisted under `wcore.outputBudget`).
 * `auto` omits `--max-tokens` so the engine sizes per-model (#456); `fixed`
 * passes `value` as the per-call `--max-tokens` (#468).
 */
export type OutputBudget = { mode: 'auto' | 'fixed'; value?: number };

/** Default Fixed value offered when a user first switches Auto → Fixed. */
export const DEFAULT_FIXED_BUDGET = 16000;
/** Bounds for the Fixed numeric input (engine clamps the real ceiling anyway). */
export const MIN_FIXED_BUDGET = 256;
export const MAX_FIXED_BUDGET = 200000;

export type OutputBudgetFieldProps = {
  /** Current preference (undefined / absent = Auto). */
  value: OutputBudget | undefined;
  /** Persist a new preference. */
  onChange: (next: OutputBudget) => void;
};

/**
 * Presentational Auto/Fixed output-budget control. Carries NO persistence so the
 * SAME source serves the desktop settings pane (persists via ConfigStorage) and
 * the edge/WebUI console (persists via its settings API) - #468 parity.
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
