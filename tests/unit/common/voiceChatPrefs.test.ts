/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { cycleSpeakOverride, resolveSpeakState, type ChatSpeakOverride, type VoiceChatPrefs } from '@/common/types/voiceChatPrefs';
import { resolveSilenceMs, stepSilenceMs, DEFAULT_SILENCE_MS, SILENCE_MS_BOUNDS } from '@/common/types/voiceChatPrefs';
import {
  resolveSensitivityBias,
  stepSensitivityBias,
  DEFAULT_SENSITIVITY_BIAS,
  SENSITIVITY_BIAS_BOUNDS,
} from '@/common/types/voiceChatPrefs';

describe('resolveSpeakState', () => {
  const prefs = (overrides: Record<string, ChatSpeakOverride>): VoiceChatPrefs => ({ overrides });

  it('uses the system default when the chat has no override (inherit)', () => {
    expect(resolveSpeakState({ conversationId: 'c1', systemDefault: true, prefs: prefs({}) })).toBe(true);
    expect(resolveSpeakState({ conversationId: 'c1', systemDefault: false, prefs: prefs({}) })).toBe(false);
  });

  it("'inherit' override is identical to no override", () => {
    expect(resolveSpeakState({ conversationId: 'c1', systemDefault: true, prefs: prefs({ c1: 'inherit' }) })).toBe(true);
  });

  it("'on' override forces speaking even when the default is off", () => {
    expect(resolveSpeakState({ conversationId: 'c1', systemDefault: false, prefs: prefs({ c1: 'on' }) })).toBe(true);
  });

  it("'off' override suppresses speaking even when the default is on", () => {
    expect(resolveSpeakState({ conversationId: 'c1', systemDefault: true, prefs: prefs({ c1: 'off' }) })).toBe(false);
  });

  it('treats a missing conversationId as inherit', () => {
    expect(resolveSpeakState({ conversationId: undefined, systemDefault: true, prefs: prefs({ c1: 'off' }) })).toBe(true);
  });

  it('cycleSpeakOverride rotates inherit -> on -> off -> inherit', () => {
    expect(cycleSpeakOverride(undefined)).toBe('on');
    expect(cycleSpeakOverride('inherit')).toBe('on');
    expect(cycleSpeakOverride('on')).toBe('off');
    expect(cycleSpeakOverride('off')).toBe('inherit');
  });
});

describe('open-voice silence threshold', () => {
  it('resolves the system default when no per-chat override', () => {
    expect(resolveSilenceMs({ conversationId: 'c1', systemDefault: 1200, overrides: {} })).toBe(1200);
  });
  it('uses the per-chat override when present', () => {
    expect(resolveSilenceMs({ conversationId: 'c1', systemDefault: 1200, overrides: { c1: 2000 } })).toBe(2000);
  });
  it('stepSilenceMs("longer") increases by a step, clamped to max', () => {
    expect(stepSilenceMs(1200, 'longer')).toBeGreaterThan(1200);
    expect(stepSilenceMs(SILENCE_MS_BOUNDS.max, 'longer')).toBe(SILENCE_MS_BOUNDS.max);
  });
  it('stepSilenceMs("shorter") decreases, clamped to min', () => {
    expect(stepSilenceMs(1200, 'shorter')).toBeLessThan(1200);
    expect(stepSilenceMs(SILENCE_MS_BOUNDS.min, 'shorter')).toBe(SILENCE_MS_BOUNDS.min);
  });
});

describe('open-voice sensitivity bias', () => {
  it('resolves the system default when no per-chat override', () => {
    expect(resolveSensitivityBias({ conversationId: 'c1', systemDefault: DEFAULT_SENSITIVITY_BIAS, overrides: {} })).toBe(
      DEFAULT_SENSITIVITY_BIAS,
    );
  });
  it('uses the per-chat override when present', () => {
    expect(resolveSensitivityBias({ conversationId: 'c1', systemDefault: 0, overrides: { c1: 0.08 } })).toBe(0.08);
  });
  it('stepSensitivityBias("less") increases the bias, clamped to max', () => {
    expect(stepSensitivityBias(0, 'less')).toBeGreaterThan(0);
    expect(stepSensitivityBias(SENSITIVITY_BIAS_BOUNDS.max, 'less')).toBe(SENSITIVITY_BIAS_BOUNDS.max);
  });
  it('stepSensitivityBias("more") decreases the bias, clamped to min', () => {
    expect(stepSensitivityBias(0, 'more')).toBeLessThan(0);
    expect(stepSensitivityBias(SENSITIVITY_BIAS_BOUNDS.min, 'more')).toBe(SENSITIVITY_BIAS_BOUNDS.min);
  });
});
