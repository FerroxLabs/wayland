/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { useEffect } from 'react';
import useSWR from 'swr';

/**
 * Fetches a team agent's conversation record and keeps the shared SWR cache
 * (`['team-conversation', id]`) fresh when the process persists an update.
 *
 * #736 - the per-agent header model selector and the send box each build their
 * OWN model-selection state hydrated from this record. Picking a model in the
 * header updates that instance's local state immediately and persists via
 * `ipcBridge.conversation.update`, but nothing revalidated this cache, so the
 * send box's instance kept the stale `conversation.model` - the composer read
 * "Send message to gemini-3.5-flash" while the header showed the actual active
 * model (e.g. `z-ai/glm-5.2`) until an unrelated revalidation happened by.
 * `conversation.update` already emits `conversation.listChanged('updated')`,
 * so subscribing here keeps every consumer of the record in sync with the
 * persisted model, in both directions (header pick -> send box, and send box
 * pick -> header).
 */
export function useTeamConversation(conversationId: string | undefined) {
  const swr = useSWR(conversationId ? ['team-conversation', conversationId] : null, () =>
    ipcBridge.conversation.get.invoke({ id: conversationId! })
  );
  const { mutate } = swr;

  useEffect(() => {
    if (!conversationId) return;
    return ipcBridge.conversation.listChanged.on((event) => {
      if (event.conversationId === conversationId && event.action === 'updated') {
        void mutate();
      }
    });
  }, [conversationId, mutate]);

  return swr;
}
