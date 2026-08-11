/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { SPEECH_TO_TEXT_ERROR_CODES } from '@/common/types/speech';
import { TEXT_TO_SPEECH_ERROR_CODES } from '@/common/types/ttsTypes';
import {
  describeVoiceFailure,
  VOICE_FAILURE_CODES,
} from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { describe, expect, it } from 'vitest';

/**
 * WHAT THIS FILE PROVES: that the vocabulary the BRIDGES can emit and the
 * vocabulary the RENDERER can describe are the same vocabulary.
 *
 * The sibling file `voiceFailureVocabulary.test.ts` walks the renderer's own
 * list and is green either way - it grades the renderer against its own copy of
 * the truth. That is exactly how seven live speech codes came to render as
 * "which this version does not recognize": the `never` exhaustiveness check was
 * guarding the copy, not the source. This file walks the SOURCES instead.
 *
 * WHAT IT CANNOT PROVE: that these sentences are the ones a user sees on a real
 * failure. That needs the app running.
 */

/** The catch-all the closed union exists to make unreachable. */
const UNRECOGNIZED_FALLBACK = 'does not recognize';

/** A raw i18n key that leaked instead of being resolved, e.g. `settings.foo`. */
const LOOKS_LIKE_I18N_KEY = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/;

const expectNamedSentence = (code: string) => {
  const sentence = describeVoiceFailure(code);
  expect(sentence, `${code} fell through to the unrecognized-code fallback`).not.toContain(UNRECOGNIZED_FALLBACK);
  expect(sentence.toLowerCase(), `${code} rendered the word "unknown"`).not.toContain('unknown');
  expect(sentence, `${code} was echoed back at the user as a raw code`).not.toBe(code);
  expect(sentence, `${code} rendered a raw i18n key path`).not.toMatch(LOOKS_LIKE_I18N_KEY);
  // A sentence a human wrote: words, not an enum.
  expect(sentence, `${code} produced no prose`).toContain(' ');
  expect(sentence.length, `${code} produced a stub`).toBeGreaterThan(20);
};

describe('the renderer can describe every code the bridges can emit', () => {
  it('names every speech-to-text bridge code', () => {
    // Control: the source list is not empty, so the loop is not vacuous.
    expect(SPEECH_TO_TEXT_ERROR_CODES.length).toBeGreaterThan(5);
    for (const code of SPEECH_TO_TEXT_ERROR_CODES) expectNamedSentence(code);
  });

  it('names every text-to-speech bridge code', () => {
    expect(TEXT_TO_SPEECH_ERROR_CODES.length).toBeGreaterThan(5);
    for (const code of TEXT_TO_SPEECH_ERROR_CODES) expectNamedSentence(code);
  });

  it('names every member of the unified union', () => {
    expect(VOICE_FAILURE_CODES.length).toBeGreaterThan(10);
    for (const code of VOICE_FAILURE_CODES) expectNamedSentence(code);
  });

  /**
   * The structural half. Even if every sentence above were somehow present, a
   * bridge code missing from the union means the renderer's `never` branch is
   * still policing a subset of reality.
   */
  it('carries every bridge code in the union itself', () => {
    const union = VOICE_FAILURE_CODES as readonly string[];
    const missing = [...SPEECH_TO_TEXT_ERROR_CODES, ...TEXT_TO_SPEECH_ERROR_CODES].filter(
      (code) => !union.includes(code)
    );
    expect(missing, 'bridge codes absent from the renderer union').toEqual([]);
  });
});
