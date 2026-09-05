/**
 * WCoreManager mode-based auto-approval - unit tests
 *
 * Verifies that tryAutoApprove correctly handles 'auto_edit', 'yolo',
 * and 'default' modes when deciding whether to auto-approve tool
 * confirmations.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  mockDb,
  mockCronService,
  mockApproveTool,
  mockSetMode,
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
  mockCronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', schedule: '* * * * *', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
  mockApproveTool: vi.fn(),
  mockSetMode: vi.fn(),
}));

// ── Mocks ──────────────────────────────────────────────────────────

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
  cronService: mockCronService,
}));

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    kill: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    approveTool: mockApproveTool,
    denyTool: vi.fn(),
    setConfig: vi.fn(),
    setMode: mockSetMode,
    sendCommand: vi.fn(),
    injectConversationHistory: vi.fn().mockResolvedValue(undefined),
    get bootstrap() {
      return Promise.resolve();
    },
  })),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';
import { resolveUnattendedHoldMs } from '@/process/acp/session/unattendedHold';

// ── Helpers ────────────────────────────────────────────────────────

function createManager(
  sessionMode: string,
  automation: { unattendedHoldDeadlineMs?: number; workflowSessionId?: string } = {}
): WCoreManager {
  const data = {
    workspace: '/test',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: 'conv-1',
    sessionMode,
    ...automation,
  };
  const model = data.model as any;
  return new WCoreManager(data as any, model);
}

function makeContent(type: 'edit' | 'info' | 'exec', callId = 'call-1') {
  return {
    callId,
    status: 'Confirming' as const,
    confirmationDetails: { type, title: `${type} action` },
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WCoreManager.tryAutoApprove', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── auto_edit mode ───────────────────────────────────────────────

  describe('auto_edit mode', () => {
    let manager: WCoreManager;

    beforeEach(() => {
      manager = createManager('auto_edit');
      // Ensure agent is set so approveTool can be called
      (manager as any).agent = {
        approveTool: mockApproveTool,
        start: vi.fn(),
        stop: vi.fn(),
        kill: vi.fn(),
        send: vi.fn(),
        denyTool: vi.fn(),
      };
    });

    it('should auto-approve edit tools', () => {
      const content = makeContent('edit');
      const result = (manager as any).tryAutoApprove(content);
      expect(result).toBe(true);
      expect(mockApproveTool).toHaveBeenCalledWith('call-1', 'once');
    });

    it('should auto-approve info tools', () => {
      const content = makeContent('info');
      const result = (manager as any).tryAutoApprove(content);
      expect(result).toBe(true);
      expect(mockApproveTool).toHaveBeenCalledWith('call-1', 'once');
    });

    it('should NOT auto-approve exec tools', () => {
      const content = makeContent('exec');
      const result = (manager as any).tryAutoApprove(content);
      expect(result).toBe(false);
      expect(mockApproveTool).not.toHaveBeenCalled();
    });
  });

  // ── yolo mode ────────────────────────────────────────────────────

  describe('yolo mode', () => {
    let manager: WCoreManager;

    beforeEach(() => {
      manager = createManager('yolo');
      (manager as any).agent = {
        approveTool: mockApproveTool,
        start: vi.fn(),
        stop: vi.fn(),
        kill: vi.fn(),
        send: vi.fn(),
        denyTool: vi.fn(),
      };
    });

    it('should auto-approve all tool types', () => {
      for (const type of ['edit', 'info', 'exec'] as const) {
        mockApproveTool.mockClear();
        const content = makeContent(type, `call-${type}`);
        const result = (manager as any).tryAutoApprove(content);
        expect(result).toBe(true);
        expect(mockApproveTool).toHaveBeenCalledWith(`call-${type}`, 'once');
      }
    });
  });

  // ── default mode ─────────────────────────────────────────────────

  describe('default mode', () => {
    let manager: WCoreManager;

    beforeEach(() => {
      manager = createManager('default');
      (manager as any).agent = {
        approveTool: mockApproveTool,
        start: vi.fn(),
        stop: vi.fn(),
        kill: vi.fn(),
        send: vi.fn(),
        denyTool: vi.fn(),
      };
    });

    it('should NOT auto-approve any tool types', () => {
      for (const type of ['edit', 'info', 'exec'] as const) {
        mockApproveTool.mockClear();
        const content = makeContent(type, `call-${type}`);
        const result = (manager as any).tryAutoApprove(content);
        expect(result).toBe(false);
        expect(mockApproveTool).not.toHaveBeenCalled();
      }
    });
  });
});

// ── setMode notification tests ────────────────────────────────────

describe('WCoreManager.setMode', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send set_mode command to wcore agent', async () => {
    const manager = createManager('default');
    (manager as any).agent = {
      approveTool: mockApproveTool,
      setMode: mockSetMode,
      start: vi.fn(),
      stop: vi.fn(),
      kill: vi.fn(),
      send: vi.fn(),
      denyTool: vi.fn(),
    };

    await manager.setMode('auto_edit');

    expect(mockSetMode).toHaveBeenCalledWith('auto_edit');
  });

  it('should save mode locally and to DB', async () => {
    const manager = createManager('default');
    (manager as any).agent = {
      approveTool: mockApproveTool,
      setMode: mockSetMode,
      start: vi.fn(),
      stop: vi.fn(),
      kill: vi.fn(),
      send: vi.fn(),
      denyTool: vi.fn(),
    };

    const result = await manager.setMode('yolo');

    expect((manager as any).currentMode).toBe('yolo');
    expect(result).toEqual({ success: true, data: { mode: 'yolo' } });
  });

  it('should not throw if agent is null', async () => {
    const manager = createManager('default');
    (manager as any).agent = null;

    await expect(manager.setMode('yolo')).resolves.toEqual({
      success: true,
      data: { mode: 'yolo' },
    });
  });
});

describe('unattended Core approval boundaries', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });
  it.each([{ unattendedHoldDeadlineMs: 60000 }, { workflowSessionId: 'workflow-one' }])(
    'does not infer safe automation from broad tool categories (%j)',
    (automation) => {
      const manager = createManager('auto_edit', automation);
      (manager as unknown as { agent: unknown }).agent = { approveTool: mockApproveTool };
      const approve = (content: unknown) =>
        (manager as unknown as { tryAutoApprove: (value: unknown) => boolean }).tryAutoApprove(content);
      expect(approve({ ...makeContent('info'), name: 'todo' })).toBe(false);
      expect(approve({ ...makeContent('edit'), name: 'notion_api' })).toBe(false);
      expect(approve({ ...makeContent('edit'), name: 'Write' })).toBe(true);
      expect(approve({ ...makeContent('edit'), name: 'Edit' })).toBe(true);
      expect(approve({ callId: 'boundary', name: 'Read', confirmationDetails: { type: 'path_boundary' } })).toBe(false);
    }
  );
  it('denies an unanswered scheduled confirmation at the deadline and removes the card', async () => {
    vi.useFakeTimers();
    const holdDuration = resolveUnattendedHoldMs({ nowMs: Date.now(), nextRunAtMs: Date.now() + 2000 });
    const manager = createManager('auto_edit', { unattendedHoldDeadlineMs: holdDuration });
    const denyTool = vi.fn();
    (manager as unknown as { agent: unknown }).agent = { approveTool: mockApproveTool, denyTool };
    (manager as unknown as { addConfirmation: (value: unknown) => void }).addConfirmation({
      id: 'held',
      callId: 'held',
      title: 'Review',
      options: [{ label: 'Deny', value: 'cancel' }],
    });
    expect(manager.getConfirmations()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(denyTool).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(denyTool).toHaveBeenCalledWith('held', 'Unattended approval deadline expired');
    expect(mockApproveTool).not.toHaveBeenCalled();
    expect(manager.getConfirmations()).toHaveLength(0);
  });
  it('does not expire an interactive confirmation without a deadline', async () => {
    vi.useFakeTimers();
    const manager = createManager('default');
    const denyTool = vi.fn();
    (manager as unknown as { agent: unknown }).agent = { denyTool };
    (manager as unknown as { addConfirmation: (value: unknown) => void }).addConfirmation({
      id: 'interactive',
      callId: 'interactive',
      title: 'Review',
      options: [],
    });
    await vi.advanceTimersByTimeAsync(60000);
    expect(denyTool).not.toHaveBeenCalled();
    expect(manager.getConfirmations()).toHaveLength(1);
  });
  it('contains transport death racing a scheduled denial', async () => {
    vi.useFakeTimers();
    const manager = createManager('auto_edit', { unattendedHoldDeadlineMs: 1000 });
    (manager as unknown as { agent: unknown }).agent = {
      denyTool: vi.fn(() => {
        throw new Error('transport closed');
      }),
    };
    (manager as unknown as { addConfirmation: (value: unknown) => void }).addConfirmation({
      id: 'dying',
      callId: 'dying',
      title: 'Review',
      options: [],
    });
    await expect(vi.advanceTimersByTimeAsync(1000)).resolves.not.toThrow();
    expect(manager.getConfirmations()).toHaveLength(0);
  });
  it('does not let a redelivered prompt renew the unattended hold', async () => {
    vi.useFakeTimers();
    const manager = createManager('auto_edit', { unattendedHoldDeadlineMs: 1000 });
    const denyTool = vi.fn();
    (manager as unknown as { agent: unknown }).agent = { denyTool };
    const add = (value: unknown) =>
      (manager as unknown as { addConfirmation: (value: unknown) => void }).addConfirmation(value);
    add({ id: 'repeat', callId: 'repeat', title: 'Review', options: [] });
    await vi.advanceTimersByTimeAsync(500);
    add({ id: 'repeat', callId: 'repeat', title: 'Updated review', options: [] });
    await vi.advanceTimersByTimeAsync(500);
    expect(denyTool).toHaveBeenCalledExactlyOnceWith('repeat', 'Unattended approval deadline expired');
  });
});
