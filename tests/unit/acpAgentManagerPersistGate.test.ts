/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * The REAL AcpAgentManager must be able to switch model / config option for the
 * LIVE session without touching the conversation row.
 *
 * `resolveConversationForJob` gates `extra.currentModelId` for a chat the user
 * owns, but `setModel -> saveModelId` wrote that exact field straight back, and
 * `setConfigOption -> saveConfigOptions` did the same for
 * `extra.cachedConfigOptions`. Both existing cron suites missed it because their
 * task mock exposes neither method - so this asserts against the real class.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockUpdateConversation, mockGetConversation } = vi.hoisted(() => ({
  mockUpdateConversation: vi.fn(),
  mockGetConversation: vi.fn(),
}));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: vi.fn(async () => undefined), set: vi.fn(async () => {}) },
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
  channelEventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn(), emitAgentMessage: vi.fn() },
}));
vi.mock('@process/utils/previewUtils', () => ({ handlePreviewOpenEvent: vi.fn() }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getAll: vi.fn(() => []), getAcpAdapters: vi.fn(() => []) })) },
}));
vi.mock('@process/agent/acp', () => ({
  AcpAgent: class {
    sendMessage = vi.fn();
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
    kill() {
      return Promise.resolve();
    }
  },
}));
vi.mock('@process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: { getInstance: () => ({ notifyPotentialCompletion: vi.fn() }) },
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

const USER_MODEL = 'gpt-5-user-pick';
const JOB_MODEL = 'gpt-5-job-pick';

function makeManager(conversationId = 'conv-acp') {
  const manager = new AcpAgentManager({
    conversation_id: conversationId,
    // codex is early-persist eligible (not claude), which is the branch that
    // wrote the row before the live set_model round-trip even happened.
    backend: 'codex' as AcpBackend,
    workspace: '/tmp/workspace',
  });
  const mockAgent = {
    setModelByConfigOption: vi.fn(async (id: string) => ({
      source: 'models',
      sourceDetail: 'live',
      currentModelId: id,
      currentModelLabel: id,
      canSwitch: true,
      availableModels: [{ id, label: id }],
    })),
    setConfigOption: vi.fn(async (id: string, value: string) => [{ id, currentValue: value, selectedValue: value }]),
    getModelInfo: vi.fn(() => ({
      source: 'models',
      sourceDetail: 'live',
      currentModelId: USER_MODEL,
      currentModelLabel: USER_MODEL,
      canSwitch: true,
      availableModels: [
        { id: USER_MODEL, label: USER_MODEL },
        { id: JOB_MODEL, label: JOB_MODEL },
      ],
    })),
    kill: vi.fn(async () => {}),
  };
  const self = manager as unknown as Record<string, unknown>;
  self.agent = mockAgent;
  self.bootstrap = Promise.resolve(mockAgent);
  // Keep the switch on the cheap in-place path: no Flux routing boundary.
  self.computeFluxRouting = async () => ({ routing: 'unknown' });
  self.lastRouting = 'unknown';
  return { manager, mockAgent };
}

/** Row writes that actually landed on the conversation record. */
function extraWrites() {
  return mockUpdateConversation.mock.calls.map(([, patch]) => (patch as { extra?: Record<string, unknown> }).extra);
}

describe('AcpAgentManager honours persist:false on the borrowed-session doors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversation.mockReturnValue({
      success: true,
      data: { id: 'conv-acp', type: 'acp', extra: { currentModelId: USER_MODEL, backend: 'codex' } },
    });
  });

  it('setModel persists the model id by default (the user-driven path is unchanged)', async () => {
    const { manager } = makeManager();

    await manager.setModel(JOB_MODEL);

    expect(extraWrites().some((extra) => extra?.currentModelId === JOB_MODEL)).toBe(true);
  });

  it('setModel with persist:false never writes currentModelId onto the row', async () => {
    const { manager, mockAgent } = makeManager();

    await manager.setModel(JOB_MODEL, { persist: false });

    // The LIVE session still switched - the scheduled run needs its own model.
    expect(mockAgent.setModelByConfigOption).toHaveBeenCalledWith(JOB_MODEL);
    expect((manager as unknown as { persistedModelId: string }).persistedModelId).toBe(JOB_MODEL);
    // ...but the user's chat row is untouched.
    expect(mockUpdateConversation).not.toHaveBeenCalled();
  });

  it('setConfigOption persists cachedConfigOptions by default', async () => {
    const { manager } = makeManager();

    await manager.setConfigOption('effort', 'high');
    await Promise.resolve();

    expect(extraWrites().some((extra) => Array.isArray(extra?.cachedConfigOptions))).toBe(true);
  });

  it('setConfigOption with persist:false never writes cachedConfigOptions onto the row', async () => {
    const { manager, mockAgent } = makeManager();

    const updated = await manager.setConfigOption('effort', 'high', { persist: false });
    await Promise.resolve();

    expect(mockAgent.setConfigOption).toHaveBeenCalledWith('effort', 'high');
    expect(updated).toHaveLength(1);
    expect(mockUpdateConversation).not.toHaveBeenCalled();
  });
});
