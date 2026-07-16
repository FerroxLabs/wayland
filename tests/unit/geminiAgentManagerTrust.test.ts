import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIpcBridge = vi.hoisted(() => ({
  geminiConversation: {
    responseStream: { emit: vi.fn() },
  },
}));
const mockTeamEventBus = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock('@/common', () => ({ ipcBridge: mockIpcBridge }));
vi.mock('@/common/utils', () => ({ uuid: vi.fn(() => 'uuid-1') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(() => null) }));
vi.mock('@/common/utils/platformAuthType', () => ({ getProviderAuthType: vi.fn(() => 'api_key') }));
vi.mock('@process/channels/agent/ChannelEventBus', () => ({ channelEventBus: { emitAgentMessage: vi.fn() } }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getExtensions: vi.fn(() => []) })) },
}));
vi.mock('@process/services/cron/CronBusyGuard', () => ({ cronBusyGuard: { setProcessing: vi.fn() } }));
vi.mock('@process/services/cron/SkillSuggestWatcher', () => ({ skillSuggestWatcher: { onFinish: vi.fn() } }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn().mockResolvedValue({}) }));
vi.mock('@process/team/mcp/guide/teamGuideSingleton', () => ({ getTeamGuideStdioConfig: vi.fn() }));
vi.mock('@process/team/teamEventBus', () => ({ teamEventBus: mockTeamEventBus }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn().mockResolvedValue({}), set: vi.fn().mockResolvedValue(undefined) },
  getSkillsDir: vi.fn(() => '/fake/skills'),
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
  nextTickToLocalFinish: vi.fn(),
}));
vi.mock('@process/utils/previewUtils', () => ({ handlePreviewOpenEvent: vi.fn(() => false) }));
vi.mock('../../src/process/task/AcpSkillManager', () => ({
  detectSkillLoadRequest: vi.fn(() => false),
  AcpSkillManager: {
    getInstance: vi.fn(() => ({
      discoverSkills: vi.fn().mockResolvedValue(undefined),
      getBuiltinSkillsIndex: vi.fn(() => []),
    })),
  },
  buildSkillContentText: vi.fn(() => ''),
}));
vi.mock('../../src/process/task/CronCommandDetector', () => ({ hasCronCommands: vi.fn(() => false) }));
vi.mock('../../src/process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(() => ''),
  processCronInMessage: vi.fn(),
}));
vi.mock('../../src/process/task/ThinkTagDetector', () => ({
  stripThinkTags: vi.fn((value: string) => value),
  extractAndStripThinkTags: vi.fn((value: string) => ({ thinking: '', content: value })),
}));
vi.mock('../../src/process/task/agentUtils', () => ({ buildSystemInstructionsWithSkillsIndex: vi.fn(() => '') }));
vi.mock('../../src/process/agent/gemini/GeminiApprovalStore', () => ({
  GeminiApprovalStore: class {
    allApproved() {
      return false;
    }
    approveAll() {}
  },
}));
vi.mock('../../src/process/agent/gemini/cli/tools/tools', () => ({ ToolConfirmationOutcome: {} }));
vi.mock('@office-ai/aioncli-core', () => ({
  AuthType: { LOGIN_WITH_GOOGLE: 'LOGIN_WITH_GOOGLE', USE_VERTEX_AI: 'USE_VERTEX_AI' },
  getOauthInfoWithCache: vi.fn().mockResolvedValue(null),
  Storage: { getOAuthCredsPath: vi.fn(() => '/fake/oauth') },
}));
vi.mock('node:fs', () => ({ existsSync: vi.fn(() => false) }));
vi.mock('../../src/process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('../../src/process/task/BaseAgentManager', () => ({
  default: class BaseAgentManager {
    conversation_id = 'conv-test';
    status = 'pending';
    type = 'gemini';
    yoloMode = false;
    confirmations: unknown[] = [];
    private listeners = new Map<string, Array<(data: unknown) => void>>();

    constructor(_type: string, _data: unknown, _emitter: unknown) {
      if (typeof (this as { init?: () => void }).init === 'function') {
        (this as { init: () => void }).init();
      }
    }

    init() {}

    on(name: string, handler: (data: unknown) => void) {
      const list = this.listeners.get(name) ?? [];
      list.push(handler);
      this.listeners.set(name, list);
      return () => {};
    }

    emit(name: string, data: unknown) {
      for (const handler of this.listeners.get(name) ?? []) {
        handler(data);
      }
    }

    stop = vi.fn().mockResolvedValue(undefined);
    kill = vi.fn();
    getConfirmations() {
      return this.confirmations;
    }
    addConfirmation(c: unknown) {
      this.confirmations.push(c);
    }
    confirm = vi.fn();
    postMessagePromise = vi.fn().mockResolvedValue(undefined);
  },
}));

