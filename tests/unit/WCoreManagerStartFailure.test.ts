/**
 * WCoreManager bootstrap-failure honesty - unit test (bug S2)
 *
 * Regression guard: when the agent bootstrap (`start()`) fails (missing/old
 * wcore binary, auth failure, bad model config), the held turn must surface a
 * real error + finish instead of silently hanging with no reply, no error, and
 * no finish (the old `this.start().catch(() => {})` swallow left `this.agent`
 * null, so `sendMessage`'s `if (this.agent)` send was skipped and the turn
 * spun forever).
 *
 * Mirrors WCoreManagerProcessExit.test.ts's mock setup.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const { emitResponseStream, mockDb, mockMainError, agentStart } = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockMainError: vi.fn(),
  // Default: succeeds. Individual tests override to reject.
  agentStart: vi.fn().mockResolvedValue(undefined),
}));

// ── Module mocks ───────────────────────────────────────────────────

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
    cron: {
      onJobCreated: { emit: vi.fn() },
      onJobRemoved: { emit: vi.fn() },
    },
    cost: {
      budgetGateBlocked: { emit: vi.fn() },
    },
  },
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
  ProcessConfig: { get: vi.fn(() => Promise.resolve(false)) },
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
  mainError: mockMainError,
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

vi.mock('@process/agent/wcore', () => ({
  // Use a plain function (not vi.fn) so test-level mock clearing/resetting can
  // never strip the constructor implementation (which previously produced
  // "WCoreAgent is not a constructor").
  WCoreAgent: function WCoreAgentMock(this: Record<string, unknown>) {
    this.start = agentStart;
    this.stop = vi.fn();
    this.kill = vi.fn();
    this.send = vi.fn().mockResolvedValue(undefined);
    this.approveTool = vi.fn();
    this.denyTool = vi.fn();
    this.setConfig = vi.fn();
    this.setMode = vi.fn();
    this.sendCommand = vi.fn();
    this.ping = vi.fn();
    this.isAlive = true;
    this.capabilities = null;
    this.injectConversationHistory = vi.fn().mockResolvedValue(undefined);
  },
}));

// Per-turn skill context helpers are best-effort and not under test here.
vi.mock('@/process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => ({ advert: undefined, autoLoaded: [] })),
  consumePendingSessionSkills: vi.fn(async () => undefined),
  mergeLoadedSkillsExtra: vi.fn(async () => {}),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';

// ── Helpers ────────────────────────────────────────────────────────

function createManager(conversationId = 'conv-sf-1'): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as Record<string, unknown>, data.model as Record<string, unknown>);
}

function findEmissions(type: string) {
  return emitResponseStream.mock.calls
    .filter(([e]: [{ type: string }]) => e.type === type)
    .map(([e]: [Record<string, unknown>]) => e);
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WCoreManager bootstrap failure surfaces error + finish (S2)', () => {
  beforeEach(() => {
    emitResponseStream.mockClear();
    mockMainError.mockClear();
    agentStart.mockReset();
    agentStart.mockResolvedValue(undefined);
  });

  it('emits error then finish when start() fails, instead of hanging the turn', async () => {
    agentStart.mockRejectedValue(new Error('wcore binary not found'));
    const manager = createManager();

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-1' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ type: 'error', conversation_id: 'conv-sf-1', msg_id: 'msg-sf-1' });
    expect(String(errors[0].data)).toContain('wcore binary not found');

    const finishes = findEmissions('finish');
    expect(finishes).toHaveLength(1);
    expect(finishes[0]).toMatchObject({ type: 'finish', conversation_id: 'conv-sf-1' });

    // The send must NOT have proceeded against a null agent.
    expect((manager as unknown as { agent: unknown }).agent).toBeNull();
  });

  it('logs the bootstrap failure (no longer silently swallowed)', async () => {
    agentStart.mockRejectedValue(new Error('auth failed'));
    const manager = createManager('conv-sf-2');

    await manager.sendMessage({ content: 'hi', msg_id: 'msg-sf-2' });

    expect(mockMainError).toHaveBeenCalled();
  });

  it('does NOT emit a start-failure error/finish when start() succeeds (happy path preserved)', async () => {
    agentStart.mockResolvedValue(undefined);
    const manager = createManager('conv-sf-3');

    await manager.sendMessage({ content: 'normal turn', msg_id: 'msg-sf-3' });

    // No bootstrap-failure error frame should be emitted on success.
    const failureErrors = findEmissions('error').filter((e) => String(e.data).startsWith('Agent failed to start'));
    expect(failureErrors).toHaveLength(0);
    expect((manager as unknown as { agent: unknown }).agent).not.toBeNull();
  });
});
