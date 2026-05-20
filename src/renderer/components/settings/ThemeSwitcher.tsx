/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Moon, Sun } from 'lucide-react';
import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import type { ThemePreference } from '@renderer/hooks/system/useTheme';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Half-sun/half-moon glyph for the "Auto" theme mode. Inline so we don't
 * have to chase down a matching icon in the Arco set.
 */
const IconAuto: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style={style} aria-hidden='true'>
    <path d='M12 3a9 9 0 1 0 0 18V3z' />
    <path d='M12 3a9 9 0 0 1 0 18V3z' fillOpacity='0.35' />
  </svg>
);

interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  activeIcon: React.ComponentType<{ style?: React.CSSProperties }>;
}

/**
 * Theme switcher component
 *
 * Three-state toggle: Auto / Light / Dark.
 *  - Auto follows the OS `prefers-color-scheme` and live-updates when it changes
 *  - Light and Dark are explicit user overrides
 */
export const ThemeSwitcher = () => {
  const { themePreference, setTheme } = useThemeContext();
  const { t } = useTranslation();
  const trackInset = 6;
  const splitGap = 1;

  const options: ThemeOption[] = [
    {
      value: 'system',
      label: t('settings.systemMode', 'Auto'),
      icon: IconAuto,
      activeIcon: IconAuto,
    },
    { value: 'light', label: t('settings.lightMode'), icon: Sun, activeIcon: Sun },
    { value: 'dark', label: t('settings.darkMode'), icon: Moon, activeIcon: Moon },
  ];

  const activeIndex = options.findIndex((o) => o.value === themePreference);
  // Indicator pill spans 1/3 of the track and slides between three positions.
  const indicatorWidth = `calc((100% - ${trackInset * 2}px) / 3 - ${splitGap * 2}px)`;
  const indicatorLeft = `calc(${trackInset}px + (100% - ${trackInset * 2}px) * ${activeIndex} / 3 + ${splitGap}px)`;

  return (
    <div
      className='relative inline-grid grid-cols-3 p-6px rd-full border border-solid border-[var(--color-border-2)] bg-1 w-full max-w-320px md:w-auto md:min-w-280px'
      role='radiogroup'
      aria-label={t('settings.theme')}
    >
      <span
        aria-hidden='true'
        className='absolute rd-full border border-solid border-[var(--color-border-2)] transition-all duration-260 ease-[cubic-bezier(0.2,0.8,0.2,1)]'
        style={{
          top: trackInset,
          bottom: trackInset,
          left: indicatorLeft,
          width: indicatorWidth,
          backgroundColor: 'var(--color-fill-2)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
        }}
      />
      {options.map((option) => {
        const isActive = themePreference === option.value;
        const Icon = option.icon;
        const ActiveIcon = option.activeIcon;

        return (
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={isActive}
            className='relative z-1 h-33px min-w-0 px-8px md:px-10px rd-full text-13px font-500 inline-flex items-center justify-center gap-6px transition-all duration-180 active:scale-[0.985] disabled:cursor-not-allowed'
            style={{
              color: isActive ? 'var(--brand)' : 'var(--color-text-2)',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              cursor: isActive ? 'default' : 'pointer',
            }}
            onClick={() => {
              if (!isActive) {
                void setTheme(option.value);
              }
            }}
          >
            <span className='relative inline-flex items-center justify-center w-14px h-14px'>
              <Icon
                style={{
                  fontSize: 14,
                  opacity: isActive ? 0 : 0.8,
                  transform: isActive ? 'scale(0.6) rotate(-20deg)' : 'scale(1) rotate(0deg)',
                  transition: 'transform 220ms ease, opacity 220ms ease',
                  position: 'absolute',
                }}
              />
              <ActiveIcon
                style={{
                  fontSize: 14,
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scale(1.08) rotate(0deg)' : 'scale(0.65) rotate(20deg)',
                  transition: 'transform 220ms ease, opacity 220ms ease',
                  position: 'absolute',
                }}
              />
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
