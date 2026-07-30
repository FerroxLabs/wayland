/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { ProcessChat } from '@process/utils/initStorage';
import type { ConversationSource, TChatConversation } from '@/common/config/storage';
import type { TMessage } from '@/common/chat/chatLib';
import { migrateConversationToDatabase } from './migrationUtils';
import { UNKNOWN_CONVERSATION_SOURCE, upgradeLegacyMarkerAttachments } from './legacyMarkerAttachments';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';

export function initDatabaseBridge(repo: IConversationRepository): void {
  // Get conversation messages from database
  ipcBridge.database.getConversationMessages.provider(async (_params): Promise<TMessage[]> => {
    const { conversation_id, page = 0, pageSize = 10000 } = _params ?? {};
    try {
      const result = await repo.getMessages(conversation_id, page, pageSize);
      // Renderer-facing read only: attachments stored before `content.files`
      // existed are recovered from the legacy marker here, gated on the
      // conversation source so an inbound channel message cannot be laundered
      // into a trusted file list.
      //
      // A failed read or a missing conversation row is NOT the same as a row
      // with no source: the former means we cannot tell whether this is a
      // channel, so it must fail closed. Only a row that exists and is local
      // (or predates the `source` column) may be upgraded.
      let source: ConversationSource | null | undefined = UNKNOWN_CONVERSATION_SOURCE;
      try {
        const conversation = await repo.getConversation(conversation_id);
        if (conversation) source = conversation.source;
      } catch {
        source = UNKNOWN_CONVERSATION_SOURCE;
      }
      return upgradeLegacyMarkerAttachments(result.data, source);
    } catch (error) {
      console.error('[DatabaseBridge] Error getting conversation messages:', error);
      return [];
    }
  });

  // Get user conversations from database with lazy migration from file storage
  ipcBridge.database.getUserConversations.provider(async (_params) => {
    const { page = 0, pageSize = 10000 } = _params ?? {};
    try {
      const result = await repo.getUserConversations(undefined, page * pageSize, pageSize);
      const dbConversations = result.data;

      // Try to get conversations from file storage
      let fileConversations: TChatConversation[] = [];
      try {
        fileConversations = (await ProcessChat.get('chat.history')) || [];
      } catch (error) {
        console.warn('[DatabaseBridge] No file-based conversations found:', error);
      }

      // Use database conversations as the primary source while backfilling missing ones from file storage
      // Build a map for fast lookup to avoid duplicates when merging
      const dbConversationMap = new Map(dbConversations.map((conv) => [conv.id, conv] as const));

      // Filter out conversations that already exist in database
      const fileOnlyConversations = fileConversations.filter((conv) => !dbConversationMap.has(conv.id));

      // If there are conversations that only exist in file storage, migrate them in background
      if (fileOnlyConversations.length > 0) {
        void Promise.all(fileOnlyConversations.map((conv) => migrateConversationToDatabase(conv)));
      }

      // Combine database conversations (source of truth) with any remaining file-only conversations
      const allConversations = [...dbConversations, ...fileOnlyConversations];
      // Re-sort by modifyTime (or createTime as fallback) to maintain correct order
      allConversations.sort((a, b) => (b.modifyTime || b.createTime || 0) - (a.modifyTime || a.createTime || 0));
      return allConversations;
    } catch (error) {
      console.error('[DatabaseBridge] Error getting user conversations:', error);
      return [];
    }
  });

  ipcBridge.database.searchConversationMessages.provider(async (_params) => {
    const { keyword, page = 0, pageSize = 20 } = _params ?? {};
    try {
      const result = await repo.searchMessages(keyword, page, pageSize);
      return result;
    } catch (error) {
      console.error('[DatabaseBridge] Error searching conversation messages:', error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }
  });
}
