/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ConversationActivitySnapshot } from '@/common/chat/activity/conversationActivity';
import type { TChatConversation } from '@/common/config/storage';

export type WorkspaceGroup = {
  workspace: string;
  displayName: string;
  conversations: TChatConversation[];
};

export type TimelineItem = {
  type: 'workspace' | 'conversation';
  time: number;
  workspaceGroup?: WorkspaceGroup;
  conversation?: TChatConversation;
};

export type TimelineSection = {
  timeline: string;
  items: TimelineItem[];
};

export type GroupedHistoryResult = {
  pinnedConversations: TChatConversation[];
  timelineSections: TimelineSection[];
};

export type ExportZipFile = {
  name: string;
  content?: string;
  sourcePath?: string;
};

export type ExportTask =
  | { mode: 'single'; conversation: TChatConversation }
  | { mode: 'batch'; conversationIds: string[] }
  | null;

export type ConversationRowProps = {
  conversation: TChatConversation;
  isGenerating: boolean;
  hasCompletionUnread: boolean;
  /**
   * #252 - live snapshot of what the agent is doing (current action + spawned
   * sub-agents), read passively from the conversation-list sync store. Present
   * only while the conversation is generating; drives the sidebar status label
   * and the expandable sub-agent tree.
   */
  activity?: ConversationActivitySnapshot;
  collapsed: boolean;
  tooltipEnabled: boolean;
  batchMode: boolean;
  checked: boolean;
  selected: boolean;
  menuVisible: boolean;
  onToggleChecked: (conversation: TChatConversation) => void;
  onConversationClick: (conversation: TChatConversation) => void;
  onOpenMenu: (conversation: TChatConversation) => void;
  onMenuVisibleChange: (conversationId: string, visible: boolean) => void;
  onEditStart: (conversation: TChatConversation) => void;
  onDelete: (conversationId: string) => void;
  onExport?: (conversation: TChatConversation) => void;
  onTogglePin: (conversation: TChatConversation) => void;
  /**
   * v0.6.2.6 - invoked when user picks "Schedule this chat" (or "Edit
   * scheduled task" if the conversation already has a cron). Parent
   * handles navigation + modal open via emitter event.
   */
  onScheduleChat?: (conversation: TChatConversation) => void;
  /** Add an existing chat to a project (opens the project picker). Shown only when the chat is not already in a project. */
  onAssignToProject?: (conversation: TChatConversation) => void;
  /** Detach a chat from its project. Shown only when the chat already belongs to one. */
  onRemoveFromProject?: (conversation: TChatConversation) => void;
  getJobStatus: (conversationId: string) => 'none' | 'active' | 'paused' | 'error' | 'unread';
};

export type WorkspaceGroupedHistoryProps = {
  onSessionClick?: () => void;
  collapsed?: boolean;
  tooltipEnabled?: boolean;
  batchMode?: boolean;
  onBatchModeChange?: (value: boolean) => void;
};

export type DragItemType = 'conversation' | 'workspace';

export type DragItem = {
  type: DragItemType;
  id: string;
  conversation?: TChatConversation;
  workspaceGroup?: WorkspaceGroup;
  sourceSection: 'pinned' | string;
  sourceWorkspace?: string;
};
