/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fast first-response ack (#30), renderer side.
 *
 * `fireAck(prompt, msgId)` makes a parallel one-shot flux-fast call (NOT awaited
 * before the real turn is sent) and, IF the main response has not yet started,
 * inserts a TRANSIENT assistant bubble (id `ack:${msgId}`) above the streaming
 * response. The bubble is never persisted to the DB.
 *
 * The stream hook signals "the main response started / errored" via
 * ACK_CLEAR_EVENT; this hook removes the bubble and records the turn as cleared
 * so a late-arriving ack response no longer inserts (flicker/race guard).
 */

import { useCallback, useEffect, useRef } from 'react';
import { ipcBridge } from '@/common';
import { useTranslation } from 'react-i18next';
import {
  useAddOrUpdateMessage,
  useRemoveMessageByMsgId,
} from '@/renderer/pages/conversation/Messages/hooks';
import { ACK_CLEAR_EVENT, ackMsgId, type AckClearDetail } from './ackEvents';

export const useFastAck = (conversation_id: string) => {
  const { t } = useTranslation();
  const addOrUpdateMessage = useAddOrUpdateMessage();
  const removeMessageByMsgId = useRemoveMessageByMsgId();

  // Turns whose ack has been cleared (main response started or errored). A late
  // ack response for one of these must NOT insert a bubble.
  const clearedRef = useRef<Set<string>>(new Set());

  // Remove the transient ack the moment the main response starts (or errors).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AckClearDetail>).detail;
      if (!detail?.msgId || detail.conversationId !== conversation_id) return;
      clearedRef.current.add(detail.msgId);
      removeMessageByMsgId(ackMsgId(detail.msgId));
    };
    window.addEventListener(ACK_CLEAR_EVENT, handler);
    return () => window.removeEventListener(ACK_CLEAR_EVENT, handler);
  }, [conversation_id, removeMessageByMsgId]);

  const fireAck = useCallback(
    (prompt: string, msgId: string) => {
      void (async () => {
        try {
          const result = await ipcBridge.conversation.fastAck.invoke({ prompt });
          const text = result?.success ? result.data?.text?.trim() : '';
          if (!text) return;
          // Race guard: the main response may already have started while we were
          // waiting - if this turn was cleared, do not insert a stale bubble.
          if (clearedRef.current.has(msgId)) return;
          addOrUpdateMessage(
            {
              id: ackMsgId(msgId),
              msg_id: ackMsgId(msgId),
              type: 'text',
              position: 'left',
              conversation_id,
              status: 'finish',
              content: { content: `${t('conversation.chat.quickTake')}\n\n${text}` },
              createdAt: Date.now(),
            },
            true
          );
        } catch {
          // Best-effort: never let the ack affect the real turn.
        }
      })();
    },
    [addOrUpdateMessage, conversation_id, t]
  );

  return { fireAck };
};
