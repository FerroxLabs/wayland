/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { detectThresholdIntent } from '@/common/voice/thresholdIntent';

describe('detectThresholdIntent', () => {
  it('detects "wait longer" style requests as a longer-gap step', () => {
    for (const t of ['wait longer', 'give me a sec', 'give me a second', "don't cut me off", 'stop interrupting me', 'hold on let me think', 'wait, let me finish']) {
      expect(detectThresholdIntent(t)?.direction).toBe('longer');
    }
  });

  it('detects "go quicker" style requests as a shorter-gap step', () => {
    for (const t of ['you can go quicker', 'respond faster', "don't wait so long", 'send sooner']) {
      expect(detectThresholdIntent(t)?.direction).toBe('shorter');
    }
  });

  it('returns null for a normal utterance', () => {
    expect(detectThresholdIntent('what is the capital of France')).toBeNull();
    expect(detectThresholdIntent('write me a python script')).toBeNull();
  });

  it('is case- and punctuation-insensitive', () => {
    expect(detectThresholdIntent('WAIT LONGER!!')?.direction).toBe('longer');
  });

  it('only matches short command-like utterances (not a long sentence that merely contains the words)', () => {
    expect(detectThresholdIntent('I had to wait longer than expected at the airport yesterday because the flight from Tokyo was delayed by several hours')).toBeNull();
  });
});
