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

// ── Helpers ────────────────────────────────────────────────────────

function createManager(sessionMode: string): WCoreManager {
  const data = {
    workspace: '/test',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: 'conv-1',
    sessionMode,
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
      isAlive: true,
      start: vi.fn(),
      stop: vi.fn(),
      kill: vi.fn(),
      send: vi.fn(),
      denyTool: vi.fn(),
    };

    const result = manager.setMode('auto_edit');
    (manager as unknown as { emit: (event: string, data: unknown) => void }).emit('wcore.message', {
      type: 'config_changed',
      msg_id: '',
      data: { current_mode: 'auto_edit' },
    });
    await result;

    expect(mockSetMode).toHaveBeenCalledWith('auto_edit');
  });

  it('should save mode locally and to DB', async () => {
    const manager = createManager('default');
    (manager as any).agent = {
      approveTool: mockApproveTool,
      setMode: mockSetMode,
      isAlive: true,
      start: vi.fn(),
      stop: vi.fn(),
      kill: vi.fn(),
      send: vi.fn(),
      denyTool: vi.fn(),
    };

    const pending = manager.setMode('yolo');
    (manager as unknown as { emit: (event: string, data: unknown) => void }).emit('wcore.message', {
      type: 'config_changed',
      msg_id: '',
      data: { current_mode: 'force' },
    });
    const result = await pending;

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

function frame(manager: WCoreManager, type: string, data: unknown) {
  (manager as unknown as { emit: (event: string, data: unknown) => void }).emit('wcore.message', {
    type,
    msg_id: '',
    data,
  });
}

describe('Core-confirmed mode changes (#1223)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });
  function live() {
    const manager = createManager('default');
    (manager as unknown as { agent: unknown }).agent = {
      isAlive: true,
      setMode: mockSetMode,
      approveTool: mockApproveTool,
    };
    return manager;
  }

  it('never enables automatic approval while the mode request is still unacknowledged', async () => {
    const manager = live();
    const result = manager.setMode('yolo');
    expect(manager.getMode().mode).toBe('default');
    expect(
      (manager as unknown as { tryAutoApprove: (value: unknown) => boolean }).tryAutoApprove(makeContent('exec'))
    ).toBe(false);
    frame(manager, 'set_mode_refused', { requested: 'force', effective: 'default', reason: 'local_opt_in_required' });
    await expect(result).resolves.toMatchObject({ success: false, data: { mode: 'default' } });
    expect(manager.getMode().mode).toBe('default');
    expect(mockDb.updateConversation).not.toHaveBeenCalled();
    expect(emitResponseStream).toHaveBeenCalledWith(expect.objectContaining({ type: 'set_mode_refused' }));
  });
  it('uses the accepted policy revision as the positive acknowledgement during a running turn', async () => {
    const manager = live();
    const result = manager.setMode('auto_edit');
    frame(manager, 'execution_policy', {
      type: 'execution_policy',
      critical: true,
      contract_version: '1.0',
      revision: 1,
      reason: 'mode_change',
      effective_at_unix_ms: 123,
      policy: {
        posture: 'smart',
        approvals: 'auto_edit',
        sandbox: 'required',
        source: 'desktop_local_launch',
        managed_floor_active: false,
      },
    });
    await expect(result).resolves.toMatchObject({ success: true, data: { mode: 'auto_edit' } });
    expect(manager.getMode().mode).toBe('auto_edit');
    expect(
      (manager as unknown as { tryAutoApprove: (value: unknown) => boolean }).tryAutoApprove(makeContent('edit'))
    ).toBe(true);
    expect(
      (manager as unknown as { tryAutoApprove: (value: unknown) => boolean }).tryAutoApprove(makeContent('exec'))
    ).toBe(false);
  });
  it('does not persist a temporary mode used by a scheduled operation', async () => {
    const manager = live();
    const save = vi
      .spyOn(manager as unknown as { saveSessionMode: (mode: string) => Promise<void> }, 'saveSessionMode')
      .mockResolvedValue();
    const result = manager.setMode('yolo', { persist: false });
    frame(manager, 'config_changed', { current_mode: 'force' });
    await expect(result).resolves.toMatchObject({ success: true, data: { mode: 'yolo' } });
    frame(manager, 'config_changed', { current_mode: 'force' });
    expect(save).not.toHaveBeenCalled();
  });
  it('rejects overlapping requests and times out without changing approval authority', async () => {
    vi.useFakeTimers();
    const manager = live();
    const result = manager.setMode('yolo');
    await expect(manager.setMode('auto_edit')).resolves.toMatchObject({ success: false, data: { mode: 'default' } });
    expect(mockSetMode).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10000);
    await expect(result).resolves.toMatchObject({ success: false, data: { mode: 'default' } });
    expect(manager.getMode().mode).toBe('default');
  });
  it('does not treat an unrelated config receipt as acceptance of the pending request', async () => {
    vi.useFakeTimers();
    const manager = live();
    const result = manager.setMode('yolo');
    let finished = false;
    void result.then(() => {
      finished = true;
    });
    frame(manager, 'config_changed', { current_mode: 'default' });
    await Promise.resolve();
    expect(finished).toBe(false);
    frame(manager, 'set_mode_refused', { requested: 'force', effective: 'default', reason: 'local_opt_in_required' });
    await expect(result).resolves.toMatchObject({ success: false });
  });
  it('persists a requested mode only after Core confirms it', async () => {
    const manager = live();
    const save = vi
      .spyOn(manager as unknown as { saveSessionMode: (mode: string) => Promise<void> }, 'saveSessionMode')
      .mockResolvedValue();
    const result = manager.setMode('yolo');
    expect(save).not.toHaveBeenCalled();
    frame(manager, 'config_changed', { current_mode: 'force' });
    await expect(result).resolves.toMatchObject({ success: true });
    expect(save).toHaveBeenCalledExactlyOnceWith('yolo');
  });
});
