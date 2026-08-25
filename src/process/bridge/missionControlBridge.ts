/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TeamSessionService } from '@process/team/TeamSessionService';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import type { IConversationService } from '@process/services/IConversationService';
import { getWorkflowSessionService } from '@process/services/workflow/workflowSessionServiceSingleton';
import { getDatabase } from '@process/services/database';
import { emptyCounts, TaskLedgerService } from '@process/services/missionControl/TaskLedgerService';
import { projectScheduleRuns } from '@process/services/missionControl/ScheduleRunProjector';
import type { ActivityObservation, ScheduleRunRecord } from '@/common/types/missionControl';
import type { MissionControlSnapshot } from '@/common/types/missionControl';

/**
 * Mission Control bridge - exposes the unified task ledger to the renderer.
 *
 * P1 is a one-shot `snapshot` query. The renderer keeps it live by refetching
 * on cron/team events it already subscribes to; a dedicated push emitter lands
 * in a later phase.
 */
export function initMissionControlBridge(
  teamSessionService: TeamSessionService,
  workerTaskManager: IWorkerTaskManager,
  conversationService: IConversationService
): void {
  const ledger = new TaskLedgerService(teamSessionService, {
    listScheduleRuns: async (jobs) => {
      const database = await getDatabase();
      const results = await Promise.all(
        jobs.map(async (job): Promise<{ runs: ScheduleRunRecord[]; failed: boolean }> => {
          try {
            const conversations = new Map(
              (await conversationService.getConversationsByCronJob(job.id)).map((conversation) => [
                conversation.id,
                conversation,
              ])
            );
            if (job.metadata.conversationId && !conversations.has(job.metadata.conversationId)) {
              const existing = await conversationService.getConversation(job.metadata.conversationId);
              if (existing) conversations.set(existing.id, existing);
            }
            const evidence = [...conversations.values()].map((conversation) => {
              const history = database.getConversationMessages(conversation.id, 0, 10_000, 'ASC');
              if (history.hasMore) throw new Error('schedule history exceeds the bounded complete evidence window');
              return { conversationId: conversation.id, messages: history.data ?? [] };
            });
            return { runs: projectScheduleRuns(job, evidence), failed: false };
          } catch {
            return { runs: [], failed: true };
          }
        })
      );
      const runs = results.flatMap((result) => result.runs);
      const failedJobs = results.filter((result) => result.failed).length;
      return {
        runs,
        status: failedJobs > 0 ? ('partial' as const) : ('ok' as const),
        ...(failedJobs > 0 ? { detail: `${failedJobs}/${jobs.length} schedule histories unavailable` } : {}),
      };
    },
    listDesktopWorkflows: async () => {
      const service = getWorkflowSessionService();
      if (!service) throw new Error('workflow service not initialized');
      return (await service.findAllActive(100)).map(({ session }) => session);
    },
    // The process manager authoritatively identifies live Core runtimes, but it
    // does not retain child workflow/sub-agent events. Expose known turns as
    // unknown progress and declare that observability gap instead of inventing
    // a running state or silently omitting the missing children.
    listCoreActivity: async () => {
      const tasks = workerTaskManager.listTasks().filter((task) => task.type === 'wcore');
      const observations = (
        await Promise.all(
          tasks.map(async (task): Promise<ActivityObservation | null> => {
            const conversation = await conversationService.getConversation(task.id);
            if (!conversation) return null;
            return {
              sourceId: task.id,
              provenance: { origin: 'core', kind: 'turn' },
              title: conversation.name,
              status: 'unknown',
              action: { kind: 'navigate', path: `/conversation/${conversation.id}`, label: 'Open Core turn' },
              context: 'Wayland Core',
              detail: 'Runtime exists; current turn progress is not authoritatively observable',
              startedAt: conversation.createTime,
              updatedAt: conversation.modifyTime,
            };
          })
        )
      ).filter((item): item is ActivityObservation => item !== null);
      return {
        observations,
        status: 'partial',
        detail: 'Core turn runtimes are visible; child sub-agent/workflow progress is not retained by Desktop',
      };
    },
    // #1060: without this reader the `approvals` source stayed optional, so the
    // ledger permanently reported it unavailable and a pending approval could
    // never reach "Needs you". Every live agent manager owns the authoritative
    // pending set for its conversation.
    listPendingApprovals: async () => {
      const tasks = workerTaskManager.listTasks();
      const observations: ActivityObservation[] = [];
      let unresolved = 0;
      for (const task of tasks) {
        // getConfirmations() hands back the manager's live array. Read it,
        // never sort or splice it - that is the queue the renderer answers.
        const confirmations = workerTaskManager.getTask(task.id)?.getConfirmations() ?? [];
        if (confirmations.length === 0) continue;
        const conversation = await conversationService.getConversation(task.id);
        if (!conversation) {
          unresolved += confirmations.length;
          continue;
        }
        const provenance: ActivityObservation['provenance'] =
          task.type === 'wcore' ? { origin: 'core', kind: 'approval' } : { origin: 'desktop', kind: 'approval' };
        for (const confirmation of confirmations) {
          observations.push({
            sourceId: `${task.id}:${confirmation.callId}`,
            provenance,
            title: confirmation.title ?? confirmation.action ?? 'Approval required',
            status: 'pending',
            needsHuman: true,
            action: { kind: 'navigate', path: `/conversation/${task.id}`, label: 'Answer approval' },
            context: conversation.name,
            detail: confirmation.description,
            startedAt: conversation.createTime,
            updatedAt: conversation.modifyTime,
          });
        }
      }
      if (unresolved > 0) {
        return {
          observations,
          status: 'partial',
          detail: `${unresolved} pending approval(s) belong to a conversation Desktop can no longer read`,
        };
      }
      return { observations, status: 'ok' };
    },
  });

  ipcBridge.missionControl.snapshot.provider(async ({ userId }): Promise<MissionControlSnapshot> => {
    try {
      return await ledger.snapshot(userId);
    } catch (error) {
      console.error('[missionControlBridge] snapshot error:', error);
      return {
        generatedAt: Date.now(),
        entries: [],
        counts: emptyCounts(),
        groupCounts: { 'needs-you': 0, running: 0, upcoming: 0, recent: 0 },
        sourceHealth: [
          {
            source: 'desktop-teams',
            status: 'error',
            observedAt: Date.now(),
            detail: error instanceof Error ? error.message : 'snapshot failed',
          },
        ],
        completeness: 'unavailable',
      };
    }
  });
}
