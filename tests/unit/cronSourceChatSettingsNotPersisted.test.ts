/**
 * Regression: a scheduled task that runs inside the user's OWN chat must never
 * persist its agent settings onto that chat.
 *
 * A UI-created "run in this chat" job carries a real agentConfig - and
 * `getFullAutoMode('wcore')` is `'yolo'` (CreateTaskDialog -> ICronAgentConfig).
 * Once `resolveConversationForJob` reuses the source conversation, the sync
 * block wrote `sessionMode: 'yolo'` and the job's `currentModelId` straight onto
 * it, and `applyAgentSettings` -> `task.setMode('yolo')` ->
 * `WCoreManager.saveSessionMode` wrote the same thing again through a second
 * door. Both are permanent: `WCoreManager`'s constructor reads
 * `extra.sessionMode`, and `tryAutoApprove` then auto-approves EVERY tool call
 * in that chat with no confirmation dialog, forever.
 *
 * The cron run itself still needs full-auto (there is nobody to answer a
 * confirmation), so the mode is still applied to the LIVE session - it is only
 * the persistence onto the user's row that is suppressed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: vi.fn(() => '/mock/userData') },
}));
vi.mock('@/common/utils', () => ({ uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@process/utils', () => ({ copyFilesToDirectory: vi.fn(async () => []) }));
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

const conversationStore = new Map<string, any>();
/** Every persisted conversation write, in order: [conversationId, patch]. */
const updateCalls: Array<[string, any]> = [];
const createConversationMock = vi.fn(async (params: any) => {
  const id = `conv-created-${conversationStore.size}`;
  const conv = {
    id,
    type: params.type,
    name: params.name,
    createTime: Date.now(),
    modifyTime: Date.now() + 1000,
    model: params.model,
    extra: { ...params.extra, workspace: params.extra?.workspace || `/tmp/wcore-temp-${Date.now()}` },
  };
  conversationStore.set(id, conv);
  return conv;
});

vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async (id: string) => conversationStore.get(id)),
    createConversation: createConversationMock,
    updateConversation: vi.fn(async (id: string, patch: any) => {
      updateCalls.push([id, patch]);
      const conv = conversationStore.get(id);
      if (conv) conversationStore.set(id, { ...conv, ...patch });
    }),
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()]
        .filter((c) => c.extra?.cronJobId === cronJobId)
        .sort((a, b) => b.createTime - a.createTime)
    ),
  },
}));

import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import type { CronJob } from '@/process/services/cron/CronStore';

const USER_WORKSPACE = '/Users/tester/real-project';

/**
 * The job CreateTaskDialog builds for "run in this chat": a full agentConfig
 * whose mode is `getFullAutoMode('wcore')` === 'yolo', a chosen model, and no
 * workspace (the picker defaults to undefined).
 */
