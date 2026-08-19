/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * The `persist: false` gates on setModel/setConfigOption are bypassed by the
 * CLI's own echo.
 *
 * `AcpAgent.setConfigOption` / `setModelByConfigOption` make the backend send a
 * `config_option_update` session notification; the agent turns that into an
 * `acp_model_info` STREAM FRAME, and `handleStreamEvent` wrote
 * `extra.cachedConfigOptions` for every such frame with no gate at all. So a
 * scheduled run borrowing a chat the user owns still overwrote that chat's
 * cached config options - durably, and after the gated call had already
 * returned.
 *
 * Every earlier suite missed this because they drive the manager through its
 * API surface only. These tests drive `handleStreamEvent` with a real frame.
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
const USER_OPTIONS = [{ id: 'effort', currentValue: 'low', selectedValue: 'low' }];
const JOB_OPTIONS = [{ id: 'effort', currentValue: 'high', selectedValue: 'high' }];

function makeManager(conversationId = 'conv-acp') {
  const manager = new AcpAgentManager({
    conversation_id: conversationId,
    backend: 'codex' as AcpBackend,
    workspace: '/tmp/workspace',
  });
  // What the LIVE session reports after the job mutated it - i.e. exactly what
  // the echoed frame carries back.
  const mockAgent = {
    setModelByConfigOption: vi.fn(async (id: string) => ({
      source: 'models',
      sourceDetail: 'live',
      currentModelId: id,
      currentModelLabel: id,
      canSwitch: true,
      availableModels: [{ id, label: id }],
    })),
    setConfigOption: vi.fn(async () => JOB_OPTIONS),
    getConfigOptions: vi.fn(() => JOB_OPTIONS),
    getModelInfo: vi.fn(() => ({
      source: 'models',
      sourceDetail: 'live',
      currentModelId: JOB_MODEL,
      currentModelLabel: JOB_MODEL,
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
  self.computeFluxRouting = async () => ({ routing: 'unknown' });
  self.lastRouting = 'unknown';
  return { manager, mockAgent };
}

/**
 * Feed the manager the frame the ACP agent emits when the backend echoes a
 * `config_option_update` notification (agent/acp/index.ts emitModelInfo()).
 */
function feedModelInfoFrame(manager: AcpAgentManager) {
  (
    manager as unknown as { handleStreamEvent: (msg: Record<string, unknown>, backend: string) => void }
  ).handleStreamEvent(
    {
      type: 'acp_model_info',
      conversation_id: 'conv-acp',
      msg_id: 'frame-1',
      data: {
        source: 'models',
        sourceDetail: 'live',
        currentModelId: JOB_MODEL,
        currentModelLabel: JOB_MODEL,
        canSwitch: true,
        availableModels: [{ id: JOB_MODEL, label: JOB_MODEL }],
      },
    },
    'codex'
  );
}

/** Row writes that actually landed on the conversation record. */
function cachedConfigOptionWrites() {
  return mockUpdateConversation.mock.calls
    .map(([, patch]) => (patch as { extra?: Record<string, unknown> }).extra)
    .filter((extra) => extra && 'cachedConfigOptions' in extra);
}

describe('the acp_model_info echo must not re-open the borrowed-session config door', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversation.mockReturnValue({
      success: true,
      data: {
        id: 'conv-acp',
        type: 'acp',
        extra: { currentModelId: USER_MODEL, backend: 'codex', cachedConfigOptions: USER_OPTIONS },
      },
    });
  });

  it('persists cached config options from the echo on the ordinary user-driven path', async () => {
    const { manager } = makeManager();

    await manager.setConfigOption('effort', 'high');
    feedModelInfoFrame(manager);
    await Promise.resolve();
    await Promise.resolve();

    expect(cachedConfigOptionWrites().length).toBeGreaterThan(0);
  });

  it('setConfigOption persist:false survives the echo the same call provokes', async () => {
    const { manager } = makeManager();

    await manager.setConfigOption('effort', 'high', { persist: false });
    feedModelInfoFrame(manager);
    await Promise.resolve();
    await Promise.resolve();

    expect(cachedConfigOptionWrites()).toEqual([]);
    expect(mockUpdateConversation).not.toHaveBeenCalled();
  });

  it('setModel persist:false survives the echo set_model provokes', async () => {
    const { manager } = makeManager();

    await manager.setModel(JOB_MODEL, { persist: false });
    feedModelInfoFrame(manager);
    await Promise.resolve();
    await Promise.resolve();

    expect(cachedConfigOptionWrites()).toEqual([]);
    expect(mockUpdateConversation).not.toHaveBeenCalled();
  });

  it('a later echo, long after the gated call returned, is still suppressed', async () => {
    const { manager } = makeManager();

    await manager.setConfigOption('effort', 'high', { persist: false });
    await new Promise((r) => setTimeout(r, 10));
    feedModelInfoFrame(manager);
    feedModelInfoFrame(manager);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockUpdateConversation).not.toHaveBeenCalled();
  });
});
