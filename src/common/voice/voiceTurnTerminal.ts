/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { VoiceSessionState } from './VoiceSessionMachine';
import { extractVoiceResponseText } from './voiceResponseText';

/**
 * What a turn's terminal event should do, decided in one place.
 *
 * Two events end a voice turn: `finish` on the response stream and
 * `turnCompleted`. Both used to run the same handler, and that handler refused
 * to run unless the machine was in `thinking` or `acting`. The moment the first
 * sentence chunk fires `response_segment_ready` the machine is in `speaking`
 * (`VoiceSessionMachine.ts` `response_segment_ready`), so under chunked
 * synthesis every terminal event landed on that guard and returned in silence:
 * the trailing fragment was never spoken, `lastResponse` was never set so the
 * captions stayed empty, and the no-speakable-response branch was unreachable.
 *
 * `speaking` is therefore terminable. The cost of admitting it is that the
 * state guard used to be the accidental dedupe as well - `finish` passed it and
 * moved the machine to `speaking`, and that is what rejected the `turnCompleted`
 * arriving a moment later. With `speaking` admitted the dedupe has to be
 * explicit, and it is keyed on the TURN rather than on the terminal event's id.
 * The two paths do not agree on an id: `finish` names the assistant message,
 * while `turnCompleted` reports the last message in the conversation, which is
 * routinely an activity card. A key that included the terminal id would let one
 * answer be spoken twice.
 */
const TERMINABLE_STATES: readonly VoiceSessionState[] = ['thinking', 'acting', 'speaking'];

export type VoiceTurnTerminalInput = {
  state: VoiceSessionState;
  /** The turn the machine currently owns, or `null` when there is none. */
  turnId: string | null;
  /** The last turn already terminated. The dedupe, made explicit. */
  completedTurnId: string | null;
  terminalError: boolean;
  /** Everything streamed for this turn, raw and unnormalized. */
  rawResponse: string;
  /** How much of `rawResponse` has already been handed to speech. */
  spokenLength: number;
};

export type VoiceTurnTerminalDecision =
  | { kind: 'ignore'; why: 'no-turn' | 'not-terminable' | 'already-completed' }
  | { kind: 'fail'; errorCode: 'TURN_FAILED' | 'NO_SPEAKABLE_RESPONSE' }
  /** `tail` is what is left to speak; `transcript` is the whole answer, for captions. */
  | { kind: 'speak'; tail: string; transcript: string }
  /** Nothing left to speak, but the turn did speak. Not a failure. */
  | { kind: 'settle'; transcript: string };

export const resolveVoiceTurnTerminal = ({
  state,
  turnId,
  completedTurnId,
  terminalError,
  rawResponse,
  spokenLength,
}: VoiceTurnTerminalInput): VoiceTurnTerminalDecision => {
  if (!turnId) return { kind: 'ignore', why: 'no-turn' };
  if (!TERMINABLE_STATES.includes(state)) return { kind: 'ignore', why: 'not-terminable' };
  if (completedTurnId === turnId) return { kind: 'ignore', why: 'already-completed' };
  if (terminalError) return { kind: 'fail', errorCode: 'TURN_FAILED' };

  const transcript = extractVoiceResponseText('content', rawResponse) ?? '';
  const tail = extractVoiceResponseText('content', rawResponse.slice(spokenLength)) ?? '';
  if (!tail) {
    // An empty tail means one of two completely different things. If chunks
    // already went out, the answer was delivered and the turn is simply over.
    // If nothing went out, this really is a visual or tool-only turn, and it
    // keeps its own name so the session can say so.
    return spokenLength > 0 ? { kind: 'settle', transcript } : { kind: 'fail', errorCode: 'NO_SPEAKABLE_RESPONSE' };
  }
  return { kind: 'speak', tail, transcript };
};
