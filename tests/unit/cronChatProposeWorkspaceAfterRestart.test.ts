/**
 * Regression: a chat-propose ("make this daily") cron job must keep running in
 * its SOURCE conversation - and therefore its source workspace - across an app
 * restart.
 *
 * The bug this guards (verified on f7b49a587):
 *   1. `cronBridge.confirmProposal` accepts the proposal with
 *      executionMode:'existing' and NO `metadata.agentConfig`.
 *   2. `WorkerTaskManagerJobExecutor.prepareConversation` early-returns
 *      `metadata.conversationId` while agentConfig is absent, so the whole
 *      first session runs in the right place.
 *   3. On the next launch `CronService.init()` -> `backfillCronJobIdOnConversations`
 *      SYNTHESISES an agentConfig (backend only, no workspace).
 *   4. agentConfig now present => the early return is gone => the executor
 *      compares `conversation.extra.backend` with `agentConfig.backend`.
 *   5. `createWCoreAgent` never persists `extra.backend` (its whitelist is
 *      workspace/customWorkspace/presetRules/enabledSkills/presetAssistantId/
 *      sessionMode), so `undefined !== 'wcore'` reads as "the agent changed"
 *      and a brand-new conversation is built with `workspace: ''` -> a fresh
 *      `wcore-temp-<ts>` directory that cannot see the configured chat's files.
 *
 * This suite drives the REAL backfill through the REAL executor, because the
 * defect only exists once the backfill has run - a same-session test passes on
 * the broken code.
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
      [...conversationStore.values()].filter((c) => c.extra?.cronJobId === cronJobId).sort((a, b) => b.createTime - a.createTime)
    ),
  },
}));

import { CronService } from '@/process/services/cron/CronService';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import type { CronJob } from '@/process/services/cron/CronStore';
import type { ICronRepository } from '@/process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@/process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@/process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@/process/services/database/IConversationRepository';

const SOURCE_WORKSPACE = '/Users/tester/Documents/quarterly-report';

/** The job cronBridge.confirmProposal creates when the user accepts "make this daily". */
function makeChatProposeJob(overrides?: Partial<CronJob>): CronJob {
  return {
    id: 'job-daily',
    name: 'Daily quarterly report',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 9 * * *', description: 'every day at 9:00' },
    target: { payload: { kind: 'message', text: 'refresh the report' }, executionMode: 'existing' },
    metadata: {
      conversationId: 'conv-source',
      conversationTitle: 'Quarterly report',
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1000,
      updatedAt: 1000,
      // NOTE: no agentConfig - this is the whole point of the bug.
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
    ...overrides,
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
  };
}

function makeConversationRepo(): IConversationRepository {
  return {
    getConversation: vi.fn((id: string) => conversationStore.get(id)),
    createConversation: vi.fn(),
    updateConversation: vi.fn((id: string, patch: any) => {
      const conv = conversationStore.get(id);
      if (conv) conversationStore.set(id, { ...conv, ...patch });
    }),
    deleteConversation: vi.fn(),
    getMessages: vi.fn(() => ({ data: [], total: 0, hasMore: false })),
    insertMessage: vi.fn(),
    getUserConversations: vi.fn(() => ({ data: [], total: 0, hasMore: false })),
    listAllConversations: vi.fn(() => []),
    searchMessages: vi.fn(async () => ({ data: [], total: 0, hasMore: false })),
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()].filter((c) => c.extra?.cronJobId === cronJobId)
    ),
  } as unknown as IConversationRepository;
}

function makeEmitter(): ICronEventEmitter {
  return {
    emitJobCreated: vi.fn(),
    emitJobUpdated: vi.fn(),
    emitJobRemoved: vi.fn(),
    emitJobExecuted: vi.fn(),
    showNotification: vi.fn(async () => {}),
  } as unknown as ICronEventEmitter;
}

function makeStubExecutor(): ICronJobExecutor {
  return {
    isConversationBusy: vi.fn(() => false),
    executeJob: vi.fn(async () => {}),
    onceIdle: vi.fn(),
    setProcessing: vi.fn(),
  } as unknown as ICronJobExecutor;
}

