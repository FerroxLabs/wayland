/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import { getActivityTime } from '@/renderer/utils/chat/timeline';
import { getWorkspaceDisplayName } from '@/renderer/utils/workspace/workspace';
import { getWorkspaceUpdateTime } from '@/renderer/utils/workspace/workspaceHistory';

import type { GroupedHistoryResult, TimelineItem, TimelineSection } from '../types';
import { getConversationSortOrder } from './sortOrderHelpers';

export const isConversationPinned = (conversation: TChatConversation): boolean => {
  const extra = conversation.extra as { pinned?: boolean } | undefined;
  return Boolean(extra?.pinned);
};

export const isCronJobConversation = (conversation: TChatConversation): boolean => {
  const extra = conversation.extra as { cronJobId?: string } | undefined;
  return Boolean(extra?.cronJobId);
};

export const getConversationPinnedAt = (conversation: TChatConversation): number => {
  const extra = conversation.extra as { pinnedAt?: number } | undefined;
  if (typeof extra?.pinnedAt === 'number') {
    return extra.pinnedAt;
  }
  return 0;
};

export const groupConversationsByWorkspace = (
  conversations: TChatConversation[],
  t: (key: string) => string,
  projects: IProject[] = []
): TimelineSection[] => {
  // Build a lookup from workspace path → project name so workspace groups show
  // the user-defined project name instead of the raw folder basename.
  const projectNameByWorkspace = new Map<string, string>(
    projects.filter((p) => p.workspace).map((p) => [p.workspace as string, p.name])
  );
  const allWorkspaceGroups = new Map<string, TChatConversation[]>();
  const withoutWorkspaceConvs: TChatConversation[] = [];

  conversations.forEach((conv) => {
    const workspace = conv.extra?.workspace;
    const customWorkspace = conv.extra?.customWorkspace;

    if (customWorkspace && workspace) {
      if (!allWorkspaceGroups.has(workspace)) {
        allWorkspaceGroups.set(workspace, []);
      }
      allWorkspaceGroups.get(workspace)!.push(conv);
    } else {
      withoutWorkspaceConvs.push(conv);
    }
  });

  const items: TimelineItem[] = [];

  allWorkspaceGroups.forEach((convList, workspace) => {
    const sortedConvs = [...convList].toSorted((a, b) => getActivityTime(b) - getActivityTime(a));
    const latestConversationTime = getActivityTime(sortedConvs[0]);
    const updateTime = getWorkspaceUpdateTime(workspace);
    const time = Math.max(updateTime, latestConversationTime);
    items.push({
      type: 'workspace',
      time,
      workspaceGroup: {
        workspace,
        displayName: getWorkspaceDisplayName(workspace, undefined, projectNameByWorkspace.get(workspace)),
        conversations: sortedConvs,
      },
    });
  });

  withoutWorkspaceConvs.forEach((conv) => {
    items.push({
      type: 'conversation',
      time: getActivityTime(conv),
      conversation: conv,
    });
  });

  items.sort((a, b) => b.time - a.time);

  if (items.length === 0) return [];

  return [
    {
      timeline: t('conversation.history.recents'),
      items,
    },
  ];
};

/** Check whether a conversation belongs to a scoped surface (should be hidden from global sidebar). */
const isScopedConversation = (conversation: TChatConversation): boolean => {
  const extra = conversation.extra as { teamId?: string; projectId?: string } | undefined;
  return Boolean(extra?.teamId || extra?.projectId);
};

export const buildGroupedHistory = (
  conversations: TChatConversation[],
  t: (key: string) => string,
  projects: IProject[] = []
): GroupedHistoryResult => {
  // Filter out scoped conversations; they are only visible via their owning surface.
  const visibleConversations = conversations.filter((conv) => !isScopedConversation(conv));

  const pinnedConversations = visibleConversations
    .filter((conversation) => isConversationPinned(conversation))
    .toSorted((a, b) => {
      const orderA = getConversationSortOrder(a);
      const orderB = getConversationSortOrder(b);
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return getConversationPinnedAt(b) - getConversationPinnedAt(a);
    });

  const normalConversations = visibleConversations.filter(
    (conversation) => !isConversationPinned(conversation) && !isCronJobConversation(conversation)
  );

  return {
    pinnedConversations,
    timelineSections: groupConversationsByWorkspace(normalConversations, t, projects),
  };
};
