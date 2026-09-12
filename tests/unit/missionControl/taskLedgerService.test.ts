/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityObservation } from '@/common/types/missionControl';

const listJobs = vi.fn();
vi.mock('@process/services/cron/cronServiceSingleton', () => ({ cronService: { listJobs: () => listJobs() } }));

import { classify, TaskLedgerService } from '@process/services/missionControl/TaskLedgerService';

const team = { id: 't1', name: 'Launch Team' };

function makeTeams() {
  return {
    listTeams: vi.fn(async () => [team]),
    listTasksForTeam: vi.fn(async () => [
      {
        id: 'a',
        teamId: 't1',
        subject: 'Running task',
        status: 'in_progress',
        owner: 'slot1',
        blockedBy: [],
        blocks: [],
        metadata: {},
        createdAt: 1,
        updatedAt: 30,
      },
      {
        id: 'b',
        teamId: 't1',
        subject: 'Blocked task',
        status: 'pending',
        blockedBy: ['a'],
        blocks: [],
        metadata: {},
        createdAt: 1,
        updatedAt: 20,
      },
      {
        id: 'd',
        teamId: 't1',
        subject: 'Done task',
        status: 'completed',
        blockedBy: [],
        blocks: [],
        metadata: { verification: { outcome: 'pass' } },
        createdAt: 1,
        updatedAt: 5,
      },
      {
        id: 'e',
        teamId: 't1',
        subject: 'Deleted task',
        status: 'deleted',
        blockedBy: [],
        blocks: [],
        metadata: {},
        createdAt: 1,
        updatedAt: 99,
      },
    ]),
  };
}

function makeCronJob(over: Record<string, unknown>) {
  return {
    id: over.id,
    name: over.name,
    description: '',
    enabled: over.enabled,
    schedule: {},
    target: { payload: { kind: 'message', text: '' } },
    metadata: {
      conversationId: 'x',
      conversationTitle: 'Daily work',
      agentType: 'claude',
      createdBy: 'user',
      createdAt: 1,
      updatedAt: 2,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3, ...(over.state as object) },
  };
}

