import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelMessageService, type StreamCallback } from '@process/channels/agent/ChannelMessageService';
import type { IAgentMessageEvent } from '@process/channels/agent/ChannelEventBus';
import { workerTaskManager } from '@process/task/workerTaskManagerSingleton';
import * as databaseModule from '@process/services/database';

type TestStreamState = {
  msgId: string;
  callback: StreamCallback;
  buffer: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  turnCount: number;
  finishCount: number;
  lastVisibleMessageType?: string;
  hasAnswerMessage?: boolean;
  hasNonAnswerMessage?: boolean;
  finishTimer?: ReturnType<typeof setTimeout>;
  deadlineTimer?: ReturnType<typeof setTimeout>;
};

type ChannelMessageServiceHarness = Pick<ChannelMessageService, 'clearStreamByConversationId' | 'sendMessage'> & {
  activeStreams: Map<string, TestStreamState>;
  handleAgentMessage: (event: IAgentMessageEvent) => void;
};

function createServiceHarness(): ChannelMessageServiceHarness {
  return new ChannelMessageService() as unknown as ChannelMessageServiceHarness;
}

const flushMicrotasks = async () => {
  // Drain the queue and Promise.race continuations without moving fake time.
  // A fixed number of Promise.resolve yields stops before task dispatch.
  await vi.advanceTimersByTimeAsync(0);
};

