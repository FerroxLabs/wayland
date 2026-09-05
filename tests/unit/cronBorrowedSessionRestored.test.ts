/**
 * Regression: a scheduled run that BORROWS the user's own chat must hand the
 * live session back, and must not reach the conversation row through any
 * remaining door.
 *
 * Round 2 (c30e57b53) closed the PERSISTED downgrade: `extra.sessionMode`,
 * `extra.currentModelId`, the model row, and `setMode -> saveSessionMode`. Two
 * things survived it:
 *
 *  1. THE BORROWED LIVE SESSION IS NEVER RESTORED. `WCoreManager` has no
 *     `ensureYoloMode` override, so `BaseAgentManager`'s `false` makes the
 *     executor kill the user's task and rebuild it with `yoloMode: true`; then
 *     `applyAgentSettings` sets `currentMode = 'yolo'` on it (live only). That
 *     task stays in `WorkerTaskManager` keyed by the conversation, so the
 *     user's NEXT interactive turn in that chat runs on it: `tryAutoApprove`
 *     auto-approves every tool call, and the `this.yoloMode` escape hatch
 *     auto-resumes `approval_required`, until the app restarts.
 *
 *  2. `AcpAgentManager.setModel` -> `saveModelId` and `setConfigOption` ->
 *     `saveConfigOptions` still wrote `extra.currentModelId` /
 *     `extra.cachedConfigOptions` onto the user's own ACP chat. Both existing
 *     suites missed them purely because their task mock exposes neither method.
 *
 * These tests drive the REAL `CronBusyGuard`, so the idle handoff is exercised
 * through the same synchronous `setProcessing(false)` fire that production uses.
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
import { CronBusyGuard } from '@/process/services/cron/CronBusyGuard';
import type { CronJob } from '@/process/services/cron/CronStore';

const USER_WORKSPACE = '/Users/tester/real-project';

/** Let queued `setImmediate` work (the deferred idle handoff) run. */
const flushMacrotasks = () => new Promise<void>((resolve) => setImmediate(resolve));

function makeUiCreatedJob(overrides?: Partial<NonNullable<CronJob['metadata']['agentConfig']>>): CronJob {
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

/**
 * The job a "make this daily" chat proposal creates, BEFORE
 * `CronService.init()` backfills an agentConfig for it: no agentConfig at all,
 * so `resolveConversationForJob` is never reached and the run lands directly in
 * the user's chat.
 */
function makeChatProposeJob(): CronJob {
  const job = makeUiCreatedJob();
  delete (job.metadata as { agentConfig?: unknown }).agentConfig;
  return job;
}

/** The user's own chat: created through the normal path, so no `cronWorkspace`. */
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
    model: { id: 'm', name: 'm', useModel: 'model-cron', platform: 'wcore', baseUrl: '', apiKey: '' },
    extra: {
      workspace: '/tmp/wcore-temp-1755000000000',
      cronWorkspace: '',
      cronJobId: 'job-ui',
      backend: 'wcore',
      sessionMode: 'default',
    },
  });
}

/**
 * A task mock that EXPOSES `setModel` and `setConfigOption` - the two methods
 * both existing suites omit, which is the only reason they never saw the
 * ungated `saveModelId` / `saveConfigOptions` writes.
 */
function makeTask(opts?: { canEnableYolo?: boolean }) {
  return {
    type: 'wcore',
    workspace: USER_WORKSPACE,
    sendMessage: vi.fn(async () => {}),
    setMode: vi.fn(async () => ({ success: true })),
    setModel: vi.fn(async () => null),
    setConfigOption: vi.fn(async () => []),
    ensureYoloMode: vi.fn(async () => opts?.canEnableYolo ?? true),
  };
}

/** Executor wired to the REAL CronBusyGuard and a task registry kill() empties. */
function makeExecutor(task?: any, factoryTask = task) {
  const live = new Map<string, any>();
  if (task) live.set('conv-source', task);
  const taskManager = {
    getTask: vi.fn((id: string) => live.get(id)),
    getOrBuildTask: vi.fn(async (id: string) => {
      const fresh = factoryTask ? { ...factoryTask } : undefined;
      live.set(id, fresh);
      return fresh;
    }),
    addTask: vi.fn(),
    kill: vi.fn((id: string) => {
      live.delete(id);
    }),
    clear: vi.fn(),
    listTasks: vi.fn(() => []),
  } as any;
  const busyGuard = new CronBusyGuard();
  return { executor: new WorkerTaskManagerJobExecutor(taskManager, busyGuard), taskManager, busyGuard, live };
}

