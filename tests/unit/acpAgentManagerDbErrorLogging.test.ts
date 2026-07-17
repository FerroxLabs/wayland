/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpAgentManager DB-error honesty - unit tests (bug S6)
 *
 * 1. The `updateConversation` "touch for list sort" in sendMessage used to
 *    `catch {}` ALL DB errors with zero logging, silently eating real failures
 *    (corruption, disk-full). It must now log via mainWarn while still
 *    degrading gracefully (the turn proceeds).
 * 2. A transactional model switch must not mark a model confirmed when its DB
 *    commit fails. The prior confirmed model stays active and setModel returns
 *    a structured failure rather than leaking an unhandled rejection.
 *
 * Mirrors acpAgentManagerCronGuard.test.ts's mock setup.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const {
  mockSetProcessing,
  mockIsProcessing,
  mockNotifyCompletion,
  mockMainWarn,
  mockGetConversation,
  mockUpdateConversation,
} = vi.hoisted(() => ({
  mockSetProcessing: vi.fn(),
  mockIsProcessing: vi.fn(() => false),
  mockNotifyCompletion: vi.fn(() => Promise.resolve()),
  mockMainWarn: vi.fn(),
  mockGetConversation: vi.fn(),
  mockUpdateConversation: vi.fn(),
}));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: mockSetProcessing, isProcessing: mockIsProcessing },
}));
vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: mockMainWarn,
  mainError: vi.fn(),
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: vi.fn() },
}));
vi.mock('@/common', () => ({
  ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } },
}));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() =>
    Promise.resolve({ getConversation: mockGetConversation, updateConversation: mockUpdateConversation })
  ),
}));
vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
  nextTickToLocalFinish: vi.fn((cb: () => void) => cb()),
}));
vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emitAgentMessage: vi.fn(),
  },
}));
vi.mock('@process/utils/previewUtils', () => ({ handlePreviewOpenEvent: vi.fn() }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: {
    getInstance: vi.fn(() => ({ getAll: vi.fn(() => []), getAcpAdapters: vi.fn(() => []) })),
  },
}));
vi.mock('@process/agent/acp', () => ({
  AcpAgent: class {
    sendMessage = vi.fn().mockResolvedValue({ success: true });
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
  },
}));

vi.mock('@process/task/BaseAgentManager', () => ({
  default: class {
    conversation_id = '';
    status: string | undefined;
    workspace = '';
    bootstrapping = false;
    yoloMode = false;
    constructor(_type: string, data: Record<string, unknown>, _emitter: unknown) {
      if (data?.conversation_id) this.conversation_id = data.conversation_id as string;
      if (data?.workspace) this.workspace = data.workspace as string;
    }
    isYoloMode() {
      return false;
    }
    addConfirmation() {}
    getConfirmations() {
      return [];
    }
  },
}));

vi.mock('@process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: () => ({ notifyPotentialCompletion: mockNotifyCompletion }),
  },
}));
vi.mock('@process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('@process/task/CronCommandDetector', () => ({ hasCronCommands: vi.fn(() => false) }));
vi.mock('@process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(() => ''),
  processCronInMessage: vi.fn((x: unknown) => x),
}));
vi.mock('@process/task/ThinkTagDetector', () => ({ stripThinkTags: vi.fn((x: unknown) => x) }));
vi.mock('@process/utils/initAgent', () => ({ hasNativeSkillSupport: vi.fn(() => false) }));
vi.mock('@process/task/agentUtils', () => ({
  prepareFirstMessageWithSkillsIndex: vi.fn((x: string) => Promise.resolve({ content: x, loadedSkills: [] })),
}));
vi.mock('@/common/utils', () => ({ parseError: vi.fn((e: unknown) => e), uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(), uuid: vi.fn(() => 'uuid') }));

import AcpAgentManager from '../../src/process/task/AcpAgentManager';
import type { AcpBackend } from '../../src/common/types/acpTypes';

