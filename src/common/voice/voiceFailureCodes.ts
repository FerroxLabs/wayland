/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { SPEECH_TO_TEXT_ERROR_CODES } from '@/common/types/speech';
import { TEXT_TO_SPEECH_ERROR_CODES } from '@/common/types/ttsTypes';

/**
 * Failures the RENDERER raises on its own, with no bridge involved.
 *
 * Playback lives entirely in the renderer - the bridge hands back bytes and is
 * finished - so these have no main-process source list to be derived from.
 * `TTS_NO_RESPONSE` is the Test-voice timeout in `ToolsModalContent`.
 */
export const RENDERER_VOICE_FAILURE_CODES = [
  /** Thrown by the renderer-side transcriber when the on-device engine will not run. */
  'STT_LOCAL_ENGINE_FAILED',
  'TTS_EMPTY_AUDIO',
  'TTS_PLAYBACK_FAILED',
  'TTS_AUDIO_CONTEXT_BLOCKED',
  'TTS_NO_RESPONSE',
  'TTS_REQUEST_FAILED',
] as const;

/**
 * Every raw failure code the voice subsystems can emit, as a CLOSED type.
 *
 * DERIVED, not re-typed. The two bridge vocabularies are the source of truth
 * and this list is composed from them, because the previous arrangement - a
 * hand-maintained renderer copy sitting in a different file - is what let seven
 * live speech codes reach a user as "which this version does not recognize".
 * A `never` exhaustiveness check can only guard the list it is given; given a
 * copy, it guards the copy. Adding a code to either bridge now propagates here
 * and breaks the typecheck of every consumer that switches on it.
 */
export const VOICE_FAILURE_CODES = [
  ...SPEECH_TO_TEXT_ERROR_CODES,
  ...TEXT_TO_SPEECH_ERROR_CODES,
  ...RENDERER_VOICE_FAILURE_CODES,
] as const;

export type VoiceFailureCode = (typeof VOICE_FAILURE_CODES)[number];

export const isVoiceFailureCode = (value: string): value is VoiceFailureCode =>
  (VOICE_FAILURE_CODES as readonly string[]).includes(value);
