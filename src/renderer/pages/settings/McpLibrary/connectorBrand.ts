/// <reference types="vite/client" />
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CatalogEntry } from './types';

/**
 * Catalog logos are rendered through `<img src="...svg">`. An SVG loaded that
 * way is an independent document: it cannot inherit `color` from the page, so a
 * glyph painted with `currentColor` - or with no paint declared at all - renders
 * BLACK whatever the app theme is. On the dark plate that is 1.32:1, i.e.
 * invisible. 15 of the 108 catalog connectors ship such a glyph.
 *
 * A second, narrower failure: 12 more connectors ship a glyph whose only colour
 * is near-black, and one ships a pure-white glyph. Those carry their own colour,
 * so painting over them would destroy the mark - what they need is a plate they
 * can be seen against.
 *
 * This module decides, per connector, which of the two treatments applies. Every
 * catalog entry already declares the intent in `x-wayland.brand`; nothing here
 * invents a colour, it only validates the declared pair and falls back to theme
 * tokens when the declared pair cannot be trusted.
 */

/** WCAG 2.2 SC 1.4.11 minimum for a non-text graphical object. */
export const MIN_GLYPH_CONTRAST = 3;

/**
 * What a DECLARED brand pair has to clear before we paint a glyph with it. The
 * extra over the 3:1 floor is antialiasing headroom: a 20px glyph on a browse
 * card renders blended edges, and three catalog pairs sit so exactly on 3.00
 * that they measure 2.97 once drawn. A pair below this falls back to the theme
 * tokens, which are far above the floor on both themes.
 */
export const MIN_BRAND_PAIR_CONTRAST = 3.5;

/** Forced plates for a monochrome glyph whose entry declares no usable background. */
export const FALLBACK_LIGHT_PLATE = '#ffffff';
export const FALLBACK_DARK_PLATE = '#14161a';

export type LogoTreatment = {
  /**
   * True when the glyph carries no colour of its own, so the renderer has to
   * paint it (via a CSS mask - an `<img>` cannot be recoloured).
   */
  tint: boolean;
  /** Colour to paint the glyph with. Only ever set when `tint` is true. */
  foreground?: string;
  /** Plate colour to force. Undefined means "keep the caller's token plate". */
  background?: string;
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

// Raw icon sources, inlined at build time. The SOURCE - not the asset URL - is
// the only thing that says whether a glyph carries colour of its own, and doing
// it here keeps the rule self-maintaining: a new currentColor icon is handled
// the day it lands, with no list to update. (The catalog guides are already
// inlined the same way, at twice the size.)
const iconSources = import.meta.glob<string>('@renderer/mcp-catalog/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const entryModules = import.meta.glob<{ default: CatalogEntry } | CatalogEntry>(
  '@renderer/mcp-catalog/entries/*.json',
  {
    eager: true,
  }
);

function basename(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.slice(slash + 1) : path;
}

const sourceByFilename: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(iconSources)) map[basename(key)] = value;
  return map;
})();

export function expandHex(hex: string): [number, number, number] | null {
  if (!HEX.test(hex)) return null;
  let body = hex.slice(1);
  if (body.length === 3)
    body = body
      .split('')
      .map((c) => c + c)
      .join('');
  return [parseInt(body.slice(0, 2), 16), parseInt(body.slice(2, 4), 16), parseInt(body.slice(4, 6), 16)];
}

