/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2-3 - one source of truth for a scheduled run's workspace.
 *
 * The workspace lives in two places for an `existing`-mode job: the
 * CONVERSATION (`extra.workspace`, what the agent actually runs in) and the
 * CRON JOB (`metadata.agentConfig.workspace`, what the Create Task dialog last
 * wrote). The executor treated the job's copy as authoritative even when the
 * job HAD no copy: `config.workspace || ''` turns "this job expresses no
 * opinion" into "the workspace is now empty", `workspaceChanged` fires, and the
 * run is rehomed into a brand-new conversation with `workspace: ''` - a fresh
 * `wcore-temp-<ts>` that cannot see a single previous run.
 *
 * That is the exact shape of the `extra.backend` defect one field over: an
 * agentConfig synthesised by `backfillCronJobIdOnConversations` carries a
 * backend and NO workspace, so it only ever bites after a restart.
 *
 * The fix is to resolve from the conversation when the job states nothing, and
 * to keep the job authoritative only when it actually names a workspace.
 */


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/mock/userData'),
    getAppPath: vi.fn(() => '/mock/appPath'),
  },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    power: { preventSleep: vi.fn(() => 1), allowSleep: vi.fn() },
  }),
}));
vi.mock('croner', () => ({
  Cron: class {
    stop() {}
    nextRun() {
      return null;
    }
  },
}));
vi.mock('@process/services/i18n', () => ({
  default: { t: vi.fn((key: string) => key) },
  i18nReady: Promise.resolve(),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@process/utils', () => ({ copyFilesToDirectory: vi.fn(async () => {}) }));
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: vi.fn() },
      listChanged: { emit: vi.fn() },
    },
  },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined) },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
  hasCronSkillFile: vi.fn(async () => false),
  getCronSkillDir: vi.fn(() => '/mock/cronSkills/job'),
}));
vi.mock('@/process/services/cron/cronArchive', () => ({
  archiveCronJob: vi.fn(async () => ({ archiveId: 'a', archivedAt: 1, skillPresent: false })),
  listArchivedCronJobs: vi.fn(async () => []),
  markCronArchiveAborted: vi.fn(async () => {}),
  markCronArchiveRestored: vi.fn(async () => {}),
  preserveRemovedCronSkill: vi.fn(async () => {}),
  restoreCronSkillFromArchive: vi.fn(),
  rollbackRestoredCronSkill: vi.fn(async () => {}),
}));
vi.mock('@process/services/cron/SkillSuggestWatcher', () => ({
  skillSuggestWatcher: { watch: vi.fn(), stop: vi.fn() },
}));
vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: {
    getInstance: () => ({
      discoverSkills: vi.fn(async () => {}),
      getSkillsIndex: () => [],
    }),
  },
}));

// The executor lazy-imports the conversation service singleton to break a
// circular dependency; stand in an in-memory implementation.
const conversationStore = new Map<string, any>();
const createConversationMock = vi.fn(async (params: any) => {
  // Mirror the real factories: an empty `extra.workspace` becomes a throwaway
  // `<agent>-temp-<ts>` directory, which is exactly the failure symptom.
  const id = `conv-created-${conversationStore.size}`;
  const workspace = params.extra?.workspace ? params.extra.workspace : `/tmp/wcore-temp-${Date.now()}`;
  const conv = {
    id,
    type: params.type,
    name: params.name,
    createTime: Date.now(),
    modifyTime: Date.now() + 1000,
    model: params.model,
    // wcore's factory whitelist drops `backend`; ConversationServiceImpl then
    // merges back only the keys the factory did not produce.
    extra: { ...params.extra, workspace },
  };
  conversationStore.set(id, conv);
  return conv;
});

const updateConversationMock = vi.fn(async (id: string, patch: any) => {
  const conv = conversationStore.get(id);
  if (conv) conversationStore.set(id, { ...conv, ...patch });
});

vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async (id: string) => conversationStore.get(id)),
    createConversation: createConversationMock,
    updateConversation: updateConversationMock,
    // Production ordering: `getConversationsByCronJobId` is `ORDER BY created_at DESC`.
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()].filter((c) => c.extra?.cronJobId === cronJobId).sort((a, b) => b.createTime - a.createTime)
    ),
  },
}));
import os from 'os';
import pathMod from 'path';
import fsp from 'fs/promises';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import type { CronJob } from '@/process/services/cron/CronStore';

// Real directories: the P2-10 preflight stats the workspace before every run, so
// a job pointed at a path that does not exist fails closed rather than resolving
// a conversation. These suites are about WHICH workspace wins, not about a
// missing one, so both candidates have to actually be on disk.
let tmp: string;
let DURABLE_WORKSPACE: string;
let OTHER_WORKSPACE: string;

function makeExistingModeJob(agentConfig: CronJob['metadata']['agentConfig']): CronJob {
  return {
    id: 'job-brief',
    name: 'Morning Brief',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: 'every day at 7:00' },
    target: { payload: { kind: 'message', text: 'brief me' }, executionMode: 'existing' },
    metadata: {
      conversationId: 'conv-child',
      conversationTitle: 'Morning Brief',
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'user',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };
}

/** A conversation this job created for itself, running in a durable workspace. */
function seedDurableChild(cronWorkspace: string) {
  conversationStore.set('conv-child', {
    id: 'conv-child',
    type: 'wcore',
    name: 'Morning Brief - 08/19 07:00',
    createTime: 5000,
    modifyTime: 5000,
    extra: {
      workspace: DURABLE_WORKSPACE,
      cronWorkspace,
      cronJobId: 'job-brief',
      backend: 'wcore',
    },
  });
}

