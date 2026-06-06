/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2 (durable execution) - Watchdog sweep. Covers the two-phase zombie flow
 * (detect -> mark `zombie` on one tick, reclaim on the next), reclaim-to-pending
 * while budget remains, terminate-to-deleted on exhaustion, lease clearing,
 * EventLogger emission, cross-sweep idempotency, the re-entrancy guard, and P3
 * verify-orphan recovery (a stuck `verifying` task completed-through).
 */
import { describe, expect, it, vi } from 'vitest';
import { Watchdog } from '@process/team/Watchdog';
import { EventLogger } from '@process/team/EventLogger';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { TeamEvent, TeamTask } from '@process/team/types';

const TEAM_ID = 'team-abc';
// Anchor timestamps to the real wall clock the Watchdog uses (`Date.now()`), so
// a lapsed lease is genuinely in the past relative to the sweep's `now`.
const NOW = Date.now();

function makeTask(overrides: Partial<TeamTask> = {}): TeamTask {
  return {
    id: crypto.randomUUID(),
    teamId: TEAM_ID,
    subject: 'do the thing',
    status: 'in_progress',
    owner: 'slot-alice',
    blockedBy: [],
    blocks: [],
    metadata: {},
    createdAt: NOW - 10_000,
    updatedAt: NOW - 10_000,
    leaseOwner: 'slot-alice',
    leaseExpiresAt: NOW - 5_000, // lapsed
    lastHeartbeat: NOW - 5_000,
    retryBudget: 3,
    retriesUsed: 0,
    ...overrides,
  };
}

/**
 * In-memory repo mirroring the SQL semantics of the real repository: guarded
 * `markZombie`/`reclaimZombie` CAS writes and the three sweep queries.
 */
function makeRepo(seed: TeamTask[]): { repo: ITeamRepository; tasks: Map<string, TeamTask> } {
  const tasks = new Map<string, TeamTask>(seed.map((t) => [t.id, t]));
  const repo: Partial<ITeamRepository> = {
    async updateTask(id: string, updates: Partial<TeamTask>) {
      const existing = tasks.get(id);
      if (!existing) throw new Error(`Task ${id} not found`);
      const merged = { ...existing, ...updates } as TeamTask;
      tasks.set(id, merged);
      return merged;
    },
    async findTaskById(id: string) {
      return tasks.get(id) ?? null;
    },
    async findStaleLeasedTasks(now: number) {
      return Array.from(tasks.values()).filter(
        (t) => t.status === 'in_progress' && t.leaseExpiresAt !== undefined && t.leaseExpiresAt < now
      );
    },
    async renewLease(id: string, owner: string, leaseExpiresAt: number, now: number) {
      const t = tasks.get(id);
      if (!t || t.status !== 'in_progress' || t.owner !== owner) return false;
      tasks.set(id, { ...t, leaseOwner: owner, leaseExpiresAt, lastHeartbeat: now, updatedAt: now });
      return true;
    },
    async markZombie(id: string, now: number) {
      const t = tasks.get(id);
      if (!t || t.status !== 'in_progress' || t.leaseExpiresAt === undefined || t.leaseExpiresAt >= now) return false;
      tasks.set(id, { ...t, status: 'zombie', updatedAt: now });
      return true;
    },
    async findZombieTasks() {
      return Array.from(tasks.values()).filter((t) => t.status === 'zombie');
    },
    async reclaimZombie(id: string, now: number) {
      const t = tasks.get(id);
      if (!t || t.status !== 'zombie') return 'skipped' as const;
      if ((t.retriesUsed ?? 0) < (t.retryBudget ?? 0)) {
        tasks.set(id, {
          ...t,
          status: 'pending',
          owner: undefined,
          leaseOwner: undefined,
          leaseExpiresAt: undefined,
          lastHeartbeat: undefined,
          retriesUsed: (t.retriesUsed ?? 0) + 1,
          updatedAt: now,
        });
        return 'requeued' as const;
      }
      tasks.set(id, {
        ...t,
        status: 'failed',
        leaseOwner: undefined,
        leaseExpiresAt: undefined,
        lastHeartbeat: undefined,
        metadata: { ...t.metadata, failed: true, failureReason: 'lease exhausted' },
        updatedAt: now,
      });
      return 'exhausted' as const;
    },
    async recoverVerifyingTask(id: string, metadataPatch: Record<string, unknown>, now: number) {
      const t = tasks.get(id);
      if (!t || t.status !== 'verifying') return false;
      tasks.set(id, { ...t, status: 'completed', metadata: { ...t.metadata, ...metadataPatch }, updatedAt: now });
      return true;
    },
    async findStaleVerifyingTasks(now: number, staleMs: number) {
      return Array.from(tasks.values()).filter((t) => t.status === 'verifying' && t.updatedAt < now - staleMs);
    },
  };
  return { repo: repo as ITeamRepository, tasks };
}

/** EventLogger whose appendEvent is a spy, so we can assert the emitted timeline. */
function makeEventLogger(): { logger: EventLogger; events: TeamEvent[] } {
  const events: TeamEvent[] = [];
  const logger = new EventLogger({
    async appendEvent(event: TeamEvent) {
      events.push(event);
    },
    async listEvents() {
      return [];
    },
  });
  return { logger, events };
}

