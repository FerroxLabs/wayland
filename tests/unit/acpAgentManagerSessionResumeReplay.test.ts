/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for H9 / upstream aionui-org/AionUi#2887:
 *
 * On ACP session resume (Claude / Codex / Qwen / Goose), `agent.start()` triggers
 * a `session/load` replay that emits historical stream events. Those events
 * MUST NOT reach `transformMessage` → `addOrUpdateMessage`, otherwise they
 * receive fresh client-side UUIDs and are inserted as duplicate SQLite rows.
 *
 * The fix:
 *  1. `bootstrapping` is no longer flipped to `false` at the top of
 *     `sendMessage()`; it is released only after `agent.start()` resolves
 *     inside `initAgent()`.
 *  2. While `bootstrapping === true`, `handleStreamEvent` short-circuits
 *     BEFORE `transformMessage` / `addOrUpdateMessage` are called, with one
 *     allowlist: `agent_status` frames are still emitted to the IPC bus so
 *     UI init progress remains visible.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Hoisted mocks (shared with assertions) ───────────────────────────────────
const { mockAddOrUpdateMessage, mockTransformMessage, mockResponseStreamEmit } = vi.hoisted(() => ({
  mockAddOrUpdateMessage: vi.fn(),
  mockTransformMessage: vi.fn((msg: { type: string; data: unknown; conversation_id: string }) => ({
    type: 'text' as const,
    id: 'fresh-uuid',
    msg_id: 'fresh-uuid',
    position: 'left' as const,
    conversation_id: msg.conversation_id,
    content: { content: String(msg.data ?? '') },
    createdAt: Date.now(),
  })),
  mockResponseStreamEmit: vi.fn(),
}));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: vi.fn() },
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    acpConversation: { responseStream: { emit: mockResponseStreamEmit } },
  },
}));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve({ updateConversation: vi.fn() })),
}));
vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: mockAddOrUpdateMessage,
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
vi.mock('@process/team/teamEventBus', () => ({
  teamEventBus: { emit: vi.fn() },
}));
vi.mock('@process/utils/previewUtils', () => ({ handlePreviewOpenEvent: vi.fn(() => false) }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: {
    getInstance: vi.fn(() => ({ getAll: vi.fn(() => []), getAcpAdapters: vi.fn(() => []) })),
  },
}));
vi.mock('@process/agent/acp', () => ({
  AcpAgent: class {
    sendMessage = vi.fn();
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
  },
}));

// Minimal BaseAgentManager so constructing AcpAgentManager doesn't spawn a fork
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

vi.mock('@process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('@process/task/CronCommandDetector', () => ({ hasCronCommands: vi.fn(() => false) }));
vi.mock('@process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(() => ''),
  processCronInMessage: vi.fn((x: unknown) => x),
}));
vi.mock('@process/task/ThinkTagDetector', () => ({
  stripThinkTags: vi.fn((x: unknown) => x),
  extractAndStripThinkTags: vi.fn((s: string) => ({ thinking: '', content: s })),
}));
vi.mock('@process/utils/initAgent', () => ({ hasNativeSkillSupport: vi.fn(() => false) }));
vi.mock('@process/task/agentUtils', () => ({
  prepareFirstMessageWithSkillsIndex: vi.fn((x: string) => Promise.resolve({ content: x, loadedSkills: [] })),
}));
vi.mock('@/common/utils', () => ({
  parseError: vi.fn((e: unknown) => e),
  uuid: vi.fn(() => 'fresh-uuid'),
}));
vi.mock('@/common/chat/chatLib', () => ({
  transformMessage: mockTransformMessage,
  uuid: vi.fn(() => 'fresh-uuid'),
}));
vi.mock('@process/services/cron/SkillSuggestWatcher', () => ({
  skillSuggestWatcher: { handle: vi.fn() },
}));
vi.mock('@process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: class {
    notifyTurnFinished = vi.fn();
  },
}));
vi.mock('@process/team/prompts/teamGuideCapability.ts', () => ({
  shouldInjectTeamGuideMcp: vi.fn(() => Promise.resolve(false)),
}));
vi.mock('@process/acp/compat', () => ({
  AcpAgentV2: class {
    start = vi.fn();
    sendMessage = vi.fn();
    stop = vi.fn();
    cancelPrompt = vi.fn();
    getModelInfo = vi.fn(() => null);
    getConfigOptions = vi.fn(() => []);
  },
}));

