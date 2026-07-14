/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpAgentManager.setModel durable persistence for codex / generic ACP backends.
 *
 * The bug: a codex model pick silently snapped back when the agent was not live —
 * setModel only wrote the record AFTER a successful live `set_model` round-trip,
 * so a disconnected / unspawnable agent lost the selection. setModel now persists
 * the REQUESTED id early (before init), keeps the requested id even if the live
 * bridge echoes a stale default (10s timeout fallback), and leaves claude's
 * respawn path and the flux-id branch untouched.
 *
 * Mock setup mirrors acpAgentManagerModelInfoEmit.test.ts.
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

type ManagerInternals = {
  agent: unknown;
  initAgent: (...args: unknown[]) => Promise<unknown>;
  computeFluxRouting: (...args: unknown[]) => Promise<{ routing: string }>;
  lastRouting: string;
};

function makeManager(
  backend: string,
  opts?: { withAgent?: Partial<{ setModelByConfigOption: unknown; getModelInfo: unknown }> }
) {
  const manager = new AcpAgentManager({
    conversation_id: 'conv-model',
    backend: backend as AcpBackend,
    workspace: '/tmp/workspace',
  });
  const internals = manager as unknown as ManagerInternals;
  // Neutralize Flux routing so codex picks take the plain in-place set_model path.
  internals.computeFluxRouting = vi.fn().mockResolvedValue({ routing: 'unknown' });
  internals.lastRouting = 'unknown';
  if (opts?.withAgent) {
    internals.agent = {
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
      getModelInfo: opts.withAgent.getModelInfo ?? vi.fn(() => null),
      setModelByConfigOption: opts.withAgent.setModelByConfigOption ?? vi.fn(() => Promise.resolve(null)),
    };
  }
  return manager;
}

function persistedModelIds(): string[] {
  return mockUpdateConversation.mock.calls
    .map((c) => (c[1] as { extra?: { currentModelId?: string } } | undefined)?.extra?.currentModelId)
    .filter((v): v is string => typeof v === 'string');
}

describe('AcpAgentManager.setModel durable persistence (codex / ACP)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversation.mockReturnValue({ success: true, data: { type: 'acp', extra: {} } });
  });

  it('persists a codex pick to the record even when the agent cannot spawn (init fails)', async () => {
    const manager = makeManager('codex');
    // No live agent + init throws (spawn failure / disconnected).
    (manager as unknown as ManagerInternals).initAgent = vi.fn().mockRejectedValue(new Error('spawn failed'));

    const out = await manager.setModel('gpt-5-codex');

    // The requested id was written to the conversation record before init.
    expect(persistedModelIds()).toContain('gpt-5-codex');
    // And it is reported back (persisted-model info), not null, so the picker
    // reflects the pick rather than reverting to "Select Model".
    expect(out?.currentModelId).toBe('gpt-5-codex');
  });

  it('keeps the requested id when the live bridge echoes a stale default (timeout fallback)', async () => {
    // setModelByConfigOption's 10s timeout resolves to cachedModelInfo, whose
    // currentModelId is the agent DEFAULT — it must not clobber the pick.
    const stale: AcpModelInfo = {
      currentModelId: 'gpt-5',
      currentModelLabel: 'GPT-5',
      availableModels: [],
      canSwitch: true,
      source: 'models',
    } as AcpModelInfo;
    const manager = makeManager('codex', {
      withAgent: {
        setModelByConfigOption: vi.fn(() => Promise.resolve(stale)),
        getModelInfo: vi.fn(() => stale),
      },
    });

    await manager.setModel('gpt-5-codex');

    const ids = persistedModelIds();
    // Every write carried the user's requested id; the stale default was never persisted.
    expect(ids).toContain('gpt-5-codex');
    expect(ids).not.toContain('gpt-5');
  });

  it('leaves claude untouched: no early persist, returns null on spawn failure', async () => {
    const manager = makeManager('claude');
    (manager as unknown as ManagerInternals).initAgent = vi.fn().mockRejectedValue(new Error('spawn failed'));

    const out = await manager.setModel('claude-opus-4-8');

    // Claude's pick is a normalized slot persisted by respawnForRoutingChange, not
    // an early raw-id write — so a spawn failure writes nothing here and returns null.
    expect(persistedModelIds()).toHaveLength(0);
    expect(out).toBeNull();
  });

  it('routes a flux pick through the flux branch, not the early-persist path', async () => {
    const manager = makeManager('codex', {
      withAgent: {
        // If the flux branch is skipped this would run and (wrongly) drive persistence.
        setModelByConfigOption: vi.fn(() => Promise.resolve(null)),
        getModelInfo: vi.fn(() => ({
          currentModelId: 'flux-auto',
          currentModelLabel: 'Flux Auto',
          availableModels: [{ id: 'gpt-5', label: 'GPT-5' }],
          canSwitch: true,
          source: 'models',
        })),
      },
    });

    await manager.setModel('flux-auto');

    // The flux id was persisted by the dedicated flux branch; set_model was never called.
    expect(persistedModelIds()).toContain('flux-auto');
    const agent = (manager as unknown as ManagerInternals).agent as {
      setModelByConfigOption: ReturnType<typeof vi.fn>;
    };
    expect(agent.setModelByConfigOption).not.toHaveBeenCalled();
  });
});

/**
 * restorePersistedState: codex's session/new capabilities enumerate a narrower
 * model list than the account can use (gpt-5.6-sol/luna/terra come from the live
 * codex/models catalog the picker reads, but the session drops them). Clearing the
 * pick when it is absent from that list stranded the conversation header on
 * "Select Model" and silently ran the default. For codex we now attempt the switch
 * instead of clearing; other backends keep the strict clear.
 */
type RestoreInternals = {
  agent: { getModelInfo: ReturnType<typeof vi.fn>; setModelByConfigOption: ReturnType<typeof vi.fn> };
  persistedModelId: string | null;
  restorePersistedState: () => Promise<void>;
};

function enumeratingAgent() {
  // Advertises only gpt-5 — the user's gpt-5.6-terra pick is NOT in the list.
  return {
    getModelInfo: vi.fn(() => ({
      currentModelId: 'gpt-5',
      currentModelLabel: 'GPT-5',
      availableModels: [{ id: 'gpt-5', label: 'GPT-5' }],
      canSwitch: true,
      source: 'models' as const,
    })),
    setModelByConfigOption: vi.fn(() => Promise.resolve(null)),
  };
}

describe('AcpAgentManager.restorePersistedState (unenumerated subscription models)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('codex: keeps a pick absent from the session list and attempts the switch (no silent clear)', async () => {
    const manager = makeManager('codex', { withAgent: enumeratingAgent() });
    const internals = manager as unknown as RestoreInternals;
    internals.persistedModelId = 'gpt-5.6-terra';

    await internals.restorePersistedState();

    // The pick survives (header can confirm it) and the backend was asked to switch.
    expect(internals.persistedModelId).toBe('gpt-5.6-terra');
    expect(internals.agent.setModelByConfigOption).toHaveBeenCalledWith('gpt-5.6-terra');
  });

  it('non-codex: still clears a pick the session does not advertise (strict, no switch attempt)', async () => {
    const manager = makeManager('qwen', { withAgent: enumeratingAgent() });
    const internals = manager as unknown as RestoreInternals;
    internals.persistedModelId = 'legacy-only-model';

    await internals.restorePersistedState();

    expect(internals.persistedModelId).toBeNull();
    expect(internals.agent.setModelByConfigOption).not.toHaveBeenCalled();
  });
});
