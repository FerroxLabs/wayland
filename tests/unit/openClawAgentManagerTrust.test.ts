/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #671 gate wiring (OpenClaw): in a trusted ("cowork") workspace the manager
 * auto-approves read/search/edit permission requests (no confirmation card)
 * while STILL surfacing a card for execute/fetch; untrusted ("chat") prompts
 * on everything. Mirrors acpAgentManagerTrust.test.ts.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const { isWorkspaceTrusted } = vi.hoisted(() => ({
  isWorkspaceTrusted: vi.fn<(ws: string | undefined | null) => boolean>(),
}));
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted }));

vi.mock('@process/agent/openclaw', () => ({ OpenClawAgent: class {} }));
vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emitAgentMessage: vi.fn() },
}));
vi.mock('@/common', () => ({
  ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } },
}));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(() => null) }));
vi.mock('@/common/utils', () => ({ uuid: vi.fn(() => 'uuid-oc'), parseError: vi.fn((e: unknown) => e) }));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve({ updateConversation: vi.fn() })),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn(), addOrUpdateMessage: vi.fn() }));
vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/services/cron/SkillSuggestWatcher', () => ({ skillSuggestWatcher: { onFinish: vi.fn() } }));
vi.mock('@process/task/BaseAgentManager', () => ({
  default: class {
    conversation_id = '';
    workspace = '';
    addConfirmation() {}
    getConfirmations() {
      return [];
    }
  },
}));
vi.mock('@process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('@process/team/teamEventBus', () => ({ teamEventBus: { emit: vi.fn() } }));
vi.mock('@process/services/cost/CostRecorder', () => ({ getCostRecorder: vi.fn(() => ({ record: vi.fn() })) }));
vi.mock('@process/services/cost/gatewayUsage', () => ({ parseGatewayUsage: vi.fn(() => null) }));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));

import OpenClawAgentManager from '../../src/process/task/OpenClawAgentManager';

type SignalFn = (msg: unknown) => void;

function makeManager(workspace: string) {
  const mgr = Object.create(OpenClawAgentManager.prototype) as InstanceType<typeof OpenClawAgentManager>;
  (mgr as unknown as { workspace: string }).workspace = workspace;
  (mgr as unknown as { conversation_id: string }).conversation_id = 'conv-oc';
  return mgr;
}

function permissionSignal(kind: string) {
  return {
    type: 'acp_permission',
    msg_id: 'msg-oc',
    data: {
      sessionId: 'sess-1',
      toolCall: { toolCallId: 'oc-call-1', kind, title: `${kind} tool` },
      options: [
        { optionId: 'allow-once', name: 'Allow', kind: 'allow_once' },
        { optionId: 'reject-once', name: 'Deny', kind: 'reject_once' },
      ],
    },
  };
}

describe('OpenClawAgentManager trusted-workspace gate (#671)', () => {
  beforeEach(() => {
    isWorkspaceTrusted.mockReset();
  });

  it('auto-approves read/search/edit in a trusted workspace (no card)', () => {
    for (const kind of ['read', 'search', 'edit']) {
      const mgr = makeManager('/trusted/ws');
      isWorkspaceTrusted.mockReturnValue(true);
      const confirm = vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
      const addConfirmation = vi.spyOn(mgr as unknown as { addConfirmation: (c: unknown) => void }, 'addConfirmation');
      (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal(kind));
      expect(confirm, `kind=${kind} should auto-approve`).toHaveBeenCalledTimes(1);
      expect(confirm.mock.calls[0][2]).toBe('allow-once');
      expect(addConfirmation, `kind=${kind} should NOT prompt`).not.toHaveBeenCalled();
    }
  });

  it('STILL prompts on execute/fetch in a trusted workspace', () => {
    for (const kind of ['execute', 'fetch']) {
      const mgr = makeManager('/trusted/ws');
      isWorkspaceTrusted.mockReturnValue(true);
      const confirm = vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
      const addConfirmation = vi.spyOn(mgr as unknown as { addConfirmation: (c: unknown) => void }, 'addConfirmation');
      (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal(kind));
      expect(confirm, `kind=${kind} must not auto-approve`).not.toHaveBeenCalled();
      expect(addConfirmation, `kind=${kind} must prompt`).toHaveBeenCalledTimes(1);
    }
  });

  it('prompts on edit when the workspace is NOT trusted (chat)', () => {
    const mgr = makeManager('/gated/ws');
    isWorkspaceTrusted.mockReturnValue(false);
    const confirm = vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
    const addConfirmation = vi.spyOn(mgr as unknown as { addConfirmation: (c: unknown) => void }, 'addConfirmation');
    (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal('edit'));
    expect(confirm).not.toHaveBeenCalled();
    expect(addConfirmation).toHaveBeenCalledTimes(1);
  });

  it('reads THIS workspace (passes its own workspace to the trust check)', () => {
    const mgr = makeManager('/specific/oc/ws');
    isWorkspaceTrusted.mockReturnValue(false);
    vi.spyOn(mgr, 'confirm').mockResolvedValue(undefined);
    (mgr as unknown as { handleSignalEvent: SignalFn }).handleSignalEvent(permissionSignal('read'));
    expect(isWorkspaceTrusted).toHaveBeenCalledWith('/specific/oc/ws');
  });
});
