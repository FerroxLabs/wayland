/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpAgentManager model-switch -> renderer notification (#801)
 *
 * `saveModelId` writes the AUTHORITATIVE model id to the conversation row, and the
 * renderer seeds the context meter from that row (#733) - but only on LOAD. A
 * mid-chat switch therefore wrote the row and told nobody: the meter kept sizing
 * itself from the PREVIOUS model, so switching opus (1M) -> haiku (200K) left a 1M
 * denominator over a 200K window and the user hit the ceiling with no warning.
 *
 * `saveModelId` now pushes an `acp_model_info` to the live renderer.
 *
 * The dangerous way to do that is to emit a FRESH payload: an `acp_model_info`
 * whose `availableModels` is empty reverts the in-chat picker to "Select Model"
 * (#184). So the emit MERGES onto the agent's current info and can only ever change
 * currentModelId/currentModelLabel - never shrink the model list. That is the
 * property these tests pin.
 *
 * Mock setup mirrors acpAgentManagerDbErrorLogging.test.ts.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockEmit, mockUpdateConversation, mockGetConversation } = vi.hoisted(() => ({
  mockEmit: vi.fn(),
  mockUpdateConversation: vi.fn(),
  mockGetConversation: vi.fn(() => ({ success: true, data: { type: 'acp', extra: {} } })),
}));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: vi.fn() },
}));
vi.mock('@/common', () => ({
  ipcBridge: { acpConversation: { responseStream: { emit: mockEmit } } },
}));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() =>
    Promise.resolve({ updateConversation: mockUpdateConversation, getConversation: mockGetConversation })
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
    getInstance: () => ({ notifyPotentialCompletion: vi.fn(() => Promise.resolve()) }),
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
import type { AcpBackend, AcpModelInfo } from '../../src/common/types/acpTypes';

const SLOTS = [
  { id: 'opus', label: 'Opus' },
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'haiku', label: 'Haiku' },
];

function makeManager(modelInfo: AcpModelInfo | null) {
  const manager = new AcpAgentManager({
    conversation_id: 'conv-801',
    backend: 'claude' as AcpBackend,
    workspace: '/tmp/workspace',
  });
  (manager as unknown as { agent: unknown }).agent = {
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
    getModelInfo: vi.fn(() => modelInfo),
  };
  return manager;
}

/** Invoke the private choke point every switch path funnels through. */
async function saveModelId(manager: AcpAgentManager, modelId: string) {
  await (manager as unknown as { saveModelId: (id: string) => Promise<void> }).saveModelId(modelId);
}

function emittedModelInfo(): Array<{ type: string; data: AcpModelInfo }> {
  return mockEmit.mock.calls.map((c) => c[0]).filter((m) => m?.type === 'acp_model_info');
}

describe('AcpAgentManager notifies the renderer when the model changes (#801)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversation.mockReturnValue({ success: true, data: { type: 'acp', extra: {} } });
  });

  const current: AcpModelInfo = {
    currentModelId: 'opus',
    currentModelLabel: 'Opus',
    availableModels: SLOTS,
  } as AcpModelInfo;

  it('pushes the NEW model id to the live renderer, not just the DB row', async () => {
    const manager = makeManager(current);

    await saveModelId(manager, 'haiku');

    const infos = emittedModelInfo();
    expect(infos).toHaveLength(1);
    // The renderer sizes the context meter off THIS field (#733). Before #801 the
    // switch was DB-only, so it kept reporting the previous model's window.
    expect(infos[0].data.currentModelId).toBe('haiku');
    expect(infos[0].data.currentModelLabel).toBe('Haiku');
    expect(infos[0].conversation_id).toBe('conv-801');
  });

  it('MERGES onto the cached info - an emit can never wipe the model picker (#184)', async () => {
    const manager = makeManager(current);

    await saveModelId(manager, 'sonnet');

    const infos = emittedModelInfo();
    expect(infos).toHaveLength(1);
    // The #184 hazard: an acp_model_info with an empty availableModels reverts the
    // in-chat picker to "Select Model". This emit must carry the list through intact.
    expect(infos[0].data.availableModels).toEqual(SLOTS);
    expect(infos[0].data.availableModels.length).toBeGreaterThan(0);
  });

  it('still emits for a model the agent does not list, without inventing a list', async () => {
    const manager = makeManager(current);

    // A Flux routing alias is not in availableModels; the label falls back to the id.
    await saveModelId(manager, 'flux-auto');

    const infos = emittedModelInfo();
    expect(infos[0].data.currentModelId).toBe('flux-auto');
    expect(infos[0].data.currentModelLabel).toBe('flux-auto');
    expect(infos[0].data.availableModels).toEqual(SLOTS);
  });

  it('emits nothing when there is no model info to merge onto', async () => {
    const manager = makeManager(null);

    await saveModelId(manager, 'haiku');

    // Nothing authoritative to merge onto -> stay silent rather than push a payload
    // with an empty model list. The renderer still seeds from the conversation row
    // on its next load (#733).
    expect(emittedModelInfo()).toHaveLength(0);
  });

  // The load-bearing guard. `!info` alone is NOT enough: getModelInfo() has two
  // reachable states that return a non-null info with an EMPTY availableModels -
  // the no-agent/persisted-id branch, and a non-claude bridge whose first snapshot
  // (or 10s timeout fallback) was empty. The renderer's selector adopts an incoming
  // acp_model_info unconditionally, so emitting either one reverts the in-chat
  // picker to "Select Model" (#184) - trading a stale meter for a broken picker.
  it('stays silent rather than emit an EMPTY model list and wipe the picker (#184)', async () => {
    const manager = makeManager({
      currentModelId: 'gpt-5',
      currentModelLabel: 'GPT-5',
      availableModels: [],
    } as unknown as AcpModelInfo);

    await saveModelId(manager, 'gpt-5.1');

    expect(emittedModelInfo()).toHaveLength(0);
  });

  it('still notifies the renderer even if the DB write fails', async () => {
    const manager = makeManager(current);
    mockGetConversation.mockImplementation(() => {
      throw new Error('disk full');
    });

    await saveModelId(manager, 'haiku');

    // The in-memory agent HAS switched; a persist failure must not also leave the
    // meter silently sized to the old model for the rest of the session.
    expect(emittedModelInfo()[0]?.data.currentModelId).toBe('haiku');
  });
});
