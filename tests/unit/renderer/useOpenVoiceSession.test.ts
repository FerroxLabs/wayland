/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { nextOpenVoiceAction } from '@/renderer/hooks/voice/useOpenVoiceSession';

describe('nextOpenVoiceAction', () => {
  it('on speech-start while TTS is playing -> barge-in (stop tts + stop turn)', () => {
    expect(nextOpenVoiceAction({ phase: 'listening', ttsActive: true, turnRunning: true }, { type: 'speech-start' }))
      .toEqual({ kind: 'barge-in' });
  });
  it('on speech-start while idle (no tts) -> begin capturing the utterance', () => {
    expect(nextOpenVoiceAction({ phase: 'listening', ttsActive: false, turnRunning: false }, { type: 'speech-start' }))
      .toEqual({ kind: 'begin-utterance' });
  });
  it('on speech-end -> transcribe', () => {
    expect(nextOpenVoiceAction({ phase: 'capturing', ttsActive: false, turnRunning: false }, { type: 'speech-end' }))
      .toEqual({ kind: 'transcribe' });
  });
  it('on transcript that is a threshold-intent -> adjust (do not send)', () => {
    expect(nextOpenVoiceAction({ phase: 'transcribing', ttsActive: false, turnRunning: false }, { type: 'transcript', text: 'wait longer' }))
      .toEqual({ kind: 'adjust-threshold', direction: 'longer' });
  });
  it('on a normal transcript -> send', () => {
    expect(nextOpenVoiceAction({ phase: 'transcribing', ttsActive: false, turnRunning: false }, { type: 'transcript', text: 'what is two plus two' }))
      .toEqual({ kind: 'send', text: 'what is two plus two' });
  });
  it("on transcript \"it's noisy\" -> adjust-sensitivity less (do not send)", () => {
    expect(nextOpenVoiceAction({ phase: 'transcribing', ttsActive: false, turnRunning: false }, { type: 'transcript', text: "it's noisy" }))
      .toEqual({ kind: 'adjust-sensitivity', direction: 'less' });
  });
  it('on transcript "you\'re not hearing me" -> adjust-sensitivity more (do not send)', () => {
    expect(nextOpenVoiceAction({ phase: 'transcribing', ttsActive: false, turnRunning: false }, { type: 'transcript', text: "you're not hearing me" }))
      .toEqual({ kind: 'adjust-sensitivity', direction: 'more' });
  });
  it('on an empty transcript -> resume listening (no send)', () => {
    expect(nextOpenVoiceAction({ phase: 'transcribing', ttsActive: false, turnRunning: false }, { type: 'transcript', text: '   ' }))
      .toEqual({ kind: 'resume' });
  });
});
