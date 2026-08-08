/**
 * GAP-9: WCoreManager Turn Completion Service - Black-box tests
 *
 * Tests based on GAP-9-plan.md acceptance criteria.
 * Validates that WCoreManager calls ConversationTurnCompletionService
 * on turn completion (normal finish and fallback finish).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  mockDb,
  mockTeamEventBusEmit,
  mockChannelEmitAgentMessage,
  mockNotifyPotentialCompletion,
} = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  emitConfirmationAdd: vi.fn(),
  emitConfirmationUpdate: vi.fn(),
  emitConfirmationRemove: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockTeamEventBusEmit: vi.fn(),
  mockChannelEmitAgentMessage: vi.fn(),
  mockNotifyPotentialCompletion: vi.fn().mockResolvedValue(undefined),
}));

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: emitResponseStream },
      confirmation: {
        add: { emit: emitConfirmationAdd },
        update: { emit: emitConfirmationUpdate },
        remove: { emit: emitConfirmationRemove },
      },
    },
    cron: {
      onJobCreated: { emit: vi.fn() },
      onJobRemoved: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/team/teamEventBus', () => ({
  teamEventBus: { emit: mockTeamEventBusEmit },
}));

vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emitAgentMessage: mockChannelEmitAgentMessage },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: {
      fork: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        postMessage: vi.fn(),
        kill: vi.fn(),
      })),
    },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/services/database/export', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
}));

vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
}));

vi.mock('@/common/utils', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `uuid-${++counter}`) };
});

vi.mock('@/renderer/utils/common', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `pipe-${++counter}`) };
});

vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('./ConversationTurnCompletionService', async () => {
  const actual = await vi.importActual<typeof import('@/process/task/ConversationTurnCompletionService')>(
    '@/process/task/ConversationTurnCompletionService'
  );
  return actual;
});

vi.mock('@/process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: vi.fn(() => ({
      notifyPotentialCompletion: mockNotifyPotentialCompletion,
    })),
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

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';

// ── Helpers ────────────────────────────────────────────────────────

const CONV_ID = 'conv-tc-1';
const FALLBACK_DELAY_MS = 15_000;

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

// ── Tests ──────────────────────────────────────────────────────────

describe('GAP-9: WCoreManager Turn Completion Service', () => {
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

  // ── AC-1: Normal finish calls notifyPotentialCompletion ──────────

  describe('AC-1: Normal finish triggers notifyPotentialCompletion', () => {
    it('calls notifyPotentialCompletion on finish event', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'hello', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      // Allow async handleTurnEnd to complete
      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledTimes(1);
    });

    it('passes correct conversationId', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledWith(CONV_ID, expect.any(Object));
    });

    it('passes correct context fields (status, workspace, backend, pendingConfirmations, modelId)', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'response text', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          status: 'finished',
          workspace: '/test/workspace',
          backend: 'wcore',
          pendingConfirmations: 0,
          modelId: 'test-model',
        })
      );
    });
  });

  // ── AC-2: Process exit calls notifyPotentialCompletion ───────────

  describe('AC-2: Process exit triggers notifyPotentialCompletion', () => {
    it('calls notifyPotentialCompletion on process exit during active turn', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'data', msg_id: 'msg-1' });

      (manager as Record<string, (...args: unknown[]) => void>)['handleProcessExit'](1, 'msg-1');
      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledTimes(1);
    });

    it('process exit passes correct context fields', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'data', msg_id: 'msg-1' });

      (manager as Record<string, (...args: unknown[]) => void>)['handleProcessExit'](1, 'msg-1');
      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          status: 'finished',
          workspace: '/test/workspace',
          backend: 'wcore',
        })
      );
    });
  });

  // ── AC-3: Notification fires even without cron commands ──────────

  describe('AC-3: Notification fires even without cron commands', () => {
    it('notifies when turn content has no cron commands', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'plain text response', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledTimes(1);
    });

    it('notifies when turn has empty content', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledTimes(1);
    });
  });

  // ── AC-4: Notification fires even with cron commands ─────────────

  describe('AC-4: Notification fires even with cron commands', () => {
    it('notifies when turn content includes cron commands', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: '[CRON_LIST]', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockNotifyPotentialCompletion).toHaveBeenCalledTimes(1);
    });
  });

  // ── AC-5: Different conversation IDs propagated correctly ────────

  describe('AC-5: Different conversation IDs work correctly', () => {
    it('uses the correct conversationId for each manager instance', async () => {
      const manager2 = createManager('conv-tc-2');
      vi.spyOn(manager2 as any, 'postMessagePromise').mockResolvedValue(undefined);

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });
      emitEvent(manager2, { type: 'start', data: '', msg_id: 'msg-2' });
      emitEvent(manager2, { type: 'finish', data: '', msg_id: 'msg-2' });

      await vi.advanceTimersByTimeAsync(200);

      const calls = mockNotifyPotentialCompletion.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0]).toBe(CONV_ID);
      expect(calls[1][0]).toBe('conv-tc-2');
    });
  });

  // ── AC-6: An error-only turn ends in a terminal status ───────────
  // A provider error with no content used to leave `status` stuck on 'running'
  // (it was only set to 'finished' on a content/tool_group frame). conversation.get
  // returns task.status, so the renderer kept restoring a stuck "Processing" spinner
  // that locked the composer. `finish` must mark the turn terminal regardless.

  describe('AC-6: error-only turn marks status finished', () => {
    it("sets status to 'finished' after start -> error -> finish with no content", async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'error', data: 'Provider error: 400 tool calling not supported', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: { finish_reason: 'error' }, msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      expect((manager as unknown as { status: string }).status).toBe('finished');
    });
  });
});

/**
 * K-02 / DIA-01: a bootstrap failure must leave a DURABLE record.
 *
 * Live-verified on released Core v0.12.26: the engine refused to start, the
 * main process logged the reason and emitted error+finish on the response
 * stream, and the chat showed the user nothing at all - not the error, not even
 * their own message - indefinitely.
 *
 * The renderer hook handles that sequence correctly when it receives it (see
 * wcoreBootstrapFailureSurfacing.dom.test.tsx). The hole is that a stream emit
 * is delivered once, to whoever is subscribed at that instant, and never
 * replayed - and a bootstrap failure is exactly when nobody reliably is: the
 * turn is sent from the new-chat surface while the renderer is still mounting
 * the conversation view it just navigated to.
 */
