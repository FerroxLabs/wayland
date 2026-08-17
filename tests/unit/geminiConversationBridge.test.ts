import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));

const handlers: Record<string, (...args: any[]) => any> = {};
function makeChannel(name: string) {
  return {
    provider: vi.fn((fn: (...args: any[]) => any) => {
      handlers[name] = fn;
    }),
    emit: vi.fn(),
    invoke: vi.fn(),
  };
}

vi.mock('../../src/common', () => ({
  ipcBridge: {
    geminiConversation: {
      confirmMessage: makeChannel('confirmMessage'),
    },
  },
}));

import { initGeminiConversationBridge } from '../../src/process/bridge/geminiConversationBridge';
import type { IWorkerTaskManager } from '../../src/process/task/IWorkerTaskManager';

function makeTaskManager(overrides?: Partial<IWorkerTaskManager>): IWorkerTaskManager {
  return {
    getTask: vi.fn(() => undefined),
    getOrBuildTask: vi.fn(async () => {
      throw new Error('not found');
    }),
    addTask: vi.fn(),
    kill: vi.fn(),
    clear: vi.fn(),
    listTasks: vi.fn(() => []),
    ...overrides,
  };
}

function makeGeminiTask(id = 'c1') {
  return {
    type: 'gemini' as const,
    conversation_id: id,
    confirm: vi.fn(),
    kill: vi.fn(),
    stop: vi.fn(),
    sendMessage: vi.fn(),
    getConfirmations: vi.fn(() => []),
  };
}

describe('geminiConversationBridge', () => {
  let taskManager: IWorkerTaskManager;

  beforeEach(() => {
    vi.clearAllMocks();
    taskManager = makeTaskManager();
    initGeminiConversationBridge(taskManager);
  });

  // --- confirmMessage ---

  it('routes confirmation payload to the correct gemini task', async () => {
    const task = makeGeminiTask('c1');
    vi.mocked(taskManager.getTask).mockReturnValue(task as any);

    const result = await handlers['confirmMessage']({
      conversation_id: 'c1',
      msg_id: 'msg-1',
      confirmKey: 'allow',
      callId: 'call-1',
    });

    expect(taskManager.getTask).toHaveBeenCalledWith('c1');
    expect(task.confirm).toHaveBeenCalledWith('msg-1', 'call-1', 'allow');
    expect(result).toEqual({ success: true });
  });

  // #983: postMessagePromise now rejects when the worker child exits, so this
  // bridge has to handle the rejection. IAgentManager.confirm is typed `void`
  // and only the Gemini implementation returns a promise, so chaining .catch
  // straight onto the call throws "Cannot read properties of undefined" for
  // every implementation (and every mock) that returns nothing.
  it('#983: survives a confirm implementation that returns no promise', async () => {
    const task = makeGeminiTask('c1');
    task.confirm.mockReturnValue(undefined);
    vi.mocked(taskManager.getTask).mockReturnValue(task as any);

    await expect(
      handlers['confirmMessage']({ conversation_id: 'c1', msg_id: 'msg-1', confirmKey: 'allow', callId: 'call-1' })
    ).resolves.toEqual({ success: true });
  });

  // #983: a worker that died mid-confirm rejects the round-trip. That must be
  // swallowed into a log, never left to surface as an unhandled rejection.
  it('#983: swallows a rejected confirm round-trip instead of leaking it', async () => {
    const task = makeGeminiTask('c1');
    task.confirm.mockRejectedValue(new Error('fork task child exited before responding'));
    vi.mocked(taskManager.getTask).mockReturnValue(task as any);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await expect(
        handlers['confirmMessage']({ conversation_id: 'c1', msg_id: 'msg-1', confirmKey: 'allow', callId: 'call-1' })
      ).resolves.toEqual({ success: true });
      // Let the rejection settle; an unguarded one would escape here.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('call-1'), expect.stringContaining('child exited'));
    } finally {
      warn.mockRestore();
    }
  });

  it('returns error response when task is not found in manager', async () => {
    vi.mocked(taskManager.getTask).mockReturnValue(undefined);

    const result = await handlers['confirmMessage']({
      conversation_id: 'missing',
      msg_id: 'msg-1',
      confirmKey: 'allow',
      callId: 'call-1',
    });

    expect(result).toEqual({ success: false, msg: 'conversation not found' });
  });

  it('returns error response when task type is not gemini', async () => {
    const task = { ...makeGeminiTask('c1'), type: 'acp' as const };
    vi.mocked(taskManager.getTask).mockReturnValue(task as any);

    const result = await handlers['confirmMessage']({
      conversation_id: 'c1',
      msg_id: 'msg-1',
      confirmKey: 'allow',
      callId: 'call-1',
    });

    expect(result).toEqual({ success: false, msg: 'only supported for gemini' });
    expect(task.confirm).not.toHaveBeenCalled();
  });
});
