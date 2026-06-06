/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Reuse existing business type definitions
import type { ConversationSource, TChatConversation, IConfigStorageRefer } from '@/common/config/storage';
import type { TMessage } from '@/common/chat/chatLib';
import type { IProject } from '@/common/types/project';

/**
 * ======================
 * Database-specific types (new functionality)
 * ======================
 */

/**
 * User account (new account system)
 */
export interface IUser {
  id: string;
  username: string;
  email?: string;
  password_hash: string;
  avatar_path?: string;
  jwt_secret?: string | null;
  created_at: number;
  updated_at: number;
  last_login?: number | null;
}

// Image metadata removed - images are stored in filesystem and referenced via message.resultDisplay

/**
 * ======================
 * Database query helper types
 * ======================
 */

/**
 * Database query result wrapper
 */
export interface IQueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Paginated query result
 */
export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * ======================
 * Database storage format (serialized form)
 * ======================
 */

/**
 * Conversation stored in database (serialized form)
 */
export interface IConversationRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  extra: string; // JSON string of extra data
  model?: string; // JSON string of TProviderWithModel (gemini type has this)
  status?: 'pending' | 'running' | 'finished';
  source?: ConversationSource; // Conversation source
  channel_chat_id?: string; // Channel chat isolation ID (e.g. user:xxx or group:xxx)
  created_at: number;
  updated_at: number;
}

/**
 * Message stored in database (serialized form)
 */
export interface IMessageRow {
  id: string;
  conversation_id: string;
  msg_id?: string; // source message ID
  type: string; // TMessage['type']
  content: string; // JSON string of message content
  position?: 'left' | 'right' | 'center' | 'pop';
  status?: 'finish' | 'pending' | 'error' | 'work';
  hidden?: number; // 0 or 1, maps to boolean IMessage.hidden
  created_at: number;
}

/**
 * Config stored in database (key-value, used for database version tracking)
 */
export interface IConfigRow {
  key: string;
  value: string; // JSON string
  updated_at: number;
}

/**
 * ======================
 * Type conversion functions
 * ======================
 */

/**
 * Convert TChatConversation to database row
 */
export function conversationToRow(conversation: TChatConversation, userId: string): IConversationRow {
  return {
    id: conversation.id,
    user_id: userId,
    name: conversation.name,
    type: conversation.type,
    extra: JSON.stringify(conversation.extra),
    model: 'model' in conversation ? JSON.stringify(conversation.model) : undefined,
    status: conversation.status,
    source: conversation.source,
    channel_chat_id: conversation.channelChatId,
    created_at: conversation.createTime,
    updated_at: conversation.modifyTime,
  };
}

/**
 * Convert database row to TChatConversation
 */
export function rowToConversation(row: IConversationRow): TChatConversation {
  const base = {
    id: row.id,
    name: row.name,
    desc: undefined as string | undefined,
    createTime: row.created_at,
    modifyTime: row.updated_at,
    status: row.status,
    source: row.source,
    channelChatId: row.channel_chat_id,
  };

  // Gemini type has model field
  if (row.type === 'gemini' && row.model) {
    return {
      ...base,
      type: 'gemini' as const,
      extra: JSON.parse(row.extra),
      model: JSON.parse(row.model),
    } as TChatConversation;
  }

  // ACP type
  if (row.type === 'acp') {
    return {
      ...base,
      type: 'acp' as const,
      extra: JSON.parse(row.extra),
    } as TChatConversation;
  }

  // Codex type
  if (row.type === 'codex') {
    return {
      ...base,
      type: 'codex' as const,
      extra: JSON.parse(row.extra),
    } as TChatConversation;
  }

  // OpenClaw Gateway type
  if (row.type === 'openclaw-gateway') {
    return {
      ...base,
      type: 'openclaw-gateway' as const,
      extra: JSON.parse(row.extra),
    } as TChatConversation;
  }

  // Nanobot type
  if (row.type === 'nanobot') {
    return {
      ...base,
      type: 'nanobot' as const,
      extra: JSON.parse(row.extra),
    } as TChatConversation;
  }

  // Wcore type has model field.
  if (row.type === 'wcore' && row.model) {
    return {
      ...base,
      type: 'wcore' as const,
      extra: JSON.parse(row.extra),
      model: JSON.parse(row.model),
    } as TChatConversation;
  }

  // Remote type
  if (row.type === 'remote') {
    return {
      ...base,
      type: 'remote' as const,
      extra: JSON.parse(row.extra),
    } as TChatConversation;
  }

  // Unknown type - should never happen with valid data
  throw new Error(`Unknown conversation type: ${row.type}`);
}

/**
 * Convert TMessage to database row
 */
export function messageToRow(message: TMessage): IMessageRow {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    msg_id: message.msg_id,
    type: message.type,
    content: JSON.stringify(message.content),
    position: message.position,
    status: message.status,
    hidden: message.hidden ? 1 : 0,
    created_at: message.createdAt || Date.now(),
  };
}

/**
 * Convert database row to TMessage
 */
export function rowToMessage(row: IMessageRow): TMessage {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    msg_id: row.msg_id,
    type: row.type as TMessage['type'],
    content: JSON.parse(row.content),
    position: row.position,
    status: row.status,
    hidden: row.hidden === 1 ? true : undefined,
    createdAt: row.created_at,
  } as TMessage;
}

/**
 * Project stored in database (serialized form). Mirrors the projects table
 * created in migration_v43.
 */
export interface IProjectRow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  workspace?: string | null;
  icon?: string | null;
  icon_color?: string | null;
  pinned: number; // 0 | 1
  pinned_at?: number | null;
  created_at: number;
  updated_at: number;
}

/**
 * Convert IProject to database row.
 */
export function projectToRow(project: IProject, userId: string): IProjectRow {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description ?? null,
    workspace: project.workspace ?? null,
    icon: project.icon ?? null,
    icon_color: project.iconColor ?? null,
    pinned: project.pinned ? 1 : 0,
    pinned_at: project.pinnedAt ?? null,
    created_at: project.createTime,
    updated_at: project.modifyTime,
  };
}

/**
 * Convert database row to IProject.
 */
export function rowToProject(row: IProjectRow): IProject {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    workspace: row.workspace ?? undefined,
    icon: row.icon ?? undefined,
    iconColor: row.icon_color ?? undefined,
    pinned: row.pinned === 1,
    pinnedAt: row.pinned_at ?? undefined,
    createTime: row.created_at,
    modifyTime: row.updated_at,
  };
}

/**
 * ======================
 * Re-exported type aliases for convenience
 * ======================
 */

export type {
  // Reused business types
  TChatConversation,
  TMessage,
  IConfigStorageRefer,
};
