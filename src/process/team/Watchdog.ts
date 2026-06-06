// src/process/team/Watchdog.ts
//
// P2 durable execution - zombie reclaim sweep + P3 verify-orphan recovery.
//
// A periodic sweeper with three responsibilities per tick:
//   1. Reclaim tasks already parked in `zombie` (detected dead on a PRIOR tick):
//      re-queue to `pending` while retry budget remains, else terminate
//      (mapped to `deleted` with a `failureReason`).
//   2. Detect newly dead work: `in_progress` tasks whose persisted lease has
//      fully lapsed (the owning agent or whole process died without the
//      in-memory inactivity timeout ever firing) -> flip to `zombie`.
//   3. Recover tasks orphaned mid-verification: a `verifying` task whose owner
//      died after the gate's `verifying` write but before the final write would
//      otherwise be stuck forever (the gate is throw-free but the host can die).
//      These are completed-through with an advisory note.
//
// Detection (step 2) and reclaim (step 1) are split across ticks ON PURPOSE: a
// task spends ~one interval visibly in `zombie` (Mission Control surfaces it as
// STALLED) before it is reclaimed. The extra latency only ever applies to work
// that has ALREADY died, so it costs nothing real and buys an honest UI signal.
//
// IDEMPOTENCY / RACE-SAFETY is guaranteed at the REPOSITORY layer, not here:
//   - `markZombie` is a guarded CAS (`WHERE status='in_progress' AND lease
//     lapsed`), so a re-woken owner / concurrent sweep / the gate moving the task
//     on makes it a no-op and the `zombie` event is never duplicated.
//   - `reclaimZombie` reads the PERSISTED budget and increments `retries_used`
//     via SQL inside a transaction guarded by `WHERE status='zombie'`, so two
//     passes can never double-increment or double-dispatch.
//   - The in-process `sweeping` guard additionally prevents a slow sweep from
//     overlapping the next interval tick.
import type { EventLogger } from './EventLogger';
import type { ITaskRepository } from './repository/ITeamRepository';
import type { TeamTask } from './types';

type WatchdogOptions = {
  /** How often the sweep runs, in ms. */
  checkIntervalMs: number;
  /**
   * A `verifying` task untouched for longer than this is treated as orphaned and
   * completed-through. Must comfortably exceed the gate's cross-audit timeout.
   * Defaults to 5 minutes.
   */
  verifyStaleMs?: number;
  /**
   * Called after a task is completed-through by verify-recovery, so dependents
   * blocked on it are released (wired to TaskManager.checkUnblocks). Optional so
   * standalone/tests work without it.
   */
  onCompleted?: (taskId: string) => Promise<void>;
};

const DEFAULT_VERIFY_STALE_MS = 5 * 60 * 1000;

export class Watchdog {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  /** Re-entrancy guard - true while a sweep is in flight (prevents overlap). */
  private sweeping = false;
  private readonly verifyStaleMs: number;