type MockAgent = {
  sendMessage: ReturnType<typeof vi.fn>;
  setModelByConfigOption?: ReturnType<typeof vi.fn>;
  getModelInfo?: ReturnType<typeof vi.fn>;
};

function makeManager(conversationId = 'conv-s6', backend: AcpBackend = 'claude') {
  const manager = new AcpAgentManager({
    conversation_id: conversationId,
    backend,
    workspace: '/tmp/workspace',
  });
  const mockAgent: MockAgent = { sendMessage: vi.fn().mockResolvedValue({ success: true }) };
  (manager as unknown as { agent: MockAgent }).agent = mockAgent;
  (manager as unknown as { bootstrap: Promise<MockAgent> }).bootstrap = Promise.resolve(mockAgent);
  (manager as unknown as { isFirstMessage: boolean }).isFirstMessage = false;
  return { manager, mockAgent };
}

describe('AcpAgentManager DB-error honesty (S6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversation.mockReset();
    mockUpdateConversation.mockReset();
  });

  it('logs (does not silently swallow) a DB error from the updateConversation touch', async () => {
    mockUpdateConversation.mockImplementation(() => {
      throw new Error('database disk image is malformed');
    });
    const { manager } = makeManager('conv-s6-1');

    // Reaches the touch path (msg_id + content + not silent), and must not throw.
    await expect(manager.sendMessage({ content: 'hello', msg_id: 'msg-1' })).resolves.toBeDefined();

    expect(mockMainWarn).toHaveBeenCalledWith(
      '[AcpAgentManager]',
      expect.stringContaining('updateConversation'),
      expect.any(Error)
    );
  });

  it('does NOT log a warning when the DB touch succeeds (happy path preserved)', async () => {
    mockUpdateConversation.mockReturnValue(undefined);
    const { manager } = makeManager('conv-s6-2');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-2' });

    const touchWarnings = mockMainWarn.mock.calls.filter(([, msg]) => String(msg).includes('updateConversation'));
    expect(touchWarnings).toHaveLength(0);
  });

  it('keeps the prior confirmed model when the transactional DB commit fails', async () => {
    const { manager, mockAgent } = makeManager('conv-s6-3', 'qwen' as AcpBackend);
    const modelInfo = {
      currentModelId: 'm1',
      currentModelLabel: 'Model 1',
      availableModels: [{ id: 'm1', label: 'Model 1' }],
      canSwitch: true,
      source: 'models' as const,
      sourceDetail: 'acp-models' as const,
      confirmationSource: 'session-models' as const,
    };
    mockAgent.setModelByConfigOption = vi.fn().mockResolvedValue(modelInfo);
    mockAgent.getModelInfo = vi.fn().mockReturnValue(modelInfo);

    Object.assign(manager as unknown as Record<string, unknown>, {
      persistedModelId: 'm0',
      requestedModelId: 'm0',
      confirmedModelId: 'm0',
      modelSelectionState: 'confirmed',
    });
    vi.spyOn(
      manager as unknown as { computeFluxRouting: () => Promise<{ routing: string }> },
      'computeFluxRouting'
    ).mockResolvedValue({ routing: 'unknown' });
    (manager as unknown as { lastRouting: string }).lastRouting = 'unknown';
    mockGetConversation.mockReturnValue({
      success: true,
      data: { type: 'acp', extra: { currentModelId: 'm0' } },
    });
    mockUpdateConversation.mockReturnValue({ success: false, error: 'persist failed' });

    await expect(manager.setModel('m1')).resolves.toMatchObject({
      ok: false,
      requestedModelId: 'm1',
      previousConfirmedModelId: 'm0',
      code: 'bridge_unavailable',
      message: 'persist failed',
    });
    expect(mockUpdateConversation).toHaveBeenCalledWith(
      'conv-s6-3',
      expect.objectContaining({ extra: expect.objectContaining({ currentModelId: 'm1' }) })
    );
    expect(manager.getModelInfo()).toMatchObject({
      currentModelId: 'm0',
      selectionState: 'blocked',
      requestedModelId: 'm1',
    });
  });
});
