import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));

import { WorkerTaskManager } from '../../src/process/task/WorkerTaskManager';
import type { IConversationRepository } from '../../src/process/services/database/IConversationRepository';
import type { AgentType } from '../../src/process/task/agentTypes';

function makeRepo(overrides?: Partial<IConversationRepository>): IConversationRepository {
  return {
    getConversation: vi.fn(),
    createConversation: vi.fn(),
    updateConversation: vi.fn(),
    deleteConversation: vi.fn(),
    getMessages: vi.fn(),
    insertMessage: vi.fn(),
    getUserConversations: vi.fn(),
    listAllConversations: vi.fn(() => []),
    searchMessages: vi.fn(() => ({ items: [], total: 0, page: 0, pageSize: 20, hasMore: false })),
    ...overrides,
  };
}

function makeFactory(agent?: any) {
  return { register: vi.fn(), create: vi.fn(() => agent ?? makeAgent()) };
}

function makeAgent(id = 'c1', type: AgentType = 'gemini') {
  return {
    type,
    status: undefined,
    workspace: '/ws',
    conversation_id: id,
    kill: vi.fn(),
    sendMessage: vi.fn(),
    stop: vi.fn(),
    confirm: vi.fn(),
    getConfirmations: vi.fn(() => []),
  };
}

function makeConversation(id: string, type: AgentType = 'gemini') {
  return { id, type, extra: {} };
}

