/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The env that actually reaches an ACP spawn, asserted at the handoff -
 * `resolveAgentCliConfig().customEnv` is the exact record `createSpawnConfig`
 * applies over the child's environment, so a key present here is a key the
 * agent can spend.
 *
 * #1039 (money): Wayland Nano advertises every connected provider, and
 * `buildConnectedProviderEnv` used to hand it every connected provider's API
 * key. A user who connected an Anthropic key for Claude Code therefore had Nano
 * spend it, without choosing Anthropic for Nano and with nothing in the UI
 * saying so. Nano's credentials must be scoped to the provider the user
 * actually directed at it - the provider that owns the chat's selected model.
 *
 * #1027: user-level Claude Code hooks are deliberately NOT seeded into the
 * Flux-scoped CLAUDE_CONFIG_DIR (see claudeConfig.ts - a Flux turn must not run
 * the user's arbitrary hook commands). Silently dropping a policy the user
 * believes is enforcing is the defect, so the spawn has to SAY so.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

const {
  mockGet,
  mockIsCliAvailable,
  mockResolveWNanoBinary,
  mockReadConnectedFluxKey,
  mockAddMessage,
  mockMaterializeFluxClaudeConfigDir,
  mockReadDroppedUserHookEvents,
  repoState,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockIsCliAvailable: vi.fn(),
  mockResolveWNanoBinary: vi.fn(),
  mockReadConnectedFluxKey: vi.fn(),
  mockAddMessage: vi.fn(),
  mockMaterializeFluxClaudeConfigDir: vi.fn(),
  mockReadDroppedUserHookEvents: vi.fn(),
  repoState: {
    providers: [] as Array<{ providerId: string; state: string }>,
    creds: {} as Record<string, string>,
    catalog: {} as Record<string, string[]>,
  },
}));

vi.mock('electron', () => ({ app: { getPath: () => '/tmp/wayland-test-userdata' } }));
vi.mock('@process/agent/acp/AcpDetector', () => ({ acpDetector: { isCliAvailable: mockIsCliAvailable } }));
vi.mock('@process/agent/wnano/binaryResolver', () => ({ resolveWNanoBinary: mockResolveWNanoBinary }));
vi.mock('@process/connectors/fluxKey', () => ({ readConnectedFluxKey: mockReadConnectedFluxKey }));
vi.mock('@process/task/claudeConfig', () => ({
  materializeFluxClaudeConfigDir: mockMaterializeFluxClaudeConfigDir,
  readDroppedUserHookEvents: mockReadDroppedUserHookEvents,
  buildDroppedUserHooksNotice: (events: readonly string[]) =>
    `Your user-level Claude Code hooks (${events.join(', ')}) do not run on a Flux-routed turn.`,
}));
vi.mock('@process/task/codexConfig', () => ({
  getCodexSandboxModeForSessionMode: vi.fn(() => 'workspace-write'),
  materializeFluxCodexHome: vi.fn(async () => '/tmp/codex-home'),
  materializeNativeCodexHome: vi.fn(async () => '/tmp/codex-home'),
  normalizeCodexSandboxMode: vi.fn(() => 'workspace-write'),
}));
vi.mock('@process/task/hermesConfig', () => ({ materializeFluxHermesHome: vi.fn(async () => '/tmp/hermes-home') }));
vi.mock('@process/task/wnano', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    writeWnanoFluxKeyFile: vi.fn(async () => '/tmp/flux-key-file'),
    cleanupWnanoFluxKeyFile: vi.fn(async () => undefined),
    buildWnanoOAuthBearerEnv: vi.fn(async () => ({})),
  };
});
vi.mock('@process/providers/storage/ProviderRepository', () => ({
  ProviderRepository: class {
    listRegistryProviders() {
      return repoState.providers;
    }
    getRegistryProviderCreds(id: string) {
      const key = repoState.creds[id];
      return key === undefined ? { status: 'missing' } : { status: 'ok', creds: { key } };
    }
    getRegistryCatalog(id: string) {
      return (repoState.catalog[id] ?? []).map((m) => ({ id: m, providerId: id }));
    }
    listCustomModels() {
      return [];
    }
    listRegistryOverrides() {
      return [];
    }
  },
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
  getDatabase: vi.fn(() =>
    Promise.resolve({ updateConversation: vi.fn(), getConversation: vi.fn(), getDriver: () => ({}) })
  ),
}));
vi.mock('@process/utils/message', () => ({
  addMessage: mockAddMessage,
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
}));
vi.mock('@/common/utils', () => ({ parseError: vi.fn((e: unknown) => e), uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(), uuid: vi.fn(() => 'uuid') }));

