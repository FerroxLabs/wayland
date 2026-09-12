import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Track calls to prepareFirstMessageWithSkillsIndex
const { mockPrepareFirstMessage, mockAgentSendMessage } = vi.hoisted(() => ({
  mockPrepareFirstMessage: vi.fn(async (content: string) => ({ content: `[injected] ${content}`, loadedSkills: [] })),
  mockAgentSendMessage: vi.fn(async () => ({ success: true })),
}));

// --- Module mocks ---

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: {
      fork: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        postMessage: vi.fn(),
        kill: vi.fn(),
      })),
    },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    acpConversation: { responseStream: { emit: vi.fn() } },
    conversation: {
      confirmation: {
        add: { emit: vi.fn() },
        update: { emit: vi.fn() },
        remove: { emit: vi.fn() },
      },
      responseStream: { emit: vi.fn() },
      listChanged: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emitAgentMessage: vi.fn() },
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({
    updateConversation: vi.fn(),
    getConversation: vi.fn(() => ({ success: true, data: { extra: {}, source: 'wayland' } })),
  })),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => {
      if (key === 'acp.cachedInitializeResult') {
        // Provide cached init results so shouldInjectTeamGuideMcp returns true for claude/gemini
        return {
          claude: {
            protocolVersion: 1,
            capabilities: {
              loadSession: false,
              promptCapabilities: { image: false, audio: false, embeddedContext: false },
              mcpCapabilities: { stdio: true, http: false, sse: false },
              sessionCapabilities: { fork: null, resume: null, list: null, close: null },
              _meta: {},
            },
            agentInfo: null,
            authMethods: [],
          },
        };
      }
      return null;
    }),
    set: vi.fn(async () => {}),
  },
}));

vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
  nextTickToLocalFinish: vi.fn(),
}));

vi.mock('@process/utils/previewUtils', () => ({
  handlePreviewOpenEvent: vi.fn(),
}));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn() },
}));

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));

vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getAcpAdapters: () => [] }) },
}));

vi.mock('@/common/utils', () => ({
  parseError: vi.fn((e: unknown) => String(e)),
  uuid: vi.fn(() => 'mock-uuid'),
}));

vi.mock('@process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(),
  processCronInMessage: vi.fn(),
}));

vi.mock('@process/task/ThinkTagDetector', () => ({
  stripThinkTags: vi.fn((s: string) => s),
}));

vi.mock('@process/task/CronCommandDetector', () => ({
  hasCronCommands: vi.fn(() => false),
}));

// Mock hasNativeSkillSupport to use real logic for known backends
vi.mock('@process/utils/initAgent', () => ({
  hasNativeSkillSupport: vi.fn((backend: string | undefined) => {
    const supported = ['gemini', 'claude', 'codebuddy', 'codex', 'qwen', 'goose', 'droid', 'kimi', 'vibe', 'cursor'];
    return !!backend && supported.includes(backend);
  }),
  setupAssistantWorkspace: vi.fn(),
}));