// ── Import real AcpAgentManager after all mocks are set up ───────────────────
import AcpAgentManager from '../../src/process/task/AcpAgentManager';
import type { AcpBackend } from '../../src/common/types/acpTypes';
import type { IResponseMessage } from '../../src/common/adapter/ipcBridge';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeManager(conversationId = 'conv-resume') {
  const manager = new AcpAgentManager({
    conversation_id: conversationId,
    backend: 'claude' as AcpBackend,
    workspace: '/tmp/workspace',
  });
  return manager;
}

/** Invoke the private handleStreamEvent on a manager. */
function streamEvent(manager: AcpAgentManager, message: IResponseMessage, backend: AcpBackend = 'claude') {
  return (
    manager as unknown as { handleStreamEvent: (m: IResponseMessage, b: AcpBackend) => void }
  ).handleStreamEvent(message, backend);
}

function setBootstrapping(manager: AcpAgentManager, value: boolean) {
  (manager as unknown as { bootstrapping: boolean }).bootstrapping = value;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AcpAgentManager - H9 session-resume replay does not duplicate SQLite rows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drops replayed content events while bootstrapping (no addOrUpdateMessage, no transformMessage)', () => {
    const manager = makeManager('conv-h9-1');
    setBootstrapping(manager, true);

    // Simulate a session/load replay: assistant-side text content frames
    const replayed: IResponseMessage[] = [
      {
        type: 'content',
        conversation_id: 'conv-h9-1',
        msg_id: 'replay-1',
        data: 'previous assistant turn',
      } as IResponseMessage,
      {
        type: 'content',
        conversation_id: 'conv-h9-1',
        msg_id: 'replay-2',
        data: 'another previous turn',
      } as IResponseMessage,
    ];

    for (const ev of replayed) streamEvent(manager, ev);

    expect(mockTransformMessage).not.toHaveBeenCalled();
    expect(mockAddOrUpdateMessage).not.toHaveBeenCalled();
  });

  it('drops replayed acp_tool_call events while bootstrapping', () => {
    const manager = makeManager('conv-h9-2');
    setBootstrapping(manager, true);

    streamEvent(manager, {
      type: 'acp_tool_call',
      conversation_id: 'conv-h9-2',
      msg_id: 'replay-tool-1',
      data: { name: 'Read', input: { path: 'foo.ts' } },
    } as IResponseMessage);

    expect(mockTransformMessage).not.toHaveBeenCalled();
    expect(mockAddOrUpdateMessage).not.toHaveBeenCalled();
  });

  it('still emits agent_status frames during bootstrap so init progress is visible', () => {
    const manager = makeManager('conv-h9-3');
    setBootstrapping(manager, true);

    const statusEvent: IResponseMessage = {
      type: 'agent_status',
      conversation_id: 'conv-h9-3',
      msg_id: 'status-1',
      data: { status: 'connecting' },
    } as IResponseMessage;

    streamEvent(manager, statusEvent);

    // agent_status flows directly to the IPC bus (no transform / no DB write)
    expect(mockResponseStreamEmit).toHaveBeenCalledWith(statusEvent);
    expect(mockTransformMessage).not.toHaveBeenCalled();
    expect(mockAddOrUpdateMessage).not.toHaveBeenCalled();
  });

  it('once bootstrapping is released, post-resume content events flow through transform + DB', () => {
    const manager = makeManager('conv-h9-4');
    setBootstrapping(manager, false);
    // Mark first-turn complete so agent_status filter is permissive
    (manager as unknown as { isFirstMessage: boolean }).isFirstMessage = true;

    streamEvent(manager, {
      type: 'content',
      conversation_id: 'conv-h9-4',
      msg_id: 'live-1',
      data: 'live assistant chunk',
    } as IResponseMessage);

    expect(mockTransformMessage).toHaveBeenCalledTimes(1);
    // The chunk is buffered for the 120ms stream debounce, so it does not
    // hit addOrUpdateMessage synchronously - but the critical fix is that
    // transformMessage IS invoked once bootstrapping is false (proving the
    // gate is the only thing blocking it during resume).
  });
});