/**
 * An OLDER child conversation: created before `extra.workspace` was always
 * written, so the field is absent entirely rather than empty.
 *
 * `seedDurableChild` cannot stand in for this. It always sets
 * `extra.workspace`, and the backfill branch is guarded on
 * `workspace === undefined || workspace === null` - so every test built on it
 * skips that branch completely, whatever the branch does.
 */
function seedChildMissingWorkspace(cronWorkspace: string) {
  conversationStore.set('conv-child', {
    id: 'conv-child',
    type: 'wcore',
    name: 'Morning Brief - 08/18 07:00',
    createTime: 4000,
    modifyTime: 4000,
    extra: {
      cronWorkspace,
      cronJobId: 'job-brief',
      backend: 'wcore',
    },
  });
}

function makeRealExecutor(): WorkerTaskManagerJobExecutor {
  return new WorkerTaskManagerJobExecutor(
    { getTask: vi.fn(), buildConversation: vi.fn() } as any,
    { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as any
  );
}

describe('P2-3 the conversation is the source of truth for the workspace', () => {
  beforeEach(async () => {
    tmp = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-p23-'));
    DURABLE_WORKSPACE = pathMod.join(tmp, 'Wayland', 'Tasks', 'Morning Brief');
    OTHER_WORKSPACE = pathMod.join(tmp, 'Somewhere Else');
    await fsp.mkdir(DURABLE_WORKSPACE, { recursive: true });
    await fsp.mkdir(OTHER_WORKSPACE, { recursive: true });
    conversationStore.clear();
    createConversationMock.mockClear();
    updateConversationMock.mockClear();
  });
  afterEach(async () => {
    await fsp.rm(tmp, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('keeps the durable workspace when the job states no workspace of its own', async () => {
    seedDurableChild(DURABLE_WORKSPACE);
    // What `backfillCronJobIdOnConversations` synthesises after a restart:
    // a backend, and no workspace at all.
    const job = makeExistingModeJob({ backend: 'wcore' as CronJob['metadata']['agentType'], name: 'Morning Brief' });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(createConversationMock).not.toHaveBeenCalled();
    expect(resolved).toBe('conv-child');
    expect(conversationStore.get(resolved).extra.workspace).toBe(DURABLE_WORKSPACE);
  });

  it('leaves an existing conversation workspace exactly as it was', async () => {
    seedDurableChild(DURABLE_WORKSPACE);
    const job = makeExistingModeJob({ backend: 'wcore' as CronJob['metadata']['agentType'], name: 'Morning Brief' });

    await makeRealExecutor().prepareConversation(job);

    expect(conversationStore.get('conv-child').extra.workspace).toBe(DURABLE_WORKSPACE);
    expect(conversationStore.get('conv-child').extra.cronWorkspace).toBe(DURABLE_WORKSPACE);
  });

  /**
   * The BACKFILL branch, which the four tests above never reach.
   *
   * Every one of them seeds a child that already has `extra.workspace`, and the
   * branch is guarded on that field being absent - so a full revert of P2-3 left
   * this whole area green. These two enter it: the first proves it is reachable
   * and does its job, the second pins the guard that stops it copying the job's
   * NON-ANSWER into the conversation store.
   */
  it('backfills the workspace onto an older conversation from the job that names one', async () => {
    seedChildMissingWorkspace(DURABLE_WORKSPACE);
    const job = makeExistingModeJob({
      backend: 'wcore' as CronJob['metadata']['agentType'],
      name: 'Morning Brief',
      workspace: DURABLE_WORKSPACE,
    });

    const resolved = await makeRealExecutor().prepareConversation(job);

    // Reused, not rehomed: the job names the same folder the conversation was
    // already configured with.
    expect(createConversationMock).not.toHaveBeenCalled();
    expect(resolved).toBe('conv-child');
    expect(conversationStore.get('conv-child').extra.workspace).toBe(DURABLE_WORKSPACE);
  });

  it('writes NOTHING onto the conversation when the job names no workspace', async () => {
    seedChildMissingWorkspace('');
    // What `backfillCronJobIdOnConversations` synthesises after a restart: a
    // backend and no workspace at all. `config.workspace || ''` used to turn
    // that non-answer into "the workspace is now empty" and persist it, which
    // makes the store and the job disagree about which one holds the truth.
    const job = makeExistingModeJob({ backend: 'wcore' as CronJob['metadata']['agentType'], name: 'Morning Brief' });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(resolved).toBe('conv-child');
    expect(createConversationMock).not.toHaveBeenCalled();
    // Not "is empty" - ABSENT. Writing `undefined` or `''` here is the defect.
    expect('workspace' in conversationStore.get('conv-child').extra).toBe(false);
    // And with nothing else to sync, the conversation was not touched at all.
    expect(updateConversationMock).not.toHaveBeenCalled();
  });

  it('STILL rehomes when the user repoints the job at a different workspace', async () => {
    seedDurableChild(DURABLE_WORKSPACE);
    const job = makeExistingModeJob({
      backend: 'wcore' as CronJob['metadata']['agentType'],
      name: 'Morning Brief',
      workspace: OTHER_WORKSPACE,
    });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(resolved).not.toBe('conv-child');
    expect(conversationStore.get(resolved).extra.workspace).toBe(OTHER_WORKSPACE);
  });

  it('STILL rehomes when the agent genuinely changed, even with no job workspace', async () => {
    seedDurableChild(DURABLE_WORKSPACE);
    const job = makeExistingModeJob({ backend: 'claude' as CronJob['metadata']['agentType'], name: 'Claude' });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(resolved).not.toBe('conv-child');
  });
});