vi.mock('@process/task/agentUtils', () => ({
  prepareFirstMessageWithSkillsIndex: mockPrepareFirstMessage,
  buildSystemInstructions: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => ({ advert: '', autoLoaded: [] })),
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

vi.mock('@process/services/constitution/composePrompt', () => ({
  composePrompt: ({ basePrompt = '' }: { basePrompt?: string }) => ({
    text: basePrompt,
    approxTokens: Math.ceil(basePrompt.length / 4),
    anthropicCacheControl: { type: 'ephemeral' as const },
    hadOverlay: false,
    constitutionSupported: true,
  }),
}));

// Mock AcpAgent class
vi.mock('@process/agent/acp', () => ({
  AcpAgent: vi.fn().mockImplementation(() => ({
    sendMessage: mockAgentSendMessage,
    getModelInfo: vi.fn(() => null),
    getSessionState: vi.fn(() => null),
    stop: vi.fn(),
    kill: vi.fn(),
    on: vi.fn().mockReturnThis(),
  })),
}));

import AcpAgentManager from '@process/task/AcpAgentManager';
import { addMessage } from '@process/utils/message';
import { clearRunOutputDirs, openRunOutputDir } from '@process/services/artifacts/runOutputDir';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function createManager(
  overrides: {
    backend?: string;
    customWorkspace?: boolean;
    presetContext?: string;
    enabledSkills?: string[];
  } = {}
) {
  const data = {
    conversation_id: 'test-conv',
    backend: overrides.backend ?? 'claude',
    workspace: '/tmp/test-workspace',
    customWorkspace: overrides.customWorkspace,
    presetContext: overrides.presetContext,
    enabledSkills: overrides.enabledSkills,
  };
  // @ts-expect-error - backend type narrowing
  const manager = new AcpAgentManager(data);
  return manager;
}

async function sendFirstMessage(manager: InstanceType<typeof AcpAgentManager>, content = 'Hello') {
  // Stub initAgent to set up a mock agent without actual process bootstrapping
  const mockAgent = {
    sendMessage: mockAgentSendMessage,
    getModelInfo: vi.fn(() => null),
    on: vi.fn().mockReturnThis(),
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- accessing private fields for test setup
  (manager as unknown as Record<string, unknown>).agent = mockAgent;
  (manager as unknown as Record<string, unknown>).bootstrap = Promise.resolve(mockAgent);

  // Override initAgent to just return the already-bootstrapped agent
  vi.spyOn(manager, 'initAgent').mockResolvedValue(mockAgent as never);

  return manager.sendMessage({ content, msg_id: 'msg-1' });
}

/**
 * THE DELIVERABLES DIRECTIVE RIDES THE OUTGOING PROMPT, NOT THE MESSAGE STORE.
 *
 * Core told the engine where a turn's deliverables go on `--system-prompt`. That
 * channel left with Core, and a Fuigo routine then wrote wherever the model
 * guessed, staged nothing and settled as `no-output` (live: "[CronExecutor] ...
 * produced no output; nothing published"). The directive now prepends the
 * content handed to the agent on every genuine turn, resolved from the single
 * producer (`resolveOutputDir`). It must NOT reach the persisted message: a
 * conversation read is allowed to a paired WebUI and the absolute staging path
 * is exactly what `artifacts.list` is denied for.
 */
describe('AcpAgentManager - output directive on the outgoing turn', () => {
  let ws: string;
  beforeEach(() => {
    vi.clearAllMocks();
    clearRunOutputDirs();
    ws = mkdtempSync(path.join(tmpdir(), 'acp-directive-'));
  });
  afterEach(() => rmSync(ws, { recursive: true, force: true }));

  function managerIn(workspace: string) {
    return new AcpAgentManager({ conversation_id: 'test-conv', backend: 'fuigo', workspace });
  }

  it("prepends the open run's staging directory to what the agent receives, and keeps it out of the stored message", async () => {
    const staging = path.join(ws, 'artifacts', 'market', '.staging', 'run-7');
    mkdirSync(staging, { recursive: true });
    openRunOutputDir('test-conv', 'run-7', staging);

    await sendFirstMessage(managerIn(ws), 'Produce the brief.');

    const sent = mockAgentSendMessage.mock.calls[0][0] as { content: string };
    expect(sent.content).toContain('[Output Directive]');
    expect(sent.content).toContain(`go in ${staging}.`);
    expect(sent.content).toContain('do NOT print it');
    expect(sent.content).toContain('Produce the brief.');
    for (const call of vi.mocked(addMessage).mock.calls) {
      expect(JSON.stringify(call[0])).not.toContain(staging);
    }
  });

  it('names the permanent chat namespace for an ordinary chat turn', async () => {
    await sendFirstMessage(managerIn(ws), 'Write me a report.');

    const sent = mockAgentSendMessage.mock.calls[0][0] as { content: string };
    expect(sent.content).toContain(path.join(ws, 'artifacts', 'chat', 'test-conv'));
    expect(sent.content).not.toContain('staging area');
  });

  it("a scheduled run's prompt is `hidden` (a cron card stands in for it) and still gets the directive", async () => {
    const staging = path.join(ws, 'artifacts', 'market', '.staging', 'run-8');
    mkdirSync(staging, { recursive: true });
    openRunOutputDir('test-conv', 'run-8', staging);
    const manager = managerIn(ws);
    const mockAgent = {
      sendMessage: mockAgentSendMessage,
      getModelInfo: vi.fn(() => null),
      on: vi.fn().mockReturnThis(),
    };
    (manager as unknown as Record<string, unknown>).agent = mockAgent;
    (manager as unknown as Record<string, unknown>).bootstrap = Promise.resolve(mockAgent);
    vi.spyOn(manager, 'initAgent').mockResolvedValue(mockAgent as never);

    await manager.sendMessage({ content: '[Scheduled Task Context] run it', msg_id: 'msg-h', hidden: true });

    const sent = mockAgentSendMessage.mock.calls[0][0] as { content: string };
    expect(sent.content).toContain(`go in ${staging}.`);
  });
});
