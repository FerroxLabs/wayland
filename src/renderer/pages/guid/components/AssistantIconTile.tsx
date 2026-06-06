/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import styles from './AssistantIconTile.module.css';

/**
 * Colored tile primitive that wraps an assistant icon. Solves the
 * "black icon on dark background" contrast problem (flat-fill SVGs
 * disappear on the dark theme). Background is the category's hue at
 * ~12% opacity; foreground (`color`) is the full-strength hue, which
 * Lucide glyphs inherit via currentColor. <img> children sit on the
 * tinted card unchanged.
 */

export type PaletteKey = 'cowork' | 'write' | 'sales' | 'launch' | 'research' | 'finance' | 'dev';

export type AssistantIconTileProps = {
  /** The icon to display - can be an <img>, an Lucide component, or any ReactNode */
  children: React.ReactNode;
  /** Category drives the color palette. */
  category?: string;
  /** Force a specific palette override (used for the Cowork preset anchor). */
  paletteKey?: PaletteKey;
  /** 'sm' = 28px (cards, sidebar). 'md' = 40px (preset hero). 'lg' = 56px (modal/details) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className passthrough for callers that need extra layout control. */
  className?: string;
  /** Passthrough for test selectors (e.g. team-chat-empty-state-avatar). */
  'data-testid'?: string;
  /** Passthrough for variant tagging when multiple branches share the same testid. */
  'data-variant'?: string;
};

const PALETTES: Record<PaletteKey, { bg: string; fg: string }> = {
  cowork: { bg: 'rgba(249,115,22,0.12)', fg: 'rgb(249,115,22)' },
  write: { bg: 'rgba(139,92,246,0.12)', fg: 'rgb(139,92,246)' },
  sales: { bg: 'rgba(16,185,129,0.12)', fg: 'rgb(16,185,129)' },
  launch: { bg: 'rgba(244,114,182,0.12)', fg: 'rgb(244,114,182)' },
  research: { bg: 'rgba(56,189,248,0.12)', fg: 'rgb(56,189,248)' },
  finance: { bg: 'rgba(245,158,11,0.12)', fg: 'rgb(245,158,11)' },
  dev: { bg: 'rgba(99,102,241,0.12)', fg: 'rgb(99,102,241)' },
};

/**
 * Map a free-form category string (from ASSISTANT_PRESETS or extension
 * assistant configs) to a palette key. Returns undefined for unknown
 * categories so the tile falls back to neutral fill.
 *
 * Built-in AssistantCategory values ('sell' | 'write' | 'research' |
 * 'build' | 'run' | 'office' | 'general') are covered, plus the
 * waylandteams categories ('copy', 'sales', 'cold-outbound',
 * 'product-launch', 'launch', 'info-product-launch', 'finance',
 * 'wealth', 'money', 'dev', 'engineering').
 */
export function categoryToPaletteKey(category?: string): PaletteKey | undefined {
  if (!category) return undefined;
  const c = category.toLowerCase();
  if (c.includes('write') || c.includes('copy') || c.includes('content')) return 'write';
  if (c === 'sell' || c.includes('sales') || c.includes('cold-outbound')) return 'sales';
  if (c.includes('launch')) return 'launch';
  if (c.includes('research')) return 'research';
  if (c.includes('finance') || c.includes('wealth') || c.includes('money')) return 'finance';
  if (c.includes('dev') || c.includes('engineering') || c === 'build') return 'dev';
  return undefined;
}

const AssistantIconTile: React.FC<AssistantIconTileProps> = ({
  children,
  category,
  paletteKey,
  size = 'sm',
  className,
  'data-testid': dataTestId,
  'data-variant': dataVariant,
}) => {
  const key = paletteKey ?? categoryToPaletteKey(category);
  const palette = key ? PALETTES[key] : null;
  const style: React.CSSProperties = palette ? { backgroundColor: palette.bg, color: palette.fg } : {};
  const composed = [styles.tile, styles[size], className].filter(Boolean).join(' ');
  return (
    <span className={composed} style={style} aria-hidden='true' data-testid={dataTestId} data-variant={dataVariant}>
      {children}
    </span>
  );
};

export default AssistantIconTile;