function makeUiCreatedJob(overrides?: Partial<CronJob['metadata']['agentConfig']>): CronJob {
  return {
    id: 'job-ui',
    name: 'Nightly summary',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 9 * * *', description: 'every day at 9:00' },
    target: { payload: { kind: 'message', text: 'summarise' }, executionMode: 'existing' },
    metadata: {
      conversationId: 'conv-source',
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'user',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig: {
        backend: 'wcore' as CronJob['metadata']['agentType'],
        name: 'Wayland',
        mode: 'yolo',
        modelId: 'model-cron',
        ...overrides,
      },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  } as CronJob;
}

/** The user's own chat: created through the normal wcore path, so no `cronWorkspace`. */
function seedUserChat() {
  conversationStore.set('conv-source', {
    id: 'conv-source',
    type: 'wcore',
    name: 'My project chat',
    createTime: 1000,
    modifyTime: 1000,
    model: { id: 'm', name: 'm', useModel: 'model-user', platform: 'wcore', baseUrl: '', apiKey: '' },
    extra: {
      workspace: USER_WORKSPACE,
      customWorkspace: true,
      sessionMode: 'default',
      currentModelId: 'model-user',
      cronJobId: 'job-ui',
    },
  });
}

/** A conversation the cron job created for itself - stamped with `cronWorkspace`. */
function seedCronChild() {
  conversationStore.set('conv-child', {
    id: 'conv-child',
    type: 'wcore',
    name: 'Nightly summary - 08/19 09:00',
    createTime: 5000,
    modifyTime: 5000,
    model: { id: 'm', name: 'm', useModel: 'model-old', platform: 'wcore', baseUrl: '', apiKey: '' },
    extra: {
      workspace: '/tmp/wcore-temp-1755000000000',
      cronWorkspace: '',
      cronJobId: 'job-ui',
      backend: 'wcore',
      sessionMode: 'default',
    },
  });
}

function makeExecutor(task?: any) {
  const taskManager = {
    getTask: vi.fn(() => task),
    getOrBuildTask: vi.fn(async () => task),
    addTask: vi.fn(),
    kill: vi.fn(),
    clear: vi.fn(),
    listTasks: vi.fn(() => []),
  } as any;
  const busyGuard = { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as any;
  return { executor: new WorkerTaskManagerJobExecutor(taskManager, busyGuard), taskManager };
}

function makeTask() {
  return {
    type: 'wcore',
    workspace: USER_WORKSPACE,
    sendMessage: vi.fn(async () => {}),
    setMode: vi.fn(async () => ({ success: true })),
    ensureYoloMode: vi.fn(async () => true),
  };
}

/** Persisted `extra` patches only (the sync block writes `{ extra: {...} }`). */
function extraPatchesFor(conversationId: string) {
  return updateCalls.filter(([id, patch]) => id === conversationId && patch?.extra).map(([, patch]) => patch.extra);
}

describe("a cron job never persists its own settings onto the user's chat", () => {
  beforeEach(() => {
    conversationStore.clear();
    updateCalls.length = 0;
    vi.clearAllMocks();
  });

  it('does not write sessionMode or currentModelId onto the source conversation', async () => {
    seedUserChat();
    const { executor } = makeExecutor();

    const resolved = await executor.prepareConversation(makeUiCreatedJob());

    // The round-1 fix keeps the job in the user's chat - that part must hold.
    expect(resolved).toBe('conv-source');
    expect(createConversationMock).not.toHaveBeenCalled();

    for (const extra of extraPatchesFor('conv-source')) {
      expect(extra.sessionMode).toBe('default');
      expect(extra.currentModelId).toBe('model-user');
    }
    expect(conversationStore.get('conv-source').extra.sessionMode).toBe('default');
    expect(conversationStore.get('conv-source').extra.currentModelId).toBe('model-user');
  });

  it('still writes them onto a conversation the cron job created for itself', async () => {
    seedUserChat();
    seedCronChild();
    const { executor } = makeExecutor();

    const resolved = await executor.prepareConversation(makeUiCreatedJob({ workspace: '' }));

    expect(resolved).toBe('conv-child');
    expect(conversationStore.get('conv-child').extra.sessionMode).toBe('yolo');
    expect(conversationStore.get('conv-child').extra.currentModelId).toBe('model-cron');
  });

  it("does not rewrite the model row of the user's chat", async () => {
    seedUserChat();
    const task = makeTask();
    const { executor, taskManager } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob());

    expect(updateCalls.filter(([id, patch]) => id === 'conv-source' && patch?.model)).toEqual([]);
    expect(conversationStore.get('conv-source').model.useModel).toBe('model-user');
    // The user's live task must not be torn down to swap a model we did not swap.
    expect(taskManager.kill).not.toHaveBeenCalled();
  });

  it("applies full-auto to the live session but does not persist it in the user's chat", async () => {
    seedUserChat();
    const task = makeTask();
    const { executor } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob());

    // The run is unattended: the mode still has to reach the live session,
    // otherwise the first tool approval wedges with nobody to answer it.
    expect(task.setMode).toHaveBeenCalledWith('yolo', { persist: false });
    expect(conversationStore.get('conv-source').extra.sessionMode).toBe('default');
  });

  it('persists the mode as usual when the run is in a cron-created conversation', async () => {
    seedUserChat();
    seedCronChild();
    const task = makeTask();
    const { executor } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob({ workspace: '' }));

    expect(task.setMode).toHaveBeenCalledWith('yolo', { persist: true });
  });
});
