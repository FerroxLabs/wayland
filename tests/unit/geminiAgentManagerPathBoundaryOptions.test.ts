/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — the `path_boundary` arm in GeminiAgentManager.getConfirmationButtons
 * is a GUARD, not a formality, and this file exists so deleting it goes red.
 *
 * `default:` in that switch IS the mcp case. Drop the boundary arm and a
 * filesystem-boundary escalation falls through to it: it gets labelled
 * `messages.confirmation.allowMCPTool` and offered proceed_once /
 * proceed_always_tool / proceed_always_server. `proceed_always*` is exactly the
 * vocabulary Wayland's auto-approve paths match on, so the one decision that
 * widens filesystem authority OUTSIDE the workspace would arrive speaking the
 * words that get approved without a human. It must carry NO options here: this
 * surface cannot express a folder grant, and PathBoundaryConfirmCard is the
 * only place that can.
 *
 * Every assertion is paired with an `mcp` positive control in this same file.
 * Without one, these tests could pass because the fixture never reached the
 * switch at all — which is how the pre-existing suite stayed green with the arm
 * deleted.
 */
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
vi.mock('@process/permissions/workspaceTrust', () => ({ isWorkspaceTrusted: vi.fn(() => false) }));
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
// Mirrors the real enum in src/process/agent/gemini/cli/tools/tools.ts. The
// VALUES are the point of this file, so they are spelled out rather than
// stubbed to `{}`.
vi.mock('../../src/process/agent/gemini/cli/tools/tools', () => ({
  ToolConfirmationOutcome: {
    ProceedOnce: 'proceed_once',
    ProceedAlways: 'proceed_always',
    ProceedAlwaysServer: 'proceed_always_server',
    ProceedAlwaysTool: 'proceed_always_tool',
    ModifyWithEditor: 'modify_with_editor',
    Cancel: 'cancel',
  },
}));
vi.mock('@office-ai/aioncli-core', () => ({
  AuthType: { LOGIN_WITH_GOOGLE: 'LOGIN_WITH_GOOGLE', USE_VERTEX_AI: 'USE_VERTEX_AI' },
  getOauthInfoWithCache: vi.fn().mockResolvedValue(null),
  Storage: { getOAuthCredsPath: vi.fn(() => '/fake/oauth') },
}));
vi.mock('node:fs', () => ({ existsSync: vi.fn(() => false) }));
vi.mock('../../src/process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('../../src/process/task/BaseAgentManager', () => ({
  default: class BaseAgentManager {
    conversation_id = 'conv-1099';
    status = 'pending';
    type = 'gemini';
    yoloMode = false;
    confirmations: Array<Record<string, unknown>> = [];

    constructor(_type: string, _data: unknown, _emitter: unknown) {}

    init() {}
    on() {
      return () => {};
    }
    emit() {}
    stop = vi.fn().mockResolvedValue(undefined);
    kill = vi.fn();
    getConfirmations() {
      return this.confirmations;
    }
    addConfirmation(c: Record<string, unknown>) {
      this.confirmations.push(c);
    }
    confirm = vi.fn();
    postMessagePromise = vi.fn().mockResolvedValue(undefined);
  },
}));

import { GeminiAgentManager } from '../../src/process/task/GeminiAgentManager';

const ROOT = '/Users/sean/Documents/reports';
const TARGET = `${ROOT}/q3.md`;
const MCP_LABEL_KEY = 'messages.confirmation.allowMCPTool';
const WIDENING_OUTCOMES = ['proceed_once', 'proceed_always', 'proceed_always_tool', 'proceed_always_server'];

const boundaryDetails = {
  type: 'path_boundary' as const,
  title: `Read ${TARGET}`,
  target: TARGET,
  suggestedRoot: ROOT,
  access: 'read' as const,
};

const mcpDetails = {
  type: 'mcp' as const,
  title: 'Run search',
  toolName: 'search',
  toolDisplayName: 'Search the web',
  serverName: 'brave-search',
};

type Buttons = {
  question?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
};

function createManager() {
  // `getConfirmationButtons` is an instance FIELD, so a real construction is
  // required - Object.create(prototype) would not carry it. createBootstrap is
  // the only heavy step in the constructor and is stubbed on the prototype.
  vi.spyOn(
    GeminiAgentManager.prototype as unknown as { createBootstrap: () => Promise<void> },
    'createBootstrap'
  ).mockResolvedValue(undefined);
  const manager = new GeminiAgentManager({ workspace: '/test/workspace', conversation_id: 'conv-1099' }, {
    name: 'test-provider',
    useModel: 'test-model',
    baseUrl: '',
    platform: 'test',
  } as never);
  (manager as unknown as { currentMode: string }).currentMode = 'default';
  return manager;
}

function buttonsFor(manager: GeminiAgentManager, details: unknown): Buttons {
  return (
    manager as unknown as { getConfirmationButtons: (d: unknown, t: (k: string) => string) => Buttons }
  ).getConfirmationButtons(details, (k: string) => k);
}

function raiseCard(manager: GeminiAgentManager, callId: string, details: unknown) {
  (manager as unknown as { handleConformationMessage: (m: unknown) => void }).handleConformationMessage({
    id: 'msg-1',
    conversation_id: 'conv-1099',
    type: 'tool_group',
    content: [
      {
        callId,
        name: 'Read',
        description: TARGET,
        renderOutputAsMarkdown: false,
        status: 'Confirming',
        confirmationDetails: details,
      },
    ],
  });
  return (manager as unknown as { confirmations: Array<Record<string, unknown>> }).confirmations;
}

describe('#1099 GeminiAgentManager never offers MCP buttons for a path boundary', () => {
  let manager: GeminiAgentManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    manager = createManager();
  });

  it('offers a path_boundary NO options at all', () => {
    const { options } = buttonsFor(manager, boundaryDetails);
    expect(options).toEqual([]);
  });

  it('never offers a path_boundary proceed_once / proceed_always / _tool / _server', () => {
    const values = (buttonsFor(manager, boundaryDetails).options ?? []).map((o) => o.value);
    for (const outcome of WIDENING_OUTCOMES) {
      expect(values, `a folder grant must never speak ${outcome}`).not.toContain(outcome);
    }
  });

  it('never labels a path_boundary with the MCP string', () => {
    const { question } = buttonsFor(manager, boundaryDetails);
    expect(question).not.toBe(MCP_LABEL_KEY);
    // It describes the boundary itself, from the engine's own title/target.
    expect(question).toBe(boundaryDetails.title);
    expect(buttonsFor(manager, boundaryDetails).description).toBe(TARGET);
  });

  it('CONTROL: an mcp confirmation IS labelled with the MCP string and keeps its options', () => {
    const { question, options } = buttonsFor(manager, mcpDetails);
    expect(question).toBe(MCP_LABEL_KEY);
    expect((options ?? []).map((o) => o.value)).toEqual([
      'proceed_once',
      'proceed_always_tool',
      'proceed_always_server',
      'cancel',
    ]);
  });

  it('raises no confirmation card at all for a path boundary on this surface', () => {
    expect(raiseCard(manager, 'call-boundary', boundaryDetails)).toEqual([]);
  });

  it('CONTROL: an mcp confirmation DOES raise a card here, action mcp', () => {
    const cards = raiseCard(manager, 'call-mcp', mcpDetails);
    expect(cards).toHaveLength(1);
    expect(cards[0].action).toBe('mcp');
    expect((cards[0].options as Array<{ value: string }>).map((o) => o.value)).toContain('proceed_always_tool');
  });
});
