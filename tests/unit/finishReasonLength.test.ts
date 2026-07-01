/**
 * finish_reason: length - Truncation warning surface
 *
 * Covers Worker D scope (BLACKBOARD.md row D): when a wcore turn ends with
 * `finish_reason: 'length'` (or matches the heuristic for wcore ≤0.1.21
 * binaries that don't yet emit finish_reason), WCoreManager must attach
 * `truncatedDueToBudget: true` to the resulting assistant message so the
 * renderer can show a "response truncated" banner instead of an empty bubble.
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
  mockAddOrUpdateMessage,
} = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  emitConfirmationAdd: vi.fn(),
  emitConfirmationUpdate: vi.fn(),
  emitConfirmationRemove: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: true, data: { type: 'wcore', extra: {} } })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockTeamEventBusEmit: vi.fn(),
  mockChannelEmitAgentMessage: vi.fn(),
  mockAddOrUpdateMessage: vi.fn(),
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
  addOrUpdateMessage: mockAddOrUpdateMessage,
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

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: {
    setProcessing: vi.fn(),
    isProcessing: vi.fn(() => false),
  },
}));

vi.mock('@/process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: vi.fn(() => ({
      notifyPotentialCompletion: vi.fn().mockResolvedValue(undefined),
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

const CONV_ID = 'conv-trunc-1';

function createManager(maxTokens?: number): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: CONV_ID,
    maxTokens,
  };
  return new WCoreManager(data as any, data.model as any);
}

function emitEvent(manager: WCoreManager, event: Record<string, unknown>) {
  (manager as any).emit('wcore.message', event);
}

function truncationEmits(): Array<{ data: { content?: string; truncatedDueToBudget?: boolean } }> {
  return emitResponseStream.mock.calls
    .map(([msg]) => msg)
    .filter((m: any) => m?.type === 'content' && typeof m.data === 'object' && m.data?.truncatedDueToBudget === true);
}

// ── Tests ──────────────────────────────────────────────────────────

describe('finish_reason: length - truncation flag plumbing', () => {
  let manager: WCoreManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockDb.getConversation.mockReturnValue({
      success: true,
      data: { type: 'wcore', extra: { workspace: '/test' } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('attaches truncatedDueToBudget=true when finish_reason=length with empty content', async () => {
    manager = createManager();
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
    emitEvent(manager, {
      type: 'finish',
      data: { input_tokens: 100, output_tokens: 60, finish_reason: 'length' },
      msg_id: 'msg-1',
    });

    await vi.advanceTimersByTimeAsync(200);

    const flagged = truncationEmits();
    expect(flagged).toHaveLength(1);
    expect(flagged[0].data.truncatedDueToBudget).toBe(true);

    // Persistence: the same flag landed in the addOrUpdateMessage call so the
    // bubble survives a page refresh.
    const persistedTrunc = mockAddOrUpdateMessage.mock.calls
      .map(([, msg]) => msg)
      .filter((m: any) => m?.type === 'text' && m.content?.truncatedDueToBudget === true);
    expect(persistedTrunc.length).toBeGreaterThanOrEqual(1);
  });

  it('flags truncation when finish_reason=max_turns even with substantial content (#457)', async () => {
    // A MaxTurns stop is continuable but NOT empty/near-budget, so only the
    // explicit finish_reason path can catch it. Once Core emits a distinct
    // 'max_turns' value, the Continue banner must still show.
    manager = createManager(32768);
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-mt' });
    emitEvent(manager, {
      type: 'content',
      data: 'Did step 1 and 2, ran out of turns before step 3.',
      msg_id: 'msg-mt',
    });
    emitEvent(manager, {
      type: 'finish',
      data: { input_tokens: 100, output_tokens: 40, finish_reason: 'max_turns' },
      msg_id: 'msg-mt',
    });

    await vi.advanceTimersByTimeAsync(200);

    const flagged = truncationEmits();
    expect(flagged).toHaveLength(1);
    expect(flagged[0].data.truncatedDueToBudget).toBe(true);
  });

  it('does NOT flag truncation when finish_reason=stop (normal completion)', async () => {
    manager = createManager();
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-2' });
    emitEvent(manager, { type: 'content', data: 'the cat sat on it', msg_id: 'msg-2' });
    emitEvent(manager, {
      type: 'finish',
      data: { input_tokens: 100, output_tokens: 8, finish_reason: 'stop' },
      msg_id: 'msg-2',
    });

    await vi.advanceTimersByTimeAsync(200);

    expect(truncationEmits()).toHaveLength(0);
  });

  it('flags truncation via heuristic when finish_reason missing but output_tokens at budget with empty content', async () => {
    // Simulates wcore ≤0.1.21 binary (no finish_reason in protocol) + Gemini Pro
    // reasoning model: thinking tokens consume the entire 60-token budget,
    // content emitted is the 3-char fragment "the".
    manager = createManager(60);
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-3' });
    emitEvent(manager, { type: 'content', data: 'the', msg_id: 'msg-3' });
    emitEvent(manager, {
      type: 'finish',
      data: { input_tokens: 100, output_tokens: 60 },
      msg_id: 'msg-3',
    });

    await vi.advanceTimersByTimeAsync(200);

    const flagged = truncationEmits();
    expect(flagged).toHaveLength(1);
    expect(flagged[0].data.truncatedDueToBudget).toBe(true);
  });

  it('does NOT fire heuristic when output_tokens are well below budget', async () => {
    manager = createManager(32768);
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-4' });
    emitEvent(manager, { type: 'content', data: '', msg_id: 'msg-4' });
    emitEvent(manager, {
      type: 'finish',
      data: { input_tokens: 100, output_tokens: 50 },
      msg_id: 'msg-4',
    });

    await vi.advanceTimersByTimeAsync(200);

    // Empty content but tokens well below budget → don't blame the budget.
    // Some other failure mode; not our warning to surface.
    expect(truncationEmits()).toHaveLength(0);
  });

  it('does NOT fire heuristic when content is substantial (legitimate near-budget finish)', async () => {
    manager = createManager(60);
    const longContent = 'the cat sat on the mat and watched the sun set over the harbor while ';
    emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-5' });
    emitEvent(manager, { type: 'content', data: longContent, msg_id: 'msg-5' });
    emitEvent(manager, {
      type: 'finish',
      data: { input_tokens: 100, output_tokens: 60 },
      msg_id: 'msg-5',
    });

    await vi.advanceTimersByTimeAsync(200);

    expect(truncationEmits()).toHaveLength(0);
  });
});