describe('a scheduled run hands the borrowed live session back to the user', () => {
  beforeEach(() => {
    conversationStore.clear();
    vi.clearAllMocks();
  });

  it("releases the user's task once the run goes idle, so the next turn rebuilds at the user's own mode", async () => {
    seedUserChat();
    const task = makeTask();
    const { executor, taskManager, busyGuard } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob());

    // The run applied full-auto to the LIVE session - that part is deliberate.
    expect(task.setMode).toHaveBeenCalledWith('yolo', { persist: false });
    // Initial acquisition retires the old idle runtime; the borrowed runtime
    // is not torn down while its turn is running.
    expect(busyGuard.isProcessing('conv-source')).toBe(true);
    expect(taskManager.kill).toHaveBeenCalledTimes(1); // Initial retirement only.

    // Turn end.
    busyGuard.setProcessing('conv-source', false);
    await flushMacrotasks();

    expect(taskManager.kill).toHaveBeenCalledTimes(2);
    expect(taskManager.kill).toHaveBeenLastCalledWith('conv-source');
  });

  it('releases it just the same when wcore could not enable yolo dynamically (the real path)', async () => {
    seedUserChat();
    // All scheduled runs now recreate the runtime with their declared policy,
    // regardless of the retired manager's old blanket-enable capability.
    const task = makeTask({ canEnableYolo: false });
    const { executor, taskManager, busyGuard } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob());
    const killsDuringRun = taskManager.kill.mock.calls.length;

    busyGuard.setProcessing('conv-source', false);
    await flushMacrotasks();

    expect(taskManager.kill.mock.calls.length).toBe(killsDuringRun + 1);
  });

  it('releases it for a chat-propose job that has no agentConfig yet', async () => {
    seedUserChat();
    const task = makeTask();
    const { executor, taskManager, busyGuard } = makeExecutor(task);

    await executor.executeJob(makeChatProposeJob());

    busyGuard.setProcessing('conv-source', false);
    await flushMacrotasks();

    expect(taskManager.kill).toHaveBeenCalledTimes(2);
    expect(taskManager.kill).toHaveBeenLastCalledWith('conv-source');
  });

  it('does NOT release a conversation the cron job created for itself', async () => {
    seedUserChat();
    seedCronChild();
    const task = makeTask();
    const { executor, taskManager, busyGuard, live } = makeExecutor();
    live.set('conv-child', task);
    taskManager.getOrBuildTask.mockImplementation(async (id: string) => {
      live.set(id, task);
      return task;
    });

    const used = await executor.executeJob(makeUiCreatedJob({ workspace: '' }));
    expect(used).toBe('conv-child');

    busyGuard.setProcessing('conv-child', false);
    await flushMacrotasks();

    expect(taskManager.kill).toHaveBeenCalledTimes(1); // Initial retirement only.
  });

  it('waits for a follow-up turn instead of tearing the manager down mid-teardown', async () => {
    seedUserChat();
    const task = makeTask();
    const { executor, taskManager, busyGuard } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob());

    // handleTurnEnd() marks idle FIRST and keeps working - it can even start a
    // follow-up turn. The handoff must notice and wait.
    busyGuard.setProcessing('conv-source', false);
    busyGuard.setProcessing('conv-source', true);
    await flushMacrotasks();
    expect(taskManager.kill).toHaveBeenCalledTimes(1); // Initial retirement only.

    busyGuard.setProcessing('conv-source', false);
    await flushMacrotasks();
    expect(taskManager.kill).toHaveBeenCalledTimes(2);
    expect(taskManager.kill).toHaveBeenLastCalledWith('conv-source');
  });

  it('releases the task the settings retry rebuilt, not the one it discarded', async () => {
    seedUserChat();
    const failing = makeTask();
    failing.setMode.mockResolvedValue({ success: false, msg: 'stale agent' });
    const rebuilt = makeTask();
    const { executor, taskManager, busyGuard, live } = makeExecutor();
    taskManager.getOrBuildTask
      .mockImplementationOnce(async (id: string) => {
        live.set(id, failing);
        return failing;
      })
      .mockImplementation(async (id: string) => {
        live.set(id, rebuilt);
        return rebuilt;
      });

    await executor.executeJob(makeUiCreatedJob());
    expect(taskManager.getOrBuildTask).toHaveBeenCalledTimes(2);
    expect(failing.setMode).toHaveBeenCalledTimes(1);
    expect(rebuilt.setMode).toHaveBeenCalledTimes(1);
    expect(live.get('conv-source')).toBe(rebuilt);

    // The retry's kill() does not clear the busy guard, so the run is still busy
    // here and the release cannot fire before the message is even sent.
    expect(busyGuard.isProcessing('conv-source')).toBe(true);

    const killsDuringRun = taskManager.kill.mock.calls.length;
    busyGuard.setProcessing('conv-source', false);
    await flushMacrotasks();

    expect(taskManager.kill.mock.calls.length).toBe(killsDuringRun + 1);
  });

  it('does not kill a successor task that replaced the one it borrowed', async () => {
    seedUserChat();
    const task = makeTask();
    const { executor, taskManager, busyGuard, live } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob());

    live.set('conv-source', { ...makeTask(), type: 'wcore-successor' });
    busyGuard.setProcessing('conv-source', false);
    await flushMacrotasks();

    expect(taskManager.kill).toHaveBeenCalledTimes(1); // Initial retirement only.
  });
});

describe('setModel and setConfigOption are gated like every other door', () => {
  beforeEach(() => {
    conversationStore.clear();
    vi.clearAllMocks();
  });

  it("does not let the job persist its model onto the user's own chat", async () => {
    seedUserChat();
    const task = makeTask();
    const { executor } = makeExecutor(task);

    await executor.executeJob(makeUiCreatedJob({ configOptions: { effort: 'high' } }));

    expect(task.setModel).toHaveBeenCalledWith('model-cron', { persist: false });
    expect(task.setConfigOption).toHaveBeenCalledWith('effort', 'high', { persist: false });
  });

  it('still persists both in a conversation the cron job created for itself', async () => {
    seedUserChat();
    seedCronChild();
    const task = makeTask();
    const { executor, live } = makeExecutor(undefined, task);
    live.set('conv-child', task);

    await executor.executeJob(makeUiCreatedJob({ workspace: '', configOptions: { effort: 'high' } }));

    expect(task.setModel).toHaveBeenCalledWith('model-cron', { persist: true });
    expect(task.setConfigOption).toHaveBeenCalledWith('effort', 'high', { persist: true });
  });
});
