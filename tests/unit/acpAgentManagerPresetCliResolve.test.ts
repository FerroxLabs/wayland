/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #66 regression guard: routing a preset through the customAgentId||presetAssistantId
 * fallback must NOT break "thin" specialists (a preset assistant with a backend but
 * no defaultCliPath, e.g. the builtin claude specialists). Such a row reaches
 * resolveCustomAgentCliConfig, which - because it has no launch override - must fall
 * through to builtin resolution and still yield a real cliPath, NOT the bare
 * cliPath-less early return that throws "No CLI path configured". Rows that DO carry
 * defaultCliPath (a Hermes profile) keep forwarding their env.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: mockGet },
}));
vi.mock('@/common', () => ({ ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } } }));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve({ updateConversation: vi.fn(), getConversation: vi.fn() })),
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
    sendMessage = vi.fn().mockResolvedValue({ success: true });
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
  },
}));
vi.mock('@process/task/BaseAgentManager', () => ({
  default: class {
    conversation_id = '';
    workspace = '';
    yoloMode = false;
    currentMode = 'default';
    constructor(_type: string, data: Record<string, unknown>) {
      if (data?.conversation_id) this.conversation_id = data.conversation_id as string;
      if (data?.workspace) this.workspace = data.workspace as string;
    }
    isYoloMode() {
      return false;
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
import { ACP_BACKENDS_ALL, type AcpBackend } from '../../src/common/types/acpTypes';

type Resolver = (
  data: Record<string, unknown>
) => Promise<{ cliPath?: string; customArgs?: string[]; customEnv?: Record<string, string> }>;

const ASSISTANTS = [
  // Thin builtin specialist: real backend, NO defaultCliPath (the regression case).
  { id: 'builtin-social', name: 'Social', kind: 'specialist', isBuiltin: true, presetAgentType: 'claude' },
  // Hermes profile: carries a launch override + env.
  {
    id: 'hermes-profile-alpha',
    name: 'Hermes (alpha)',
    kind: 'specialist',
    isBuiltin: false,
    presetAgentType: 'hermes',
    defaultCliPath: 'hermes',
    acpArgs: ['acp'],
    env: { HERMES_PROFILE: 'alpha' },
  },
];

function resolver(backend: string): Resolver {
  const manager = new AcpAgentManager({
    conversation_id: 'c1',
    backend: backend as AcpBackend,
    workspace: '/tmp/ws',
  });
  return (data) => (manager as unknown as { resolveCustomAgentCliConfig: Resolver }).resolveCustomAgentCliConfig(data);
}

describe('resolveCustomAgentCliConfig — thin-specialist fallthrough (#66)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async (key: string) => (key === 'assistants' ? ASSISTANTS : undefined));
  });

  it('resolves a real cliPath for a thin builtin specialist (no defaultCliPath)', async () => {
    const res = await resolver('claude')({ customAgentId: 'builtin-social', backend: 'claude', cliPath: undefined });
    // The regression returned { cliPath: undefined } → spawn throws. The fix falls
    // through to builtin resolution, yielding the backend's cliCommand.
    expect(res.cliPath).toBe(ACP_BACKENDS_ALL.claude.cliCommand);
    expect(res.cliPath).toBeTruthy();
  });

  it('still forwards env for a Hermes profile (defaultCliPath present)', async () => {
    const res = await resolver('hermes')({ customAgentId: 'hermes-profile-alpha', backend: 'hermes' });
    expect(res.cliPath).toBe('hermes');
    expect(res.customArgs).toEqual(['acp']);
    expect(res.customEnv).toEqual({ HERMES_PROFILE: 'alpha' });
  });

  it('preserves an explicit data.cliPath for a thin custom agent', async () => {
    const res = await resolver('claude')({ customAgentId: 'builtin-social', backend: 'claude', cliPath: '/my/claude' });
    // resolveBuiltinBackendConfig prefers a passed-in cliPath, so custom agents
    // that set their own launch path keep it.
    expect(res.cliPath).toBe('/my/claude');
  });
});
