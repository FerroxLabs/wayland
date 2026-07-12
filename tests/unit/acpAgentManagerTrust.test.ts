/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #671 gate wiring: in a trusted ("cowork") workspace, AcpAgentManager must
 * auto-approve read/edit tool calls (no confirmation card) while STILL surfacing
 * a card for execute/network — and must prompt for everything when the workspace
 * is untrusted ("chat"). This is the end-to-end proof that the shared decision
 * is wired into the primary ACP gate with the right variable (this.workspace)
 * and the right short-circuit. The Gemini/WCore/OpenClaw gates follow the same
 * shape (covered by workspaceTrustDecision.test.ts for the decision itself).
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// isWorkspaceTrusted is the seam; drive it per-test. Declared via vi.hoisted so
// the reference is available inside the hoisted vi.mock factory.
const { isWorkspaceTrusted } = vi.hoisted(() => ({
  isWorkspaceTrusted: vi.fn<(ws: string | undefined | null) => boolean>(),
}));
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted }));

// ── Manager construction mocks (mirror acpAgentManagerTeamPermission.test.ts) ──
vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: vi.fn() },
}));
vi.mock('@/common', () => ({
  ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } },
}));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve({ updateConversation: vi.fn() })),
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
    options: Record<string, unknown> = {};
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

type SignalFn = (v: unknown, backend: string) => Promise<void>;

function makeManager(workspace: string) {
  const data: Record<string, unknown> = { conversation_id: 'conv-trust', backend: 'claude', workspace };
  const manager = new AcpAgentManager(data as never);
  (manager as unknown as { options: Record<string, unknown> }).options = data;
  // Default (non-yolo, non-acceptEdits) mode so the trust branch is the decider.
  (manager as unknown as { currentMode: string }).currentMode = 'default';
  return manager;
}

function permissionSignal(kind: string) {
  return {
    type: 'acp_permission',
    msg_id: 'msg-1',
    data: {
      toolCall: { toolCallId: 'call-1', kind, title: `${kind} tool` },
      options: [
        { optionId: 'allow-once', name: 'Allow', kind: 'allow_once' },
        { optionId: 'reject-once', name: 'Deny', kind: 'reject_once' },
      ],
    },
  };
}

describe('AcpAgentManager trusted-workspace gate (#671)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    isWorkspaceTrusted.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-approves read/edit in a trusted workspace (no confirmation card)', async () => {
    for (const kind of ['read', 'search', 'edit']) {
      const mgr = makeManager('/trusted/ws');
      isWorkspaceTrusted.mockReturnValue(true);
      const confirm = vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
      const addConfirmation = vi.spyOn(mgr as unknown as { addConfirmation: (c: unknown) => void }, 'addConfirmation');

      await (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal(kind), 'claude');
      await vi.runAllTimersAsync(); // the auto-approve path defers via setTimeout(50)

      expect(confirm, `kind=${kind} should auto-approve`).toHaveBeenCalledTimes(1);
      expect(confirm.mock.calls[0][2]).toMatchObject({ optionId: 'allow-once' });
      expect(addConfirmation, `kind=${kind} should NOT prompt`).not.toHaveBeenCalled();
    }
  });

  it('STILL prompts on execute/network in a trusted workspace', async () => {
    for (const kind of ['execute', 'fetch']) {
      const mgr = makeManager('/trusted/ws');
      isWorkspaceTrusted.mockReturnValue(true);
      const confirm = vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
      const addConfirmation = vi.spyOn(mgr as unknown as { addConfirmation: (c: unknown) => void }, 'addConfirmation');

      await (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal(kind), 'claude');
      await vi.runAllTimersAsync();

      expect(confirm, `kind=${kind} must not auto-approve`).not.toHaveBeenCalled();
      expect(addConfirmation, `kind=${kind} must prompt`).toHaveBeenCalledTimes(1);
    }
  });

  it('prompts on read/edit when the workspace is NOT trusted (chat)', async () => {
    const mgr = makeManager('/gated/ws');
    isWorkspaceTrusted.mockReturnValue(false);
    const confirm = vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
    const addConfirmation = vi.spyOn(mgr as unknown as { addConfirmation: (c: unknown) => void }, 'addConfirmation');

    await (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal('edit'), 'claude');
    await vi.runAllTimersAsync();

    expect(confirm).not.toHaveBeenCalled();
    expect(addConfirmation).toHaveBeenCalledTimes(1);
  });

  it('reads THIS workspace (passes its own workspace to the trust check)', async () => {
    const mgr = makeManager('/specific/ws');
    isWorkspaceTrusted.mockReturnValue(false);
    vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
    await (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal('read'), 'claude');
    await vi.runAllTimersAsync();
    expect(isWorkspaceTrusted).toHaveBeenCalledWith('/specific/ws');
  });
});
