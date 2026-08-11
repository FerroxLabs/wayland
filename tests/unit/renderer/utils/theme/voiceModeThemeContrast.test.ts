/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reported from the running app: "remember I'm in light mode right now. When I
 * went to voice chat, it went to dark mode."
 *
 * voice-conversation-mode.css hardcoded a near-black background and
 * rgba(255,255,255,a) ink, so the full-screen voice surface stayed dark inside a
 * light app. Nothing in DESIGN.md, the voice plan, or the file's history asks for
 * that - DESIGN.md's Voice section says Voice and Chat are reversible
 * presentations of the same conversation, and its Visual language section
 * requires WCAG AA. The surface was simply authored under the dark default.
 *
 * The fix routes every colour through a --vm-* token and overrides the whole set
 * under [data-theme='light']. Two failure modes follow from that shape, and both
 * are asserted here:
 *   1. A token added to one block and forgotten in the other - that is what
 *      "half of it is still dark" looks like as a diff.
 *   2. A light value chosen by eye that does not actually clear AA.
 */

import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AA,
  composite,
  contrast,
  declarationsFor,
  luminance,
  parseColor,
  readCss,
  type Rgb,
} from '../../../helpers/cssContrast';

const VOICE_CSS = resolve(
  __dirname,
  '../../../../..',
  'src/renderer/pages/conversation/voice/voice-conversation-mode.css'
);
const css = readCss(VOICE_CSS);

const dark = declarationsFor(css, '.voice-mode');
const light = declarationsFor(css, "[data-theme='light'] .voice-mode");

const opaque = (tokens: Record<string, string>, name: string): Rgb => {
  const parsed = parseColor(tokens[name]);
  expect(parsed.alpha, `${name} is expected to be opaque`).toBe(1);
  return parsed.rgb;
};

const layered = (tokens: Record<string, string>, name: string, backdrop: Rgb): Rgb =>
  composite(parseColor(tokens[name]), backdrop);

const expectAA = (label: string, inkToken: string, tokens: Record<string, string>, backdrop: Rgb): void => {
  const ratio = contrast(composite(parseColor(tokens[inkToken]), backdrop), backdrop);
  expect(
    ratio,
    `${label} (${inkToken} = ${tokens[inkToken]}) is ${ratio}:1, below WCAG AA ${AA}:1`
  ).toBeGreaterThanOrEqual(AA);
};

const colourTokens = (tokens: Record<string, string>): string[] =>
  Object.keys(tokens)
    .filter((k) => k.startsWith('--vm-') || k === '--voice-accent')
    .sort();

describe('voice mode follows the app theme', () => {
  it('declares the same token set in both themes', () => {
    const darkTokens = colourTokens(dark);
    expect(darkTokens.length).toBeGreaterThan(0);
    expect(colourTokens(light)).toEqual(darkTokens);
  });

  it('paints a light surface in light mode and a dark one in dark mode', () => {
    expect(luminance(opaque(light, '--vm-surface'))).toBeGreaterThan(0.5);
    expect(luminance(opaque(dark, '--vm-surface'))).toBeLessThan(0.1);
  });
});

describe('every text element in the voice view clears AA', () => {
  it.each([
    ['light', () => light],
    ['dark', () => dark],
  ])('%s', (_mode, get) => {
    const tokens = get();
    const surface = opaque(tokens, '--vm-surface');

    // Worst case inside the stage: the warm ambient blob washing the surface.
    const ambientOpacity = Number(tokens['--vm-ambient-opacity']);
    expect(Number.isFinite(ambientOpacity), '--vm-ambient-opacity must be a number').toBe(true);
    const stage = composite({ rgb: [255, 99, 39], alpha: ambientOpacity }, surface);

    // Topbar and control bar sit outside the stage, on the bare surface.
    expectAA('conversation title / heading ink', '--vm-ink', tokens, surface);
    expectAA('VOICE · SAME CHAT eyebrow', '--voice-accent', tokens, surface);
    expectAA('actor · permission sub-text', '--vm-ink-muted', tokens, surface);

    expectAA(
      'Mic on / Captions / Interrupt / voice labels',
      '--vm-control-ink',
      tokens,
      layered(tokens, '--vm-control-bg', surface)
    );
    expectAA(
      'control label on hover',
      '--vm-control-ink-strong',
      tokens,
      layered(tokens, '--vm-control-bg-hover', surface)
    );
    expectAA('End label', '--vm-end-ink', tokens, layered(tokens, '--vm-end-bg', surface));
    expectAA('Muted (active) label', '--vm-active-ink', tokens, layered(tokens, '--vm-active-bg', surface));

    // Orb sub-text sits over the ambient wash.
    expectAA('orb sub-text', '--vm-ink-soft', tokens, stage);

    // "Nothing hidden" / setup notice / captions panels.
    const panel = layered(tokens, '--vm-panel-bg', stage);
    expectAA('caption body', '--vm-panel-ink', tokens, panel);
    expectAA('notice body', '--vm-panel-ink-muted', tokens, panel);
    expectAA('caption speaker label', '--vm-panel-label', tokens, panel);
    expectAA('notice button label', '--vm-panel-btn-ink', tokens, layered(tokens, '--vm-panel-btn-bg', panel));
  });
});