describe('WorkerTaskManager', () => {
  let repo: IConversationRepository;
  // Track every manager built in a test so afterEach can dispose it. Each
  // WorkerTaskManager starts a 60s idle-check setInterval in its constructor;
  // left un-cleared, those ref'd timers keep the vitest fork worker's event
  // loop alive and hang the unit shard under CI load (#353).
  const managers: WorkerTaskManager[] = [];
  const newManager = (...args: ConstructorParameters<typeof WorkerTaskManager>): WorkerTaskManager => {
    const mgr = new WorkerTaskManager(...args);
    managers.push(mgr);
    return mgr;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repo = makeRepo();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await Promise.all(managers.splice(0).map((mgr) => mgr.clear()));
  });

  // --- getTask / addTask ---

  it('getTask returns undefined for unknown id', () => {
    const mgr = newManager(makeFactory() as any, repo);
    expect(mgr.getTask('unknown')).toBeUndefined();
  });

  it('addTask stores task and getTask returns it', () => {
    const mgr = newManager(makeFactory() as any, repo);
    const agent = makeAgent();
    mgr.addTask('c1', agent as any);
    expect(mgr.getTask('c1')).toBe(agent);
  });

  it('addTask replaces existing task with same id and kills the old one', () => {
    const mgr = newManager(makeFactory() as any, repo);
    const agent1 = makeAgent('c1', 'gemini');
    const agent2 = makeAgent('c1', 'acp');
    mgr.addTask('c1', agent1 as any);
    mgr.addTask('c1', agent2 as any);
    expect(mgr.getTask('c1')).toBe(agent2);
    expect(agent1.kill).toHaveBeenCalledOnce();
  });

  // --- kill ---

  it('kill removes task from list and calls task.kill()', () => {
    const agent = makeAgent();
    const mgr = newManager(makeFactory(agent) as any, repo);
    mgr.addTask('c1', agent as any);
    mgr.kill('c1');
    expect(mgr.getTask('c1')).toBeUndefined();
    expect(agent.kill).toHaveBeenCalled();
  });

  it('forwards idle_timeout when reaping idle cli agents', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T10:00:00Z'));

    const agent = {
      ...makeAgent('c1', 'acp'),
      status: 'finished',
      lastActivityAt: Date.now() - 6 * 60 * 1000,
    };
    const mgr = newManager(makeFactory(agent) as any, repo);
    mgr.addTask('c1', agent as any);

    vi.advanceTimersByTime(1 * 60 * 1000 + 1);
    // killIdleCliAgents reads config asynchronously - flush the microtask queue
    await vi.advanceTimersByTimeAsync(0);

    expect(agent.kill).toHaveBeenCalledWith('idle_timeout');
    expect(mgr.getTask('c1')).toBeUndefined();
  });

  it('kill is a no-op for unknown id', () => {
    const mgr = newManager(makeFactory() as any, repo);
    expect(() => mgr.kill('nonexistent')).not.toThrow();
  });

  // --- clear ---

  it('clear kills all tasks and empties the list', async () => {
    vi.useFakeTimers();
    const agent1 = makeAgent('c1', 'gemini');
    const agent2 = makeAgent('c2', 'acp');
    const mgr = newManager(makeFactory() as any, repo);
    mgr.addTask('c1', agent1 as any);
    mgr.addTask('c2', agent2 as any);
    const clearPromise = mgr.clear();
    vi.advanceTimersByTime(5000);
    await clearPromise;
    expect(agent1.kill).toHaveBeenCalled();
    expect(agent2.kill).toHaveBeenCalled();
    expect(mgr.listTasks()).toHaveLength(0);
  });

  // --- listTasks ---

  it('listTasks returns id and type for each task', () => {
    const mgr = newManager(makeFactory() as any, repo);
    mgr.addTask('c1', makeAgent('c1', 'gemini') as any);
    mgr.addTask('c2', makeAgent('c2', 'acp') as any);
    mgr.addTask('c3', makeAgent('c3', 'nanobot') as any);
    expect(mgr.listTasks()).toEqual([
      { id: 'c1', type: 'gemini' },
      { id: 'c2', type: 'acp' },
      { id: 'c3', type: 'nanobot' },
    ]);
  });

  // --- getOrBuildTask: cache hit ---

  it('returns cached task without hitting repo on second call', async () => {
    const agent = makeAgent();
    const factory = makeFactory(agent);
    const mgr = newManager(factory as any, repo);
    mgr.addTask('c1', agent as any);

    const result = await mgr.getOrBuildTask('c1');
    expect(repo.getConversation).not.toHaveBeenCalled();
    expect(factory.create).not.toHaveBeenCalled();
    expect(result).toBe(agent);
  });

  // --- getOrBuildTask: repo hit ---

  it('hits repo on cache miss and builds task correctly', async () => {
    const agent = makeAgent('c1', 'gemini');
    const factory = makeFactory(agent);
    vi.mocked(repo.getConversation).mockReturnValue(makeConversation('c1', 'gemini') as any);

    const mgr = newManager(factory as any, repo);
    const result = await mgr.getOrBuildTask('c1');

    expect(repo.getConversation).toHaveBeenCalledWith('c1');
    expect(factory.create).toHaveBeenCalledWith(makeConversation('c1', 'gemini'), undefined);
    expect(result).toBe(agent);
  });

  it('caches task built from repo', async () => {
    const agent = makeAgent();
    const factory = makeFactory(agent);
    vi.mocked(repo.getConversation).mockReturnValue(makeConversation('c1') as any);

    const mgr = newManager(factory as any, repo);
    await mgr.getOrBuildTask('c1');
    await mgr.getOrBuildTask('c1'); // second call should use cache
    expect(factory.create).toHaveBeenCalledTimes(1);
  });

  // --- getOrBuildTask: failure paths ---

  it('rejects with error when repo returns undefined', async () => {
    vi.mocked(repo.getConversation).mockReturnValue(undefined);
    const mgr = newManager(makeFactory() as any, repo);

    await expect(mgr.getOrBuildTask('missing')).rejects.toThrow('Conversation not found: missing');
  });

  it('rejects when skipCache is set and repo returns undefined', async () => {
    vi.mocked(repo.getConversation).mockReturnValue(undefined);
    const mgr = newManager(makeFactory() as any, repo);

    await expect(mgr.getOrBuildTask('missing', { skipCache: true })).rejects.toThrow('Conversation not found: missing');
  });

  // --- getOrBuildTask: skipCache option ---

  it('getOrBuildTask with skipCache bypasses cache and does not store result', async () => {
    const agent = makeAgent();
    const factory = makeFactory(agent);
    vi.mocked(repo.getConversation).mockReturnValue(makeConversation('c1') as any);

    const mgr = newManager(factory as any, repo);
    mgr.addTask('c1', agent as any);
    await mgr.getOrBuildTask('c1', { skipCache: true });

    expect(factory.create).toHaveBeenCalledTimes(1);
    // Task list should still only have the original (not a duplicate)
    expect(mgr.listTasks()).toHaveLength(1);
  });
});
