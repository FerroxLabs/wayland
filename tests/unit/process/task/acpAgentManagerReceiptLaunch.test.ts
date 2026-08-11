/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The install RECEIPT reaching the spawn path.
 *
 * `extra.launch` is only ever written by a PREVIOUS spawn of this same code, so
 * a conversation started on a freshly installed backend carries none - which is
 * exactly why installs were inert: the receipt was written, valid, and read by
 * nothing. `resolveBuiltinBackendConfig` therefore falls back to the registry,
 * which is where decision D1 has already been applied: a PATH-detected system
 * copy carries no launch spec, so the user's own copy keeps running.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet, capturedAgentConfigs, getManagedLaunchSpec } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  capturedAgentConfigs: [] as Array<Record<string, unknown>>,
  getManagedLaunchSpec: vi.fn(),
}));

vi.mock('@process/agent/AgentRegistry', () => ({ agentRegistry: { getManagedLaunchSpec } }));

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
// initAgent constructs AcpAgentV2 with the fully-resolved agentConfig. Capturing it
// is the only way to observe what actually reaches the spawn layer.
vi.mock('@process/acp/compat/AcpAgentV2', () => ({
  AcpAgentV2: class {
    constructor(config: Record<string, unknown>) {
      capturedAgentConfigs.push(config);
    }
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
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
  isConciergeAssistant: vi.fn(() => false),
}));
vi.mock('@/common/utils', () => ({ parseError: vi.fn((e: unknown) => e), uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(), uuid: vi.fn(() => 'uuid') }));

import AcpAgentManager from '../../../../src/process/task/AcpAgentManager';
import type { AcpBackend, AcpLaunchSpec } from '../../../../src/common/types/acpTypes';

/** What the kimi receipt resolves to on a dev build: a runtime plus an entry. */
const RECEIPT_LAUNCH: AcpLaunchSpec = {
  command: '/Applications/Wayland.app/Contents/MacOS/Wayland',
  args: ['/Users/John Smith/Library/Application Support/Wayland/agents/kimi/node_modules/x/dist/main.mjs'],
  env: { ELECTRON_RUN_AS_NODE: '1' },
};

/** A descriptor already persisted on the conversation, from an earlier spawn. */
const EXTRA_LAUNCH: AcpLaunchSpec = { command: '/persisted/bun', args: ['/persisted/entry.mjs'] };

type Resolved = { cliPath?: string; launch?: AcpLaunchSpec };

function resolveBuiltin(data: Record<string, unknown>): Promise<Resolved> {
  const m = new AcpAgentManager({ conversation_id: 'c1', backend: 'kimi' as AcpBackend, workspace: '/tmp/ws' });
  return (
    m as unknown as { resolveBuiltinBackendConfig: (d: unknown) => Promise<Resolved> }
  ).resolveBuiltinBackendConfig(data);
}

describe('AcpAgentManager - install receipt feeds the launch path', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async () => undefined);
    getManagedLaunchSpec.mockReset();
    getManagedLaunchSpec.mockReturnValue(null);
    capturedAgentConfigs.length = 0;
  });

  it('uses the receipt when the conversation carries no launch descriptor', async () => {
    getManagedLaunchSpec.mockReturnValue(RECEIPT_LAUNCH);
    const res = await resolveBuiltin({ backend: 'kimi' });

    // The whole spec, verbatim - including the env half, without which a dev
    // build spawns an Electron WINDOW instead of Node.
    expect(res.launch).toEqual(RECEIPT_LAUNCH);
    expect(getManagedLaunchSpec).toHaveBeenCalledWith('kimi');
  });

  it('a descriptor already on the conversation wins over the receipt', async () => {
    getManagedLaunchSpec.mockReturnValue(RECEIPT_LAUNCH);
    const res = await resolveBuiltin({ backend: 'kimi', launch: EXTRA_LAUNCH });
    expect(res.launch).toEqual(EXTRA_LAUNCH);
  });

  it('D1: no launch spec at all when the registry withheld one (a system copy won)', async () => {
    getManagedLaunchSpec.mockReturnValue(null);
    const res = await resolveBuiltin({ backend: 'kimi' });
    // Positive control: the SAME call shape does produce a spec when there is one.
    expect((await resolveBuiltin({ backend: 'kimi', launch: EXTRA_LAUNCH })).launch).toEqual(EXTRA_LAUNCH);
    expect(res.launch).toBeUndefined();
    // The legacy string fallback is untouched, so the user's own copy still runs.
    expect(res.cliPath).toBe('kimi');
  });

  it('carries the receipt spec all the way onto the agent config AND extra', async () => {
    getManagedLaunchSpec.mockReturnValue(RECEIPT_LAUNCH);
    const m = new AcpAgentManager({ conversation_id: 'c1', backend: 'kimi' as AcpBackend, workspace: '/tmp/ws' });
    await m.initAgent({
      conversation_id: 'c1',
      backend: 'kimi' as AcpBackend,
      workspace: '/tmp/ws',
    } as never);

    expect(capturedAgentConfigs).toHaveLength(1);
    const config = capturedAgentConfigs[0];
    // agentConfig.launch feeds LegacyConnectorFactory -> createGenericSpawnConfig;
    // extra.launch feeds AcpAgent.ensureBackendAuth, which only warns on failure.
    expect(config.launch).toEqual(RECEIPT_LAUNCH);
    expect((config.extra as Record<string, unknown>).launch).toEqual(RECEIPT_LAUNCH);
  });
});
