/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { chooseWhisperPath } from '@/renderer/services/SpeechToTextService';
import { describe, expect, it } from 'vitest';

describe('chooseWhisperPath', () => {
  it('uses the bundled tiny engine when the model is unset', () => {
    expect(chooseWhisperPath(undefined, false)).toBe('bundled');
    expect(chooseWhisperPath(undefined, true)).toBe('bundled');
  });

  it('uses the bundled tiny engine for the tiny model', () => {
    expect(chooseWhisperPath('tiny', true)).toBe('bundled');
  });

  it('routes installed ggml models through the whisper.cpp path', () => {
    expect(chooseWhisperPath('base', true)).toBe('ggml');
    expect(chooseWhisperPath('small', true)).toBe('ggml');
    expect(chooseWhisperPath('large-v3-turbo', true)).toBe('ggml');
  });

  it('falls back to the bundled engine when a ggml model is not installed', () => {
    expect(chooseWhisperPath('base', false)).toBe('bundled');
    expect(chooseWhisperPath('small', false)).toBe('bundled');
    expect(chooseWhisperPath('large-v3-turbo', false)).toBe('bundled');
  });

  it('treats unknown model identifiers as bundled', () => {
    expect(chooseWhisperPath('medium', true)).toBe('bundled');
  });
});