import AcpAgentManager from '@process/task/AcpAgentManager';

type SpawnData = { backend: string; currentModelId?: string; conversation_id?: string };

async function spawnEnv(data: SpawnData): Promise<Record<string, string>> {
  const manager = new AcpAgentManager({
    conversation_id: data.conversation_id ?? 'c1',
    backend: data.backend,
    workspace: '/tmp/ws',
  } as never);
  const resolved = await (
    manager as unknown as {
      resolveAgentCliConfig: (d: SpawnData) => Promise<{ customEnv?: Record<string, string> }>;
    }
  ).resolveAgentCliConfig({ conversation_id: 'c1', ...data });
  return resolved.customEnv ?? {};
}

describe('ACP spawn env scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(undefined);
    mockIsCliAvailable.mockReturnValue(true);
    mockResolveWNanoBinary.mockReturnValue('/opt/wayland-nano');
    mockReadConnectedFluxKey.mockResolvedValue(undefined);
    mockMaterializeFluxClaudeConfigDir.mockResolvedValue('/tmp/flux-claude-home');
    mockReadDroppedUserHookEvents.mockResolvedValue([]);
    repoState.providers = [
      { providerId: 'anthropic', state: 'connected' },
      { providerId: 'openai', state: 'connected' },
    ];
    repoState.creds = { anthropic: 'sk-ant-user-key', openai: 'sk-openai-user-key' };
    repoState.catalog = { anthropic: ['claude-opus-4-8'], openai: ['gpt-5.6-terra'] };
  });

  // ── #1039 ────────────────────────────────────────────────────────────────
  it('does not hand Nano the Anthropic key when the chat is bound to an OpenAI model', async () => {
    const env = await spawnEnv({ backend: 'wnano', currentModelId: 'openai:gpt-5.6-terra' });

    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBe('sk-openai-user-key');
  });

  it('hands Nano the Anthropic key only when the chat is bound to an Anthropic model', async () => {
    const env = await spawnEnv({ backend: 'wnano', currentModelId: 'anthropic:claude-opus-4-8' });

    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-user-key');
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('hands Nano no third-party provider key at all when no model has been picked', async () => {
    // The reported case: a fresh Nano chat, no explicit pick, and the user's
    // Anthropic key silently paying for it.
    const env = await spawnEnv({ backend: 'wnano' });

    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it('leaves every OTHER backend on the full connected-provider env', async () => {
    // Control: the scoping is wnano-only. A claude spawn must still receive the
    // registry key that overrides a stale shell export - delete the backend
    // guard and this is the assertion that fails.
    const env = await spawnEnv({ backend: 'claude', currentModelId: 'claude-opus-4-8' });

    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-user-key');
    expect(env.OPENAI_API_KEY).toBe('sk-openai-user-key');
  });

  // ── #1027 ────────────────────────────────────────────────────────────────
  it('tells the user, in the chat, that their user-level hooks do not run on a Flux turn', async () => {
    mockReadConnectedFluxKey.mockResolvedValue('flux-key');
    mockReadDroppedUserHookEvents.mockResolvedValue(['PreToolUse', 'Stop']);

    await spawnEnv({ backend: 'claude', currentModelId: 'flux-auto' });

    const notices = mockAddMessage.mock.calls
      .map((call) => String((call[1] as { content?: { content?: string } })?.content?.content ?? ''))
      .filter((text) => text.includes('PreToolUse'));
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('Stop');
  });

  it('says nothing when the user has no user-level hooks configured', async () => {
    mockReadConnectedFluxKey.mockResolvedValue('flux-key');
    mockReadDroppedUserHookEvents.mockResolvedValue([]);

    await spawnEnv({ backend: 'claude', currentModelId: 'flux-auto' });

    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  it('says nothing on a NATIVE claude turn, where the hooks do run', async () => {
    mockReadConnectedFluxKey.mockResolvedValue(undefined);
    mockReadDroppedUserHookEvents.mockResolvedValue(['PreToolUse']);

    await spawnEnv({ backend: 'claude', currentModelId: 'claude-opus-4-8' });

    expect(mockAddMessage).not.toHaveBeenCalled();
  });
});
