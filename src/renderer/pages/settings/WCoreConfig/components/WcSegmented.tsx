/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import styles from '../panes/Panes.module.css';

export type WcSegmentedOption = {
  /** Stable value persisted to config. */
  value: string;
  /** Display label (already translated). */
  label: string;
};

export type WcSegmentedProps = {
  options: readonly WcSegmentedOption[];
  /** Currently-selected value. */
  value: string;
  onChange: (value: string) => void;
  /** Accessible group label. */
  label: string;
  /** Render as read-only (e.g. SEC-6 human-only config viewed in the web console). */
  disabled?: boolean;
};

/**
 * Bespoke segmented control reproducing the mockup-v3 `.segmented` visual. The
 * buttons here are genuine option toggles in a `radiogroup`; we use styled
 * `role="radio"` elements (not raw `<button>`/`<select>`) per the repo's no-raw-
 * interactive-HTML rule, keeping the comp fidelity while staying accessible.
 */
const WcSegmented: React.FC<WcSegmentedProps> = ({ options, value, onChange, label, disabled = false }) => {
  return (
    <div
      className={classNames(styles.segmented, { [styles.segmentedDisabled]: disabled })}
      role='radiogroup'
      aria-label={label}
      aria-disabled={disabled || undefined}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <div
            key={opt.value}
            role='radio'
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : () => onChange(opt.value)}
            onKeyDown={
              disabled
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onChange(opt.value);
                    }
                  }
            }
            className={classNames({ [styles.active]: selected })}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
};

export default WcSegmented;
