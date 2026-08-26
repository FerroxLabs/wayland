/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1045 - the scheduled-run path is what makes a hold unattended, so it is the
 * path that has to supply the deadline.
 *
 * Two acquisition branches, and both matter. The executor SPAWNS a task when
 * there is none, and REUSES a live one when `ensureYoloMode()` succeeds - which
 * is the common case for the second and later runs of a job. The reuse branch
 * never rebuilds the session, so a deadline handed only to `getOrBuildTask`
 * would bound a job's first run after a spawn and nothing after it.
 *
 * `executeJob` is allowed to fail after acquisition here. Everything asserted
 * happens before the turn is sent, and mocking the whole run would be asserting
 * the mocks rather than the wiring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: vi.fn(() => '/mock/userData') },
}));
vi.mock('@/common/utils', () => ({ uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@process/utils', () => ({
  copyFilesToDirectory: vi.fn(async () => []),
  getDataPath: vi.fn(() => '/mock/userData'),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
  ProcessConfig: { get: vi.fn(async () => undefined) },
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: { responseStream: { emit: vi.fn() }, listChanged: { emit: vi.fn() } },
    geminiConversation: { responseStream: { emit: vi.fn() } },
    acpConversation: { responseStream: { emit: vi.fn() } },
    openclawConversation: { responseStream: { emit: vi.fn() } },
  },
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  hasCronSkillFile: vi.fn(async () => false),
  getCronSkillDir: vi.fn((jobId: string) => `/mock/cronSkills/${jobId}`),
}));
vi.mock('@/process/services/cron/SkillSuggestWatcher', () => ({
  skillSuggestWatcher: { register: vi.fn(), unregister: vi.fn() },
}));
vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: {
    getInstance: () => ({ discoverSkills: vi.fn(async () => {}), getSkillsIndex: () => [] }),
  },
}));
vi.mock('@/process/services/cron/durableTaskWorkspace', () => ({
  preflightJobWorkspace: vi.fn(async () => null),
  artifactSeriesForJob: vi.fn(() => 'series'),
}));
vi.mock('@process/services/promotion/promotionLock', () => ({ assertNotPromoting: vi.fn() }));
vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async () => undefined),
    createConversation: vi.fn(),
    updateConversation: vi.fn(),
    getConversationsByCronJob: vi.fn(async () => []),
  },
}));

import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import type { CronJob } from '@/process/services/cron/CronStore';
import {
  resolveUnattendedHoldMs,
  UNATTENDED_HOLD_CEILING_MS,
  UNATTENDED_HOLD_DEFAULT_MS,
} from '@process/acp/session/unattendedHold';

const CONVERSATION_ID = 'conv-scheduled';

function makeJob(nextRunAtMs?: number): CronJob {
  return {
    id: 'job-1',
    name: 'Hourly check',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 * * * *', description: 'hourly' },
    target: { payload: { kind: 'message', text: 'check' }, executionMode: 'existing' },
    metadata: {
      conversationId: CONVERSATION_ID,
      agentType: 'acp' as CronJob['metadata']['agentType'],
      createdBy: 'user',
      createdAt: 1000,
      updatedAt: 1000,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3, nextRunAtMs },
  } as CronJob;
}

