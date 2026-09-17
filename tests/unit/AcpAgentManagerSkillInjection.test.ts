import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track calls to buildFirstMessageRulesWithSkillsIndex
const { mockPrepareFirstMessage, mockAgentSendMessage, mockConsumePendingSessionSkills } = vi.hoisted(() => ({
  mockPrepareFirstMessage: vi.fn(async (_config: unknown) => ({ rules: '[injected]', loadedSkills: [] })),
  mockAgentSendMessage: vi.fn(async () => ({ success: true })),
  mockConsumePendingSessionSkills: vi.fn(async (_conversationId: string) => ''),
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
  buildFirstMessageRulesWithSkillsIndex: mockPrepareFirstMessage,
  consumePendingSessionSkills: mockConsumePendingSessionSkills,
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

describe('AcpAgentManager - first-message skill injection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses native skills (no prompt injection) for supported backend without customWorkspace', async () => {
    const manager = createManager({
      backend: 'claude',
      customWorkspace: false,
      presetContext: 'You are helpful.',
      enabledSkills: ['pptx'],
    });

    await sendFirstMessage(manager);

    expect(mockPrepareFirstMessage).not.toHaveBeenCalled();
    // Should have injected presetContext directly into content
    const sentContent = mockAgentSendMessage.mock.calls[0][0].content as string;
    expect(sentContent).toContain('[Assistant Rules');
    expect(sentContent).toContain('You are helpful.');
    expect(sentContent).toContain('[User Request]');
  });

  it('sends a fuigo first message WITHOUT the rules: they ride session/new _meta.rules instead', async () => {
    // Real hasNativeSkillSupport from acpTypes (AcpAgentManager imports it from
    // there, not from initAgent). In the message, the persona alone put a
    // Smart Trader first turn at 36,180 bytes - over Fuigo's 25,000-byte
    // prompt offload, so the model's first act was `read_file prompt_0.txt`.
    const manager = createManager({
      backend: 'fuigo',
      customWorkspace: false,
      presetContext: 'You are Concierge.',
      enabledSkills: ['cron'],
    });

    await sendFirstMessage(manager, 'Say hi');

    expect(mockPrepareFirstMessage).not.toHaveBeenCalled();
    const sentContent = mockAgentSendMessage.mock.calls[0][0].content as string;
    expect(sentContent).not.toContain('[Available Skills]');
    expect(sentContent).not.toContain('[Skills Location]');
    expect(sentContent).not.toContain('[Assistant Rules');
    expect(sentContent).not.toContain('You are Concierge.');
    expect(sentContent).not.toContain('Team Mode');
    // Only the per-turn Output Directive may precede the user's own text.
    expect(sentContent.endsWith('\n\nSay hi')).toBe(true);
    expect(sentContent.replace(/^\[Output Directive\][\s\S]*?\[\/Output Directive\]\n\n/, '')).toBe('Say hi');

    // ...and the same rules are what the session is created with.
    const rules = await (
      manager as unknown as { buildFuigoSessionRules(d: unknown): Promise<string> }
    ).buildFuigoSessionRules({ backend: 'fuigo' });
    expect(rules).toContain('You are Concierge.');
    expect(rules).not.toContain('[User Request]');
  });

  it("puts turn-1 session skills into a NEW fuigo session's rules, never into a resumed one", async () => {
    mockConsumePendingSessionSkills.mockResolvedValue('[Skill added to this chat: concierge]\nHow-to body');
    const manager = createManager({ backend: 'fuigo', customWorkspace: false, presetContext: 'You are Concierge.' });
    const build = (d: unknown) =>
      (manager as unknown as { buildFuigoSessionRules(d: unknown): Promise<string> }).buildFuigoSessionRules(d);

    const created = await build({ backend: 'fuigo' });
    expect(created).toContain('You are Concierge.');
    expect(created).toContain('[Skill added to this chat: concierge]');
    expect(mockConsumePendingSessionSkills).toHaveBeenCalledWith('test-conv');

    // Fuigo ignores rules on session/load, so a pending skill consumed here
    // would be marked injected and silently lost - it must stay per-turn.
    mockConsumePendingSessionSkills.mockClear();
    const resumed = await build({ backend: 'fuigo', acpSessionId: '01a09d0b-1a6c-7ee3-94da-d873016bff1e' });
    expect(resumed).not.toContain('[Skill added to this chat');
    expect(mockConsumePendingSessionSkills).not.toHaveBeenCalled();
    mockConsumePendingSessionSkills.mockResolvedValue('');
  });

  // Fuigo 1.0.16 drops `<human_rules>` from the system prompt on any
  // session/set_model that changes the model (measured live: chat history
  // 40,580 -> 9,780 B, persona word forgotten, still gone after session/load).
  it('re-sends the rules on the next fuigo turn after a model switch dropped them, then stops', async () => {
    const manager = createManager({ backend: 'fuigo', customWorkspace: false, presetContext: 'You are Smart Trader.' });
    (manager as unknown as { fuigoRulesStale: boolean }).fuigoRulesStale = true;

    await sendFirstMessage(manager, 'research MAs');
    const resent = mockAgentSendMessage.mock.calls[0][0].content as string;
    expect(resent).toContain('[Assistant Rules - You MUST follow these instructions]\nYou are Smart Trader.');
    expect(resent).toContain('[User Request]\nresearch MAs');
    expect((manager as unknown as { fuigoRulesStale: boolean }).fuigoRulesStale).toBe(false);

    await manager.sendMessage({ content: 'and HMA?', msg_id: 'msg-2' });
    const next = mockAgentSendMessage.mock.calls[1][0].content as string;
    expect(next).not.toContain('[Assistant Rules');
    expect(next.endsWith('and HMA?')).toBe(true);
  });

  it('marks the fuigo rules stale when set_model really changes the live model, not on a same-model set', async () => {
    const manager = createManager({ backend: 'fuigo', customWorkspace: false, presetContext: 'You are Smart Trader.' });
    let live = 'flux-auto';
    const agent = {
      sendMessage: mockAgentSendMessage,
      on: vi.fn().mockReturnThis(),
      getModelInfo: vi.fn(() => ({ currentModelId: live, availableModels: [] })),
      setModelByConfigOption: vi.fn(async (id: string) => {
        live = id;
        return { currentModelId: id, availableModels: [] };
      }),
    };
    const internals = manager as unknown as Record<string, unknown>;
    internals.agent = agent;
    internals.bootstrap = Promise.resolve(agent);
    internals.computeFluxRouting = vi.fn(async () => ({ routing: 'unknown' }));

    await manager.setModel('flux-auto');
    expect(internals.fuigoRulesStale).toBe(false);

    await manager.setModel('flux-reasoning');
    expect(agent.setModelByConfigOption).toHaveBeenLastCalledWith('flux-reasoning');
    expect(internals.fuigoRulesStale).toBe(true);
  });

  it('falls back to prompt injection for supported backend WITH customWorkspace', async () => {
    const manager = createManager({
      backend: 'claude',
      customWorkspace: true,
      presetContext: 'You are helpful.',
      enabledSkills: ['pptx'],
    });

    await sendFirstMessage(manager);

    expect(mockPrepareFirstMessage).toHaveBeenCalledWith({
      workspace: '/tmp/test-workspace',
      conversationId: 'test-conv',
      presetContext: 'You are helpful.',
      enabledSkills: ['pptx'],
      enableTeamGuide: true,
      backend: 'claude',
    });
    const sentContent = mockAgentSendMessage.mock.calls[0][0].content as string;
    expect(sentContent).toContain(
      '[Assistant Rules - You MUST follow these instructions]\n[injected]\n\n[User Request]\nHello'
    );
  });

  it('falls back to prompt injection for unsupported backend regardless of customWorkspace', async () => {
    const manager = createManager({
      backend: 'auggie',
      customWorkspace: false,
      presetContext: 'Some rules',
      enabledSkills: ['pdf'],
    });

    await sendFirstMessage(manager);

    expect(mockPrepareFirstMessage).toHaveBeenCalledWith({
      workspace: '/tmp/test-workspace',
      conversationId: 'test-conv',
      presetContext: 'Some rules',
      enabledSkills: ['pdf'],
      enableTeamGuide: false,
      backend: 'auggie',
    });
  });

  it('injects team guide prompt even when presetContext is undefined (native path, whitelisted backend)', async () => {
    const manager = createManager({
      backend: 'claude',
      customWorkspace: false,
    });

    await sendFirstMessage(manager, 'Test message');

    expect(mockPrepareFirstMessage).not.toHaveBeenCalled();
    const sentContent = mockAgentSendMessage.mock.calls[0][0].content as string;
    // claude is whitelisted for team guide → content should include team guide prompt
    expect(sentContent).toContain('[Assistant Rules');
    expect(sentContent).toContain('Team Mode');
    expect(sentContent).toContain('[User Request]');
    expect(sentContent).toContain('Test message');
  });
});
