/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE TASK THAT WAS ALREADY TURNED ON.
 *
 * `durableWorkspaceMetadataForJob` is reached from exactly two places: `addJob`,
 * and the disabled-to-enabled transition in `updateJob`. A recurring task that
 * was ALREADY enabled when durable workspaces shipped passes through neither,
 * so every fire mints a fresh `wcore-temp-<ts>`, run 2 cannot see run 1, and the
 * whole milestone is invisible to the users most likely to have a routine
 * running. Nothing in the product would ever have repaired it - the user would
 * have to toggle the task off and on again, and nothing tells them to.
 *
 * The repair is deliberately at FIRST FIRE and not at boot. A boot sweep would
 * put a folder in the user's Documents for every routine they ever enabled and
 * forgot, on an upgrade they did not ask for; allocating here creates one only
 * for a task that is about to write a report into it.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@process/services/i18n', () => ({
  default: { t: vi.fn((key: string) => key) },
  i18nReady: Promise.resolve(),
}));
vi.mock('croner', () => ({
  Cron: class {
    stop() {}
    nextRun() {
      return null;
    }
  },
}));
vi.mock('@/common/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/common/platform')>();
  const real = actual.getPlatformServices();
  return {
    ...actual,
    getPlatformServices: () => ({ ...real, power: { preventSleep: () => 1, allowSleep: () => {} } }),
  };
});
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => '/mock/documents' },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));

/**
 * A DIFFERENT folder per call, numbered by call index (reset with `mockClear`),
 * so "run 2 landed in run 1's folder" is a real claim about the path and not a
 * constant the stub would return either way.
 */
const allocateWorkspace = vi.hoisted(() => {
  const fn = vi.fn(async () => {
    const n = fn.mock.calls.length;
    return { dir: `/mock/documents/Wayland/Tasks/Morning Brief ${n}`, marker: { workspaceId: `ws-${n}` } };
  });
  return fn;
});
vi.mock('@process/services/projectWorkspace', () => ({ allocateWorkspace }));

import { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { ICronRepository } from '@process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';

function armedJob(over: Partial<CronJob> = {}): CronJob {
  return {
    id: 'cron_already_on',
    name: 'Morning Brief',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '0 7 * * *' },
    target: { payload: { kind: 'message', text: 'brief me' }, executionMode: 'new_conversation' },
    metadata: {
      conversationId: '',
      conversationTitle: 'Morning Brief',
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig: {
        backend: 'wcore' as CronJob['metadata']['agentType'],
        name: 'Morning Brief',
        mode: 'bypassPermissions',
        configOptions: { kind: 'routine', routineId: 'weekday-morning-report', artifactSeries: 'market' },
      },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
    ...over,
  };
}

function harness(jobs: CronJob[]) {
  /** What the executor saw on the job it was handed, per fire. */
  const workspacesSeen: Array<string | undefined> = [];

  const repo = {
    insert: vi.fn(async () => {}),
    update: vi.fn(async (jobId: string, updates: Partial<CronJob>) => {
      const idx = jobs.findIndex((j) => j.id === jobId);
      if (idx >= 0) jobs[idx] = { ...jobs[idx], ...updates };
    }),
    delete: vi.fn(async () => {}),
    getById: vi.fn(async (id: string) => jobs.find((j) => j.id === id) ?? null),
    listAll: vi.fn(async () => jobs),
    listEnabled: vi.fn(async () => jobs.filter((j) => j.enabled)),
    listByConversation: vi.fn(async () => []),
    deleteByConversation: vi.fn(async () => 0),
  } as unknown as ICronRepository;

  const executor = {
    isConversationBusy: vi.fn(() => false),
    executeJob: vi.fn(async (job: CronJob) => {
      workspacesSeen.push(job.metadata.agentConfig?.workspace);
    }),
    prepareConversation: vi.fn(async (job: CronJob) => {
      workspacesSeen.push(job.metadata.agentConfig?.workspace);
      return 'conv-1';
    }),
    onceIdle: vi.fn(),
    setProcessing: vi.fn(),
  } as unknown as ICronJobExecutor;

  const service = new CronService(
    repo,
    {
      emitJobCreated: vi.fn(),
      emitJobUpdated: vi.fn(),
      emitJobRemoved: vi.fn(),
      emitJobExecuted: vi.fn(),
      showNotification: vi.fn(async () => {}),
    } as unknown as ICronEventEmitter,
    executor,
    {
      getConversation: vi.fn(async () => undefined),
      updateConversation: vi.fn(),
      getConversationsByCronJob: vi.fn(async () => []),
    } as unknown as IConversationRepository
  );

  return { service, repo, executor, workspacesSeen };
}

describe('a task that was already enabled gets a durable workspace at its first fire', () => {
  beforeEach(() => {
    allocateWorkspace.mockClear();
  });

  it('allocates one, persists it, and hands the SAME one to the run', async () => {
    const jobs = [armedJob()];
    // The state an upgrade finds: armed, and stateless.
    expect(jobs[0].metadata.agentConfig!.workspace).toBeUndefined();

    const h = harness(jobs);
    await h.service.triggerJob('cron_already_on');

    expect(allocateWorkspace).toHaveBeenCalledTimes(1);
    const allocated = jobs[0].metadata.agentConfig!.workspace;
    expect(allocated).toBe('/mock/documents/Wayland/Tasks/Morning Brief 1');
    // The marker id travels with it, or the next run's identity preflight has
    // nothing to compare against.
    expect(jobs[0].metadata.agentConfig!.workspaceId).toBe('ws-1');
    // And the run that triggered the allocation used it, not a temp dir.
    expect(h.workspacesSeen).toEqual([allocated]);
  });

  it('allocates once and only once, so run 2 lands in run 1s folder', async () => {
    const jobs = [armedJob()];
    const h = harness(jobs);

    await h.service.triggerJob('cron_already_on');
    await h.service.triggerJob('cron_already_on');

    expect(allocateWorkspace).toHaveBeenCalledTimes(1);
    expect(h.workspacesSeen).toEqual([
      '/mock/documents/Wayland/Tasks/Morning Brief 1',
      '/mock/documents/Wayland/Tasks/Morning Brief 1',
    ]);
  });

  it('allocates once even on the TIMER path, which re-uses one job object per tick', async () => {
    // `startTimer` closes over a single job object and hands that same object to
    // every fire, so the back-fill has to move the in-memory copy as well as the
    // stored one. Reaching for the private is deliberate: it is the only way to
    // reproduce the aliasing, and with croner stubbed no tick ever arrives.
    const jobs = [armedJob()];
    const h = harness(jobs);
    const captured = jobs[0];

    await (h.service as unknown as { executeJob(job: CronJob): Promise<void> }).executeJob(captured);
    await (h.service as unknown as { executeJob(job: CronJob): Promise<void> }).executeJob(captured);

    expect(allocateWorkspace).toHaveBeenCalledTimes(1);
    expect(h.workspacesSeen).toEqual([
      '/mock/documents/Wayland/Tasks/Morning Brief 1',
      '/mock/documents/Wayland/Tasks/Morning Brief 1',
    ]);
  });

  it('runs BEFORE the conversation is prepared, which is what mints the workspace', async () => {
    const jobs = [armedJob()];
    const h = harness(jobs);

    await h.service.runNow('cron_already_on');

    // prepareConversation is the first thing runNow calls; it must already see
    // the durable path, because the conversation it creates keeps it.
    expect(h.workspacesSeen[0]).toBe('/mock/documents/Wayland/Tasks/Morning Brief 1');
  });

  it('allocates nothing for a one-off Run-now on a task the user never enabled', async () => {
    // ENABLING is the opt-in that earns a folder in the user's Documents; that
    // is the rule `updateJob` already enforces and this back-fill only completes
    // it for jobs armed before it existed. A single manual run of a routine that
    // is still switched off keeps today's disposable workspace, so browsing the
    // routine list and pressing Run-now leaves nothing behind.
    const jobs = [armedJob({ enabled: false })];
    const h = harness(jobs);

    await h.service.runNow('cron_already_on');

    expect(allocateWorkspace).not.toHaveBeenCalled();
    expect(jobs[0].metadata.agentConfig!.workspace).toBeUndefined();
  });

  it('leaves a job that already has a workspace untouched', async () => {
    const jobs = [armedJob()];
    jobs[0].metadata.agentConfig!.workspace = '/somewhere/the/user/picked';
    const h = harness(jobs);

    await h.service.triggerJob('cron_already_on');

    expect(allocateWorkspace).not.toHaveBeenCalled();
    expect(jobs[0].metadata.agentConfig!.workspace).toBe('/somewhere/the/user/picked');
  });

  it('leaves a job running in a chat the user owns untouched', async () => {
    // `existing` mode runs inside the user's own conversation, whose workspace
    // is theirs; allocating one would move where their chat writes.
    const jobs = [
      armedJob({
        target: { payload: { kind: 'message', text: 'brief me' }, executionMode: 'existing' },
        metadata: { ...armedJob().metadata, conversationId: 'user-owned' },
      }),
    ];
    const h = harness(jobs);

    await h.service.triggerJob('cron_already_on');

    expect(allocateWorkspace).not.toHaveBeenCalled();
    expect(jobs[0].metadata.agentConfig!.workspace).toBeUndefined();
  });

  it('still runs when the allocation fails, rather than skipping the report', async () => {
    // Unlike the enable path, which aborts and tells the user: here the run is
    // already happening unattended, and the pre-P2-2 throwaway workspace is
    // strictly better than not running at all.
    allocateWorkspace.mockRejectedValueOnce(new Error('disk full'));
    const jobs = [armedJob()];
    const h = harness(jobs);

    await expect(h.service.triggerJob('cron_already_on')).resolves.toBeUndefined();
    expect(h.executor.executeJob).toHaveBeenCalledTimes(1);
    expect(jobs[0].metadata.agentConfig!.workspace).toBeUndefined();
  });
});
