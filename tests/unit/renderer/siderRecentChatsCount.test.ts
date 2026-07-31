/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  isConversationPinned,
  isCronJobConversation,
} from '@renderer/pages/conversation/GroupedHistory/utils/groupingHelpers';
import type { TChatConversation } from '@/common/storage';

/**
 * The Recent Chats badge and the list it sits above computed the visible set
 * independently, and disagreed.
 *
 * Observed live on a clean profile: the sidebar rendered "RECENT CHATS 1"
 * directly over the empty state "No chat history". The chat was real — the Chats
 * page listed it — but it had just acquired a schedule, and a cron conversation
 * is excluded from `normalConversations` (groupingHelpers.ts:126-128) while
 * being unpinned means it lands in no section at all. The badge's own filter
 * never knew about `cronJobId`, so it kept counting it.
 *
 * This pins the shared rule rather than the copy: whatever the list renders is
 * what the badge counts. The predicates themselves live in groupingHelpers and
 * are the same ones both sides now honour.
 */

const conv = (extra: Record<string, unknown>): TChatConversation =>
  ({ id: 'c1', name: 'chat', extra }) as unknown as TChatConversation;

/** The badge's predicate, kept in step with SiderRecentChatsSection. */
const countsTowardBadge = (c: TChatConversation): boolean => {
  const extra = c.extra as
    { isHealthCheck?: boolean; teamId?: string; projectId?: string; cronJobId?: string; pinned?: boolean } | undefined;
  if (extra?.isHealthCheck === true || extra?.teamId || extra?.projectId) return false;
  return Boolean(extra?.pinned) || !extra?.cronJobId;
};

/** True when the list actually puts the conversation on screen, in either section. */
const listRenders = (c: TChatConversation): boolean => {
  const extra = c.extra as { isHealthCheck?: boolean; teamId?: string; projectId?: string } | undefined;
  const inVisibleSet = extra?.isHealthCheck !== true && !extra?.teamId && !extra?.projectId;
  if (!inVisibleSet) return false;
  // Pinned chats render in their own section; the rest render only when they are
  // not cron conversations.
  return isConversationPinned(c) || !isCronJobConversation(c);
};

describe('Recent Chats badge counts what the list renders', () => {
  const cases: Array<[string, TChatConversation]> = [
    ['plain chat', conv({})],
    ['scheduled chat', conv({ cronJobId: 'job-1' })],
    ['pinned chat', conv({ pinned: true })],
    ['pinned scheduled chat', conv({ pinned: true, cronJobId: 'job-1' })],
    ['health check', conv({ isHealthCheck: true })],
    ['team chat', conv({ teamId: 't1' })],
    ['project chat', conv({ projectId: 'p1' })],
  ];

  it.each(cases)('%s: badge and list agree', (_label, c) => {
    // Negative control: before the fix the badge ignored cronJobId, so the
    // "scheduled chat" row counted (true) while the list rendered nothing (false).
    expect(countsTowardBadge(c)).toBe(listRenders(c));
  });

  it('a scheduled chat is the case that used to disagree', () => {
    const scheduled = conv({ cronJobId: 'job-1' });
    expect(isCronJobConversation(scheduled)).toBe(true);
    expect(listRenders(scheduled)).toBe(false);
    expect(countsTowardBadge(scheduled)).toBe(false);
  });
});
