/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// src/process/database/IConversationRepository.ts
// All methods are synchronous (better-sqlite3 driver).
// The service layer is async to allow future migration.

import type { TChatConversation } from '@/common/config/storage';
import type { TMessage } from '@/common/chat/chatLib';
import type { IMessageSearchResponse } from '@/common/types/database';

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  hasMore: boolean;
};

export interface IConversationRepository {
  getConversation(id: string): Promise<TChatConversation | undefined>;
  createConversation(conversation: TChatConversation): Promise<void>;
  updateConversation(id: string, updates: Partial<TChatConversation>): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  getMessages(id: string, page: number, pageSize: number, order?: 'ASC' | 'DESC'): Promise<PaginatedResult<TMessage>>;
  insertMessage(message: TMessage): Promise<void>;
  /**
   * If cursor is provided, offset is ignored.
   * If neither is provided, returns from the beginning.
   */
  getUserConversations(cursor?: string, offset?: number, limit?: number): Promise<PaginatedResult<TChatConversation>>;
  /** Returns all conversations without pagination. */
  listAllConversations(): Promise<TChatConversation[]>;
  /** Full-text search across conversation messages. */
  searchMessages(keyword: string, page: number, pageSize: number): Promise<IMessageSearchResponse>;
  /** List conversations spawned by a specific cron job. */
  getConversationsByCronJob(cronJobId: string): Promise<TChatConversation[]>;
  /**
   * v0.4.7.1 (ENGINE-3) - List conversations whose `extra.presetAssistantId`
   * equals the given id, newest-first, capped at `limit`. Used by the
   * Kickoff `SignalCollector` to find recent per-assistant threads without
   * paging through every conversation and filtering in memory (the prior
   * approach silently dropped Level-2 candidates for power users with 50+
   * recent chats across all assistants).
   */
  getConversationsByAssistant(presetAssistantId: string, limit: number): Promise<TChatConversation[]>;
}
