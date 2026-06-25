/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parent-run stall watchdog (Phase 2b.3).
 *
 * The `turnCompleted` driver loop advances a run whenever the parent agent
 * emits a terminal turn. But a hard crash mid-turn (renderer killed, agent
 * process hung without throwing) emits NOTHING, leaving the run stuck `running`
 * with a step `now` forever - the parent-run analogue of the 194-hour
 * autonomous ghost. `sweepStalledAutonomousSteps` only catches steps with an
 * `autonomous_run`; this backstop catches the plain in-chat case.
 *
 * Action: park the run at `awaiting_input` so the UI surfaces it as
 * "interrupted - resume?" rather than pretending to work. (We do NOT error the
 * step, because unlike an autonomous child the user can simply continue.)
 */

import type { WorkflowSession } from '@/common/types/workflowTypes';

/** A parent `now` step older than this with no progress is treated as stalled. */
export const PARENT_RUN_STALL_MS = 30 * 60 * 1000;

/** How often the parent watchdog sweeps. */
export const PARENT_WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;

type ParentWatchdogService = {
  findAllActive(limit?: number): Promise<Array<{ session: WorkflowSession; conversation_preview: string }>>;
  setRunMode(sessionId: string, mode: WorkflowSession['run_mode']): Promise<WorkflowSession>;
};

export type SweptParentRun = { sessionId: string; stepN: number };

/**
 * Park every parent run whose `now` step (and the session) has been idle past
 * `thresholdMs`. `now` is injectable for deterministic tests. Per-session
 * failures are logged and skipped so one bad row can't abort the sweep.
 *
 * Skipped: non-`running` sessions, `now` steps that carry an `autonomous_run`
 * (the autonomous watchdog owns those), and sessions with recent activity.
 *
 * Liveness is the MOST RECENT of the step's `started_at` and the session's
 * `updated_at`. `continueRun` touches `updated_at` on every driver turn (and on
 * boot re-poke), so an actively-driving long step (>30 min, many turns) keeps a
 * fresh `updated_at` and is never parked, while a genuinely crashed run (no
 * turns since the crash) goes stale and is parked. Using `started_at` alone
 * (set once when the step began) would false-positive on both - parking healthy
 * long steps and fighting boot-resume.
 */
export async function sweepStalledParentRuns(
  service: ParentWatchdogService,
  thresholdMs: number = PARENT_RUN_STALL_MS,
  now: number = Date.now()
): Promise<SweptParentRun[]> {
  const swept: SweptParentRun[] = [];
  const active = await service.findAllActive(100);
  for (const { session } of active) {
    if (session.run_mode !== 'running') continue;
    const nowStep = session.steps.find((s) => s.status === 'now');
    if (nowStep === undefined) continue;
    if (nowStep.autonomous_run !== null) continue;
    const lastProgress = Math.max(nowStep.started_at ?? 0, session.updated_at);
    if (now - lastProgress <= thresholdMs) continue;
    try {
      await service.setRunMode(session.id, 'awaiting_input');
      swept.push({ sessionId: session.id, stepN: nowStep.n });
    } catch (err) {
      console.warn('[parentWatchdog] failed to park stalled parent run', session.id, nowStep.n, err);
    }
  }
  return swept;
}
