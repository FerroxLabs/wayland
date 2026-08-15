/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reported from the running app in LIGHT mode: the Voice mic-level warning
 * ("Level is very high...") and the Kokoro availability note rendered in a light
 * orange Sean could barely read. Both are `text-[var(--warning)]`, and --warning
 * was #fbbf24 - an amber authored for dark surfaces, where it is 11.86:1, and
 * never re-measured for light, where it is 1.67:1 on white.
 *
 * --warning is also used as a solid fill (McpLibrary .btnWarn, RestartBanner), so
 * the ink that sits on that fill has to flip with the mode too; a fixed value
 * cannot clear AA against both a bright amber and a burnt orange.
 */

import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AA, contrast, declarationsFor, parseColor, readCss, type Rgb } from '../../../helpers/cssContrast';

const THEME_CSS = resolve(__dirname, '../../../../..', 'src/renderer/styles/themes/default-color-scheme.css');
const css = readCss(THEME_CSS);

const light = declarationsFor(css, "body[arco-theme='light']");
const dark = declarationsFor(css, "body[arco-theme='dark']");

const opaque = (tokens: Record<string, string>, name: string): Rgb => {
  const parsed = parseColor(tokens[name]);
  expect(parsed.alpha, `${name} is expected to be opaque`).toBe(1);
  return parsed.rgb;
};

describe('--warning is legible as text in both themes', () => {
  // Warning copy lands on the page (--bg-base), on panels (--bg-1) and on the
  // deepest common light fill (--bg-2, aliased as --color-fill-2 - the mic meter track).
  it.each(['--bg-base', '--bg-1', '--bg-2'])('light --warning clears AA on %s', (surfaceToken) => {
    const ratio = contrast(opaque(light, '--warning'), opaque(light, surfaceToken));
    expect(ratio, `--warning ${light['--warning']} on ${light[surfaceToken]} is ${ratio}:1`).toBeGreaterThanOrEqual(AA);
  });

  it.each(['--bg-base', '--bg-1'])('dark --warning clears AA on %s', (surfaceToken) => {
    const ratio = contrast(opaque(dark, '--warning'), opaque(dark, surfaceToken));
    expect(ratio, `--warning ${dark['--warning']} on ${dark[surfaceToken]} is ${ratio}:1`).toBeGreaterThanOrEqual(AA);
  });
});

describe('--warning-on is legible on the solid --warning fill', () => {
  it.each([
    ['light', () => light],
    ['dark', () => dark],
  ])('%s', (_mode, get) => {
    const tokens = get();
    const ratio = contrast(opaque(tokens, '--warning-on'), opaque(tokens, '--warning'));
    expect(
      ratio,
      `--warning-on ${tokens['--warning-on']} on ${tokens['--warning']} is ${ratio}:1`
    ).toBeGreaterThanOrEqual(AA);
  });
});
