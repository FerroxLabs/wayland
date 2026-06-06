import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { useConversationTabs } from '@/renderer/pages/conversation/hooks/ConversationTabsContext';
import {
  buildAutoTitleFromContent,
  deriveAutoTitleFromMessages,
  deriveAutoTitleSourceFromMessages,
} from '@/renderer/utils/chat/autoTitle';
import { emitter } from '@/renderer/utils/emitter';

export const useAutoTitle = () => {
  const { t } = useTranslation();
  const { updateTabName } = useConversationTabs();

  const syncTitleFromHistory = useCallback(
    async (conversationId: string, fallbackContent?: string) => {
      const defaultTitle = t('conversation.welcome.newConversation');
      try {
        const conversation = await ipcBridge.conversation.get.invoke({ id: conversationId });
        if (!conversation) {
          return;
        }

        const messages = await ipcBridge.database.getConversationMessages.invoke({
          conversation_id: conversationId,
          page: 0,
          pageSize: 1000,
        });

        const source = deriveAutoTitleSourceFromMessages(messages, fallbackContent);

        // Only (re)name an AUTO-named chat - never clobber a title the user chose.
        // New chats are created with their name set to the raw first message, so
        // "name equals the first message" (or its plain truncation) counts as
        // auto-named too, not just the literal "New Chat" default. A manual rename
        // matches none of these and is left untouched.
        const truncated = source ? buildAutoTitleFromContent(source) : null;
        const isAutoNamed =
          conversation.name === defaultTitle ||
          (!!source && conversation.name === source) ||
          (!!truncated && conversation.name === truncated);
        if (!isAutoNamed) {
          return;
        }

        // Prefer an AI-summarized title (short, clean, friendly - like Claude.ai)
        // generated on the cheapest fast model. Fall back to plain truncation
        // when no model is available or generation fails/returns nothing.
        let newTitle: string | null = null;
        if (source) {
          const ai = await ipcBridge.conversation.generateTitle.invoke({ message: source });
          if (ai?.success && ai.title) {
            newTitle = ai.title;
          }
        }
        if (!newTitle) {
          newTitle = deriveAutoTitleFromMessages(messages, fallbackContent);
        }
        if (!newTitle || newTitle === conversation.name) {
          return;
        }

        const success = await ipcBridge.conversation.update.invoke({
          id: conversationId,
          updates: { name: newTitle },
        });
        if (!success) {
          return;
        }

        updateTabName(conversationId, newTitle);
        emitter.emit('chat.history.refresh');
      } catch (error) {
        console.error('Failed to auto-update conversation title:', error);
      }
    },
    [t, updateTabName]
  );

  const checkAndUpdateTitle = useCallback(
    async (conversationId: string, messageContent: string) => {
      await syncTitleFromHistory(conversationId, messageContent);
    },
    [syncTitleFromHistory]
  );

  return {
    checkAndUpdateTitle,
    syncTitleFromHistory,
  };
};
