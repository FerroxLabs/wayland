/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default model for EVERY team agent (Teams "pick a default to get started").
 *
 * Before this fix `resolveConversationModel` returned an EMPTY model for all ACP
 * backends (codex/claude/qwen/…), so a new codex teammate opened on a dead
 * "Select Model" it could not start from — only gemini/wcore got a default.
 * `resolveDefaultAcpModel` now mirrors the gemini/wcore defaulting for ACP
 * backends, scoped to the provider the backend actually runs, and the resolved
 * default seeds AcpModelSelector's initialModelId (extra.currentModelId).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockConfigGet } = vi.hoisted(() => ({ mockConfigGet: vi.fn() }));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: mockConfigGet },
  getAssistantsDir: () => '/assistants',
}));

import { TeamSessionService } from '@process/team/TeamSessionService';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { IConversationService } from '@process/services/IConversationService';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';

function makeRepo(): ITeamRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMailboxByTeam: vi.fn(),
    deleteTasksByTeam: vi.fn(),
    writeMessage: vi.fn(),
    readUnread: vi.fn(),
    readUnreadAndMark: vi.fn(),
    markRead: vi.fn(),
    getMailboxHistory: vi.fn(),
    createTask: vi.fn(),
    findTaskById: vi.fn(),
    updateTask: vi.fn(),
    findTasksByTeam: vi.fn(),
    findTasksByOwner: vi.fn(),
    deleteTask: vi.fn(),
    appendToBlocks: vi.fn(),
    removeFromBlockedBy: vi.fn(),
    appendEvent: vi.fn(),
    listEvents: vi.fn(),
  } as unknown as ITeamRepository;
}

function makeConversationService(): IConversationService {
  return {
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversation: vi.fn(),
    getConversation: vi.fn(),
    createWithMigration: vi.fn(),
    listAllConversations: vi.fn(),
  } as unknown as IConversationService;
}

function makeProvider(o: {
  platform: string;
  model: string[];
  bridge?: string;
  modelEnabled?: Record<string, boolean>;
  enabled?: boolean;
  id?: string;
}): IProvider {
  const p: Record<string, unknown> = {
    id: o.id ?? o.platform,
    name: o.platform,
    platform: o.platform,
    baseUrl: '',
    apiKey: '',
    enabled: o.enabled ?? true,
    model: o.model,
  };
  if (o.modelEnabled) p.modelEnabled = o.modelEnabled;
  if (o.bridge) p.__waylandModelRegistryBridge = o.bridge;
  return p as unknown as IProvider;
}

type Probe = {
  resolveConversationModel: (p: {
    backend: string;
    isPreset: boolean;
    presetAgentType?: string;
  }) => Promise<TProviderWithModel>;
  resolveDefaultAcpModel: (backend: string) => Promise<TProviderWithModel>;
  buildConversationParams: (p: {
    teamId: string;
    teamName: string;
    workspace: string;
    agent: Record<string, unknown>;
    agents: Array<Record<string, unknown>>;
  }) => Promise<{ type: string; name: string; model: TProviderWithModel; extra: Record<string, unknown> }>;
};

const services: TeamSessionService[] = [];
function makeService(): Probe {
  const svc = new TeamSessionService(
    makeRepo(),
    { getOrBuildTask: vi.fn(), kill: vi.fn() } as never,
    makeConversationService()
  );
  services.push(svc);
  return svc as unknown as Probe;
}

/** Route ProcessConfig.get by key so buildConversationParams' three reads work. */
function config(opts: { modelConfig?: unknown; acpConfig?: unknown; cachedModels?: unknown; geminiDefault?: unknown }) {
  mockConfigGet.mockImplementation((key: string) => {
    switch (key) {
      case 'model.config':
        return Promise.resolve(opts.modelConfig);
      case 'acp.config':
        return Promise.resolve(opts.acpConfig);
      case 'acp.cachedModels':
        return Promise.resolve(opts.cachedModels);
      case 'gemini.defaultModel':
        return Promise.resolve(opts.geminiDefault);
      default:
        return Promise.resolve(undefined);
    }
  });
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
});

