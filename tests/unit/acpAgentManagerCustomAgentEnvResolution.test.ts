/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpAgentManager custom-agent CLI resolution (issue #66 follow-up).
 *
 * `resolveCustomAgentCliConfig` used to look up a `customAgentId` ONLY in the
 * `assistants` config store. After the `migration.assistantsSplitCustom`
 * migration, `assistants` holds preset-only records (isPreset === true) and
 * user-defined raw custom ACP agents (added in Settings -> Agents -> Local
 * Agents, e.g. a Hermes profile with a custom HERMES_PROFILE env var) live in
 * `acp.customAgents` instead. The old lookup silently dropped a raw custom
 * agent's configured `acpArgs`/`env` on every launch (cliPath still worked
 * because it is separately threaded through `data.cliPath`).
 *
 * Mirrors acpAgentManagerDbErrorLogging.test.ts's mock setup.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockProcessConfigGet } = vi.hoisted(() => ({
  mockProcessConfigGet: vi.fn(),
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
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: mockProcessConfigGet },
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

type ResolveCustomAgentCliConfig = (data: {
  backend: AcpBackend;
  customAgentId?: string;
  cliPath?: string;
  conversation_id: string;
}) => Promise<{ cliPath?: string; customArgs?: string[]; customEnv?: Record<string, string> }>;

function makeManager() {
  const manager = new AcpAgentManager({
    conversation_id: 'conv-custom-agent-env',
    backend: 'custom' as AcpBackend,
    workspace: '/tmp/workspace',
  });
  return manager as unknown as { resolveCustomAgentCliConfig: ResolveCustomAgentCliConfig };
}

describe('AcpAgentManager custom-agent CLI resolution (issue #66)', () => {
  beforeEach(() => {
    mockProcessConfigGet.mockReset();
  });

  it('resolves acpArgs/env for a raw custom agent stored in acp.customAgents (not assistants)', async () => {
    mockProcessConfigGet.mockImplementation((key: string) => {
      if (key === 'assistants') return Promise.resolve([]); // presets only, post-migration
      if (key === 'acp.customAgents') {
        return Promise.resolve([
          {
            id: 'hermes-marketing-uuid',
            name: 'Hermes (marketing)',
            defaultCliPath: 'hermes',
            acpArgs: ['acp', '--experimental-acp'],
            env: { HERMES_PROFILE: 'marketing' },
          },
        ]);
      }
      return Promise.resolve(undefined);
    });

    const manager = makeManager();
    const resolved = await manager.resolveCustomAgentCliConfig({
      backend: 'custom' as AcpBackend,
      customAgentId: 'hermes-marketing-uuid',
      conversation_id: 'conv-custom-agent-env',
    });

    expect(resolved.cliPath).toBe('hermes');
    expect(resolved.customArgs).toEqual(['acp', '--experimental-acp']);
    expect(resolved.customEnv).toEqual({ HERMES_PROFILE: 'marketing' });
  });

  it('still resolves a preset assistant stored in assistants', async () => {
    mockProcessConfigGet.mockImplementation((key: string) => {
      if (key === 'assistants') {
        return Promise.resolve([
          { id: 'preset-uuid', name: 'My Preset', defaultCliPath: 'claude', acpArgs: ['--foo'], env: { X: '1' } },
        ]);
      }
      if (key === 'acp.customAgents') return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    const manager = makeManager();
    const resolved = await manager.resolveCustomAgentCliConfig({
      backend: 'custom' as AcpBackend,
      customAgentId: 'preset-uuid',
      conversation_id: 'conv-custom-agent-env',
    });

    expect(resolved.cliPath).toBe('claude');
    expect(resolved.customArgs).toEqual(['--foo']);
    expect(resolved.customEnv).toEqual({ X: '1' });
  });
});
