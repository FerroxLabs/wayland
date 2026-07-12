/**
 * GAP-7: WCoreManager Buffered Stream DB Writes - Black-box tests
 *
 * Tests based on GAP-7-plan.md acceptance criteria.
 * Validates that WCoreManager batches streaming text writes to DB
 * with a 120ms flush interval instead of writing per-chunk.
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

/**
 * #671 gate wiring (WCore): in a trusted ("cowork") workspace the manager
 * auto-approves only the 'edit' confirmation type and STILL prompts on
 * exec/mcp/question AND the 'info' catch-all (engine bucket that can carry
 * network confirmations); untrusted ("chat") prompts on everything.
 */
const { isWorkspaceTrusted: trustSeam } = vi.hoisted(() => ({
  isWorkspaceTrusted: vi.fn<(ws: string | undefined | null) => boolean>(),
}));
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted: trustSeam }));

type TryAutoApprove = (content: { callId: string; status?: string; confirmationDetails?: { type: string } }) => boolean;

function makeTrustManager(workspace: string) {
  const mgr = Object.create(WCoreManager.prototype) as InstanceType<typeof WCoreManager>;
  (mgr as unknown as { workspace: string }).workspace = workspace;
  (mgr as unknown as { currentMode: string }).currentMode = 'default';
  const approveTool = vi.fn();
  (mgr as unknown as { agent: { approveTool: typeof approveTool } }).agent = { approveTool };
  return { mgr, approveTool };
}

describe('WCoreManager trusted-workspace gate (#671)', () => {
  beforeEach(() => {
    trustSeam.mockReset();
  });

  it('auto-approves edit in a trusted workspace', () => {
    const { mgr, approveTool } = makeTrustManager('/trusted/ws');
    trustSeam.mockReturnValue(true);
    const ok = (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
      callId: 'call-e',
      confirmationDetails: { type: 'edit' },
    });
    expect(ok).toBe(true);
    expect(approveTool).toHaveBeenCalledWith('call-e', 'once');
  });

  it("STILL prompts on exec/mcp/question AND the 'info' catch-all when trusted", () => {
    for (const type of ['exec', 'mcp', 'question', 'info']) {
      const { mgr, approveTool } = makeTrustManager('/trusted/ws');
      trustSeam.mockReturnValue(true);
      const ok = (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
        callId: `call-${type}`,
        confirmationDetails: { type },
      });
      expect(ok, `type=${type} must not auto-approve`).toBe(false);
      expect(approveTool, `type=${type} must not approve`).not.toHaveBeenCalled();
    }
  });

  it('prompts on edit when the workspace is NOT trusted (chat)', () => {
    const { mgr, approveTool } = makeTrustManager('/gated/ws');
    trustSeam.mockReturnValue(false);
    const ok = (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
      callId: 'call-x',
      confirmationDetails: { type: 'edit' },
    });
    expect(ok).toBe(false);
    expect(approveTool).not.toHaveBeenCalled();
  });

  it('reads THIS workspace (passes its own workspace to the trust check)', () => {
    const { mgr } = makeTrustManager('/specific/wcore/ws');
    trustSeam.mockReturnValue(false);
    (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
      callId: 'c',
      confirmationDetails: { type: 'edit' },
    });
    expect(trustSeam).toHaveBeenCalledWith('/specific/wcore/ws');
  });
});
