/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Button, Slider } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@renderer/hooks/context/ThemeContext';
import { FONT_SCALE_DEFAULT, FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP } from '@renderer/hooks/ui/useFontScale';

// Floating point comparison tolerance
const EPSILON = 0.001;
const RESET_THRESHOLD = 0.01;

/**
 * Clamp value within valid font scale range
 * @param value - Value to clamp
 * @returns Clamped value
 */
const clamp = (value: number) => Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value));

/**
 * Font size control component
 *
 * Provides interface scaling with slider and button controls
 */
const FontSizeControl: React.FC = () => {
  const { t } = useTranslation();
  const { fontScale, setFontScale, theme } = useThemeContext();

  // Format display value as percentage
  const formattedValue = useMemo(() => `${Math.round(fontScale * 100)}%`, [fontScale]);

  // Default mark (100% position)
  const defaultMarks = useMemo(
    () => ({
      1: <span className='font-scale-default-mark' aria-hidden='true' title='100%'></span>,
    }),
    []
  );

  /**
   * Handle slider value change
   * @param value - New scale value
   */
  const handleSliderChange = (value: number | number[]) => {
    if (typeof value === 'number') {
      void setFontScale(clamp(Number(value.toFixed(2))));
    }
  };

  /**
   * Handle step adjustment
   * @param delta - Step delta (positive to increase, negative to decrease)
   */
  const handleStep = (delta: number) => {
    const next = clamp(Number((fontScale + delta).toFixed(2)));
    void setFontScale(next);
  };

  /**
   * Reset to default value
   */
  const handleReset = () => {
    void setFontScale(FONT_SCALE_DEFAULT);
  };
  const isResetDisabled = Math.abs(fontScale - FONT_SCALE_DEFAULT) < RESET_THRESHOLD;

  return (
    <div className='flex flex-col gap-2 w-full md:max-w-620px'>
      <div className='flex items-center flex-wrap gap-x-12px gap-y-10px w-full'>
        <div className='flex items-center gap-8px flex-1 min-w-240px'>
          <Button
            size='mini'
            type='secondary'
            shape='circle'
            className='w-28px h-28px !min-w-28px flex items-center justify-center p-0'
            onClick={() => handleStep(-FONT_SCALE_STEP)}
            disabled={fontScale <= FONT_SCALE_MIN + EPSILON}
          >
            -
          </Button>
          {/* Slider covers 80%-150% range and persists value */}
          <Slider
            className='flex-1 min-w-180px font-scale-slider p-0 m-0'
            showTicks
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={FONT_SCALE_STEP}
            value={fontScale}
            onChange={handleSliderChange}
            marks={defaultMarks}
          />
          <Button
            size='mini'
            type='secondary'
            shape='circle'
            className='w-28px h-28px !min-w-28px flex items-center justify-center p-0'
            onClick={() => handleStep(FONT_SCALE_STEP)}
            disabled={fontScale >= FONT_SCALE_MAX - EPSILON}
          >
            +
          </Button>
        </div>
        <div className='flex items-center gap-10px ml-auto'>
          <span
            className='text-13px text-t-primary text-right min-w-56px'
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formattedValue}
          </span>
          <Button
            size='small'
            type='text'
            className='px-4px h-28px'
            onClick={handleReset}
            disabled={isResetDisabled}
            style={{
              color: isResetDisabled
                ? theme === 'dark'
                  ? 'rgba(230, 232, 236, 0.62)'
                  : 'rgba(78, 89, 105, 0.72)'
                : 'rgb(var(--primary-6))',
              opacity: 1,
            }}
          >
            {t('settings.fontSizeReset')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FontSizeControl;
