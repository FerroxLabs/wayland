/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-05 launch-spec forwarding through AcpAgentManager.
 *
 * An installed agent is described by a structured { command, args } descriptor
 * instead of a cliPath STRING, because every string form is whitespace-split
 * downstream and a Windows install path always contains a space (perMachine ->
 * "C:\Program Files\Wayland", plus the user profile). The descriptor is only
 * useful if it survives every hop from the persisted conversation `extra` to the
 * spawned agent config. Each hop below is asserted independently, so deleting
 * any single forward turns this file red rather than leaving a silent fallback
 * to the shredded string.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet, capturedAgentConfigs } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  capturedAgentConfigs: [] as Array<Record<string, unknown>>,
}));

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

import AcpAgentManager from '../../src/process/task/AcpAgentManager';
import type { AcpBackend, AcpLaunchSpec } from '../../src/common/types/acpTypes';

/** A K-05 install on Windows: the runtime and the entry script both carry spaces. */
const LAUNCH: AcpLaunchSpec = {
  command: 'C:\\Program Files\\Wayland\\resources\\bundled-bun\\win32-x64\\bun.exe',
  args: ['C:\\Users\\John Smith\\AppData\\Local\\Wayland\\agents\\qwen\\cli-entry.js'],
};

// An assistants row that DOES carry defaultCliPath - the branch that takes the
// terminal return of resolveCustomAgentCliConfig rather than falling through to
// resolveBuiltinBackendConfig.
const ASSISTANTS = [
  {
    id: 'installed-qwen',
    name: 'Qwen (installed)',
    kind: 'specialist',
    isBuiltin: false,
    presetAgentType: 'qwen',
    defaultCliPath: 'qwen',
    acpArgs: ['--acp'],
    env: { QWEN_X: '1' },
  },
];

type Resolved = { cliPath?: string; launch?: AcpLaunchSpec; customArgs?: string[] };

function manager(backend: string) {
  return new AcpAgentManager({
    conversation_id: 'c1',
    backend: backend as AcpBackend,
    workspace: '/tmp/ws',
  });
}

describe('AcpAgentManager - installed-agent launch spec forwarding (K-05)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async (key: string) => (key === 'assistants' ? ASSISTANTS : undefined));
    capturedAgentConfigs.length = 0;
  });

  it('resolveBuiltinBackendConfig forwards data.launch', async () => {
    const m = manager('qwen');
    const res: Resolved = await (
      m as unknown as { resolveBuiltinBackendConfig: (d: unknown) => Promise<Resolved> }
    ).resolveBuiltinBackendConfig({ backend: 'qwen', launch: LAUNCH });

    expect(res.launch).toEqual(LAUNCH);
  });

  it('resolveCustomAgentCliConfig forwards data.launch on the defaultCliPath branch', async () => {
    // B2: the terminal return of resolveCustomAgentCliConfig hand-lists its fields.
    // An installed agent reached through an assistants row that carries a
    // defaultCliPath dropped `launch` here and fell back to the cliPath STRING -
    // on Windows, exactly the shredding this packet exists to prevent.
    const m = manager('qwen');
    const res: Resolved = await (
      m as unknown as { resolveCustomAgentCliConfig: (d: unknown) => Promise<Resolved> }
    ).resolveCustomAgentCliConfig({ backend: 'qwen', customAgentId: 'installed-qwen', launch: LAUNCH });

    expect(res.cliPath).toBe('qwen');
    expect(res.launch).toEqual(LAUNCH);
  });

  it('resolveAgentCliConfig forwards launch down BOTH dispatch arms', async () => {
    const call = (data: Record<string, unknown>): Promise<Resolved> =>
      (
        manager('qwen') as unknown as { resolveAgentCliConfig: (d: unknown) => Promise<Resolved> }
      ).resolveAgentCliConfig(data);

    // customAgentId set -> custom arm; unset -> builtin arm.
    expect((await call({ backend: 'qwen', customAgentId: 'installed-qwen', launch: LAUNCH })).launch).toEqual(LAUNCH);
    expect((await call({ backend: 'qwen', launch: LAUNCH })).launch).toEqual(LAUNCH);
  });

  it('initAgent puts launch on the agent config AND on extra', async () => {
    // B3: both forwards are load-bearing. `agentConfig.launch` feeds the spawn
    // path (toAgentConfig -> LegacyConnectorFactory); `extra.launch` feeds the
    // CLI-login path (AcpAgent.ensureBackendAuth), which only console.warn's on
    // failure and would break silently.
    const m = manager('qwen');
    await m.initAgent({
      conversation_id: 'c1',
      backend: 'qwen' as AcpBackend,
      workspace: '/tmp/ws',
      launch: LAUNCH,
    } as never);

    expect(capturedAgentConfigs).toHaveLength(1);
    const config = capturedAgentConfigs[0];
    expect(config.launch).toEqual(LAUNCH);
    expect((config.extra as Record<string, unknown>).launch).toEqual(LAUNCH);
  });
});
