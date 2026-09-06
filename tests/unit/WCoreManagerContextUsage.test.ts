/**
 * GAP-2: WCoreManager Context Usage Persistence - Black-box tests
 *
 * Tests based on GAP-2-plan.md acceptance criteria.
 * Validates that WCoreManager persists token usage from stream_end
 * to the conversation's extra.lastTokenUsage in the database.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CostEventInput, ICostRepository } from '@/process/services/cost/types';
import type { WCoreEvent } from '@/process/agent/wcore/protocol';
import { DesktopCoreV1Consumer } from '@/process/agent/wcore/desktopContractV1';

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  mockDb,
  mockTeamEventBusEmit,
  mockChannelEmitAgentMessage,
  mockRecordTurnFinish,
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
  mockRecordTurnFinish: vi.fn(),
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

vi.mock('@process/services/cost/CostRecorder', () => ({
  getCostRecorder: () => ({ recordTurnFinish: mockRecordTurnFinish }),
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

const CONV_ID = 'conv-cu-1';

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

describe('GAP-2: WCoreManager Context Usage Persistence', () => {
  let manager: WCoreManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordTurnFinish.mockImplementation(() => undefined);
    vi.useFakeTimers();
    mockDb.getConversation.mockReturnValue({
      success: true,
      data: { type: 'wcore', extra: { workspace: '/test' } },
    });
    manager = createManager();
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── AC-1: Valid usage data is persisted ───────────────────────────

  describe('AC-1: Valid TokenUsage is persisted to DB', () => {
    it('saves lastTokenUsage on finish with valid usage data', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'hello', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: 1000, output_tokens: 200 },
        msg_id: 'msg-1',
      });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockDb.updateConversation).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          extra: expect.objectContaining({
            lastTokenUsage: expect.objectContaining({
              totalTokens: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  // ── AC-2: totalTokens = input_tokens + output_tokens ─────────────

  describe('AC-2: totalTokens equals input_tokens + output_tokens', () => {
    it('calculates totalTokens correctly', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: 5000, output_tokens: 800 },
        msg_id: 'msg-1',
      });

      await vi.advanceTimersByTimeAsync(200);

      expect(mockDb.updateConversation).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          extra: expect.objectContaining({
            lastTokenUsage: { totalTokens: 5800 },
          }),
        })
      );
    });

    it('handles usage with cache tokens', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'finish',
        data: {
          input_tokens: 3000,
          output_tokens: 500,
          cache_read_tokens: 1000,
          cache_write_tokens: 200,
        },
        msg_id: 'msg-1',
      });

      await vi.advanceTimersByTimeAsync(200);

      // totalTokens is still input + output, not including cache
      expect(mockDb.updateConversation).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({
          extra: expect.objectContaining({
            lastTokenUsage: { totalTokens: 3500 },
          }),
        })
      );
      expect(mockRecordTurnFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: CONV_ID,
          backend: 'wcore',
          inputTokens: 3000,
          outputTokens: 500,
          cacheReadTokens: 1000,
        })
      );
    });

    it('preserves absent, explicit-zero, and cached-only usage for the cost ledger', async () => {
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: 10, output_tokens: 2 },
        msg_id: 'without-cache',
      });
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: 10, output_tokens: 2, cache_read_tokens: 0 },
        msg_id: 'zero-cache',
      });
      emitEvent(manager, {
        type: 'finish',
        data: { cache_read_tokens: 900 },
        msg_id: 'cached-only',
      });

      const calls = mockRecordTurnFinish.mock.calls.map(([call]) => call);
      expect(calls[0]).not.toHaveProperty('cacheReadTokens');
      expect(calls[1].cacheReadTokens).toBe(0);
      expect(calls[2]).toMatchObject({
        cacheReadTokens: 900,
      });
      expect(calls[2]).not.toHaveProperty('inputTokens');
      expect(calls[2]).not.toHaveProperty('outputTokens');
    });

    it('drops invalid token counts instead of manufacturing cache usage', () => {
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: Number.NaN, output_tokens: -1, cache_read_tokens: Number.POSITIVE_INFINITY },
        msg_id: 'invalid-usage',
      });

      expect(mockRecordTurnFinish).not.toHaveBeenCalled();
    });
  });

  describe('per-run cost and cumulative context remain separate', () => {
    it('records 100 then 200, not cumulative 100 then 300, through decoder/agent/manager/recorder', async () => {
      const { WCoreAgent } = await vi.importActual<typeof import('@/process/agent/wcore')>('@/process/agent/wcore');
      const { CostRecorder } = await vi.importActual<typeof import('@/process/services/cost/CostRecorder')>(
        '@/process/services/cost/CostRecorder'
      );
      const rows: CostEventInput[] = [];
      const repository: ICostRepository = {
        insert: (row) => {
          rows.push(row);
          return rows.length;
        },
        aggregate: () => [],
        series: () => [],
        total: () => ({ costUsd: 0, tokensTotal: 0, events: 0 }),
        prune: () => 0,
      };
      // A deliberate unit price makes double-counting observable in cost_usd.
      const recorder = new CostRecorder(repository, { priceTokens: (_model, tokens) => tokens.input });
      mockRecordTurnFinish.mockImplementation((input) => recorder.recordTurnFinish(input));
      const agent = new WCoreAgent({
        workspace: '/test/workspace',
        model: {} as never,
        onStreamEvent: (event) => emitEvent(manager, { ...event }),
      });
      const consumer = new DesktopCoreV1Consumer();
      consumer.consumeLine(
        readFileSync(
          path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1/events/ready.json'),
          'utf8'
        ).trimEnd()
      );
      const raw = (frame: unknown) => {
        const decoded = consumer.consumeLine(JSON.stringify(frame));
        if (decoded.kind !== 'event') throw new Error('frame rejected');
        (agent as unknown as { handleEvent: (event: WCoreEvent) => void }).handleEvent(decoded.event as WCoreEvent);
      };
      try {
        raw({ type: 'stream_start', msg_id: 'run-one' });
        raw({
          type: 'stream_end',
          msg_id: 'run-one',
          agent_run_id: 'agent-run-one',
          finish_reason: 'stop',
          usage: { input_tokens: 100, output_tokens: 10, cache_read_tokens: 40, cache_write_tokens: 0 },
          usage_delta: { input_tokens: 100, output_tokens: 10, cache_read_tokens: 40, cache_write_tokens: 0 },
        });
        raw({ type: 'stream_start', msg_id: 'run-two' });
        raw({
          type: 'stream_end',
          msg_id: 'run-two',
          agent_run_id: 'agent-run-two',
          finish_reason: 'stop',
          usage: { input_tokens: 300, output_tokens: 30, cache_read_tokens: 90, cache_write_tokens: 5 },
          usage_delta: { input_tokens: 200, output_tokens: 20, cache_read_tokens: 50, cache_write_tokens: 5 },
        });
        await vi.advanceTimersByTimeAsync(0);
        expect(
          rows.map((row) => ({
            input: row.inputTokens,
            output: row.outputTokens,
            cacheRead: row.cacheReadTokens,
            cost: row.costUsd,
          }))
        ).toEqual([
          { input: 100, output: 10, cacheRead: 40, cost: 100 },
          { input: 200, output: 20, cacheRead: 50, cost: 200 },
        ]);
        expect(rows.reduce((sum, row) => sum + row.costUsd, 0)).toBe(300);
        expect(mockDb.updateConversation).toHaveBeenCalledWith(
          CONV_ID,
          expect.objectContaining({ extra: expect.objectContaining({ lastTokenUsage: { totalTokens: 330 } }) })
        );
        const finish = emitResponseStream.mock.calls
          .map(([event]) => event)
          .find((event) => event.type === 'finish' && event.msg_id === 'run-two');
        expect(finish.data).toMatchObject({
          input_tokens: 200,
          output_tokens: 20,
          cache_read_tokens: 50,
          cache_write_tokens: 5,
          agent_run_id: 'agent-run-two',
          usage_delta: { input_tokens: 200, output_tokens: 20, cache_read_tokens: 50, cache_write_tokens: 5 },
          session_usage: { input_tokens: 300, output_tokens: 30, cache_read_tokens: 90, cache_write_tokens: 5 },
        });
      } finally {
        await agent.kill();
      }
    });

    it('keeps missing-delta cumulative context without writing it as a per-run cost', async () => {
      emitEvent(manager, {
        type: 'finish',
        msg_id: 'legacy-session',
        data: { session_usage: { input_tokens: 300, output_tokens: 30 }, finish_reason: 'stop' },
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(mockRecordTurnFinish).not.toHaveBeenCalled();
      expect(mockDb.updateConversation).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({ extra: expect.objectContaining({ lastTokenUsage: { totalTokens: 330 } }) })
      );
    });

    it('does not use a per-run delta as context when the cumulative sibling is missing', async () => {
      emitEvent(manager, {
        type: 'finish',
        msg_id: 'delta-only',
        data: { input_tokens: 20, output_tokens: 2, usage_delta: { input_tokens: 20, output_tokens: 2 } },
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(mockRecordTurnFinish).toHaveBeenCalledWith(expect.objectContaining({ inputTokens: 20, outputTokens: 2 }));
      expect(mockDb.updateConversation.mock.calls.filter(([, value]) => value?.extra?.lastTokenUsage)).toHaveLength(0);
    });
  });

  // ── AC-3: No DB write when usage is absent ───────────────────────

  describe('AC-3: No DB write when usage data is absent', () => {
    it('does not save when finish data is empty string', async () => {
      mockDb.updateConversation.mockClear();

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      // updateConversation may be called for other reasons (e.g. sendMessage),
      // but not with lastTokenUsage
      const usageCalls = mockDb.updateConversation.mock.calls.filter(
        ([, updates]: [string, any]) => updates?.extra?.lastTokenUsage
      );
      expect(usageCalls).toHaveLength(0);
    });

    it('does not save when finish data is undefined', async () => {
      mockDb.updateConversation.mockClear();

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: undefined, msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      const usageCalls = mockDb.updateConversation.mock.calls.filter(
        ([, updates]: [string, any]) => updates?.extra?.lastTokenUsage
      );
      expect(usageCalls).toHaveLength(0);
    });
  });

  // ── AC-4: DB errors are silently caught ──────────────────────────

  describe('AC-4: DB errors are silently caught', () => {
    it('does not throw when getConversation fails', async () => {
      mockDb.getConversation.mockReturnValue({ success: false });

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: 100, output_tokens: 50 },
        msg_id: 'msg-1',
      });

      // Should not throw
      await vi.advanceTimersByTimeAsync(200);
    });

    it('does not throw when updateConversation throws', async () => {
      mockDb.updateConversation.mockImplementation(() => {
        throw new Error('DB write failed');
      });

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'finish',
        data: { input_tokens: 100, output_tokens: 50 },
        msg_id: 'msg-1',
      });

      // Should not throw
      await vi.advanceTimersByTimeAsync(200);
    });
  });

  // ── AC-5: Fallback finish does not save usage ────────────────────

  describe('AC-5: Fallback finish does not save usage', () => {
    it('does not persist usage on fallback timeout (no usage data)', async () => {
      mockDb.updateConversation.mockClear();

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'data', msg_id: 'msg-1' });

      // Trigger fallback (no finish event)
      await vi.advanceTimersByTimeAsync(15_000);

      const usageCalls = mockDb.updateConversation.mock.calls.filter(
        ([, updates]: [string, any]) => updates?.extra?.lastTokenUsage
      );
      expect(usageCalls).toHaveLength(0);
    });
  });
});
