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
 * 2. `saveModelId` in the non-flux setModel branch was fire-and-forget
 *    (unawaited) -> a persist failure surfaced as an unhandled rejection and
 *    the model could appear selected without being persisted. It is now
 *    awaited, so a persist failure propagates through setModel.
 *
 * Mirrors acpAgentManagerCronGuard.test.ts's mock setup.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockSetProcessing, mockIsProcessing, mockNotifyCompletion, mockMainWarn, mockUpdateConversation } = vi.hoisted(
  () => ({
    mockSetProcessing: vi.fn(),
    mockIsProcessing: vi.fn(() => false),
    mockNotifyCompletion: vi.fn(() => Promise.resolve()),
    mockMainWarn: vi.fn(),
    mockUpdateConversation: vi.fn(),
  })
);

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
  getDatabase: vi.fn(() => Promise.resolve({ updateConversation: mockUpdateConversation })),
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
};

function makeManager(conversationId = 'conv-s6') {
  const manager = new AcpAgentManager({
    conversation_id: conversationId,
    backend: 'claude' as AcpBackend,
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

  it('awaits saveModelId in the non-flux branch so a persist failure propagates (no unhandled rejection)', async () => {
    const { manager, mockAgent } = makeManager('conv-s6-3');
    mockAgent.setModelByConfigOption = vi.fn().mockResolvedValue({ currentModelId: 'm1', availableModels: [] });

    // Same-routing, non-flux switch so the `await this.saveModelId(...)` line runs.
    vi.spyOn(manager as unknown as { computeFluxRouting: () => Promise<{ routing: string }> }, 'computeFluxRouting')
      .mockResolvedValue({ routing: 'unknown' });
    (manager as unknown as { lastRouting: string }).lastRouting = 'unknown';
    const saveSpy = vi
      .spyOn(manager as unknown as { saveModelId: (id: string) => Promise<void> }, 'saveModelId')
      .mockRejectedValue(new Error('persist failed'));

    await expect(
      (manager as unknown as { setModel: (id: string) => Promise<unknown> }).setModel('m1')
    ).rejects.toThrow('persist failed');
    expect(saveSpy).toHaveBeenCalledWith('m1');
  });
});