describe('K-02: engine bootstrap failure is persisted, not only streamed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes a durable error tip carrying the engine reason', async () => {
    const { addMessage } = (await import('@process/utils/message')) as unknown as {
      addMessage: ReturnType<typeof vi.fn>;
    };
    const manager = createManager('conv-bootstrap-fail');

    (manager as any).emitStartFailure(
      'user-msg-1',
      new Error('wcore refused to start: storage.credentials.backend is set to "plaintext"')
    );

    expect(addMessage).toHaveBeenCalledTimes(1);
    const [conversationId, message] = addMessage.mock.calls[0];
    expect(conversationId).toBe('conv-bootstrap-fail');
    expect(message).toMatchObject({
      conversation_id: 'conv-bootstrap-fail',
      type: 'tips',
      position: 'center',
      content: { type: 'error' },
    });
    // The engine's own reason has to survive to the user, not just "failed".
    expect((message.content as { content: string }).content).toContain('plaintext');
  });

  it('still streams error and finish so a mounted view updates immediately', () => {
    const manager = createManager('conv-bootstrap-fail-2');

    (manager as any).emitStartFailure('user-msg-2', new Error('wcore exited with code 1 during init'));

    const types = emitResponseStream.mock.calls.map(([m]: [{ type: string }]) => m.type);
    expect(types).toEqual(['error', 'finish']);
  });
});
