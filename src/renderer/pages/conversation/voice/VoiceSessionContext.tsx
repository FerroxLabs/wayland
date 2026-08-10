/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { useHostedVoiceConsent } from '@/renderer/hooks/voice/useHostedVoiceConsent';
import {
  useVoiceConversationSession,
  type VoiceConversationSession,
} from '@/renderer/hooks/voice/useVoiceConversationSession';
import React, { createContext, useContext, useMemo } from 'react';

type VoiceSessionContextValue = VoiceConversationSession & {
  /**
   * Resolves once the user answers the hosted-voice disclosure. Local providers
   * short-circuit to `true`.
   */
  ensureConsent: (provider: string) => Promise<boolean>;
};

const VoiceSessionContext = createContext<VoiceSessionContextValue | null>(null);

/**
 * Mounted once per conversation surface, wrapping the WHOLE layout rather than
 * its header.
 *
 * The header is the mistake this replaces: three call sites render the
 * conversation with `hideHeader`, and in those the session component was never
 * mounted at all, so the composer's soundwave button dispatched its open event
 * into nothing. Wrapping the layout is what makes voice reachable from every
 * surface instead of only the ones that happen to draw a header.
 *
 * One provider per surface, not one per composer. Six platform wrappers render
 * a SendBox; a provider per SendBox would mean six sessions and six microphone
 * opens for one conversation.
 */
export const VoiceSessionProvider: React.FC<{
  conversationId: string;
  actorLabel?: string;
  children: React.ReactNode;
}> = ({ conversationId, actorLabel, children }) => {
  /**
   * The consent modal is rendered HERE, by the provider, and it has to be.
   *
   * `ensureConsent` resolves its promise from the modal's own onOk/onCancel
   * handlers. A hook cannot render, so if nothing puts this element in the tree
   * the await never settles: entry hangs with no error and no modal, and the
   * obvious repair - deleting the await - deletes the disclosure.
   */
  const { ensureConsent, consentModal } = useHostedVoiceConsent();
  const session = useVoiceConversationSession({ conversationId, actorLabel, ensureConsent });

  const value = useMemo<VoiceSessionContextValue>(() => ({ ...session, ensureConsent }), [session, ensureConsent]);

  return (
    <VoiceSessionContext.Provider value={value}>
      {consentModal}
      {children}
    </VoiceSessionContext.Provider>
  );
};

/**
 * The session for THIS conversation, or null.
 *
 * Null outside a provider, so every consumer can be written `voiceX ?? existingX`
 * and removing the provider reverts the surface completely.
 *
 * Null is also returned when the surrounding conversation is not the one the
 * session belongs to. That is not defensive tidiness: TeamPage renders a single
 * ChatLayout over many conversations, with a SendBox per agent each carrying its
 * own conversation id. Without this check every one of those composers would
 * show one session's status and offer a Stop that interrupts somebody else's.
 */
export const useVoiceSessionSafe = (): VoiceSessionContextValue | null => {
  const session = useContext(VoiceSessionContext);
  const conversationContext = useConversationContextSafe();
  if (!session) return null;
  const surfaceConversationId = conversationContext?.conversationId;
  if (surfaceConversationId && surfaceConversationId !== session.conversationId) return null;
  return session;
};
