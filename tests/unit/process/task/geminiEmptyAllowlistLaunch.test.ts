/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 follow-up - "Disable all" must silence a connector, not break it.
 *
 * Threading `allowedTools` into the Gemini runtime as `includeTools` made the
 * per-tool switches real, but it also made the existing "Disable all" button
 * (which persists `allowedTools: []`) emit a connector that discovers ZERO
 * tools. aioncli-core treats zero prompts AND zero tools as a failed
 * connection: it throws, emits error feedback, and marks the server
 * DISCONNECTED. The user would get an error toast and a red connector instead
 * of "connector on, tools off".
 *
 * These tests cover the RUNTIME OUTCOME, not just the emitted config shape:
 *  - the real aioncli-core `discoverTools` is executed and proven to return
 *    zero tools for `includeTools: []`,
 *  - the real `discoverPrompts` is executed and proven to return zero prompts
 *    for a prompt-less server,
 *  - the installed `connectAndDiscover` is pinned to still turn that pair into
 *    a throw, so this workaround's premise breaks loudly if the dep changes,
 *  - and the real `GeminiAgentManager.getMcpServers` is driven end to end to
 *    prove the connector never reaches that path in the first place.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { discoverPrompts, discoverTools } from '@office-ai/aioncli-core/dist/src/tools/mcp-client.js';
import type { IMcpServer } from '@/common/config/storage';

// ---------------------------------------------------------------------------
// Part 1 - real aioncli-core runtime behaviour (no mocks on the dependency)
// ---------------------------------------------------------------------------

/** Minimal MCP client stub: advertises tools, publishes two of them, no prompts. */
const clientWithTwoToolsAndNoPrompts = () =>
  ({
    getServerCapabilities: () => ({ tools: {} }),
    listTools: async () => ({
      tools: [
        { name: 'search_files', description: 'search', inputSchema: { type: 'object', properties: {} } },
        { name: 'delete_everything', description: 'delete', inputSchema: { type: 'object', properties: {} } },
      ],
    }),
  }) as unknown as Parameters<typeof discoverTools>[2];

const cliConfigStub = () =>
  ({
    getPolicyEngine: () => ({ addRule: () => {} }),
  }) as unknown as Parameters<typeof discoverTools>[3];

describe('#998 aioncli-core runtime: an empty includeTools discovers nothing', () => {
  it('discoverTools returns zero tools when includeTools is empty', async () => {
    const tools = await discoverTools(
      'workspace',
      { includeTools: [] } as unknown as Parameters<typeof discoverTools>[1],
      clientWithTwoToolsAndNoPrompts(),
      cliConfigStub(),
      undefined as unknown as Parameters<typeof discoverTools>[4],
      undefined
    );

    expect(tools).toEqual([]);
  });

  it('discoverPrompts returns zero prompts for a server that publishes none', async () => {
    const prompts = await discoverPrompts(
      'workspace',
      clientWithTwoToolsAndNoPrompts(),
      undefined as unknown as Parameters<typeof discoverPrompts>[2]
    );

    expect(prompts).toEqual([]);
  });

  it('connectAndDiscover still turns zero prompts + zero tools into a throw', () => {
    // Dependency-contract pin, deliberately a source assertion: driving the real
    // connectAndDiscover would require spawning an MCP server. If a future
    // aioncli-core stops failing the connection on an empty discovery, this
    // breaks and the workaround above can be revisited rather than silently kept.
    const require_ = createRequire(import.meta.url);
    const source = readFileSync(require_.resolve('@office-ai/aioncli-core/dist/src/tools/mcp-client.js'), 'utf-8');

    expect(source).toContain('if (prompts.length === 0 && tools.length === 0)');
    expect(source).toContain("throw new Error('No prompts or tools found on the server.')");
    expect(source).toContain('MCPServerStatus.DISCONNECTED');
  });
});

// ---------------------------------------------------------------------------
// Part 2 - the real GeminiAgentManager never emits such a connector
// ---------------------------------------------------------------------------

const mcpState = vi.hoisted(() => ({ servers: [] as IMcpServer[] }));

