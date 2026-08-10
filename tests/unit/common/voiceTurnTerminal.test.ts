/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { VoiceSessionState } from '@/common/voice/VoiceSessionMachine';
import { resolveVoiceTurnTerminal, type VoiceTurnTerminalInput } from '@/common/voice/voiceTurnTerminal';

/**
 * The rule this file pins is the one that decides whether a turn's terminal
 * event does anything at all.
 *
 * At HEAD the rule was `['thinking', 'acting'].includes(state)`, and the moment
 * a sentence chunk fires `response_segment_ready` the machine is in `speaking`.
 * Every terminal event after the first chunk therefore returned silently: the
 * trailing fragment was never spoken, `lastResponse` was never set so captions
 * stayed empty, the no-speakable-response branch was dead, and the dedupe
 * between the two terminal paths - `finish` on the response stream and
 * `turnCompleted` - was never armed.
 *
 * That last point is the dangerous one. The state guard was ALSO the accidental
 * dedupe: `finish` passed it and moved the machine to `speaking`, which is what
 * rejected the `turnCompleted` that followed. Admitting `speaking` removes that
 * backstop, so the dedupe has to be explicit and it has to be keyed on the
 * TURN - the two terminal paths do not agree on a message id (`turnCompleted`
 * reports the last message in the conversation, which is routinely an activity
 * card rather than the assistant message `finish` names), so a key that
 * includes the terminal id would let the same answer be spoken twice.
 */

const base: VoiceTurnTerminalInput = {
  state: 'thinking',
  turnId: 'voice-turn-1',
  completedTurnId: null,
  terminalError: false,
  rawResponse: 'Here is the answer.',
  spokenLength: 0,
};

const TERMINABLE: VoiceSessionState[] = ['thinking', 'acting', 'speaking'];
const NOT_TERMINABLE: VoiceSessionState[] = [
  'connecting',
  'listening',
  'user-speaking',
  'transcribing',
  'approval-needed',
  'interrupted',
  'reconnecting',
  'error',
  'ended',
];

describe('resolveVoiceTurnTerminal', () => {
  describe('which states can still end a turn', () => {
    /**
     * The headline. Under chunked synthesis the machine is already `speaking`
     * when the turn ends, so this is the only state the terminal event ever
     * arrives in for a long answer.
     */
    it.each(TERMINABLE)('ends a turn from %s', (state) => {
      expect(resolveVoiceTurnTerminal({ ...base, state })).toEqual({
        kind: 'speak',
        tail: 'Here is the answer.',
        transcript: 'Here is the answer.',
      });
    });

    /**
     * The control. Widening the guard must not become "accept anything" - a
     * terminal event arriving after the session already failed, ended, or
     * returned to listening has nothing to terminate, and speaking there would
     * talk over a session the user had already stopped.
     */
    it.each(NOT_TERMINABLE)('ignores a terminal event in %s', (state) => {
      expect(resolveVoiceTurnTerminal({ ...base, state })).toEqual({
        kind: 'ignore',
        why: 'not-terminable',
      });
    });

    it('ignores a terminal event with no active turn', () => {
      expect(resolveVoiceTurnTerminal({ ...base, turnId: null })).toEqual({
        kind: 'ignore',
        why: 'no-turn',
      });
    });
  });

  describe('the tail', () => {
    /**
     * The terminal handler owns whatever the chunker did not already speak.
     * Speaking the whole buffer again would repeat the entire answer out loud.
     */
    it('speaks only what has not been spoken yet', () => {
      const rawResponse = 'First part. Second part.';
      expect(
        resolveVoiceTurnTerminal({ ...base, state: 'speaking', rawResponse, spokenLength: 'First part. '.length })
      ).toEqual({
        kind: 'speak',
        tail: 'Second part.',
        transcript: 'First part. Second part.',
      });
    });

    /**
     * The control for the assertion above: with nothing spoken yet the tail IS
     * the whole answer, which is the single-clip path and exactly what shipped.
     */
    it('speaks the whole answer when nothing was spoken yet', () => {
      const rawResponse = 'First part. Second part.';
      expect(resolveVoiceTurnTerminal({ ...base, rawResponse, spokenLength: 0 })).toEqual({
        kind: 'speak',
        tail: 'First part. Second part.',
        transcript: 'First part. Second part.',
      });
    });

    /**
     * A turn whose last sentence landed exactly on a chunk boundary has no tail
     * left. That is a settled turn, not a turn that produced nothing speakable -
     * failing it would put an `error` on a session the user just heard answer.
     */
    it('settles instead of failing when the chunks already said everything', () => {
      const rawResponse = 'All of it was already spoken.';
      expect(
        resolveVoiceTurnTerminal({ ...base, state: 'speaking', rawResponse, spokenLength: rawResponse.length })
      ).toEqual({ kind: 'settle', transcript: 'All of it was already spoken.' });
    });

    /**
     * The control for that: nothing spoken AND nothing speakable is the real
     * tool-only turn, and it must still fail with its own name.
     */
    it('fails with NO_SPEAKABLE_RESPONSE when nothing was spoken and nothing is speakable', () => {
      expect(resolveVoiceTurnTerminal({ ...base, rawResponse: '', spokenLength: 0 })).toEqual({
        kind: 'fail',
        errorCode: 'NO_SPEAKABLE_RESPONSE',
      });
    });

    it('normalizes the tail it hands to speech', () => {
      // The tail goes to the synthesizer, so it gets the same treatment the
      // whole answer used to get - a raw slice would read markdown aloud.
      expect(resolveVoiceTurnTerminal({ ...base, rawResponse: 'Use the **bold** word.' })).toEqual({
        kind: 'speak',
        tail: 'Use the bold word.',
        transcript: 'Use the bold word.',
      });
    });
  });

  describe('failures', () => {
    it.each(TERMINABLE)('fails the turn from %s when the terminal event is an error', (state) => {
      expect(resolveVoiceTurnTerminal({ ...base, state, terminalError: true })).toEqual({
        kind: 'fail',
        errorCode: 'TURN_FAILED',
      });
    });
  });

  describe('the dedupe, which is now the only backstop', () => {
    /**
     * `finish` and `turnCompleted` both fire for one turn. With `speaking`
     * admitted, nothing else stops the second one, so this is what keeps an
     * answer from being spoken twice.
     */
    it.each(TERMINABLE)('ignores a second terminal event for the same turn, from %s', (state) => {
      expect(resolveVoiceTurnTerminal({ ...base, state, completedTurnId: base.turnId })).toEqual({
        kind: 'ignore',
        why: 'already-completed',
      });
    });

    it('ignores a repeat even when the turn failed the first time', () => {
      expect(
        resolveVoiceTurnTerminal({ ...base, state: 'speaking', terminalError: true, completedTurnId: base.turnId })
      ).toEqual({ kind: 'ignore', why: 'already-completed' });
    });

    /**
     * The control. Keying on the turn must not wedge the NEXT turn shut - the
     * session speaks many turns and only a repeat of the same one is a repeat.
     */
    it('still ends the next turn after the previous one completed', () => {
      expect(resolveVoiceTurnTerminal({ ...base, turnId: 'voice-turn-2', completedTurnId: 'voice-turn-1' })).toEqual({
        kind: 'speak',
        tail: 'Here is the answer.',
        transcript: 'Here is the answer.',
      });
    });
  });
});
