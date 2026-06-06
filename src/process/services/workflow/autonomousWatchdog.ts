/**
 * Watchdog for autonomous workflow steps (BUG-6 GAP-A).
 *
 * `dispatchAutonomousStep` marks a step's `autonomous_run.state = 'running'` and
 * then relies *entirely* on the child conversation emitting a terminal
 * `turnCompleted` event (handled in initBridge) to advance the step. If the child
 * agent's session crashes, disconnects, or silently hangs without ever emitting a
 * terminal turn, the step stays `running` forever - the observed 194-hour ghost.
 *
 * The catch-block fix in AcpAgentManager now emits `turnCompleted{state:'error'}`
 * when a turn *throws*, but a process that hangs without throwing still emits
 * nothing. This sweep is the backstop: any step still `running` past `thresholdMs`
 * is force-errored via the same path the completion listener uses, so the workflow
 * stops pretending to work and surfaces the failure.
 */

import type { WorkflowSession } from '@/common/types/workflowTypes';

/**
 * A step dispatched and still `running` longer than this is treated as stalled.
 * Cold agent starts + long research steps legitimately run several minutes, so
 * this is set conservatively past any real turn.
 */
export const AUTONOMOUS_STEP_STALL_MS = 30 * 60 * 1000;

/** How often the watchdog sweeps. */
export const AUTONOMOUS_WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;

/** Minimal slice of WorkflowSessionService the sweep needs - keeps it unit-testable. */
type WatchdogService = {
  findAllActive(limit?: number): Promise<Array<{ session: WorkflowSession; conversation_preview: string }>>;
  recordAutonomousCompletion(sessionId: string, stepN: number, success: boolean): Promise<WorkflowSession>;
  applyStepTransition(
    sessionId: string,
    transition: { step_n: number; status: 'errored'; source: 'worker'; dispatch_id: string; timestamp: number }
  ): Promise<WorkflowSession>;
};

export type SweptStep = { sessionId: string; stepN: number; dispatchId: string };

/**
 * Force-error every autonomous step still `running` past `thresholdMs`.
 * `now` is injectable for deterministic tests. Per-step failures are logged and
 * skipped so one bad row can't abort the whole sweep. Returns the steps it errored.
 */
export async function sweepStalledAutonomousSteps(
  service: WatchdogService,
  thresholdMs: number = AUTONOMOUS_STEP_STALL_MS,
  now: number = Date.now()
): Promise<SweptStep[]> {
  const swept: SweptStep[] = [];
  const active = await service.findAllActive(100);
  for (const { session } of active) {
    for (const step of session.steps) {
      const run = step.autonomous_run;
      if (run === null || run.state !== 'running') continue;
      if (now - run.started_at <= thresholdMs) continue;
      try {
        await service.recordAutonomousCompletion(session.id, step.n, false);
        await service.applyStepTransition(session.id, {
          step_n: step.n,
          status: 'errored',
          source: 'worker',
          dispatch_id: run.dispatch_id,
          timestamp: now,
        });
        swept.push({ sessionId: session.id, stepN: step.n, dispatchId: run.dispatch_id });
      } catch (err) {
        console.warn('[autonomousWatchdog] failed to error-out stalled step', session.id, step.n, err);
      }
    }
  }
  return swept;
}