function observation(overrides: Partial<ActivityObservation> = {}): ActivityObservation {
  return {
    sourceId: 'shared',
    provenance: { origin: 'desktop', kind: 'approval' },
    title: 'Approval',
    status: 'pending',
    action: { kind: 'navigate', path: '/conversation/shared', label: 'Answer approval' },
    startedAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

describe('TaskLedgerService.snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listJobs.mockResolvedValue([
      makeCronJob({
        id: 'j1',
        name: 'Daily digest',
        enabled: true,
        state: { lastStatus: 'ok', lastRunAtMs: 900, nextRunAtMs: 1000 },
      }),
      makeCronJob({
        id: 'j2',
        name: 'Broken job',
        enabled: true,
        state: { lastStatus: 'error', lastRunAtMs: 800, nextRunAtMs: 1200, lastError: 'boom' },
      }),
    ]);
  });

  it('projects teams, workflows, schedules and schedule runs into exact priority groups', async () => {
    const ledger = new TaskLedgerService(makeTeams() as never, {
      listDesktopWorkflows: async () => [
        {
          id: 'wf1',
          workflow_name: 'launch',
          workflow_title: 'Launch workflow',
          conversation_id: 'c1',
          current_step: 2,
          total_steps: 4,
          steps: [],
          skills: [],
          asks: [],
          status: 'active',
          palette: null,
          category: null,
          created_at: 1,
          updated_at: 40,
          completed_at: null,
          begin_sent_at: 1,
          run_mode: 'awaiting_input',
          interactivity: 'step',
        },
      ],
      listPendingApprovals: async () => ({
        observations: [observation({ sourceId: 'approval-1', title: 'Approve command' })],
      }),
    });

    const snap = await ledger.snapshot('user1');
    const byId = Object.fromEntries(snap.entries.map((entry) => [entry.id, entry]));

    expect(byId['desktop:team:a']).toMatchObject({ group: 'running', source: 'desktop-teams' });
    expect(byId['desktop:team:b']).toMatchObject({ group: 'needs-you', status: 'blocked' });
    expect(byId['desktop:workflow:wf1']).toMatchObject({ group: 'needs-you', needsHuman: true });
    expect(byId['desktop:schedule:j1']).toMatchObject({ group: 'upcoming', action: { path: '/scheduled/j1' } });
    expect(byId['desktop:schedule-run:j1:900']).toMatchObject({ group: 'recent', status: 'done' });
    expect(byId['desktop:schedule-run:j2:800']).toMatchObject({ group: 'needs-you', status: 'failed' });
    expect(byId['desktop:approval:approval-1']).toMatchObject({ group: 'needs-you', source: 'approvals' });
    expect(snap.groupCounts).toEqual({ 'needs-you': 4, running: 1, upcoming: 2, recent: 2 });
    expect(snap.completeness).toBe('partial');
    expect(snap.sourceHealth).toContainEqual(expect.objectContaining({ source: 'scheduler', status: 'partial' }));
  });

  it('reports partial and failed sources instead of returning a false healthy empty state', async () => {
    listJobs.mockRejectedValueOnce(new Error('scheduler down'));
    const teams = {
      listTeams: vi.fn(async () => [
        { id: 'ok', name: 'OK' },
        { id: 'down', name: 'Down' },
      ]),
      listTasksForTeam: vi.fn(async (id: string) => {
        if (id === 'down') throw new Error('board down');
        return [];
      }),
    };
    const ledger = new TaskLedgerService(teams as never, {
      listDesktopWorkflows: async () => [],
    });

    const snap = await ledger.snapshot('user1');
    expect(snap.entries).toEqual([]);
    expect(snap.completeness).toBe('partial');
    expect(snap.sourceHealth).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'desktop-teams', status: 'partial' }),
        expect.objectContaining({ source: 'scheduler', status: 'error', detail: 'scheduler down' }),
        expect.objectContaining({ source: 'approvals', status: 'unavailable' }),
      ])
    );
  });

  it('never invents running or upcoming progress from an unknown observation', () => {
    const unknown = observation({ status: 'unknown', provenance: { origin: 'desktop', kind: 'workflow' } });
    expect(classify(unknown)).toBe('recent');
    expect(classify({ ...unknown, status: 'pending', nextRunAtMs: undefined })).toBe('recent');
    expect(classify({ ...unknown, status: 'pending', nextRunAtMs: 100 })).toBe('upcoming');
  });

  it('keeps a scheduled run separate from a same-named approval and preserves failed outcome', async () => {
    listJobs.mockResolvedValue([
      makeCronJob({ id: 'job', name: 'Shared', enabled: true, state: { nextRunAtMs: 200 } }),
    ]);
    const ledger = new TaskLedgerService({ listTeams: vi.fn(async () => []), listTasksForTeam: vi.fn() } as never, {
      listDesktopWorkflows: async () => [],
      listScheduleRuns: async () => ({
        runs: [
          {
            jobId: 'job',
            runId: 'shared',
            title: 'Shared run',
            triggeredAt: 100,
            outcome: { status: 'available', value: 'error', source: 'scheduler-state' },
            result: { status: 'unavailable', reason: 'result missing' },
            receipt: { status: 'unavailable', reason: 'receipt missing' },
            action: { kind: 'navigate', path: '/scheduled/job', label: 'Open run' },
          },
        ],
      }),
      listPendingApprovals: async () => ({ observations: [observation({ sourceId: 'shared' })] }),
    });

    const snap = await ledger.snapshot('user1');
    expect(snap.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['desktop:schedule-run:shared', 'desktop:approval:shared'])
    );
    expect(snap.entries.find((entry) => entry.id === 'desktop:schedule-run:shared')).toMatchObject({
      status: 'failed',
      group: 'needs-you',
      action: { path: '/scheduled/job' },
    });
  });
});
