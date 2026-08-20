/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2-2 - a recurring task that compares against its own history cannot work
 * while every run mints a fresh workspace.
 *
 * `new_conversation` jobs (the Create-Task dialog's second mode, and all 12
 * bundled routines) carry no `agentConfig.workspace`, so `buildConversationForJob`
 * persists `workspace: ''` and `buildWorkspaceWidthFiles` mints a brand new
 * `wcore-temp-<ts>` for run 2 that cannot see run 1's output. The Morning Brief
 * has never once seen yesterday's brief.
 *
 * The fix is a durable workspace allocated at FIRST ENABLE - not at seed time,
 * because seeding a folder for each of a dozen routines nobody enabled is
 * user-hostile - and written in the SAME repository update as the enable, so a
 * crash can never leave a job armed but stateless.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: vi.fn(() => '/mock/userData'), getAppPath: vi.fn(() => '/mock/appPath') },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ power: { preventSleep: vi.fn(() => 1), allowSleep: vi.fn() } }),
}));
vi.mock('croner', () => ({ Cron: vi.fn(() => ({ stop: vi.fn(), nextRun: vi.fn(() => null) })) }));
// The double INTERPOLATES: a `t` that drops its params would make any
// assertion about an interpolated value vacuous, which is precisely the
// mistake this round exists to stop repeating.
vi.mock('@process/services/i18n', () => ({
  default: {
    t: vi.fn((key: string, params?: Record<string, unknown>) =>
      params ? [key, ...Object.values(params).map(String)].join(' | ') : key
    ),
  },
  i18nReady: Promise.resolve(),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@/common', () => ({
  ipcBridge: { conversation: { responseStream: { emit: vi.fn() }, listChanged: { emit: vi.fn() } } },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => false) },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));

const mockAllocate = vi.hoisted(() => vi.fn());
vi.mock('@process/services/projectWorkspace', () => ({ allocateWorkspace: mockAllocate }));

import { CronService, type CreateCronJobParams } from '@process/services/cron/CronService';
import { asCronWorkspaceError } from '@process/bridge/cronWorkspaceError';
import type { CronJob } from '@process/services/cron/CronStore';
import type { ICronRepository } from '@process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';

function makeRoutineJob(overrides?: Partial<CronJob>): CronJob {
  return {
    id: 'cron_mb',
    name: 'Morning Brief',
    enabled: false,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '0 7 * * *' },
    target: { payload: { kind: 'message', text: 'run it' }, executionMode: 'new_conversation' },
    metadata: {
      conversationId: '',
      agentType: 'wcore',
      createdBy: 'agent',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig: {
        backend: 'wcore',
        name: 'Morning Brief',
        mode: 'bypassPermissions',
        configOptions: { kind: 'routine', routineId: 'morning-brief' },
      },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
    ...overrides,
  } as CronJob;
}

function makeService(job: CronJob) {
  const stored: CronJob[] = [job];
  const updates: Array<Partial<CronJob>> = [];
  const repo: ICronRepository = {
    insert: vi.fn(async (j: CronJob) => {
      stored.push(j);
    }),
    update: vi.fn(async (id: string, patch: Partial<CronJob>) => {
      updates.push(patch);
      const idx = stored.findIndex((j) => j.id === id);
      if (idx >= 0) stored[idx] = { ...stored[idx], ...patch } as CronJob;
    }),
    delete: vi.fn(),
    getById: vi.fn(async (id: string) => stored.find((j) => j.id === id) ?? null),
    listAll: vi.fn(async () => stored),
    listEnabled: vi.fn(async () => stored.filter((j) => j.enabled)),
    listByConversation: vi.fn(async () => []),
    deleteByConversation: vi.fn(async () => 0),
  } as unknown as ICronRepository;
  const emitter = {
    emitJobCreated: vi.fn(),
    emitJobUpdated: vi.fn(),
    emitJobRemoved: vi.fn(),
    emitJobExecuted: vi.fn(),
    showNotification: vi.fn(async () => {}),
  } as unknown as ICronEventEmitter;
  const executor = {
    isConversationBusy: vi.fn(() => false),
    executeJob: vi.fn(async () => {}),
    onceIdle: vi.fn(),
    setProcessing: vi.fn(),
  } as unknown as ICronJobExecutor;
  const convRepo = {
    getConversation: vi.fn(async () => undefined),
    updateConversation: vi.fn(),
    getConversationsByCronJob: vi.fn(async () => []),
    listByConversation: vi.fn(async () => []),
  } as unknown as IConversationRepository;
  return { service: new CronService(repo, emitter, executor, convRepo), repo, updates, stored };
}

const baseParams: CreateCronJobParams = {
  name: 'Daily Digest',
  schedule: { kind: 'cron', expr: '0 8 * * *', description: '0 8 * * *' },
  prompt: 'go',
  conversationId: '',
  agentType: 'wcore',
  createdBy: 'user',
  executionMode: 'new_conversation',
  agentConfig: { backend: 'wcore', name: 'Daily Digest' },
};

beforeEach(() => {
  mockAllocate.mockReset();
  mockAllocate.mockResolvedValue({
    dir: '/Docs/Wayland/Tasks/Morning Brief',
    marker: { workspaceId: 'ws-abc', ownerKind: 'task', ownerId: 'cron_mb', displayName: 'Morning Brief' },
  });
});

