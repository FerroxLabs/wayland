/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import type { DetectionResult } from '@/common/types/onboarding';
import { classifyScenario } from '@/common/types/onboarding';
import { parseRealName } from '@process/onboarding/detect';

/** A fully-empty detection result - the cold-start baseline. */
function emptyResult(): DetectionResult {
  return {
    name: '',
    clis: [],
    envKeys: [],
    claudePro: false,
    ollama: { running: false, models: [] },
    fluxDesktop: { running: false },
    fluxConnected: false,
  };
}

describe('classifyScenario', () => {
  it('returns B when nothing meaningful is detected', () => {
    expect(classifyScenario(emptyResult())).toBe('B');
  });

  it('returns D when Flux is connected and Flux Desktop is running', () => {
    const d: DetectionResult = {
      ...emptyResult(),
      fluxConnected: true,
      fluxDesktop: { running: true, version: '1.2.3' },
    };
    expect(classifyScenario(d)).toBe('D');
  });

  it('returns C when only env keys are present', () => {
    const d: DetectionResult = { ...emptyResult(), envKeys: ['openai'] };
    expect(classifyScenario(d)).toBe('C');
  });

  it('returns A when only CLIs are present', () => {
    const d: DetectionResult = { ...emptyResult(), clis: ['claude'] };
    expect(classifyScenario(d)).toBe('A');
  });

  it('returns A when only Ollama is running', () => {
    const d: DetectionResult = {
      ...emptyResult(),
      ollama: { running: true, models: ['llama3'] },
    };
    expect(classifyScenario(d)).toBe('A');
  });

  it('returns A when only Claude Pro is present', () => {
    const d: DetectionResult = { ...emptyResult(), claudePro: true };
    expect(classifyScenario(d)).toBe('A');
  });

  it('returns C (keys win the C-vs-A split) when both env keys and CLIs exist', () => {
    const d: DetectionResult = {
      ...emptyResult(),
      envKeys: ['anthropic'],
      clis: ['claude'],
      ollama: { running: true, models: ['llama3'] },
    };
    expect(classifyScenario(d)).toBe('C');
  });

  it('D takes precedence over env keys and CLIs', () => {
    const d: DetectionResult = {
      ...emptyResult(),
      envKeys: ['openai'],
      clis: ['codex'],
      fluxConnected: true,
      fluxDesktop: { running: true },
    };
    expect(classifyScenario(d)).toBe('D');
  });

  it('returns D when Flux is connected even though Desktop is not running', () => {
    const d: DetectionResult = {
      ...emptyResult(),
      envKeys: ['openai'],
      fluxConnected: true,
      fluxDesktop: { running: false },
    };
    // Phase 1 has no Flux Desktop dependency: a connected key alone is the
    // fully-wired "D" scenario, and it outranks the env-keys "C" pitch.
    expect(classifyScenario(d)).toBe('D');
  });

  it('treats a lone running Flux Desktop (not connected) as a non-cold signal (A)', () => {
    const d: DetectionResult = {
      ...emptyResult(),
      fluxDesktop: { running: true },
    };
    expect(classifyScenario(d)).toBe('A');
  });
});

describe('parseRealName', () => {
  it('parses a same-line RealName value', () => {
    expect(parseRealName('RealName: Jane Doe')).toBe('Jane Doe');
  });

  it('parses the two-line continuation form', () => {
    expect(parseRealName('RealName:\n Jane Doe')).toBe('Jane Doe');
  });

  it('trims surrounding whitespace', () => {
    expect(parseRealName('RealName:   Jane Doe   \n')).toBe('Jane Doe');
  });

  it('returns null when the RealName marker is absent', () => {
    expect(parseRealName('SomethingElse: value')).toBeNull();
  });

  it('returns null when the RealName value is empty', () => {
    expect(parseRealName('RealName: \n')).toBeNull();
  });

  it('returns null for the empty-continuation form', () => {
    expect(parseRealName('RealName:\n')).toBeNull();
  });
});
