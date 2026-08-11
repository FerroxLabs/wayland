/**
 * The turn survived a reclaimed Constitution key ring - and the user is told.
 *
 * Acceptance (d) of the key-ring lane: when bootstrap has to regenerate a key
 * ring it could not unlock, the turn proceeds AND a non-blocking in-thread
 * notice names the cause. Never a modal, never a dead "Retry load" button, and
 * never silence.
 *
 * Mirrors WCoreManagerStartFailure.test.ts's mock setup.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const { emitResponseStream, mockDb, mockMainError, agentStart, mockAddMessage, consumeReclaim } = vi.hoisted(() => ({
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
  mockAddMessage: vi.fn(),
  consumeReclaim: vi.fn(() => null as { archivedPath: string; reclaimedAt: number } | null),
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
    paths: { isPackaged: () => false, getAppPath: () => null, getLogsDir: () => '/test/logs' },
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
  ProcessConfig: {
    get: vi.fn((key: string) => Promise.resolve(key === 'wcore.rawEngineMode' ? false : undefined)),
    remove: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@process/utils/message', () => ({
  addMessage: mockAddMessage,
  addOrUpdateMessage: vi.fn(),
}));

vi.mock('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => ({ consumeRevisionAuthorityReclaim: consumeReclaim }),
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
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';

// ── Helpers ────────────────────────────────────────────────────────

function createManager(conversationId: string): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as Record<string, unknown>, data.model as Record<string, unknown>);
}

function tipsMessages() {
  return mockAddMessage.mock.calls
    .map(([, message]: [string, { type?: string; content?: { type?: string; content?: string } }]) => message)
    .filter((message) => message?.type === 'tips' && String(message.content?.content ?? '').includes('key ring'));
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WCoreManager surfaces a reclaimed Constitution key ring', () => {
  beforeEach(() => {
    emitResponseStream.mockClear();
    mockAddMessage.mockClear();
    mockMainError.mockClear();
    agentStart.mockReset();
    agentStart.mockResolvedValue(undefined);
    consumeReclaim.mockReset();
    consumeReclaim.mockReturnValue(null);
  });

  it('completes the turn and posts a non-blocking in-thread notice naming the cause', async () => {
    consumeReclaim.mockReturnValueOnce({
      archivedPath: '/profile/constitution/revision-authority.enc.locked-20260811T182236Z',
      reclaimedAt: 1_786_000_000_000,
    });
    const manager = createManager('conv-reclaim-1');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-reclaim-1' });

    // The turn went ahead: no bootstrap failure, a live agent.
    expect(findEmissions('error')).toHaveLength(0);
    expect((manager as unknown as { agent: unknown }).agent).not.toBeNull();

    const tips = tipsMessages();
    expect(tips).toHaveLength(1);
    const notice = String(tips[0]?.content?.content ?? '');
    // A human sentence, not a code and not an i18n key path.
    expect(notice).toMatch(/^[A-Z].*\.$/s);
    expect(notice).not.toMatch(/CONSTITUTION_FS_/);
    expect(notice).not.toMatch(/(^|\s)(settings|constitution|conversation)\.[a-zA-Z]/);
    expect(notice).not.toContain('safeStorage');
    expect(notice).not.toContain('\u2014');
    // It names the cause, says what was done, and says where the old file went.
    expect(notice).toContain('could not unlock');
    expect(notice).toContain('different installation');
    expect(notice).toContain('new key ring was created');
    expect(notice).toContain('revision-authority.enc.locked-20260811T182236Z');
    // Non-blocking: an informational tip, not an error frame or a modal.
    expect(tips[0]?.content?.type).toBe('warning');
  });

  it('says nothing at all on a normal turn', async () => {
    const manager = createManager('conv-reclaim-2');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-reclaim-2' });

    expect(tipsMessages()).toHaveLength(0);
  });

  it('reports the reclaim once, not on every later turn', async () => {
    consumeReclaim.mockReturnValueOnce({ archivedPath: '/profile/ring.enc.locked-20260811T182236Z', reclaimedAt: 1 });
    const manager = createManager('conv-reclaim-3');

    await manager.sendMessage({ content: 'one', msg_id: 'msg-reclaim-3a' });
    await manager.sendMessage({ content: 'two', msg_id: 'msg-reclaim-3b' });

    expect(tipsMessages()).toHaveLength(1);
  });

  it('does not post a notice for a turn whose bootstrap failed', async () => {
    consumeReclaim.mockReturnValue({ archivedPath: '/profile/ring.enc.locked-x', reclaimedAt: 1 });
    agentStart.mockRejectedValue(new Error('wcore binary not found'));
    const manager = createManager('conv-reclaim-4');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-reclaim-4' });

    // emitStartFailure posts its own tips message; what must not appear is a
    // "we reclaimed your ring and carried on" notice for a turn that died.
    expect(tipsMessages()).toHaveLength(0);
    expect(findEmissions('error')).toHaveLength(1);
  });
});

function findEmissions(type: string) {
  return emitResponseStream.mock.calls
    .filter(([e]: [{ type: string }]) => e.type === type)
    .map(([e]: [Record<string, unknown>]) => e);
}
