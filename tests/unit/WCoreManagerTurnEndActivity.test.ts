/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-03 - turn end must terminalize the turn's activity card.
 *
 * The engine's `stream_end` becomes an IResponseMessage `finish`, and `finish`
 * is in WCoreManager's `skipTransformTypes`, so no TMessage was ever persisted
 * for the end of a turn. The activity card - the only other completion signal
 * the execution rail has - was therefore pinned 'running' forever, and a turn
 * the assistant had fully answered still reported `lifecycle: 'running'` with an
 * elapsed timer climbing past 4632 seconds.
 *
 * These are black-box tests on the real manager: `@/common/chat/chatLib` is NOT
 * mocked, so the card is built by the production constructors and only the
 * persistence/IPC edges are spied on.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { emitResponseStream, mockDb, mockNotifyPotentialCompletion } = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockNotifyPotentialCompletion: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: emitResponseStream },
      confirmation: {
        add: { emit: vi.fn() },
        update: { emit: vi.fn() },
        remove: { emit: vi.fn() },
      },
    },
    cron: { onJobCreated: { emit: vi.fn() }, onJobRemoved: { emit: vi.fn() } },
  },
}));

vi.mock('@process/team/teamEventBus', () => ({ teamEventBus: { emit: vi.fn() } }));
vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emitAgentMessage: vi.fn() },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: {
      fork: vi.fn(() => ({ on: vi.fn().mockReturnThis(), postMessage: vi.fn(), kill: vi.fn() })),
    },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: vi.fn(() => ({})) }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn(() => Promise.resolve(mockDb)) }));
vi.mock('@process/services/database/export', () => ({ getDatabase: vi.fn(() => Promise.resolve(mockDb)) }));
vi.mock('@process/utils/initStorage', () => ({ ProcessChat: { get: vi.fn(() => Promise.resolve([])) } }));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn(), addOrUpdateMessage: vi.fn() }));
vi.mock('@process/utils/mainLogger', () => ({ mainError: vi.fn(), mainLog: vi.fn(), mainWarn: vi.fn() }));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('@/process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: vi.fn(() => ({ notifyPotentialCompletion: mockNotifyPotentialCompletion })),
  },
}));

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    kill: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    approveTool: vi.fn(),
    denyTool: vi.fn(),
    injectConversationHistory: vi.fn().mockResolvedValue(undefined),
    get bootstrap() {
      return Promise.resolve();
    },
  })),
}));

import type { TMessage } from '@/common/chat/chatLib';
import { addOrUpdateMessage } from '@process/utils/message';
import { WCoreManager } from '@/process/task/WCoreManager';

const CONV_ID = 'conv-k03';

function createManager(conversationId = CONV_ID): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as any, data.model as any);
}

function emitEvent(manager: WCoreManager, event: Record<string, unknown>) {
  (manager as any).emit('wcore.message', event);
}

type ActivityMessage = Extract<TMessage, { type: 'activity' }>;

const persistedActivityCards = (): ActivityMessage[] =>
  (addOrUpdateMessage as unknown as ReturnType<typeof vi.fn>).mock.calls
    .map(([, message]) => message as TMessage)
    .filter((message): message is ActivityMessage => message?.type === 'activity');

describe('K-03: turn end terminalizes the turn activity card', () => {
  let manager: WCoreManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    manager = createManager();
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('persists a settled card keyed to the turn when the stream ends', async () => {
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
    emitEvent(manager, { type: 'content', data: 'answered', msg_id: 'msg-1' });
    emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });
    await vi.advanceTimersByTimeAsync(200);

    const settled = persistedActivityCards().filter((card) => card.content.ended);
    expect(settled).toHaveLength(1);
    expect(settled[0].msg_id).toBe('activity:msg-1');
    expect(settled[0].content).toMatchObject({ turnId: 'msg-1', ended: 'done', status: 'done' });
  });

  it('settles the still-running node a tool_chunk left behind', async () => {
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
    emitEvent(manager, {
      type: 'tool_chunk',
      data: { callId: 'call-1', toolName: 'Bash', chunk: 'hello\n' },
      msg_id: 'msg-1',
    });

    const live = persistedActivityCards();
    expect(live).toHaveLength(1);
    // Nothing in the wcore pipeline ever completes a tool_chunk-born node.
    expect(live[0].content.nodes[0]).toMatchObject({ id: 'call-1', status: 'running' });

    emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });
    await vi.advanceTimersByTimeAsync(200);

    // The delta persists card-level state; the compose merge (covered in
    // activityTree.test.ts) folds it onto the accumulated nodes.
    const settled = persistedActivityCards().filter((card) => card.content.ended);
    expect(settled).toHaveLength(1);
    expect(settled[0].content.ended).toBe('done');
  });

  it('emits the settlement on the response stream so a mounted view updates now', async () => {
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
    emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });
    await vi.advanceTimersByTimeAsync(200);

    const frames = emitResponseStream.mock.calls.map(([frame]: [Record<string, unknown>]) => frame);
    const turnEnd = frames.filter((frame) => frame.type === 'activity_turn_end');
    expect(turnEnd).toHaveLength(1);
    expect(turnEnd[0]).toMatchObject({ conversation_id: CONV_ID, msg_id: 'msg-1', data: { outcome: 'done' } });
  });

  it('settles the card as failed when the engine dies mid-turn', async () => {
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
    emitEvent(manager, { type: 'content', data: 'partial', msg_id: 'msg-1' });

    (manager as Record<string, (...args: unknown[]) => void>)['handleProcessExit'](1, 'msg-1');
    await vi.advanceTimersByTimeAsync(200);

    const settled = persistedActivityCards().filter((card) => card.content.ended);
    expect(settled).toHaveLength(1);
    expect(settled[0].content).toMatchObject({ ended: 'failed', status: 'failed' });
  });

  it('does not invent a card when no turn was ever started', async () => {
    await (manager as any).handleTurnEnd();
    await vi.advanceTimersByTimeAsync(200);

    expect(persistedActivityCards()).toHaveLength(0);
    expect(
      emitResponseStream.mock.calls.filter(([f]: [{ type: string }]) => f.type === 'activity_turn_end')
    ).toHaveLength(0);
  });
});
