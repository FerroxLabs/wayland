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
import { emptyCounts, TaskLedgerService } from '@process/services/missionControl/TaskLedgerService';
import type { ActivityObservation } from '@/common/types/missionControl';
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