describe('Watchdog - zombie reclaim', () => {
  it('first sweep marks a lapsed task `zombie` (visible dwell), does not yet reclaim', async () => {
    const task = makeTask({ retriesUsed: 1, retryBudget: 3 });
    const { repo, tasks } = makeRepo([task]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000 });

    await wd.runOnce();

    const after = tasks.get(task.id)!;
    expect(after.status).toBe('zombie');
    expect(after.retriesUsed).toBe(1); // not yet incremented
    expect(events.map((e) => e.payload.action)).toEqual(['zombie']);
  });

  it('second sweep re-queues the zombie to pending and increments retriesUsed', async () => {
    const task = makeTask({ retriesUsed: 1, retryBudget: 3 });
    const { repo, tasks } = makeRepo([task]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000 });

    await wd.runOnce(); // detect -> zombie
    await wd.runOnce(); // reclaim -> pending

    const after = tasks.get(task.id)!;
    expect(after.status).toBe('pending');
    expect(after.retriesUsed).toBe(2);
    expect(after.owner).toBeUndefined();
    expect(after.leaseOwner).toBeUndefined();
    expect(after.leaseExpiresAt).toBeUndefined();
    expect(events.map((e) => e.payload.action)).toEqual(['zombie', 'reclaim']);
    expect(events[1].payload.status).toBe('pending');
  });

  it('terminates to deleted with a failureReason when the retry budget is exhausted', async () => {
    const task = makeTask({ retriesUsed: 3, retryBudget: 3 });
    const { repo, tasks } = makeRepo([task]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000 });

    await wd.runOnce(); // zombie
    await wd.runOnce(); // reclaim -> deleted

    const after = tasks.get(task.id)!;
    expect(after.status).toBe('failed');
    expect(after.metadata.failed).toBe(true);
    expect(after.metadata.failureReason).toBe('lease exhausted');
    expect(after.leaseExpiresAt).toBeUndefined();
    expect(events[1].payload.status).toBe('failed');
  });

  it('leaves non-lapsed and non-in_progress tasks untouched', async () => {
    const fresh = makeTask({ leaseExpiresAt: NOW + 60_000 }); // not lapsed
    const completed = makeTask({ status: 'completed', leaseExpiresAt: NOW - 5_000 });
    const { repo, tasks } = makeRepo([fresh, completed]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000 });

    await wd.runOnce();
    await wd.runOnce();

    expect(tasks.get(fresh.id)!.status).toBe('in_progress');
    expect(tasks.get(completed.id)!.status).toBe('completed');
    expect(events).toHaveLength(0);
  });

  it('is idempotent across many sweeps: reclaims exactly once, never double-increments', async () => {
    const task = makeTask({ retriesUsed: 0, retryBudget: 3 });
    const { repo, tasks } = makeRepo([task]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000 });

    await wd.runOnce(); // zombie
    await wd.runOnce(); // reclaim -> pending (retriesUsed 1)
    await wd.runOnce(); // no-op (pending is not swept)
    await wd.runOnce(); // no-op

    expect(tasks.get(task.id)!.status).toBe('pending');
    expect(tasks.get(task.id)!.retriesUsed).toBe(1);
    expect(events.map((e) => e.payload.action)).toEqual(['zombie', 'reclaim']);
  });

  it('re-entrancy guard: overlapping runOnce calls do not process the same task twice', async () => {
    const task = makeTask({ retriesUsed: 0, retryBudget: 3 });
    const { repo, tasks } = makeRepo([task]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000 });

    // Two concurrent sweeps; the second short-circuits on the guard, so the task
    // is marked `zombie` exactly once.
    await Promise.all([wd.runOnce(), wd.runOnce()]);

    expect(tasks.get(task.id)!.status).toBe('zombie');
    expect(events.map((e) => e.payload.action)).toEqual(['zombie']);
  });

  it('recovers a task orphaned in `verifying` by completing it through with an advisory note', async () => {
    const stuck = makeTask({ status: 'verifying', leaseOwner: undefined, leaseExpiresAt: undefined, updatedAt: NOW - 10 * 60_000 });
    const { repo, tasks } = makeRepo([stuck]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000, verifyStaleMs: 5 * 60_000 });

    await wd.runOnce();

    const after = tasks.get(stuck.id)!;
    expect(after.status).toBe('completed');
    const verification = after.metadata.verification as { outcome: string; note: string };
    expect(verification.outcome).toBe('advisory');
    expect(verification.note).toContain('recovery');
    expect(events.map((e) => e.payload.action)).toEqual(['verify_recovered']);
  });

  it('does NOT recover a freshly-verifying task (within the stale window)', async () => {
    const fresh = makeTask({ status: 'verifying', leaseExpiresAt: undefined, updatedAt: NOW - 1_000 });
    const { repo, tasks } = makeRepo([fresh]);
    const { logger, events } = makeEventLogger();
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 1000, verifyStaleMs: 5 * 60_000 });

    await wd.runOnce();

    expect(tasks.get(fresh.id)!.status).toBe('verifying');
    expect(events).toHaveLength(0);
  });

  it('start drives the interval; stop halts further sweeps', async () => {
    const { repo } = makeRepo([]);
    const { logger } = makeEventLogger();
    const spy = vi.spyOn(repo, 'findZombieTasks');
    const wd = new Watchdog(repo, logger, { checkIntervalMs: 5 });

    wd.start();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const sweepsWhileRunning = spy.mock.calls.length;
    expect(sweepsWhileRunning).toBeGreaterThan(0);

    wd.stop();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(spy.mock.calls.length).toBe(sweepsWhileRunning);
  });
});
