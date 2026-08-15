/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WCAG 2.1 contrast measurement against the CSS we actually ship.
 *
 * Colour bugs are reported by eye and fixed by eye, which is how #fbbf24 (a
 * dark-surface amber) survived as light mode's --warning at 1.67:1 on white.
 * These helpers read the stylesheet, resolve the token, composite it over the
 * backdrop the way a browser does, and return a number.
 */

import { readFileSync } from 'node:fs';

/** WCAG 2.1 minimum for body text. Large text (>=18.66px bold / 24px) may use 3:1. */
export const AA = 4.5;

export type Rgb = [number, number, number];

const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export const luminance = ([r, g, b]: Rgb): number => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

/** Composite a colour that may carry alpha over an opaque backdrop. */
export const composite = (fg: { rgb: Rgb; alpha: number }, bg: Rgb): Rgb =>
  fg.rgb.map((c, i) => c * fg.alpha + bg[i] * (1 - fg.alpha)) as Rgb;

/** Parses `#rgb`, `#rrggbb`, `rgb(...)` and `rgba(...)`. Throws rather than guessing. */
export const parseColor = (raw: string): { rgb: Rgb; alpha: number } => {
  const value = String(raw).trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const d = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return { rgb: [parseInt(d.slice(0, 2), 16), parseInt(d.slice(2, 4), 16), parseInt(d.slice(4, 6), 16)], alpha: 1 };
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (fn) {
    const parts = fn[1].split(',').map((p) => Number(p.trim()));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      const alpha = parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : 1;
      return { rgb: [parts[0], parts[1], parts[2]], alpha };
    }
  }
  throw new Error(`Cannot parse CSS colour: ${JSON.stringify(raw)}`);
};

/**
 * Every `--token: value` declared in the first rule whose selector list contains
 * `selectorNeedle`. Comments are stripped first, so a commented-out declaration
 * can never be mistaken for a live one.
 */
export const declarationsFor = (css: string, selectorNeedle: string): Record<string, string> => {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const block = blocks.find(([, selector]) => selector.includes(selectorNeedle));
  if (!block) throw new Error(`No CSS rule found for a selector containing ${selectorNeedle}`);
  const out: Record<string, string> = {};
  for (const [, name, value] of block[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[name] = value.trim();
  return out;
};

export const readCss = (absolutePath: string): string => readFileSync(absolutePath, 'utf8');
