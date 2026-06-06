/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type PaletteRowProps = {
  /** Leading icon - assistant avatar, lucide icon, or clock for recents. */
  icon?: React.ReactNode;
  /** Primary line - assistant or conversation name. */
  title: string;
  /** Optional muted second line - backend, category, or relative time. */
  subtitle?: string;
  /** Optional right-side hint - keybinding or context label. */
  hint?: string;
};

/**
 * Compact row used inside every `Command.Item` rendered by the palette.
 *
 * Kept presentational and free of click handling: `Command.Item` owns
 * the selection wiring (click + Enter), and the row's only job is layout.
 * Tokens follow the existing settings command palette so the visual
 * language stays consistent across the two surfaces.
 */
const PaletteRow: React.FC<PaletteRowProps> = ({ icon, title, subtitle, hint }) => {
  return (
    <div className='flex items-center gap-12px w-full'>
      {icon !== undefined && (
        <span className='shrink-0 flex items-center justify-center w-20px h-20px text-[var(--text-muted)]'>
          {icon}
        </span>
      )}
      <div className='flex-1 min-w-0 flex flex-col'>
        <span className='text-14px text-[var(--text-primary)] truncate'>{title}</span>
        {subtitle && <span className='text-12px text-[var(--text-muted)] truncate'>{subtitle}</span>}
      </div>
      {hint && (
        <span className='text-11px text-[var(--text-muted)] shrink-0 ml-8px font-mono'>{hint}</span>
      )}
    </div>
  );
};

export default PaletteRow;