function makeHarness(existing?: unknown) {
  const built: Array<Record<string, unknown> | undefined> = [];
  const task = {
    type: 'acp',
    workspace: undefined,
    sendMessage: vi.fn(async () => {}),
    setMode: vi.fn(async () => ({ success: true })),
    ensureYoloMode: vi.fn(async () => true),
    setUnattendedHoldDeadlineMs: vi.fn(),
  };
  const taskManager = {
    getTask: vi.fn(() => existing),
    getOrBuildTask: vi.fn(async (_id: string, opts?: Record<string, unknown>) => {
      built.push(opts);
      return task;
    }),
    addTask: vi.fn(),
    kill: vi.fn(),
    clear: vi.fn(),
    listTasks: vi.fn(() => []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  const busyGuard = { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as never;
  return { executor: new WorkerTaskManagerJobExecutor(taskManager, busyGuard), taskManager, task, built };
}

describe('#1045 the deadline policy', () => {
  it('defaults to 15 minutes when no next run constrains it', () => {
    expect(resolveUnattendedHoldMs({ nowMs: 1_000_000 })).toBe(UNATTENDED_HOLD_DEFAULT_MS);
    expect(resolveUnattendedHoldMs({ nowMs: 1_000_000, nextRunAtMs: undefined })).toBe(UNATTENDED_HOLD_DEFAULT_MS);
  });

  it('stays STRICTLY under the time to the next scheduled run, at every interval', () => {
    // The load-bearing guarantee: one hold can never eat the run that follows
    // it. Asserted as an invariant over the whole range a cron can express,
    // rather than as one example that happens to hold.
    const now = 1_700_000_000_000;
    const intervals = [1_000, 30_000, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 24 * 60 * 60_000];
    for (const interval of intervals) {
      const deadline = resolveUnattendedHoldMs({ nowMs: now, nextRunAtMs: now + interval });
      expect(deadline).toBeGreaterThan(0);
      expect(deadline).toBeLessThan(interval);
      expect(deadline).toBeLessThanOrEqual(UNATTENDED_HOLD_DEFAULT_MS);
    }
  });

  it('never exceeds the ceiling that keeps it under CronBusyGuard cleanup', () => {
    const now = 1_700_000_000_000;
    expect(resolveUnattendedHoldMs({ nowMs: now, nextRunAtMs: now + 7 * 24 * 60 * 60_000 })).toBeLessThanOrEqual(
      UNATTENDED_HOLD_CEILING_MS
    );
  });

  it('ignores a next run that already passed rather than producing a negative deadline', () => {
    const now = 1_700_000_000_000;
    expect(resolveUnattendedHoldMs({ nowMs: now, nextRunAtMs: now - 60_000 })).toBe(UNATTENDED_HOLD_DEFAULT_MS);
    expect(resolveUnattendedHoldMs({ nowMs: now, nextRunAtMs: Number.NaN })).toBe(UNATTENDED_HOLD_DEFAULT_MS);
  });
});

describe('#1045 the scheduled-run executor supplies the deadline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hands a deadline to a task it SPAWNS', async () => {
    const now = Date.now();
    const { executor, built } = makeHarness(undefined);

    await executor.executeJob(makeJob(now + 60 * 60_000), undefined, CONVERSATION_ID).catch(() => {});

    expect(built.length).toBeGreaterThan(0);
    expect(built[0]).toMatchObject({ yoloMode: true });
    const deadline = built[0]?.unattendedHoldDeadlineMs as number;
    expect(typeof deadline).toBe('number');
    expect(deadline).toBeGreaterThan(0);
    expect(deadline).toBeLessThan(60 * 60_000);
  });

  it('pushes a deadline onto a task it REUSES, which is never rebuilt', async () => {
    const live = {
      type: 'acp',
      workspace: undefined,
      sendMessage: vi.fn(async () => {}),
      ensureYoloMode: vi.fn(async () => true),
      setUnattendedHoldDeadlineMs: vi.fn(),
    };
    const { executor, taskManager } = makeHarness(live);

    await executor.executeJob(makeJob(Date.now() + 60 * 60_000), undefined, CONVERSATION_ID).catch(() => {});

    expect(taskManager.getOrBuildTask).not.toHaveBeenCalled();
    expect(live.setUnattendedHoldDeadlineMs).toHaveBeenCalledTimes(1);
    const [ms] = live.setUnattendedHoldDeadlineMs.mock.calls[0] as [number];
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThan(60 * 60_000);
  });

  it('does not require the method - a backend without one is left alone', async () => {
    const live = {
      type: 'wcore',
      workspace: undefined,
      sendMessage: vi.fn(async () => {}),
      ensureYoloMode: vi.fn(async () => true),
    };
    const { executor } = makeHarness(live);

    const failure = await executor
      .executeJob(makeJob(Date.now() + 60 * 60_000), undefined, CONVERSATION_ID)
      .then(() => null, (error: unknown) => String(error));

    // The run may still fail further down for unrelated reasons; what must never
    // happen is failing BECAUSE the backend has no such method.
    expect(failure ?? '').not.toContain('setUnattendedHoldDeadlineMs');
  });
});
