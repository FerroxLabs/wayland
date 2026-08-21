/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The acceptance claim, proven end to end on a real filesystem: enable the
 * Morning Brief today, and tomorrow's run can see today's output.
 *
 * Everything below is real - the allocator writing into a temp "Documents", the
 * identity marker, CronService.updateJob, the executor resolving a conversation
 * per run. Only Electron's `app.getPath` and the conversation store are stood
 * in. The one thing this does NOT run is the engine itself; the assertion is
 * that both runs are handed the SAME directory and that a file left by run 1 is
 * sitting there when run 2 starts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async (id: string) => conversationStore.get(id)),
    createConversation: createConversationMock,
    updateConversation: vi.fn(async (id: string, patch: any) => {
      const conv = conversationStore.get(id);
      if (conv) conversationStore.set(id, { ...conv, ...patch });
    }),
    // Production ordering: `getConversationsByCronJobId` is `ORDER BY created_at DESC`.
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()]
        .filter((c) => c.extra?.cronJobId === cronJobId)
        .sort((a, b) => b.createTime - a.createTime)
    ),
  },
}));
import os from 'os';
import pathMod from 'path';
import fsp from 'fs/promises';
import { existsSync } from 'fs';

let documentsDir: string;
/** The allocator memoises `app.getPath('documents')`, so it is read through a
 *  hoisted ref that each test points at a fresh temp "Documents". */
const documentsDirRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => documentsDirRef.value },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));

import { CronService } from '@/process/services/cron/CronService';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import type { CronJob } from '@/process/services/cron/CronStore';
import type { ICronRepository } from '@/process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@/process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@/process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@/process/services/database/IConversationRepository';
import { readWorkspaceMarker } from '@process/services/workspaceIdentity';

/** A bundled routine exactly as BuiltinRoutinesSeeder leaves it: disabled, no workspace. */
function seededRoutine(): CronJob {
  return {
    id: 'cron_morning_brief',
    name: 'Morning Brief',
    enabled: false,
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
        configOptions: { kind: 'routine', routineId: 'morning-brief' },
      },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };
}

function makeCronRepo(jobs: CronJob[]): ICronRepository {
  return {
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
}

function makeService(jobs: CronJob[]) {
  return new CronService(
    makeCronRepo(jobs),
    {
      emitJobCreated: vi.fn(),
      emitJobUpdated: vi.fn(),
      emitJobRemoved: vi.fn(),
      emitJobExecuted: vi.fn(),
      showNotification: vi.fn(async () => {}),
    } as unknown as ICronEventEmitter,
    {
      isConversationBusy: vi.fn(() => false),
      executeJob: vi.fn(async () => {}),
      onceIdle: vi.fn(),
      setProcessing: vi.fn(),
    } as unknown as ICronJobExecutor,
    {
      getConversation: vi.fn(async () => undefined),
      updateConversation: vi.fn(),
      getConversationsByCronJob: vi.fn(async () => []),
    } as unknown as IConversationRepository
  );
}

function makeRealExecutor(): WorkerTaskManagerJobExecutor {
  return new WorkerTaskManagerJobExecutor(
    { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
    { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as any
  );
}

describe('the Morning Brief can see yesterday', () => {
  beforeEach(async () => {
    documentsDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-accept-'));
    documentsDirRef.value = documentsDir;
    conversationStore.clear();
    createConversationMock.mockClear();
  });
  afterEach(async () => {
    await fsp.rm(documentsDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('two runs a day apart share one durable workspace, and run 2 sees run 1 output', async () => {
    const jobs = [seededRoutine()];
    const service = makeService(jobs);

    // The user flips the routine on.
    await service.updateJob('cron_morning_brief', { enabled: true });

    const workspace = jobs[0].metadata.agentConfig!.workspace!;
    expect(workspace).toBe(pathMod.join(documentsDir, 'Wayland', 'Tasks', 'Morning Brief'));
    expect(existsSync(workspace)).toBe(true);
    const marker = await readWorkspaceMarker(workspace);
    expect(marker?.ownerKind).toBe('task');
    expect(marker?.ownerId).toBe('cron_morning_brief');
    expect(jobs[0].metadata.agentConfig!.workspaceId).toBe(marker!.workspaceId);

    // --- Day 1 run: a fresh conversation, in the durable workspace. ---
    const executor = makeRealExecutor();
    const day1 = await executor.prepareConversation(jobs[0]);
    expect(conversationStore.get(day1).extra.workspace).toBe(workspace);

    // What the routine leaves behind.
    await fsp.mkdir(pathMod.join(workspace, 'artifacts'), { recursive: true });
    await fsp.writeFile(pathMod.join(workspace, 'artifacts', '2026-08-19.md'), '# Monday brief', 'utf8');

    // --- Day 2 run: a NEW conversation, the SAME workspace. ---
    const day2 = await executor.prepareConversation(jobs[0]);
    expect(day2).not.toBe(day1);
    expect(conversationStore.get(day2).extra.workspace).toBe(workspace);
    expect(/-temp-\d+$/.test(conversationStore.get(day2).extra.workspace)).toBe(false);

    // Yesterday's brief is right there.
    expect(await fsp.readdir(pathMod.join(conversationStore.get(day2).extra.workspace, 'artifacts'))).toEqual([
      '2026-08-19.md',
    ]);
  });

  it('nothing is allocated for a routine the user never enabled', async () => {
    const jobs = [seededRoutine()];
    makeService(jobs);
    expect(jobs[0].metadata.agentConfig!.workspace).toBeUndefined();
    expect(existsSync(pathMod.join(documentsDir, 'Wayland'))).toBe(false);
  });
});
