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
  errorCode?: 'empty_transcript' | 'send_failed';
};

export const submitVoiceTurn = (detail: VoiceTurnSubmitDetail): void => {
  window.dispatchEvent(new CustomEvent<VoiceTurnSubmitDetail>(VOICE_TURN_SUBMIT_EVENT, { detail }));
};

export const openVoiceMode = (conversationId: string): void => {
  window.dispatchEvent(new CustomEvent<VoiceModeOpenDetail>(VOICE_MODE_OPEN_EVENT, { detail: { conversationId } }));
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
export const useVoiceTurnSubmission = (conversationId: string, onSend: (message: string) => Promise<void>): void => {
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

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
