/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE OTHER HALF OF THE SPAWN-SITE CHAIN, EXECUTED.
 *
 * `wcoreSpawnRunOutputDir` proves the agent turns `conversationId` into the
 * right `WAYLAND_OUTPUT_DIR` on a real `spawn` call. It cannot see the link
 * ABOVE it: the manager is what knows which conversation this engine serves,
 * and if it stopped handing that down, every chat would look like a chat with
 * no run open and a scheduled run would publish nothing.
 *
 * So this drives the REAL `WCoreManager.start()` and reads the options the real
 * construction site passed. The engine itself is where the launch stops - the
 * agent is replaced by a capturing stand-in that throws, which is after the
 * handoff under test.
 *
 * The mock stack is the one `wcoreBuiltinMcpPublication` established for
 * driving this same path; only the agent double differs.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  agentOptions: [] as Array<{ conversationId?: string; workspace?: string }>,
}));

vi.mock('@process/agent/wcore', () => ({
  // A constructor function, not a class: the production site uses `new`, and a
  // class whose body is only a constructor is a lint error here.
  WCoreAgent: function WCoreAgentDouble(this: unknown, options: { conversationId?: string; workspace?: string }) {
    h.agentOptions.push(options);
    throw new Error('STOP_AFTER_AGENT_CONSTRUCTION');
  },
}));

vi.mock('@process/services/mcpServices/agents/WCoreMcpAgent', async (orig) => {
  const actual = await orig<typeof import('@process/services/mcpServices/agents/WCoreMcpAgent')>();
  return {
    ...actual,
    WCoreMcpAgent: class {
      installMcpServers() {
        return Promise.resolve({ success: true });
      }
    },
  };
});
vi.mock('@process/services/mcpServices/runtimeMcpServers', () => ({
  loadRuntimeMcpServers: vi.fn(async () => []),
}));
vi.mock('@process/services/mcpServices/McpService', () => ({
  mcpService: { attachOAuthTokens: vi.fn(async (servers: unknown[]) => servers) },
}));
vi.mock('@process/agent/wcore/profilePaths', () => ({
  acquireRuntimeLaunchAuthority: vi.fn(async () => ({
    raw: false,
    identity: { dir: '/launch/wayland-home' },
    release: async () => {},
  })),
}));
vi.mock('@process/agent/wcore/effectiveRuntimeActions', () => ({
  readRawEngineModePreference: vi.fn(async () => false),
  readOutputBudgetPreference: vi.fn(async () => undefined),
}));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({
    getConversationMessages: () => ({ data: [] }),
    getConversation: () => ({ success: false }),
    updateConversation: vi.fn(),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  })),
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: vi.fn() },
      confirmation: { add: { emit: vi.fn() }, update: { emit: vi.fn() }, remove: { emit: vi.fn() } },
    },
    cron: { onJobCreated: { emit: vi.fn() }, onJobRemoved: { emit: vi.fn() } },
  },
}));
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      isPackaged: () => false,
      getAppPath: () => null,
      getDataDir: () => '/tmp/wayland-test-data',
      getHomeDir: () => '/tmp/wayland-test-home',
      getTempDir: () => '/tmp',
      getName: () => 'Wayland',
      getVersion: () => '1.0.0',
    },
    worker: { fork: vi.fn() },
  }),
}));
vi.mock('@process/utils/initStorage', () => ({
  // WCoreManager.start reads getSystemDir().workDir to decide whether the
  // workspace it is about to spawn into is one it manages, which gates the
  // workspace-trust flag. Without this export the mock throws inside start().
  getSystemDir: vi.fn(() => ({ workDir: '/mock/work', cacheDir: '/mock/cache' })),
  ProcessConfig: { get: vi.fn(async () => undefined), set: vi.fn(async () => {}), remove: vi.fn(async () => {}) },
  ProcessChat: { get: vi.fn(async () => []) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainError: vi.fn(), mainLog: vi.fn(), mainWarn: vi.fn() }));
vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: { addJob: vi.fn(), removeJob: vi.fn(), listJobsByConversation: vi.fn(async () => []) },
}));
vi.mock('@process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => undefined),
  consumePendingSessionSkills: vi.fn(() => []),
  mergeLoadedSkillsExtra: vi.fn((x: unknown) => x),
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

import { WCoreManager } from '@process/task/WCoreManager';

const CONVERSATION = 'conv-morning-brief-day-2';

describe('WCoreManager hands the engine the conversation its run is keyed on', () => {
  beforeEach(() => {
    h.agentOptions.length = 0;
  });

  it('passes its own conversation id down to the engine it constructs', async () => {
    const model = { name: 'm', useModel: 'm', platform: 'openai', baseUrl: '' };
    const manager = new WCoreManager(
      { workspace: '/ws', conversation_id: CONVERSATION, model } as never,
      model as never
    );

    await expect(manager.start()).rejects.toThrow('STOP_AFTER_AGENT_CONSTRUCTION');

    // Control: the construction really happened, and it really carried the
    // workspace - so an absent conversation id below would be an absence, not
    // an empty options bag.
    expect(h.agentOptions.length).toBeGreaterThan(0);
    expect(h.agentOptions[0].workspace).toBe('/ws');
    for (const options of h.agentOptions) {
      expect(options.conversationId).toBe(CONVERSATION);
    }
  });
});
