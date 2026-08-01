/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CronJob } from '@process/services/cron/CronStore';

export type ConversationDeletionScheduleInspection = {
  jobs: CronJob[];
  ritualJobs: CronJob[];
  blockingJobs: CronJob[];
};

/**
 * Team rituals are the only schedules owned by the Team lifecycle. Every other
 * schedule is a separate durable user object and must be moved or removed
 * explicitly before its conversation can be deleted.
 */
export function isTeamRitualSchedule(job: CronJob): boolean {
  return job.metadata.createdBy === 'agent' && job.metadata.agentConfig?.configOptions?.kind === 'ritual';
}

/**
 * Read-only schedule authority inspection. Callers must fail closed when this
 * throws; an unavailable schedule authority is not proof that deletion is safe.
 */
export async function inspectConversationDeletionSchedules(
  conversationId: string
): Promise<ConversationDeletionScheduleInspection> {
  const { cronService } = await import('@process/services/cron/cronServiceSingleton');
  const jobs = await cronService.listJobsByConversation(conversationId);
  const ritualJobs = jobs.filter(isTeamRitualSchedule);
  const ritualIds = new Set(ritualJobs.map((job) => job.id));

  return {
    jobs,
    ritualJobs,
    blockingJobs: jobs.filter((job) => !ritualIds.has(job.id)),
  };
}
