/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// cronService is a singleton imported by the service - mock it.
const listJobs = vi.fn();
vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: { listJobs: () => listJobs() },
}));

import { TaskLedgerService } from '@process/services/missionControl/TaskLedgerService';

const team = { id: 't1', name: 'Launch Team' };

function makeTeams() {
  return {
    listTeams: vi.fn(async () => [team]),
    listTasksForTeam: vi.fn(async () => [
      { id: 'a', teamId: 't1', subject: 'Running task', status: 'in_progress', owner: 'slot1', blockedBy: [], blocks: [], metadata: {}, createdAt: 1, updatedAt: 30 },
      { id: 'b', teamId: 't1', subject: 'Blocked task', status: 'pending', blockedBy: ['a'], blocks: [], metadata: {}, createdAt: 1, updatedAt: 20 },
      { id: 'c', teamId: 't1', subject: 'Free pending', status: 'pending', blockedBy: [], blocks: [], metadata: {}, createdAt: 1, updatedAt: 10 },
      { id: 'd', teamId: 't1', subject: 'Done task', status: 'completed', blockedBy: [], blocks: [], metadata: { verification: { outcome: 'pass' } }, createdAt: 1, updatedAt: 5 },
      { id: 'e', teamId: 't1', subject: 'Deleted task', status: 'deleted', blockedBy: [], blocks: [], metadata: {}, createdAt: 1, updatedAt: 99 },
      { id: 'f', teamId: 't1', subject: 'Verifying task', status: 'verifying', owner: 'slot1', blockedBy: [], blocks: [], metadata: { verification: { outcome: 'pass' } }, createdAt: 1, updatedAt: 25, retriesUsed: 1, retryBudget: 3, lastHeartbeat: 40 },
      { id: 'g', teamId: 't1', subject: 'Zombie task', status: 'zombie', owner: 'slot2', blockedBy: [], blocks: [], metadata: {}, createdAt: 1, updatedAt: 15, lastHeartbeat: 12 },
    ]),
  };
}

function makeCronJob(over: Record<string, unknown>) {
  return {
    id: over.id, name: over.name, description: '', enabled: over.enabled,
    schedule: {}, target: { payload: { kind: 'message', text: '' } },
    metadata: { conversationId: 'x', agentType: 'claude', createdBy: 'user', createdAt: 1, updatedAt: 1 },
    state: { runCount: 0, retryCount: 0, maxRetries: 3, ...(over.state as object) },
  };
}

describe('TaskLedgerService.snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listJobs.mockResolvedValue([
      makeCronJob({ id: 'j1', name: 'Daily digest', enabled: true, state: { lastStatus: 'ok', nextRunAtMs: 1000 } }),
      makeCronJob({ id: 'j2', name: 'Broken job', enabled: true, state: { lastStatus: 'error', lastError: 'boom' } }),
      makeCronJob({ id: 'j3', name: 'Paused job', enabled: false, state: {} }),
    ]);
  });

  it('normalizes statuses across team tasks + cron jobs and excludes deleted tasks', async () => {
    const teams = makeTeams();
    const ledger = new TaskLedgerService(teams as never);

    const snap = await ledger.snapshot('user1');
    const byId = Object.fromEntries(snap.entries.map((e) => [e.id, e]));

    // team task normalization
    expect(byId['team:a'].status).toBe('running'); // in_progress
    expect(byId['team:b'].status).toBe('blocked'); // pending + blockedBy
    expect(byId['team:c'].status).toBe('pending'); // pending, unblocked
    expect(byId['team:d'].status).toBe('done'); // completed
    expect(byId['team:e']).toBeUndefined(); // deleted excluded
    expect(byId['team:f'].status).toBe('verifying'); // verifying
    expect(byId['team:g'].status).toBe('zombie'); // zombie
    expect(byId['team:a'].context).toBe('Launch Team');

    // P2/P3 row-meta surfacing
    expect(byId['team:d'].verdict).toBe('pass'); // verdict shows on a settled (done) task
    expect(byId['team:f'].verdict).toBeUndefined(); // suppressed while still verifying (no stale chip)
    expect(byId['team:f'].retriesUsed).toBe(1);
    expect(byId['team:f'].retryBudget).toBe(3);
    expect(byId['team:f'].lastHeartbeat).toBe(40);
    expect(byId['team:g'].verdict).toBeUndefined();

    // cron normalization
    expect(byId['cron:j1'].status).toBe('pending'); // enabled + ok
    expect(byId['cron:j2'].status).toBe('failed'); // enabled + error
    expect(byId['cron:j2'].detail).toBe('boom');
    expect(byId['cron:j3'].status).toBe('idle'); // disabled
  });

  it('sorts active work first and tallies counts', async () => {
    const ledger = new TaskLedgerService(makeTeams() as never);
    const snap = await ledger.snapshot('user1');

    // running first, idle/done last
    expect(snap.entries[0].status).toBe('running');
    expect(snap.entries.at(-1)?.status === 'idle' || snap.entries.at(-1)?.status === 'done').toBe(true);

    expect(snap.counts.total).toBe(9); // 6 team (deleted dropped) + 3 cron
    expect(snap.counts.running).toBe(1);
    expect(snap.counts.verifying).toBe(1);
    expect(snap.counts.zombie).toBe(1);
    expect(snap.counts.blocked).toBe(1);
    expect(snap.counts.failed).toBe(1);
    expect(snap.counts.done).toBe(1);
    expect(snap.counts.idle).toBe(1);
    expect(snap.counts.pending).toBe(2); // free team pending + enabled cron
  });

  it('degrades to an empty contribution when a source throws', async () => {
    listJobs.mockRejectedValueOnce(new Error('cron down'));
    const teams = { listTeams: vi.fn(async () => [team]), listTasksForTeam: vi.fn(async () => { throw new Error('repo down'); }) };
    const ledger = new TaskLedgerService(teams as never);

    const snap = await ledger.snapshot('user1');
    expect(snap.entries).toEqual([]);
    expect(snap.counts.total).toBe(0);
  });
});