function makeRealExecutor(): WorkerTaskManagerJobExecutor {
  return new WorkerTaskManagerJobExecutor(
    { getTask: vi.fn(), buildConversation: vi.fn() } as any,
    { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as any
  );
}

/** Run the real CronService.init() so the real backfill mutates the job. */
async function runRestartBackfill(jobs: CronJob[]) {
  const repo = makeCronRepo(jobs);
  const service = new CronService(repo, makeEmitter(), makeStubExecutor(), makeConversationRepo());
  await service.init();
  return repo;
}

describe('chat-propose cron job workspace survives an app restart', () => {
  beforeEach(() => {
    conversationStore.clear();
    createConversationMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps running in the source wcore conversation after CronService backfills an agentConfig', async () => {
    // The configured chat, created through the normal wcore path: a real
    // workspace, and NO extra.backend (createWCoreAgent never persists it).
    conversationStore.set('conv-source', {
      id: 'conv-source',
      type: 'wcore',
      name: 'Quarterly report',
      createTime: 1000,
      modifyTime: 1000,
      model: { id: 'm', name: 'm', useModel: 'auto', platform: 'wcore', baseUrl: '', apiKey: '' },
      extra: { workspace: SOURCE_WORKSPACE, customWorkspace: true },
    });

    const jobs = [makeChatProposeJob()];

    // --- App restart ---
    await runRestartBackfill(jobs);

    // Guard: the test is only meaningful if the backfill actually fired.
    expect(jobs[0].metadata.agentConfig).toBeDefined();
    expect(jobs[0].metadata.agentConfig?.backend).toBe('wcore');
    expect(jobs[0].metadata.agentConfig?.workspace).toBeUndefined();
    expect(conversationStore.get('conv-source').extra.cronJobId).toBe('job-daily');

    // --- First scheduled run after the restart ---
    const resolved = await makeRealExecutor().prepareConversation(jobs[0]);

    expect(createConversationMock).not.toHaveBeenCalled();
    expect(resolved).toBe('conv-source');
    expect(conversationStore.get(resolved).extra.workspace).toBe(SOURCE_WORKSPACE);
  });

  it('keeps running in the source gemini conversation after the same backfill', async () => {
    // createGeminiAgent omits extra.backend for the same reason.
    conversationStore.set('conv-source', {
      id: 'conv-source',
      type: 'gemini',
      name: 'Gemini report',
      createTime: 1000,
      modifyTime: 1000,
      model: { id: 'm', name: 'm', useModel: 'auto', platform: 'gemini', baseUrl: '', apiKey: '' },
      extra: { workspace: SOURCE_WORKSPACE, customWorkspace: true },
    });

    const jobs = [
      makeChatProposeJob({
        metadata: {
          ...makeChatProposeJob().metadata,
          agentType: 'gemini' as CronJob['metadata']['agentType'],
        },
      }),
    ];

    await runRestartBackfill(jobs);
    expect(jobs[0].metadata.agentConfig?.backend).toBe('gemini');

    const resolved = await makeRealExecutor().prepareConversation(jobs[0]);

    expect(createConversationMock).not.toHaveBeenCalled();
    expect(resolved).toBe('conv-source');
  });

  // Documented limitation, not an aspiration: this fix stops the rehoming, it
  // does not undo it. A job already broken by the bug has a cron-created child
  // conversation that IS newest, and that child DOES carry `extra.backend`
  // (buildConversationForJob passes it, and ConversationServiceImpl merges back
  // keys the wcore factory did not consume). So it compares equal on every
  // axis and the job keeps reusing its wrong `wcore-temp-<ts>` workspace.
  // Recovering those jobs needs a separate migration or a user re-point.
  it('does NOT self-heal a job already stranded in a wcore-temp workspace', async () => {
    conversationStore.set('conv-source', {
      id: 'conv-source',
      type: 'wcore',
      name: 'Quarterly report',
      createTime: 1000,
      modifyTime: 1000,
      extra: { workspace: SOURCE_WORKSPACE, customWorkspace: true, cronJobId: 'job-daily' },
    });
    // What the bug already produced on this user's machine.
    conversationStore.set('conv-stranded', {
      id: 'conv-stranded',
      type: 'wcore',
      name: 'Daily quarterly report - 08/18 09:00',
      createTime: 5000,
      modifyTime: 5000,
      extra: {
        workspace: '/tmp/wcore-temp-1755000000000',
        cronWorkspace: '',
        cronJobId: 'job-daily',
        backend: 'wcore',
      },
    });

    const job = makeChatProposeJob({
      metadata: {
        ...makeChatProposeJob().metadata,
        agentConfig: { backend: 'wcore' as CronJob['metadata']['agentType'], name: 'Daily quarterly report' },
      },
    });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(resolved).toBe('conv-stranded');
    expect(conversationStore.get(resolved).extra.workspace).toBe('/tmp/wcore-temp-1755000000000');
  });

  it('still starts a new conversation when the ACP backend genuinely changed (claude -> codex)', async () => {
    conversationStore.set('conv-source', {
      id: 'conv-source',
      type: 'acp',
      name: 'Claude chat',
      createTime: 1000,
      modifyTime: 1000,
      extra: { workspace: SOURCE_WORKSPACE, customWorkspace: true, backend: 'claude', cronJobId: 'job-daily' },
    });

    const job = makeChatProposeJob({
      metadata: {
        ...makeChatProposeJob().metadata,
        agentType: 'claude' as CronJob['metadata']['agentType'],
        agentConfig: { backend: 'codex' as CronJob['metadata']['agentType'], name: 'Codex' },
      },
    });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(resolved).not.toBe('conv-source');
  });

  it('still starts a new conversation when a wcore chat is repointed at an ACP backend', async () => {
    conversationStore.set('conv-source', {
      id: 'conv-source',
      type: 'wcore',
      name: 'WCore chat',
      createTime: 1000,
      modifyTime: 1000,
      extra: { workspace: SOURCE_WORKSPACE, customWorkspace: true, cronJobId: 'job-daily' },
    });

    const job = makeChatProposeJob({
      metadata: {
        ...makeChatProposeJob().metadata,
        agentConfig: { backend: 'claude' as CronJob['metadata']['agentType'], name: 'Claude' },
      },
    });

    const resolved = await makeRealExecutor().prepareConversation(job);

    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(resolved).not.toBe('conv-source');
  });
});
