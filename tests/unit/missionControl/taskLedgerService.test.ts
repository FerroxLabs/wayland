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
    provenance: { origin: 'core', kind: 'workflow' },
    title: 'Core workflow',
    status: 'running',
    action: { kind: 'navigate', path: '/conversation/core', label: 'Open Core workflow' },
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
      listCoreActivity: async () => ({ observations: [observation()], status: 'ok' }),
      listPendingApprovals: async () => ({
        observations: [
          observation({
            sourceId: 'approval-1',
            provenance: { origin: 'core', kind: 'approval' },
            title: 'Approve command',
            status: 'pending',
          }),
        ],
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
    expect(byId['core:workflow:shared']).toMatchObject({ group: 'running', source: 'core-execution' });
    expect(byId['core:approval:approval-1']).toMatchObject({ group: 'needs-you', source: 'approvals' });
    expect(snap.groupCounts).toEqual({ 'needs-you': 4, running: 2, upcoming: 2, recent: 2 });
    expect(snap.completeness).toBe('complete');
  });

  it('keeps Desktop Workflow and Core workflow identities separate even with the same source id', async () => {
    const ledger = new TaskLedgerService({ listTeams: vi.fn(async () => []), listTasksForTeam: vi.fn() } as never, {
      listDesktopWorkflows: async () => [
        {
          id: 'shared',
          workflow_name: 'desktop',
          workflow_title: 'Desktop workflow',
          conversation_id: 'desktop',
          current_step: 1,
          total_steps: 1,
          steps: [],
          skills: [],
          asks: [],
          status: 'active',
          palette: null,
          category: null,
          created_at: 1,
          updated_at: 2,
          completed_at: null,
          begin_sent_at: 1,
          run_mode: 'running',
          interactivity: 'auto',
        },
      ],
      listCoreActivity: async () => ({ observations: [observation()] }),
      listPendingApprovals: async () => ({ observations: [] }),
    });
    listJobs.mockResolvedValue([]);

    const snap = await ledger.snapshot('user1');
    expect(snap.entries.map((entry) => entry.id)).toEqual(['core:workflow:shared', 'desktop:workflow:shared']);
    expect(new Set(snap.entries.map((entry) => entry.action.path))).toEqual(
      new Set(['/conversation/core', '/conversation/desktop'])
    );
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
      listCoreActivity: async () => ({ observations: [], status: 'partial', detail: 'child events unavailable' }),
    });

    const snap = await ledger.snapshot('user1');
    expect(snap.entries).toEqual([]);
    expect(snap.completeness).toBe('partial');
    expect(snap.sourceHealth).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'desktop-teams', status: 'partial' }),
        expect.objectContaining({ source: 'scheduler', status: 'error', detail: 'scheduler down' }),
        expect.objectContaining({ source: 'core-execution', status: 'partial', detail: 'child events unavailable' }),
        expect.objectContaining({ source: 'approvals', status: 'unavailable' }),
      ])
    );
  });

  it('never invents running or upcoming progress from an unknown observation', () => {
    const unknown = observation({ status: 'unknown' });
    expect(classify(unknown)).toBe('recent');
    expect(classify({ ...unknown, status: 'pending', nextRunAtMs: undefined })).toBe('recent');
    expect(classify({ ...unknown, status: 'pending', nextRunAtMs: 100 })).toBe('upcoming');
  });
});