const mockIpcBridge = vi.hoisted(() => ({
  geminiConversation: { responseStream: { emit: vi.fn() } },
  conversation: { responseStream: { emit: vi.fn() } },
}));

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
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn().mockResolvedValue({
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
  }),
}));
vi.mock('@process/services/mcpServices/runtimeMcpServers', () => ({
  loadRuntimeMcpServers: vi.fn(async () => mcpState.servers),
}));
vi.mock('@process/services/mcpServices/McpService', () => ({
  mcpService: { attachOAuthTokens: vi.fn(async (servers: IMcpServer[]) => servers) },
}));
vi.mock('@process/team/mcp/guide/teamGuideSingleton', () => ({ getTeamGuideStdioConfig: vi.fn(() => undefined) }));
vi.mock('@process/team/teamEventBus', () => ({ teamEventBus: { emit: vi.fn() } }));
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
vi.mock('../../../../src/process/task/AcpSkillManager', () => ({
  detectSkillLoadRequest: vi.fn(() => false),
  AcpSkillManager: {
    getInstance: vi.fn(() => ({
      discoverSkills: vi.fn().mockResolvedValue(undefined),
      getBuiltinSkillsIndex: vi.fn(() => []),
    })),
  },
  buildSkillContentText: vi.fn(() => ''),
}));
vi.mock('../../../../src/process/task/CronCommandDetector', () => ({ hasCronCommands: vi.fn(() => false) }));
vi.mock('../../../../src/process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(() => ''),
  processCronInMessage: vi.fn(),
}));
vi.mock('../../../../src/process/task/ThinkTagDetector', () => ({
  stripThinkTags: vi.fn((value: string) => value),
  extractAndStripThinkTags: vi.fn((value: string) => ({ thinking: '', content: value })),
}));
vi.mock('../../../../src/process/task/agentUtils', () => ({ buildSystemInstructionsWithSkillsIndex: vi.fn(() => '') }));
vi.mock('../../../../src/process/agent/gemini/GeminiApprovalStore', () => ({
  GeminiApprovalStore: class {
    allApproved() {
      return false;
    }
    approveAll() {}
  },
}));
vi.mock('../../../../src/process/agent/gemini/cli/tools/tools', () => ({ ToolConfirmationOutcome: {} }));
vi.mock('@office-ai/aioncli-core', () => ({
  AuthType: { LOGIN_WITH_GOOGLE: 'LOGIN_WITH_GOOGLE', USE_VERTEX_AI: 'USE_VERTEX_AI' },
  getOauthInfoWithCache: vi.fn().mockResolvedValue(null),
  Storage: { getOAuthCredsPath: vi.fn(() => '/fake/oauth') },
}));
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, default: actual };
});
vi.mock('../../../../src/process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('../../../../src/process/task/BaseAgentManager', () => ({
  default: class BaseAgentManager {
    conversation_id = 'conv-test';
    status = 'pending';
    type = 'gemini';
    yoloMode = false;
    constructor(_type: string, _data: unknown, _emitter: unknown) {
      if (typeof (this as { init?: () => void }).init === 'function') {
        (this as { init: () => void }).init();
      }
    }
    init() {}
    on() {
      return () => {};
    }
    emit() {}
    stop = vi.fn().mockResolvedValue(undefined);
    kill = vi.fn();
    getConfirmations() {
      return [];
    }
    addConfirmation() {}
    confirm = vi.fn();
    postMessagePromise = vi.fn().mockResolvedValue(undefined);
  },
}));

import { GeminiAgentManager } from '../../../../src/process/task/GeminiAgentManager';

const MODEL = {
  name: 'gemini',
  useModel: 'gemini-2.0-flash',
  platform: 'google',
  baseUrl: '',
} as Parameters<typeof GeminiAgentManager.prototype.constructor>[1];

const connector = (allowedTools?: string[]): IMcpServer =>
  ({
    id: 'srv-1',
    name: 'workspace',
    enabled: true,
    status: 'connected',
    source: 'library',
    transport: { type: 'stdio', command: 'uvx', args: ['google-workspace-mcp'] },
    allowedTools,
    tools: [{ name: 'search_files' }, { name: 'delete_everything' }],
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
  }) as IMcpServer;

function createManager(): GeminiAgentManager {
  vi.spyOn(GeminiAgentManager.prototype as unknown as Record<string, unknown>, 'createBootstrap').mockResolvedValue(
    undefined
  );
  return new GeminiAgentManager({ workspace: '/ws', conversation_id: 'conv-test' }, MODEL);
}

const emittedMcpConfig = async (): Promise<Record<string, { includeTools?: string[] }>> => {
  const manager = createManager() as unknown as {
    getMcpServers: () => Promise<Record<string, { includeTools?: string[] }>>;
  };
  return manager.getMcpServers();
};

describe('#998 GeminiAgentManager.getMcpServers and the empty allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('omits a connector whose every tool is switched off, instead of breaking it', async () => {
    mcpState.servers = [connector([])];

    const config = await emittedMcpConfig();

    // Not emitted at all - so aioncli-core never connects it, never discovers
    // zero tools, never throws, and never marks it disconnected.
    expect(config).not.toHaveProperty('workspace');
    expect(Object.keys(config)).toEqual([]);
  });

  it('emits a scoped connector with exactly the enabled tools', async () => {
    mcpState.servers = [connector(['search_files'])];

    const config = await emittedMcpConfig();

    expect(config.workspace.includeTools).toEqual(['search_files']);
  });

  it('emits an unscoped connector with no includeTools at all', async () => {
    mcpState.servers = [connector(undefined)];

    const config = await emittedMcpConfig();

    expect(config.workspace).not.toHaveProperty('includeTools');
  });

  it('does not declare the dropped connector as an expected session receipt', async () => {
    // The drop happens BEFORE beginMcpSession, so the launch does not sit
    // waiting on a publication that can never arrive.
    mcpState.servers = [connector([])];
    const manager = createManager() as unknown as {
      getMcpServers: () => Promise<unknown>;
      mcpSessionState: { expectedServerNames: string[] };
    };

    await manager.getMcpServers();

    expect(manager.mcpSessionState.expectedServerNames).toEqual([]);
  });
});
