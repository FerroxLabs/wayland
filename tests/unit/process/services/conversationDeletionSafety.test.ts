/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockListJobsByConversation } = vi.hoisted(() => ({
  mockListJobsByConversation: vi.fn(),
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    listJobsByConversation: mockListJobsByConversation,
  },
}));

import {
  inspectConversationDeletionSchedules,
  isTeamRitualSchedule,
} from '@process/services/conversationDeletionSafety';

function job(id: string, createdBy: 'user' | 'agent', kind?: string) {
  return {
    id,
    metadata: {
      createdBy,
      agentConfig: kind ? { configOptions: { kind } } : undefined,
    },
  } as never;
}

describe('conversation deletion schedule safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only classifies the explicit agent ritual tag as lifecycle-owned', () => {
    expect(isTeamRitualSchedule(job('ritual', 'agent', 'ritual'))).toBe(true);
    expect(isTeamRitualSchedule(job('user', 'user', 'ritual'))).toBe(false);
    expect(isTeamRitualSchedule(job('agent-user-task', 'agent'))).toBe(false);
    expect(isTeamRitualSchedule(job('other', 'agent', 'follow-up'))).toBe(false);
  });

  it('keeps every non-ritual schedule in the blocking set', async () => {
    const ritual = job('ritual', 'agent', 'ritual');
    const user = job('user', 'user');
    const agentCreatedUserTask = job('agent-user-task', 'agent');
    mockListJobsByConversation.mockResolvedValue([ritual, user, agentCreatedUserTask]);

    await expect(inspectConversationDeletionSchedules('conv-1')).resolves.toEqual({
      jobs: [ritual, user, agentCreatedUserTask],
      ritualJobs: [ritual],
      blockingJobs: [user, agentCreatedUserTask],
    });
  });

  it('surfaces schedule authority failures instead of treating them as an empty result', async () => {
    mockListJobsByConversation.mockRejectedValue(new Error('authority unavailable'));

    await expect(inspectConversationDeletionSchedules('conv-1')).rejects.toThrow(
      'authority unavailable'
    );
  });
});
