/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { speechErrorCodeForLeg } from '@/renderer/hooks/system/useSpeechInput';
import type { VoiceFailureCause, VoiceLeg } from '@/common/voice/voiceReadiness';
import {
  describeVoiceFailure,
  VOICE_FAILURE_CODES,
} from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { describe, expect, it } from 'vitest';

/**
 * WHAT THIS FILE PROVES: that no reachable failure renders the word "unknown",
 * including a raw code this version has never heard of. The `unknown` the owner
 * saw came from an unmapped RAW CODE flowing through `describeVoiceFailure` at
 * runtime, which is why a locale grep came back clean while the app said
 * "unknown" - so this tests the function, not the locale files.
 *
 * WHAT IT CANNOT PROVE: that these sentences are the ones a user sees on a real
 * failure. That needs the app running.
 */

describe('describeVoiceFailure is total over the closed code union', () => {
  it('maps EVERY member to a named sentence', () => {
    // Control: the union is not empty, so the loop below is not vacuous.
    expect(VOICE_FAILURE_CODES.length).toBeGreaterThan(10);

    for (const code of VOICE_FAILURE_CODES) {
      const sentence = describeVoiceFailure(code);
      expect(sentence.toLowerCase()).not.toContain('unknown');
      // A sentence, not the code echoed back at the user.
      expect(sentence).not.toBe(code);
      expect(sentence.length).toBeGreaterThan(20);
    }
  });

  it('prefers a provider-supplied detail over the mapped sentence', () => {
    expect(describeVoiceFailure('STT_REQUEST_FAILED: the socket closed early')).toBe('the socket closed early');
  });

  /** The case that produced the literal word "unknown". */
  it('names the subsystem for a code this version has never heard of', () => {
    for (const raw of ['STT_TELEPORT_FAILED', 'TTS_WARP_CORE_BREACH', 'SOME_GARBAGE']) {
      const sentence = describeVoiceFailure(raw);
      expect(sentence.toLowerCase()).not.toContain('unknown');
      expect(sentence).toContain('voice subsystem');
      // It still names the code, so a bug report carries the evidence.
      expect(sentence).toContain(raw);
    }
  });

  it('says something honest for an empty failure', () => {
    const sentence = describeVoiceFailure('');
    expect(sentence.toLowerCase()).not.toContain('unknown');
    expect(sentence).toContain('voice subsystem');
  });
});

describe('speechErrorCodeForLeg is exhaustive over VoiceFailureCause', () => {
  /**
   * Every member of the closed cause union, listed by hand.
   *
   * Be clear about what this list does and does not do. A subset of a union
   * still satisfies `ReadonlyArray<VoiceFailureCause>`, so omitting a member
   * here does NOT fail the typecheck - this list cannot police itself. The real
   * guard is the `never` branch inside `speechErrorCodeForLeg`, which was
   * mutation-verified by adding an unhandled member to `VoiceFailureCause` and
   * watching `tsc` reject it. This list only checks that every cause currently
   * known produces a usable code at runtime.
   */
  const allCauses: ReadonlyArray<VoiceFailureCause> = [
    'ok',
    'tts-disabled-by-user',
    'no-local-adapter',
    'kokoro-unavailable',
    'tts-needs-consent',
    'stt-disabled',
    'stt-unavailable',
    'stt-needs-consent',
    'audio-blocked',
    'local-engine-warming',
    'no-model-connected',
  ];

  it('returns a mapped composer code for every cause', () => {
    for (const cause of allCauses) {
      const leg: VoiceLeg = { direction: 'in', status: 'failed', cause, provider: null, clickable: false };
      const code = speechErrorCodeForLeg(leg);
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    }
  });

  it('does not collapse setup gaps and platform gaps onto the same code', () => {
    const legFor = (cause: VoiceFailureCause): VoiceLeg => ({
      direction: 'in',
      status: 'failed',
      cause,
      provider: null,
      clickable: false,
    });
    expect(speechErrorCodeForLeg(legFor('stt-unavailable'))).toBe('not-configured');
    expect(speechErrorCodeForLeg(legFor('no-local-adapter'))).toBe('recording-unsupported');
    expect(speechErrorCodeForLeg(legFor('local-engine-warming'))).toBe('local-engine-failed');
  });
});
