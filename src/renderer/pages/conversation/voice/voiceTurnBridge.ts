/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

export const VOICE_TURN_SUBMIT_EVENT = 'wayland:voice-turn-submit';
export const VOICE_TURN_SETTLED_EVENT = 'wayland:voice-turn-settled';
export const VOICE_MODE_OPEN_EVENT = 'wayland:voice-mode-open';

export type VoiceModeOpenDetail = {
  conversationId: string;
};

export type VoiceTurnSubmitDetail = {
  conversationId: string;
  turnId: string;
  text: string;
};

export type VoiceTurnSettledDetail = {
  conversationId: string;
  turnId: string;
  accepted: boolean;
  errorCode?: 'empty_transcript' | 'send_failed' | 'deferred_to_draft';
  /** Files staged when a turn was deferred, so the prompt can name the count. */
  deferredFileCount?: number;
};

/**
 * How a composer defers a spoken turn instead of sending it.
 *
 * A spoken turn enters the SAME send handler as typed chat, and those handlers
 * collect the staged files and clear them before dispatch. So a user who
 * attaches a photo and then speaks has the photo sent with a sentence they
 * never meant to attach it to, and cleared from the composer either way. While
 * the orb was a full-screen overlay that hid the composer this was nearly
 * unreachable; once the composer IS the voice surface it is an ordinary
 * Tuesday.
 *
 * Deferring writes the transcript into the draft and lets the user press Send
 * deliberately. It fails in the direction that costs a keystroke rather than
 * the one that mis-sends a file.
 */
export type VoiceTurnDeferral = {
  /** Files staged in this composer right now. */
  stagedFileCount: () => number;
  /** Put the transcript in the draft rather than sending it. */
  writeDraft: (text: string) => void;
};

export const submitVoiceTurn = (detail: VoiceTurnSubmitDetail): void => {
  window.dispatchEvent(new CustomEvent<VoiceTurnSubmitDetail>(VOICE_TURN_SUBMIT_EVENT, { detail }));
};

export const openVoiceMode = (conversationId: string): void => {
  window.dispatchEvent(new CustomEvent<VoiceModeOpenDetail>(VOICE_MODE_OPEN_EVENT, { detail: { conversationId } }));
};

const ARMED_VOICE_MODE_KEY = 'wayland:voice-mode-armed';

/**
 * How the new-chat page hands off into voice.
 *
 * A voice session needs a conversation to send turns into, and the welcome page
 * has none - that is the whole difficulty. So the button there does not start a
 * session; it arms one, creates the conversation through the ordinary send
 * path, and the session provider that mounts on arrival picks the arming up.
 *
 * `VOICE_MODE_OPEN_EVENT` cannot do this job: it is dispatched synchronously
 * and the provider for the new conversation has not mounted yet, so the event
 * lands in an empty room. A one-shot flag survives the navigation and the
 * remount; sessionStorage rather than a module variable so it also survives the
 * full reload some backends perform on conversation entry.
 *
 * One-shot by construction: the flag is removed by the read, so a second
 * conversation opened later never inherits it.
 */
export const armVoiceModeOnNextConversation = (): void => {
  try {
    sessionStorage.setItem(ARMED_VOICE_MODE_KEY, '1');
  } catch {
    // Storage unavailable (private mode / quota). Voice simply does not
    // auto-start; the composer's own entry button still works.
  }
};

/** Clears an arming whose conversation was never created. */
export const disarmVoiceMode = (): void => {
  try {
    sessionStorage.removeItem(ARMED_VOICE_MODE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
};

export const consumeArmedVoiceMode = (): boolean => {
  try {
    const armed = sessionStorage.getItem(ARMED_VOICE_MODE_KEY) === '1';
    if (armed) sessionStorage.removeItem(ARMED_VOICE_MODE_KEY);
    return armed;
  } catch {
    return false;
  }
};

const settleVoiceTurn = (detail: VoiceTurnSettledDetail): void => {
  window.dispatchEvent(new CustomEvent<VoiceTurnSettledDetail>(VOICE_TURN_SETTLED_EVENT, { detail }));
};

/**
 * Registers the active backend composer as the sole consumer for voice turns.
 * The voice surface never invokes a provider bridge directly: it enters the
 * exact same send handler as typed chat, preserving queues, wake-up gates,
 * provider readiness, attachments, authority, receipts, and transcript order.
 */
export const useVoiceTurnSubmission = (
  conversationId: string,
  onSend: (message: string) => Promise<void>,
  deferral?: VoiceTurnDeferral
): void => {
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;
  const deferralRef = useRef(deferral);
  deferralRef.current = deferral;

  useEffect(() => {
    const handleVoiceTurn = (event: Event) => {
      const detail = (event as CustomEvent<VoiceTurnSubmitDetail>).detail;
      if (!detail || detail.conversationId !== conversationId) return;

      const text = detail.text.trim();
      if (!text) {
        settleVoiceTurn({
          conversationId,
          turnId: detail.turnId,
          accepted: false,
          errorCode: 'empty_transcript',
        });
        return;
      }

      // Staged files present: hand the words to the draft and stop. The user
      // presses Send, so the attachment goes with the sentence they chose.
      const stagedFileCount = deferralRef.current?.stagedFileCount() ?? 0;
      if (stagedFileCount > 0) {
        deferralRef.current?.writeDraft(text);
        settleVoiceTurn({
          conversationId,
          turnId: detail.turnId,
          accepted: false,
          errorCode: 'deferred_to_draft',
          deferredFileCount: stagedFileCount,
        });
        return;
      }

      void onSendRef
        .current(text)
        .then(() => {
          settleVoiceTurn({ conversationId, turnId: detail.turnId, accepted: true });
        })
        .catch(() => {
          settleVoiceTurn({
            conversationId,
            turnId: detail.turnId,
            accepted: false,
            errorCode: 'send_failed',
          });
        });
    };

    window.addEventListener(VOICE_TURN_SUBMIT_EVENT, handleVoiceTurn);
    return () => window.removeEventListener(VOICE_TURN_SUBMIT_EVENT, handleVoiceTurn);
  }, [conversationId]);
};
