/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1060: the bridge constructed TaskLedgerService with listScheduleRuns,
 * listDesktopWorkflows and listCoreActivity but never listPendingApprovals.
 * That reader is optional, so collectExternal('approvals', undefined) always
 * reported the source unavailable and Mission Control's "Needs you" group could
 * never show a pending approval.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskLedgerSources } from '@process/services/missionControl/TaskLedgerService';

const { captured } = vi.hoisted(() => ({ captured: { sources: undefined as TaskLedgerSources | undefined } }));

vi.mock('@/common', () => ({
  ipcBridge: { missionControl: { snapshot: { provider: vi.fn() } } },
}));

vi.mock('@process/services/missionControl/TaskLedgerService', () => ({
  emptyCounts: () => ({ total: 0 }),
  TaskLedgerService: class {
    constructor(_teams: unknown, sources: TaskLedgerSources) {
      captured.sources = sources;
    }
    async snapshot() {
      return {};
    }
  },
}));

vi.mock('@process/services/missionControl/ScheduleRunProjector', () => ({ projectScheduleRuns: vi.fn(() => []) }));
vi.mock('@process/services/workflow/workflowSessionServiceSingleton', () => ({
  getWorkflowSessionService: () => null,
}));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));

import { initMissionControlBridge } from '@process/bridge/missionControlBridge';

function makeConfirmation(callId: string, over: Record<string, unknown> = {}) {
  return {
    id: `msg-${callId}`,
    callId,
    description: `Run ${callId}`,
    options: [{ label: 'Allow', value: 'allow' }],
    ...over,
  };
}

describe('missionControlBridge pending approvals projector', () => {
  let liveConfirmations: ReturnType<typeof makeConfirmation>[];
  let workerTaskManager: {
    listTasks: () => Array<{ id: string; type: string }>;
    getTask: (id: string) => unknown;
  };
  let conversationService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    captured.sources = undefined;
    liveConfirmations = [
      makeConfirmation('call-a', { title: 'Approve shell command', action: 'run_shell_command' }),
      makeConfirmation('call-b'),
    ];
    const tasks = new Map<string, { getConfirmations: () => unknown[] }>([
      ['conv-1', { getConfirmations: () => liveConfirmations }],
      ['conv-2', { getConfirmations: () => [] }],
    ]);
    workerTaskManager = {
      listTasks: () => [
        { id: 'conv-1', type: 'wcore' },
        { id: 'conv-2', type: 'gemini' },
      ],
      getTask: (id: string) => tasks.get(id),
    };
    conversationService = {
      getConversation: vi.fn(async (id: string) =>
        id === 'conv-1' ? { id: 'conv-1', name: 'Deploy chat', createTime: 100, modifyTime: 200 } : null
      ),
      getConversationsByCronJob: vi.fn(async () => []),
    };

    initMissionControlBridge(
      { listTeams: vi.fn(async () => []), listTasksForTeam: vi.fn() } as never,
      workerTaskManager as never,
      conversationService as never
    );
  });

  it('wires a pending-approvals reader into the ledger', () => {
    expect(typeof captured.sources?.listPendingApprovals).toBe('function');
  });

  it('projects each live confirmation as a needs-you approval observation', async () => {
    const read = await captured.sources!.listPendingApprovals!();

    expect(read.observations).toHaveLength(2);
    expect(read.observations[0]).toMatchObject({
      sourceId: 'conv-1:call-a',
      provenance: { origin: 'core', kind: 'approval' },
      title: 'Approve shell command',
      status: 'pending',
      needsHuman: true,
      action: { kind: 'navigate', path: '/conversation/conv-1' },
      context: 'Deploy chat',
      startedAt: 100,
      updatedAt: 200,
    });
    expect(read.observations[1]).toMatchObject({ sourceId: 'conv-1:call-b', status: 'pending' });
  });

  it('reads the manager confirmation array without reordering or draining it', async () => {
    const before = [...liveConfirmations];
    await captured.sources!.listPendingApprovals!();

    expect(liveConfirmations).toHaveLength(2);
    expect(liveConfirmations[0]).toBe(before[0]);
    expect(liveConfirmations[1]).toBe(before[1]);
  });

  it('declares the gap when an approval conversation cannot be resolved', async () => {
    liveConfirmations = [makeConfirmation('call-a')];
    conversationService.getConversation.mockResolvedValue(null);

    const read = await captured.sources!.listPendingApprovals!();

    expect(read.observations).toEqual([]);
    expect(read.status).toBe('partial');
    expect(read.detail).toBeTruthy();
  });
});