import { GeminiAgentManager } from '../../src/process/task/GeminiAgentManager';

/**
 * #671 gate wiring (Gemini): in a trusted ("cowork") workspace the manager
 * auto-approves only the 'edit' confirmation type and STILL prompts on
 * exec/mcp AND the 'info' catch-all (which can carry network/URL fetches);
 * untrusted ("chat") prompts on everything. Mirrors acpAgentManagerTrust.
 */
const { isWorkspaceTrusted: trustSeam } = vi.hoisted(() => ({
  isWorkspaceTrusted: vi.fn<(ws: string | undefined | null) => boolean>(),
}));
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted: trustSeam }));

type TryAutoApprove = (content: { callId: string; confirmationDetails?: { type: string } }) => boolean;

function makeTrustManager(workspace: string) {
  const mgr = Object.create(GeminiAgentManager.prototype) as InstanceType<typeof GeminiAgentManager>;
  (mgr as unknown as { workspace: string }).workspace = workspace;
  (mgr as unknown as { currentMode: string }).currentMode = 'default';
  const post = vi.fn().mockResolvedValue(undefined);
  (mgr as unknown as { postMessagePromise: typeof post }).postMessagePromise = post;
  return { mgr, post };
}

describe('GeminiAgentManager trusted-workspace gate (#671)', () => {
  beforeEach(() => {
    trustSeam.mockReset();
  });

  it('auto-approves edit in a trusted workspace', () => {
    const { mgr, post } = makeTrustManager('/trusted/ws');
    trustSeam.mockReturnValue(true);
    const ok = (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
      callId: 'call-e',
      confirmationDetails: { type: 'edit' },
    });
    expect(ok).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe('call-e');
  });

  it("STILL prompts on exec/mcp AND the 'info' catch-all when trusted", () => {
    for (const type of ['exec', 'mcp', 'info']) {
      const { mgr, post } = makeTrustManager('/trusted/ws');
      trustSeam.mockReturnValue(true);
      const ok = (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
        callId: `call-${type}`,
        confirmationDetails: { type },
      });
      expect(ok, `type=${type} must not auto-approve`).toBe(false);
      expect(post, `type=${type} must not post approval`).not.toHaveBeenCalled();
    }
  });

  it('prompts on edit when the workspace is NOT trusted (chat)', () => {
    const { mgr, post } = makeTrustManager('/gated/ws');
    trustSeam.mockReturnValue(false);
    const ok = (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
      callId: 'call-x',
      confirmationDetails: { type: 'edit' },
    });
    expect(ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it('reads THIS workspace (passes its own workspace to the trust check)', () => {
    const { mgr } = makeTrustManager('/specific/gemini/ws');
    trustSeam.mockReturnValue(false);
    (mgr as unknown as { tryAutoApprove: TryAutoApprove }).tryAutoApprove({
      callId: 'c',
      confirmationDetails: { type: 'edit' },
    });
    expect(trustSeam).toHaveBeenCalledWith('/specific/gemini/ws');
  });
});
