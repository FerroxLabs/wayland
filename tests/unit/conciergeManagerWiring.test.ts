/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Manager-level wiring guard for the Concierge capabilities manifest (Phase-2a
 * audit gap "tests-manager-wiring-uncovered").
 *
 * conciergeInjection.test.ts proves the system-prompt ASSEMBLERS embed the
 * manifest when handed one, and conciergeCapabilities.test.ts proves the GATING
 * (`resolveCapabilitiesManifest` builds for Concierge / intent-only otherwise).
 * What neither covers: that the MANAGER actually calls resolveCapabilitiesManifest
 * with the right presetAssistantId + agentKey and threads the result into the
 * assembler. A regression that deletes the `capabilitiesManifest:` line or passes
 * a wrong presetAssistantId would otherwise ship green. This pins that wiring for
 * WCoreManager - the engine the Concierge preset (`presetAgentType: 'wcore'`)
 * actually runs on.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const SENTINEL = 'CONCIERGE_MANIFEST_SENTINEL';

const { emitResponseStream, mockDb, agentStart, resolveCapabilitiesManifestMock, buildSystemInstructionsMock } =
  vi.hoisted(() => ({
    emitResponseStream: vi.fn(),
    mockDb: {
      getConversationMessages: vi.fn(() => ({ data: [] })),
      getConversation: vi.fn(() => ({ success: false })),
      updateConversation: vi.fn(),
      createConversation: vi.fn(() => ({ success: true })),
      insertMessage: vi.fn(),
      updateMessage: vi.fn(),
    },
    agentStart: vi.fn().mockResolvedValue(undefined),
    resolveCapabilitiesManifestMock: vi.fn(async () => undefined as string | undefined),
    buildSystemInstructionsMock: vi.fn(async () => undefined as string | undefined),
  }));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: emitResponseStream },
      confirmation: { add: { emit: vi.fn() }, update: { emit: vi.fn() }, remove: { emit: vi.fn() } },
    },
    cron: { onJobCreated: { emit: vi.fn() }, onJobRemoved: { emit: vi.fn() } },
    cost: { budgetGateBlocked: { emit: vi.fn() } },
  },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: { fork: vi.fn(() => ({ on: vi.fn().mockReturnThis(), postMessage: vi.fn(), kill: vi.fn() })) },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: vi.fn(() => ({})) }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn(() => Promise.resolve(mockDb)) }));
vi.mock('@process/services/database/export', () => ({ getDatabase: vi.fn(() => Promise.resolve(mockDb)) }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
  ProcessConfig: {
    get: vi.fn((key: string) => Promise.resolve(key === 'wcore.rawEngineMode' ? false : undefined)),
    remove: vi.fn(() => Promise.resolve()),
  },
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn(), addOrUpdateMessage: vi.fn() }));
vi.mock('@/common/utils', () => {
  let c = 0;
  return { uuid: vi.fn(() => `uuid-${++c}`) };
});
vi.mock('@/renderer/utils/common', () => {
  let c = 0;
  return { uuid: vi.fn(() => `pipe-${++c}`) };
});
vi.mock('@process/utils/mainLogger', () => ({ mainError: vi.fn(), mainLog: vi.fn(), mainWarn: vi.fn() }));
vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: function WCoreAgentMock(this: Record<string, unknown>) {
    this.start = agentStart;
    this.stop = vi.fn();
    this.kill = vi.fn();
    this.send = vi.fn().mockResolvedValue(undefined);
    this.approveTool = vi.fn();
    this.denyTool = vi.fn();
    this.setConfig = vi.fn();
    this.setMode = vi.fn();
    this.sendCommand = vi.fn();
    this.ping = vi.fn();
    this.isAlive = true;
    this.capabilities = null;
    this.injectConversationHistory = vi.fn().mockResolvedValue(undefined);
  },
}));

// The two functions under test are the manager's manifest wiring; everything
// else from agentUtils is best-effort and stubbed.
vi.mock('@/process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: buildSystemInstructionsMock,
  buildTurnSkillContext: vi.fn(async () => ({ advert: undefined, autoLoaded: [] })),
  consumePendingSessionSkills: vi.fn(async () => undefined),
  mergeLoadedSkillsExtra: vi.fn(async () => {}),
  resolveCapabilitiesManifest: resolveCapabilitiesManifestMock,
}));

import { WCoreManager } from '@/process/task/WCoreManager';

function createManager(presetAssistantId?: string, conversationId = 'conv-wire-1'): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
    presetAssistantId,
  };
  return new WCoreManager(data as Record<string, unknown>, data.model as Record<string, unknown>);
}

describe('WCoreManager capabilities-manifest wiring', () => {
  beforeEach(() => {
    emitResponseStream.mockClear();
    agentStart.mockReset();
    agentStart.mockResolvedValue(undefined);
    resolveCapabilitiesManifestMock.mockReset();
    resolveCapabilitiesManifestMock.mockResolvedValue(SENTINEL);
    buildSystemInstructionsMock.mockReset();
    buildSystemInstructionsMock.mockResolvedValue(undefined);
  });

  it('calls resolveCapabilitiesManifest with the Concierge preset id + wcore agentKey and threads the result into the assembler', async () => {
    const manager = createManager('builtin-concierge');
    await manager.sendMessage({ content: 'what can you do?', msg_id: 'm-wire-1' });

    expect(resolveCapabilitiesManifestMock).toHaveBeenCalledWith(
      expect.objectContaining({ presetAssistantId: 'builtin-concierge', agentKey: 'wcore' })
    );
    // The resolved manifest must be threaded into the system-prompt assembler.
    expect(buildSystemInstructionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ capabilitiesManifest: SENTINEL, presetAssistantId: 'builtin-concierge' })
    );
  });

  it('forwards a non-Concierge preset id unchanged (gating itself lives in resolveCapabilitiesManifest)', async () => {
    const manager = createManager('builtin-word-creator', 'conv-wire-2');
    await manager.sendMessage({ content: 'write me a poem', msg_id: 'm-wire-2' });

    expect(resolveCapabilitiesManifestMock).toHaveBeenCalledWith(
      expect.objectContaining({ presetAssistantId: 'builtin-word-creator', agentKey: 'wcore' })
    );
  });
});