  constructor(
    private readonly repo: ITaskRepository,
    private readonly eventLogger: EventLogger,
    private readonly options: WatchdogOptions
  ) {
    this.verifyStaleMs = options.verifyStaleMs ?? DEFAULT_VERIFY_STALE_MS;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => {
      void this.runOnce();
    }, this.options.checkIntervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run a single sweep. Public so tests can drive it deterministically. The
   * `sweeping` guard makes overlapping calls a no-op, so a tick that fires while
   * a previous (slow) sweep is still running is dropped rather than racing it.
   */
  async runOnce(): Promise<void> {
    if (this.sweeping) return;
    this.sweeping = true;
    try {
      const now = Date.now();
      // Each task is processed sequentially ON PURPOSE: the per-task writes must
      // be serialized to keep the idempotency/ordering reasoning and the emitted
      // event timeline intact. Parallelizing here would be wrong.
      // 1. Reclaim zombies detected on a prior tick.
      for (const task of await this.repo.findZombieTasks()) {
        // eslint-disable-next-line no-await-in-loop -- serialized reclaim, see above
        await this.reclaimZombie(task, now);
      }
      // 2. Detect newly dead work (lapsed lease) and park it as zombie.
      for (const task of await this.repo.findStaleLeasedTasks(now)) {
        // eslint-disable-next-line no-await-in-loop -- serialized detection, see above
        await this.detectZombie(task, now);
      }
      // 3. Recover tasks orphaned mid-verification.
      for (const task of await this.repo.findStaleVerifyingTasks(now, this.verifyStaleMs)) {
        // eslint-disable-next-line no-await-in-loop -- serialized recovery, see above
        await this.recoverVerifying(task, now);
      }
    } catch (error) {
      // A sweep failure must never crash the host process - the next tick retries.
      console.warn('[Watchdog] sweep failed:', error instanceof Error ? error.message : String(error));
    } finally {
      this.sweeping = false;
    }
  }

  /** Atomically flip ONE lapsed-lease task to `zombie`; emit the event only if we won the CAS. */
  private async detectZombie(task: TeamTask, now: number): Promise<void> {
    const won = await this.repo.markZombie(task.id, now);
    if (!won) return; // another writer moved it on; no event.
    await this.eventLogger.append({
      teamId: task.teamId,
      eventType: 'task',
      actorSlotId: task.leaseOwner ?? task.owner,
      targetSlotId: task.id,
      payload: {
        action: 'zombie',
        taskId: task.id,
        leaseOwner: task.leaseOwner,
        leaseExpiresAt: task.leaseExpiresAt,
        retriesUsed: task.retriesUsed ?? 0,
        retryBudget: task.retryBudget ?? 0,
      },
    });
  }

  /** Atomically reclaim ONE zombie (re-queue or terminate); emit the reclaim event for the outcome. */
  private async reclaimZombie(task: TeamTask, now: number): Promise<void> {
    const outcome = await this.repo.reclaimZombie(task.id, now);
    if (outcome === 'skipped') return; // lost the race / already reclaimed.

    // Read the POST-COMMIT row so the event reports the authoritative
    // retries_used (the txn incremented it via SQL), not a pre-sweep snapshot.
    const committed = await this.repo.findTaskById(task.id);
    const retriesUsed = committed?.retriesUsed ?? (task.retriesUsed ?? 0);
    const retryBudget = committed?.retryBudget ?? task.retryBudget ?? 0;
    await this.eventLogger.append({
      teamId: task.teamId,
      eventType: 'task',
      targetSlotId: task.id,
      payload:
        outcome === 'requeued'
          ? { action: 'reclaim', taskId: task.id, status: 'pending', retriesUsed, retryBudget }
          : {
              action: 'reclaim',
              taskId: task.id,
              status: 'failed',
              failureReason: 'lease exhausted',
              retriesUsed,
              retryBudget,
            },
    });
  }

  /**
   * Complete-through a task orphaned in `verifying`. The work itself was already
   * proposed done; we honor that and record an advisory note rather than
   * re-queueing (which would lose the proposed-completion signal).
   */
  private async recoverVerifying(task: TeamTask, now: number): Promise<void> {
    // Guarded, atomic complete-through (no-ops if the gate already moved the row).
    const recovered = await this.repo.recoverVerifyingTask(
      task.id,
      { verification: { outcome: 'advisory', note: 'verify interrupted; completed on recovery', failCount: 0, checkedAt: now } },
      now
    );
    if (!recovered) return;
    await this.eventLogger.append({
      teamId: task.teamId,
      eventType: 'task',
      actorSlotId: task.owner,
      targetSlotId: task.id,
      payload: { action: 'verify_recovered', taskId: task.id, status: 'completed' },
    });
    // Release dependents blocked on this now-completed task.
    if (this.options.onCompleted) {
      await this.options.onCompleted(task.id).catch((error) => {
        console.warn('[Watchdog] onCompleted(unblock) failed:', error instanceof Error ? error.message : String(error));
      });
    }
  }
}