describe('P2-2 durable workspace at first enable', () => {
  it('allocates a Tasks/ workspace when a routine is enabled for the first time', async () => {
    const { service, updates } = makeService(makeRoutineJob());
    await service.updateJob('cron_mb', { enabled: true });

    expect(mockAllocate).toHaveBeenCalledWith('Morning Brief', { ownerKind: 'task', ownerId: 'cron_mb' });
    // The workspace and the enable land in ONE repository write - a crash between
    // two writes would otherwise arm a stateless job.
    const enablePatch = updates.find((u) => u.enabled === true);
    expect(enablePatch).toBeDefined();
    expect(enablePatch!.metadata?.agentConfig?.workspace).toBe('/Docs/Wayland/Tasks/Morning Brief');
    expect(enablePatch!.metadata?.agentConfig?.workspaceId).toBe('ws-abc');
  });

  it('does NOT reallocate when the routine is disabled and enabled again', async () => {
    const { service } = makeService(makeRoutineJob());
    await service.updateJob('cron_mb', { enabled: true });
    expect(mockAllocate).toHaveBeenCalledTimes(1);
    await service.updateJob('cron_mb', { enabled: false });
    await service.updateJob('cron_mb', { enabled: true });
    expect(mockAllocate).toHaveBeenCalledTimes(1);
  });

  it('leaves an "existing" mode job alone - it already runs in a stable workspace', async () => {
    const job = makeRoutineJob({
      target: { payload: { kind: 'message', text: 'x' }, executionMode: 'existing' },
      metadata: { ...makeRoutineJob().metadata, conversationId: 'conv-1' },
    });
    const { service } = makeService(job);
    await service.updateJob('cron_mb', { enabled: true });
    expect(mockAllocate).not.toHaveBeenCalled();
  });

  it('leaves a job that already has a workspace alone', async () => {
    const base = makeRoutineJob();
    const job = makeRoutineJob({
      metadata: {
        ...base.metadata,
        agentConfig: { ...base.metadata.agentConfig!, workspace: '/somewhere/chosen' },
      },
    });
    const { service } = makeService(job);
    await service.updateJob('cron_mb', { enabled: true });
    expect(mockAllocate).not.toHaveBeenCalled();
  });

  it('refuses the enable when allocation fails, rather than arming a stateless task', async () => {
    mockAllocate.mockRejectedValue(new Error('ENOSPC'));
    const { service, stored, updates } = makeService(makeRoutineJob());
    await expect(service.updateJob('cron_mb', { enabled: true })).rejects.toThrow(/ENOSPC/);
    expect(stored[0].enabled).toBe(false);
    expect(updates.some((u) => u.enabled === true)).toBe(false);
  });

  /**
   * H1 - on macOS the task root lives under a TCC-protected Documents path, so
   * a missing grant makes this allocation throw during an ordinary enable. The
   * throw crosses the cron bridge, which cannot transport a rejection, so the
   * toggle used to spin forever with the job silently left off. The bridge can
   * only turn it into a rendered message if the throw says WHAT failed.
   */
  it('classifies the allocation failure, and keeps the underlying cause in the message', async () => {
    mockAllocate.mockRejectedValue(new Error('EPERM: operation not permitted'));
    const { service } = makeService(makeRoutineJob());

    const thrown = await service.updateJob('cron_mb', { enabled: true }).then(
      () => null,
      (error: unknown) => error
    );

    const classified = asCronWorkspaceError(thrown);
    expect(classified).not.toBeNull();
    expect(classified!.code).toBe('workspace_alloc_failed');
    expect(classified!.message).toContain('EPERM');
  });

  it('classifies an allocation failure at creation the same way', async () => {
    mockAllocate.mockRejectedValue(new Error('EPERM: operation not permitted'));
    const { service } = makeService(makeRoutineJob());

    const thrown = await service.addJob(baseParams).then(
      () => null,
      (error: unknown) => error
    );

    expect(asCronWorkspaceError(thrown)?.code).toBe('workspace_alloc_failed');
  });
});

describe('P2-2 allocation at creation vs at seed', () => {
  it('allocates for a new_conversation task created enabled from the Create Task dialog', async () => {
    const { service } = makeService(makeRoutineJob());
    const job = await service.addJob(baseParams);
    expect(mockAllocate).toHaveBeenCalledWith('Daily Digest', { ownerKind: 'task', ownerId: job.id });
    expect(job.metadata.agentConfig?.workspace).toBe('/Docs/Wayland/Tasks/Morning Brief');
  });

  it('allocates NOTHING when a bundled routine is seeded - routines are created enabled then disabled', async () => {
    const { service } = makeService(makeRoutineJob());
    await service.addJob({
      ...baseParams,
      createdBy: 'agent',
      agentConfig: {
        backend: 'wcore',
        name: 'Morning Brief',
        configOptions: { kind: 'routine', routineId: 'morning-brief' },
      },
    });
    expect(mockAllocate).not.toHaveBeenCalled();
  });

  it('does not allocate for an "existing" mode job at creation', async () => {
    const { service } = makeService(makeRoutineJob());
    await service.addJob({ ...baseParams, executionMode: 'existing', conversationId: 'conv-9' });
    expect(mockAllocate).not.toHaveBeenCalled();
  });
});
