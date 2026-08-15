/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * D3: "Microphone or transcription failed (unknown). Nothing was sent."
 *
 * The reporting machine has `provider: 'whisper-local'` stored, and the
 * renderer routes that provider to the bundled transformers.js engine without
 * touching main at all. When that engine cannot load its model it throws an
 * ordinary message with no `STT_` prefix, and the error map had no branch for
 * that shape - so a precisely knowable cause ("no model file", "backend failed
 * to load") was rendered to the user as the word "unknown".
 */

import { describe, expect, it } from 'vitest';
import { mapSpeechInputError, speechErrorDetail } from '@/renderer/hooks/system/useSpeechInput';

describe('local speech engine failures keep their cause', () => {
  it('a local engine failure is not "unknown"', () => {
    const error = new Error('STT_LOCAL_ENGINE_FAILED:Could not locate file "whisper-tiny/config.json"');
    expect(mapSpeechInputError(error)).toBe('local-engine-failed');
    expect(mapSpeechInputError(error)).not.toBe('unknown');
  });

  it('the underlying message survives to the surface', () => {
    const error = new Error('STT_LOCAL_ENGINE_FAILED:no available backend found. ERR: [wasm] failed to load');
    expect(speechErrorDetail(error)).toBe('no available backend found. ERR: [wasm] failed to load');
  });

  it('detail is carried for every coded error, not just STT_REQUEST_FAILED', () => {
    expect(speechErrorDetail(new Error('STT_REQUEST_FAILED:429 Too Many Requests'))).toBe('429 Too Many Requests');
    expect(speechErrorDetail(new Error('STT_HOSTED_CONSENT_REQUIRED: accept the disclosure for flux-voice'))).toBe(
      'accept the disclosure for flux-voice'
    );
  });

  it('a bare code has no detail to invent', () => {
    expect(speechErrorDetail(new Error('STT_RATE_LIMITED'))).toBeNull();
  });

  it('KNOWN POSITIVE: the existing codes still map exactly as before', () => {
    expect(mapSpeechInputError(new Error('STT_FLUX_PREMIUM_LOCKED'))).toBe('premium-locked');
    expect(mapSpeechInputError(new Error('STT_FLUX_AUTH_ERROR'))).toBe('auth-error');
    expect(mapSpeechInputError(new Error('STT_RATE_LIMITED'))).toBe('rate-limited');
    expect(mapSpeechInputError(new Error('STT_FLUX_NOT_CONFIGURED'))).toBe('not-configured');
    expect(mapSpeechInputError(new Error('STT_FILE_TOO_LARGE'))).toBe('file-too-large');
    expect(mapSpeechInputError(new Error('STT_REQUEST_FAILED:boom'))).toBe('transcription-failed');
    // And a genuinely unrecognised error is still honestly unknown.
    expect(mapSpeechInputError(new Error('something nobody mapped'))).toBe('unknown');
  });
});
