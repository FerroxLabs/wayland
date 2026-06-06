/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TeamSessionService } from '@process/team/TeamSessionService';
import { TaskLedgerService } from '@process/services/missionControl/TaskLedgerService';
import type { MissionControlSnapshot } from '@/common/types/missionControl';

/**
 * Mission Control bridge - exposes the unified task ledger to the renderer.
 *
 * P1 is a one-shot `snapshot` query. The renderer keeps it live by refetching
 * on cron/team events it already subscribes to; a dedicated push emitter lands
 * in a later phase.
 */
export function initMissionControlBridge(teamSessionService: TeamSessionService): void {
  const ledger = new TaskLedgerService(teamSessionService);

  ipcBridge.missionControl.snapshot.provider(async ({ userId }): Promise<MissionControlSnapshot> => {
    try {
      return await ledger.snapshot(userId);
    } catch (error) {
      console.error('[missionControlBridge] snapshot error:', error);
      return {
        generatedAt: Date.now(),
        entries: [],
        counts: { running: 0, verifying: 0, pending: 0, blocked: 0, failed: 0, zombie: 0, done: 0, idle: 0, total: 0 },
      };
    }
  });
}
