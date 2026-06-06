/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Alert and message display constants
 */

// Text size calculation: 14px (text-sm) × 1.5 (line-height) = 21px per line
export const TEXT_CONFIG = {
  FONT_SIZE: 14, // text-sm
  LINE_HEIGHT: 1.5,
  PX_PER_LINE: 21, // 14px × 1.5
} as const;

// Maximum display height for collapsible content
export const COLLAPSE_CONFIG = {
  MAX_LINES: 4,
  MAX_HEIGHT: TEXT_CONFIG.PX_PER_LINE * 4, // 84px
} as const;