function linearise(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance. Returns null for anything that is not a plain hex. */
export function relativeLuminance(hex: string): number | null {
  const rgb = expandHex(hex);
  if (!rgb) return null;
  return 0.2126 * linearise(rgb[0]) + 0.7152 * linearise(rgb[1]) + 0.0722 * linearise(rgb[2]);
}

/** WCAG contrast ratio between two hex colours. Returns null if either is not hex. */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const PAINT = /(?:fill|stroke|stop-color)\s*(?::|=)\s*"?\s*([^";')>]+)/gi;

/**
 * Every distinct paint an SVG declares. `null` means the glyph declares no
 * colour of its own (it uses `currentColor`, or declares no paint at all) and
 * will therefore render black inside an `<img>`.
 */
export function declaredPaints(svg: string): string[] | null {
  // A rasterised logo (a PNG/JPEG wrapped in an SVG) declares no `fill` but is
  // not colourless - all of its colour lives in the bitmap. Masking one would
  // flatten a photograph into a silhouette, so it is never a tint candidate.
  if (/<image[\s>]/i.test(svg)) return ['<raster>'];
  const found = new Set<string>();
  for (const match of svg.matchAll(PAINT)) {
    const value = match[1].trim().replace(/^"|"$/g, '').toLowerCase();
    if (!value || value === 'none' || value === 'transparent') continue;
    if (value === 'currentcolor') return null;
    found.add(value);
  }
  return found.size === 0 ? null : [...found];
}

type Brand = { logoBackground?: string; logoForeground?: string };

const catalogByEntryId: Record<string, { brand?: Brand; iconFile?: string }> = (() => {
  const map: Record<string, { brand?: Brand; iconFile?: string }> = {};
  for (const module of Object.values(entryModules)) {
    const entry = ('default' in module ? module.default : module) as CatalogEntry;
    const wayland = entry?.['x-wayland'];
    if (!entry?.name || !wayland) continue;
    map[entry.name] = { brand: wayland.brand, iconFile: wayland.iconUrl ? basename(wayland.iconUrl) : undefined };
  }
  return map;
})();

function usableHex(value: string | undefined): string | undefined {
  return value && HEX.test(value) ? value : undefined;
}

function passes(a: string, b: string, floor: number = MIN_GLYPH_CONTRAST): boolean {
  const ratio = contrastRatio(a, b);
  return ratio !== null && ratio >= floor;
}

/**
 * The two values `--color-bg-5` takes: the plate a logo sits on when the
 * renderer leaves it alone. A glyph that clears the floor against both of them
 * needs nothing from us.
 */
export const TOKEN_PLATES = ['#ffffff', '#222222'];

/** A plate this single-colour glyph is guaranteed to read against, or undefined. */
function forcedPlate(glyph: string, declared: string | undefined): string | undefined {
  if (TOKEN_PLATES.every((plate) => passes(plate, glyph))) return undefined;

  // The entry gets first say: if the plate it declared makes its own mark
  // readable, use that rather than anything we invent.
  const preferred = usableHex(declared);
  if (preferred && passes(preferred, glyph)) return preferred;

  // No declared plate that works. Step in only where the mark would otherwise
  // be effectively invisible - a near-black or near-white glyph. A mid-tone
  // brand mark (Canva teal, Airtable blue) is a logotype: WCAG 1.4.11 exempts
  // it, and overriding the brand's own declared plate would be worse.
  const luminance = relativeLuminance(glyph);
  if (luminance === null || (luminance >= 0.08 && luminance <= 0.6)) return undefined;
  const fallback = luminance < 0.08 ? FALLBACK_LIGHT_PLATE : FALLBACK_DARK_PLATE;
  return passes(fallback, glyph) ? fallback : undefined;
}

/**
 * How the renderer must present this connector's logo so the glyph is visible
 * on both themes. Unknown entries and multi-colour marks return the no-op
 * treatment, which leaves the caller's existing token plate untouched.
 */
export function logoTreatment(entryId: string): LogoTreatment {
  const record = catalogByEntryId[entryId];
  const source = record?.iconFile ? sourceByFilename[record.iconFile] : undefined;
  if (!source) return { tint: false };

  const paints = declaredPaints(source);
  const brand = record?.brand;

  if (paints === null) {
    // No colour of its own: the renderer must paint it. Only honour the
    // declared pair when it actually clears the non-text contrast floor;
    // otherwise fall through to the theme tokens the caller's CSS supplies.
    const foreground = usableHex(brand?.logoForeground);
    const background = usableHex(brand?.logoBackground);
    if (foreground && background && passes(foreground, background, MIN_BRAND_PAIR_CONTRAST))
      return { tint: true, foreground, background };
    return { tint: true };
  }

  if (paints[0] === '<raster>') {
    // A bitmap cannot be repainted, so the only lever left is the plate behind
    // it - and the entry already declares which one its artwork was drawn for.
    const background = usableHex(brand?.logoBackground);
    return background ? { tint: false, background } : { tint: false };
  }

  if (paints.length === 1) {
    const background = forcedPlate(paints[0], brand?.logoBackground);
    return background ? { tint: false, background } : { tint: false };
  }

  return { tint: false };
}