describe('ChannelMessageService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('sends Gemini input under the restricted channel policy', async () => {
    const service = new ChannelMessageService();

    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'gemini', source: 'telegram' } }),
    } as any);

    const sendTaskMessage = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(workerTaskManager, 'getOrBuildTask').mockResolvedValue({
      type: 'gemini',
      sendMessage: sendTaskMessage,
    } as any);

    const streamPromise = service.sendMessage('session-1', 'conv-gemini', 'hello gemini', vi.fn());
    await flushMicrotasks();

    expect(sendTaskMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'hello gemini',
        msg_id: expect.stringContaining('channel_msg_'),
      })
    );
    expect(sendTaskMessage).not.toHaveBeenCalledWith(expect.objectContaining({ content: 'hello gemini' }));
    expect(workerTaskManager.getOrBuildTask).toHaveBeenCalledWith('conv-gemini', {
      executionPolicy: 'channel-conversational',
      yoloMode: false,
      launchSignal: expect.any(AbortSignal),
    });

    service.clearStreamByConversationId('conv-gemini');
    await expect(streamPromise).resolves.toContain('channel_msg_');
  });

  it('fails closed before dispatch for a selected non-Gemini backend', async () => {
    const service = new ChannelMessageService();

    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'wcore', source: 'telegram' } }),
    } as any);

    const sendTaskMessage = vi.fn().mockResolvedValue(undefined);
    const getTask = vi.spyOn(workerTaskManager, 'getOrBuildTask');
    const onStream = vi.fn();

    await expect(service.sendMessage('session-1', 'conv-wcore', 'hello wcore', onStream)).rejects.toThrow(
      /support Gemini only/
    );
    expect(getTask).not.toHaveBeenCalled();
    expect(sendTaskMessage).not.toHaveBeenCalled();
    expect(onStream).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ content: expect.stringContaining('Channel Settings') }),
      }),
      true
    );
  });

  it('waits for Gemini continuation after a tool-only finish', async () => {
    const service = createServiceHarness();
    const callback = vi.fn();
    const resolve = vi.fn();
    const reject = vi.fn();

    service.activeStreams.set('conv-1', {
      msgId: 'msg-1',
      callback,
      buffer: '',
      resolve,
      reject,
      turnCount: 0,
      finishCount: 0,
      lastVisibleMessageType: undefined,
      finishTimer: undefined,
    });

    service.handleAgentMessage({ conversation_id: 'conv-1', type: 'start', msg_id: 'msg-1', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-1',
      type: 'tool_group',
      msg_id: 'msg-1',
      data: [
        {
          callId: 'tool-1',
          description: 'Searching the web for: test',
          name: 'google_web_search',
          renderOutputAsMarkdown: false,
          status: 'Confirming',
        },
      ],
    });
    service.handleAgentMessage({ conversation_id: 'conv-1', type: 'finish', msg_id: 'msg-1', data: '' });

    await vi.advanceTimersByTimeAsync(14_000);
    expect(resolve).not.toHaveBeenCalled();

    service.handleAgentMessage({ conversation_id: 'conv-1', type: 'start', msg_id: 'msg-1', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-1',
      type: 'content',
      msg_id: 'msg-1',
      data: 'Final answer from Gemini',
    });
    service.handleAgentMessage({ conversation_id: 'conv-1', type: 'finish', msg_id: 'msg-1', data: '' });

    expect(resolve).toHaveBeenCalledWith('msg-1');
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text',
        content: expect.objectContaining({ content: 'Final answer from Gemini' }),
      }),
      true
    );
  });

  it('waits for ACP continuation after a tool-only finish', async () => {
    const service = createServiceHarness();
    const callback = vi.fn();
    const resolve = vi.fn();
    const reject = vi.fn();

    service.activeStreams.set('conv-acp', {
      msgId: 'msg-acp',
      callback,
      buffer: '',
      resolve,
      reject,
      turnCount: 0,
      finishCount: 0,
      lastVisibleMessageType: undefined,
      finishTimer: undefined,
    });

    service.handleAgentMessage({ conversation_id: 'conv-acp', type: 'start', msg_id: 'msg-acp', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-acp',
      type: 'acp_tool_call',
      msg_id: 'msg-acp',
      data: { update: { toolCallId: 'tool-acp', status: 'executing' } },
    });
    service.handleAgentMessage({ conversation_id: 'conv-acp', type: 'finish', msg_id: 'msg-acp', data: '' });

    await vi.advanceTimersByTimeAsync(14_000);
    expect(resolve).not.toHaveBeenCalled();

    service.handleAgentMessage({ conversation_id: 'conv-acp', type: 'start', msg_id: 'msg-acp', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-acp',
      type: 'content',
      msg_id: 'msg-acp',
      data: 'Final answer from ACP',
    });
    service.handleAgentMessage({ conversation_id: 'conv-acp', type: 'finish', msg_id: 'msg-acp', data: '' });

    expect(resolve).toHaveBeenCalledWith('msg-acp');
  });

  it('waits for Codex continuation after a tool-only finish', async () => {
    const service = createServiceHarness();
    const callback = vi.fn();
    const resolve = vi.fn();
    const reject = vi.fn();

    service.activeStreams.set('conv-codex', {
      msgId: 'msg-codex',
      callback,
      buffer: '',
      resolve,
      reject,
      turnCount: 0,
      finishCount: 0,
      lastVisibleMessageType: undefined,
      finishTimer: undefined,
    });

    service.handleAgentMessage({ conversation_id: 'conv-codex', type: 'start', msg_id: 'msg-codex', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-codex',
      type: 'codex_tool_call',
      msg_id: 'msg-codex',
      data: { toolCallId: 'tool-codex', status: 'executing', kind: 'execute' },
    });
    service.handleAgentMessage({ conversation_id: 'conv-codex', type: 'finish', msg_id: 'msg-codex', data: '' });

    await vi.advanceTimersByTimeAsync(14_000);
    expect(resolve).not.toHaveBeenCalled();

    service.handleAgentMessage({ conversation_id: 'conv-codex', type: 'start', msg_id: 'msg-codex', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-codex',
      type: 'content',
      msg_id: 'msg-codex',
      data: 'Final answer from Codex',
    });
    service.handleAgentMessage({ conversation_id: 'conv-codex', type: 'finish', msg_id: 'msg-codex', data: '' });

    expect(resolve).toHaveBeenCalledWith('msg-codex');
  });

  it('resolves a tool-only stream after the continuation wait expires', async () => {
    const service = createServiceHarness();
    const callback = vi.fn();
    const resolve = vi.fn();
    const reject = vi.fn();

    service.activeStreams.set('conv-timeout', {
      msgId: 'msg-timeout',
      callback,
      buffer: '',
      resolve,
      reject,
      turnCount: 0,
      finishCount: 0,
      lastVisibleMessageType: undefined,
      finishTimer: undefined,
    });

    service.handleAgentMessage({ conversation_id: 'conv-timeout', type: 'start', msg_id: 'msg-timeout', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-timeout',
      type: 'plan',
      msg_id: 'msg-timeout',
      data: { sessionId: 'session-1', entries: [] },
    });
    service.handleAgentMessage({ conversation_id: 'conv-timeout', type: 'finish', msg_id: 'msg-timeout', data: '' });

    await vi.advanceTimersByTimeAsync(14_999);
    expect(resolve).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolve).toHaveBeenCalledWith('msg-timeout');
  });

  it('waits for continuation when a tool-only turn also emits thinking', async () => {
    const service = createServiceHarness();
    const callback = vi.fn();
    const resolve = vi.fn();
    const reject = vi.fn();

    service.activeStreams.set('conv-thinking', {
      msgId: 'msg-thinking',
      callback,
      buffer: '',
      resolve,
      reject,
      turnCount: 0,
      finishCount: 0,
      lastVisibleMessageType: undefined,
      finishTimer: undefined,
    });

    service.handleAgentMessage({ conversation_id: 'conv-thinking', type: 'start', msg_id: 'msg-thinking', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-thinking',
      type: 'thinking',
      msg_id: 'thinking-1',
      data: { content: 'checking files', status: 'thinking' },
    });
    service.handleAgentMessage({
      conversation_id: 'conv-thinking',
      type: 'acp_tool_call',
      msg_id: 'msg-thinking',
      data: { update: { toolCallId: 'tool-thinking', status: 'executing' } },
    });
    service.handleAgentMessage({ conversation_id: 'conv-thinking', type: 'finish', msg_id: 'msg-thinking', data: '' });

    await vi.advanceTimersByTimeAsync(14_000);
    expect(resolve).not.toHaveBeenCalled();

    service.handleAgentMessage({ conversation_id: 'conv-thinking', type: 'start', msg_id: 'msg-thinking', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-thinking',
      type: 'content',
      msg_id: 'msg-thinking',
      data: 'Final answer after thinking',
    });
    service.handleAgentMessage({ conversation_id: 'conv-thinking', type: 'finish', msg_id: 'msg-thinking', data: '' });

    expect(resolve).toHaveBeenCalledWith('msg-thinking');
  });

  it('still resolves immediately for plain text responses', () => {
    const service = createServiceHarness();
    const callback = vi.fn();
    const resolve = vi.fn();
    const reject = vi.fn();

    service.activeStreams.set('conv-2', {
      msgId: 'msg-2',
      callback,
      buffer: '',
      resolve,
      reject,
      turnCount: 0,
      finishCount: 0,
      lastVisibleMessageType: undefined,
      finishTimer: undefined,
    });

    service.handleAgentMessage({ conversation_id: 'conv-2', type: 'start', msg_id: 'msg-2', data: '' });
    service.handleAgentMessage({
      conversation_id: 'conv-2',
      type: 'content',
      msg_id: 'msg-2',
      data: 'Plain reply',
    });
    service.handleAgentMessage({ conversation_id: 'conv-2', type: 'finish', msg_id: 'msg-2', data: '' });

    expect(resolve).toHaveBeenCalledWith('msg-2');
  });

  it('serializes sends and waits for the actual prior turn to finish', async () => {
    const service = createServiceHarness();

    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'gemini', source: 'telegram' } }),
    } as unknown as Awaited<ReturnType<typeof databaseModule.getDatabase>>);

    const sendTaskMessage = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(workerTaskManager, 'getOrBuildTask').mockResolvedValue({
      type: 'gemini',
      sendMessage: sendTaskMessage,
    } as unknown as Awaited<ReturnType<typeof workerTaskManager.getOrBuildTask>>);

    const first = service.sendMessage('session-1', 'conv-3', 'first', vi.fn());
    await flushMicrotasks();
    const firstMsgId = sendTaskMessage.mock.calls[0][0].msg_id as string;

    const second = service.sendMessage('session-1', 'conv-3', 'second', vi.fn());
    await flushMicrotasks();
    expect(sendTaskMessage).toHaveBeenCalledTimes(1);

    service.handleAgentMessage({ conversation_id: 'conv-3', type: 'start', msg_id: firstMsgId, data: '' });
    service.handleAgentMessage({ conversation_id: 'conv-3', type: 'content', msg_id: firstMsgId, data: 'one' });
    service.handleAgentMessage({ conversation_id: 'conv-3', type: 'finish', msg_id: firstMsgId, data: '' });
    await expect(first).resolves.toBe(firstMsgId);
    await flushMicrotasks();

    expect(sendTaskMessage).toHaveBeenCalledTimes(2);
    const secondMsgId = sendTaskMessage.mock.calls[1][0].msg_id as string;
    service.handleAgentMessage({ conversation_id: 'conv-3', type: 'start', msg_id: secondMsgId, data: '' });
    service.handleAgentMessage({ conversation_id: 'conv-3', type: 'content', msg_id: secondMsgId, data: 'two' });
    service.handleAgentMessage({ conversation_id: 'conv-3', type: 'finish', msg_id: secondMsgId, data: '' });
    await expect(second).resolves.toBe(secondMsgId);
  });

  it('times out a lone stuck send, releases the queue, and terminates its task', async () => {
    const service = createServiceHarness();
    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'gemini', source: 'telegram' } }),
    } as unknown as Awaited<ReturnType<typeof databaseModule.getDatabase>>);
    const task = {
      type: 'gemini',
      sendMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as Awaited<ReturnType<typeof workerTaskManager.getOrBuildTask>>;
    vi.spyOn(workerTaskManager, 'getOrBuildTask').mockResolvedValue(task);
    const killTask = vi.spyOn(workerTaskManager, 'killTask').mockResolvedValue(undefined);
    const onStream = vi.fn();

    const send = service.sendMessage('session-1', 'conv-timeout', 'hello', onStream);
    const rejected = expect(send).rejects.toThrow(/timed out after 120 seconds/);
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(120_000);

    await rejected;
    expect(killTask).toHaveBeenCalledWith('conv-timeout', task);
    expect(service.activeStreams.has('conv-timeout')).toBe(false);
    expect(onStream).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ content: expect.stringContaining('120 seconds') }),
      }),
      true
    );
  });

  it('ignores a late terminal frame from a timed-out turn', async () => {
    const service = createServiceHarness();
    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'gemini', source: 'telegram' } }),
    } as unknown as Awaited<ReturnType<typeof databaseModule.getDatabase>>);
    const sendTaskMessage = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(workerTaskManager, 'getOrBuildTask').mockResolvedValue({
      type: 'gemini',
      sendMessage: sendTaskMessage,
    } as unknown as Awaited<ReturnType<typeof workerTaskManager.getOrBuildTask>>);
    vi.spyOn(workerTaskManager, 'killTask').mockResolvedValue(undefined);

    const first = service.sendMessage('session-1', 'conv-late', 'first', vi.fn());
    const firstRejected = expect(first).rejects.toThrow(/timed out/);
    await flushMicrotasks();
    const firstMsgId = sendTaskMessage.mock.calls[0][0].msg_id as string;
    await vi.advanceTimersByTimeAsync(120_000);
    await firstRejected;

    const second = service.sendMessage('session-1', 'conv-late', 'second', vi.fn());
    await flushMicrotasks();
    const secondMsgId = sendTaskMessage.mock.calls[1][0].msg_id as string;

    service.handleAgentMessage({ conversation_id: 'conv-late', type: 'finish', msg_id: firstMsgId, data: '' });
    expect(service.activeStreams.get('conv-late')?.msgId).toBe(secondMsgId);

    service.handleAgentMessage({ conversation_id: 'conv-late', type: 'start', msg_id: secondMsgId, data: '' });
    service.handleAgentMessage({ conversation_id: 'conv-late', type: 'content', msg_id: secondMsgId, data: 'reply' });
    service.handleAgentMessage({ conversation_id: 'conv-late', type: 'finish', msg_id: secondMsgId, data: '' });
    await expect(second).resolves.toBe(secondMsgId);
  });

  it('cleans up only its own late-built task and preserves a newer worker', async () => {
    const service = createServiceHarness();
    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'gemini', source: 'telegram' } }),
    } as unknown as Awaited<ReturnType<typeof databaseModule.getDatabase>>);
    let resolveOld: ((task: Awaited<ReturnType<typeof workerTaskManager.getOrBuildTask>>) => void) | undefined;
    const oldTask = { type: 'gemini', sendMessage: vi.fn() } as unknown as Awaited<
      ReturnType<typeof workerTaskManager.getOrBuildTask>
    >;
    const newSend = vi.fn().mockResolvedValue(undefined);
    const newTask = {
      type: 'gemini',
      sendMessage: newSend,
    } as unknown as Awaited<ReturnType<typeof workerTaskManager.getOrBuildTask>>;
    vi.spyOn(workerTaskManager, 'getOrBuildTask')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          })
      )
      .mockResolvedValueOnce(newTask);
    const killTask = vi.spyOn(workerTaskManager, 'killTask').mockResolvedValue(undefined);
    const killAll = vi.spyOn(workerTaskManager, 'kill');

    const first = service.sendMessage('session-1', 'conv-owned', 'first', vi.fn());
    const firstRejected = expect(first).rejects.toThrow(/timed out/);
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(120_000);
    await firstRejected;

    const second = service.sendMessage('session-1', 'conv-owned', 'second', vi.fn());
    await flushMicrotasks();
    const secondMsgId = newSend.mock.calls[0][0].msg_id as string;

    resolveOld?.(oldTask);
    await flushMicrotasks();
    expect(killTask).toHaveBeenCalledWith('conv-owned', oldTask);
    expect(killTask).not.toHaveBeenCalledWith('conv-owned', newTask);
    expect(killAll).not.toHaveBeenCalled();

    service.handleAgentMessage({ conversation_id: 'conv-owned', type: 'start', msg_id: secondMsgId, data: '' });
    service.handleAgentMessage({ conversation_id: 'conv-owned', type: 'content', msg_id: secondMsgId, data: 'reply' });
    service.handleAgentMessage({ conversation_id: 'conv-owned', type: 'finish', msg_id: secondMsgId, data: '' });
    await expect(second).resolves.toBe(secondMsgId);
  });

  it('includes queue waiting in each send deadline', async () => {
    const service = createServiceHarness();
    vi.spyOn(databaseModule, 'getDatabase').mockResolvedValue({
      getConversation: () => ({ success: true, data: { type: 'gemini', source: 'telegram' } }),
    } as unknown as Awaited<ReturnType<typeof databaseModule.getDatabase>>);
    const task = {
      type: 'gemini',
      sendMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as Awaited<ReturnType<typeof workerTaskManager.getOrBuildTask>>;
    vi.spyOn(workerTaskManager, 'getOrBuildTask').mockResolvedValue(task);
    vi.spyOn(workerTaskManager, 'killTask').mockResolvedValue(undefined);
    const secondStream = vi.fn();

    const first = service.sendMessage('session-1', 'conv-queue-deadline', 'first', vi.fn());
    const second = service.sendMessage('session-1', 'conv-queue-deadline', 'second', secondStream);
    const firstRejected = expect(first).rejects.toThrow(/timed out/);
    const secondRejected = expect(second).rejects.toThrow(/timed out.*queued/);
    await flushMicrotasks();

    await vi.advanceTimersByTimeAsync(120_000);
    await Promise.all([firstRejected, secondRejected]);

    expect(task.sendMessage).toHaveBeenCalledTimes(1);
    expect(secondStream).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ content: expect.stringContaining('while queued') }),
      }),
      true
    );
  });
});