describe('TeamSessionService.resolveDefaultAcpModel / resolveConversationModel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gives codex a default from a connected OpenAI provider (first enabled model)', async () => {
    config({
      modelConfig: [
        makeProvider({
          platform: 'openai',
          bridge: 'v2:openai',
          model: ['gpt-5', 'gpt-4.1'],
          modelEnabled: { 'gpt-5': false },
        }),
      ],
    });
    const model = await makeService().resolveConversationModel({ backend: 'codex', isPreset: false });
    expect(model.platform).toBe('openai');
    expect(model.useModel).toBe('gpt-4.1'); // gpt-5 disabled, so first ENABLED wins
  });

  it('prefers the ChatGPT-subscription provider over metered OpenAI for codex', async () => {
    config({
      modelConfig: [
        makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5'] }),
        makeProvider({
          platform: 'openai-compatible',
          id: 'chatgpt-subscription',
          bridge: 'v2:chatgpt-subscription',
          model: ['gpt-5-codex'],
        }),
      ],
    });
    const model = await makeService().resolveConversationModel({ backend: 'codex', isPreset: false });
    expect(model.useModel).toBe('gpt-5-codex');
    expect((model as unknown as Record<string, unknown>).__waylandModelRegistryBridge).toBe('v2:chatgpt-subscription');
  });

  it('returns empty (no throw) for codex when no OpenAI/subscription provider is connected', async () => {
    config({ modelConfig: [makeProvider({ platform: 'anthropic', bridge: 'v2:anthropic', model: ['claude-x'] })] });
    const model = await makeService().resolveConversationModel({ backend: 'codex', isPreset: false });
    expect(model).toEqual({});
  });

  it('resolves claude to its anthropic provider', async () => {
    config({
      modelConfig: [makeProvider({ platform: 'anthropic', bridge: 'v2:anthropic', model: ['claude-opus-4-8'] })],
    });
    const model = await makeService().resolveConversationModel({ backend: 'claude', isPreset: false });
    expect(model.platform).toBe('anthropic');
    expect(model.useModel).toBe('claude-opus-4-8');
  });

  it('matches an anthropic default by unique platform even without a bridge tag (legacy row)', async () => {
    config({ modelConfig: [makeProvider({ platform: 'anthropic', model: ['claude-sonnet'] })] });
    const model = await makeService().resolveDefaultAcpModel('claude');
    expect(model.useModel).toBe('claude-sonnet');
  });

  it('resolves qwen to its qwen provider by bridge tag', async () => {
    config({
      modelConfig: [makeProvider({ platform: 'openai-compatible', bridge: 'v2:qwen', model: ['qwen-max'] })],
    });
    const model = await makeService().resolveConversationModel({ backend: 'qwen', isPreset: false });
    expect(model.useModel).toBe('qwen-max');
  });

  it('does NOT hijack qwen onto an unrelated openai-compatible provider (tag-scoped)', async () => {
    // A lookalike openai-compatible provider (openrouter) must not supply the qwen default.
    config({
      modelConfig: [makeProvider({ platform: 'openai-compatible', bridge: 'v2:openrouter', model: ['some-model'] })],
    });
    const model = await makeService().resolveDefaultAcpModel('qwen');
    expect(model).toEqual({});
  });

  it('returns empty for a truly multi-provider backend with no single underlying provider', async () => {
    config({ modelConfig: [makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5'] })] });
    const model = await makeService().resolveDefaultAcpModel('goose');
    expect(model).toEqual({});
  });

  it('leaves wcore defaulting unchanged (first enabled provider)', async () => {
    config({ modelConfig: [makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5'] })] });
    const model = await makeService().resolveConversationModel({ backend: 'wcore', isPreset: false });
    expect(model.useModel).toBe('gpt-5');
  });
});

describe('TeamSessionService.buildConversationParams - currentModelId seed precedence (ACP)', () => {
  beforeEach(() => vi.clearAllMocks());

  const codexAgent = (overrides: Record<string, unknown> = {}) => ({
    agentType: 'codex',
    agentName: 'Dev',
    role: 'teammate',
    ...overrides,
  });

  async function seed(agent: Record<string, unknown>): Promise<string | undefined> {
    const params = await makeService().buildConversationParams({
      teamId: 't1',
      teamName: 'Team',
      workspace: '/ws',
      agent,
      agents: [agent],
    });
    return params.extra.currentModelId as string | undefined;
  }

  it('seeds the resolved default when nothing is pinned or cached', async () => {
    config({ modelConfig: [makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5', 'gpt-4.1'] })] });
    expect(await seed(codexAgent())).toBe('gpt-5');
  });

  it('an explicit agent.model pin wins over the default', async () => {
    config({ modelConfig: [makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5'] })] });
    expect(await seed(codexAgent({ model: 'gpt-4.1' }))).toBe('gpt-4.1');
  });

  it('a user preferredModelId (acp.config) wins over the default', async () => {
    config({
      modelConfig: [makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5'] })],
      acpConfig: { codex: { preferredModelId: 'gpt-pref' } },
    });
    expect(await seed(codexAgent())).toBe('gpt-pref');
  });

  it('a prior cached selection wins over the default', async () => {
    config({
      modelConfig: [makeProvider({ platform: 'openai', bridge: 'v2:openai', model: ['gpt-5'] })],
      cachedModels: { codex: { currentModelId: 'gpt-cached' } },
    });
    expect(await seed(codexAgent())).toBe('gpt-cached');
  });

  it('leaves the seed empty when no provider is connected (unchanged behavior)', async () => {
    config({ modelConfig: [] });
    expect(await seed(codexAgent())).toBeUndefined();
  });
});
