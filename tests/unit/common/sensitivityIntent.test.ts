/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { detectSensitivityIntent } from '@/common/voice/sensitivityIntent';

describe('detectSensitivityIntent', () => {
  const lessPhrases = [
    "it's noisy",
    'too much background noise',
    'you keep picking up noise',
    'stop picking up background noise',
    "you're too sensitive",
    'ignore the background noise',
    "it's loud in here",
  ];
  for (const phrase of lessPhrases) {
    it(`maps "${phrase}" to less`, () => {
      expect(detectSensitivityIntent(phrase)).toEqual({ direction: 'less' });
    });
  }

  const morePhrases = [
    "you're not hearing me",
    "you can't hear me",
    'be more sensitive',
    'listen harder',
    "i'm too quiet",
  ];
  for (const phrase of morePhrases) {
    it(`maps "${phrase}" to more`, () => {
      expect(detectSensitivityIntent(phrase)).toEqual({ direction: 'more' });
    });
  }

  it('returns null for normal utterances', () => {
    expect(detectSensitivityIntent('what is the capital of France')).toBeNull();
    expect(detectSensitivityIntent('write me a script')).toBeNull();
  });

  it('returns null for a long sentence that merely contains a trigger phrase', () => {
    expect(
      detectSensitivityIntent("it's noisy outside today so please write me a long detailed essay about cities"),
    ).toBeNull();
  });

  it('is case- and punctuation-insensitive', () => {
    expect(detectSensitivityIntent("IT'S NOISY!!!")).toEqual({ direction: 'less' });
    expect(detectSensitivityIntent('Be More Sensitive.')).toEqual({ direction: 'more' });
  });
});
