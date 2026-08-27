/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #983 (model-default half) — the default model a NEW Gemini team member is
 * created with must obey the SAME constraints as the list the Team model picker
 * offers for that backend (`getTeamAvailableModels('gemini', …)`).
 *
 * The reported shape was a three-agent Gemini team whose members defaulted to
 * "Kimi K2.7 Code" and then sat in Processing forever. `resolveDefaultAcpModel`
 * was already scoped to the providers its backend actually runs, but the Gemini
 * default resolver was not scoped to anything: it accepted whatever provider id
 * `gemini.defaultModel` last named (state SHARED with plain chats), never
 * consulted `modelEnabled`, and its last-resort fallback took the first enabled
 * provider in config order.
 *
 * Two of those are unrunnable-by-construction rather than merely surprising:
 *
 *  - the ChatGPT-subscription row is KEYLESS (OAuth via ~/.codex/auth.json, only
 *    the wcore engine can auth it). `preferSubscriptionForOwnedModel` already
 *    documents that binding a Gemini-CLI teammate to it breaks bootstrap with
 *    "OpenAI API key is required" — and a bootstrap that never returns is
 *    exactly the indefinite Processing state this issue is about.
 *    `getTeamAvailableModels` excludes it from the Gemini picker for that
 *    reason; the default resolver must agree.
 *  - a model the user has switched OFF (`modelEnabled[id] === false`) is not in
 *    the picker either, so it must never arrive as a default.
 *
 * What is NOT narrowed: a Gemini teammate legitimately runs any enabled model of
 * any ordinary provider (the picker merges them all), so a deliberately-chosen
 * foreign model must still resolve. The last test pins that.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockConfigGet, mockHasOauth } = vi.hoisted(() => ({
  mockConfigGet: vi.fn(),
  mockHasOauth: vi.fn(),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: mockConfigGet },
  getAssistantsDir: () => '/assistants',
}));

// Deterministic: the real implementation reads ~/.gemini/oauth_creds.json, so
// the suite would otherwise depend on the machine running it.
vi.mock('@process/team/googleAuthCheck', () => ({ hasGeminiOauthCreds: mockHasOauth }));

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
  id: string;
  platform: string;
  model: string[];
  bridge?: string;
  modelEnabled?: Record<string, boolean>;
  enabled?: boolean;
}): IProvider {
  const p: Record<string, unknown> = {
    id: o.id,
    name: o.id,
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

/** The keyless ChatGPT-subscription row, exactly as the registry bridge writes it. */
const SUBSCRIPTION = makeProvider({
  id: 'chatgpt-subscription',
  platform: 'openai-compatible',
  bridge: 'v2:chatgpt-subscription',
  model: ['gpt-5-codex'],
});

/** A real Gemini provider — what a Gemini teammate should land on. */
const GEMINI = makeProvider({
  id: 'google-gemini',
  platform: 'gemini',
  bridge: 'v2:google-gemini',
  model: ['gemini-2.5-pro'],
});

/** The reporter's Moonshot row: K2.7 Code switched OFF, K3 left on. */
const MOONSHOT = makeProvider({
  id: 'moonshot',
  platform: 'openai-compatible',
  bridge: 'v2:moonshot',
  model: ['kimi-k2.7-code', 'kimi-k3'],
  modelEnabled: { 'kimi-k2.7-code': false },
});

type Probe = {
  resolveConversationModel: (p: {
    backend: string;
    isPreset: boolean;
    presetAgentType?: string;
  }) => Promise<TProviderWithModel>;
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

function config(opts: { modelConfig?: unknown; geminiDefault?: unknown }) {
  mockConfigGet.mockImplementation((key: string) => {
    switch (key) {
      case 'model.config':
        return Promise.resolve(opts.modelConfig);
      case 'gemini.defaultModel':
        return Promise.resolve(opts.geminiDefault);
      default:
        return Promise.resolve(undefined);
    }
  });
}

const geminiDefault = () => makeService().resolveConversationModel({ backend: 'gemini', isPreset: false });

const bridgeOf = (m: TProviderWithModel): unknown =>
  (m as unknown as Record<string, unknown>).__waylandModelRegistryBridge;

afterEach(async () => {
  await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
});

describe('TeamSessionService gemini default model is constrained by the backend (#983)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasOauth.mockResolvedValue(false);
  });

  it('never binds a Gemini teammate to the keyless ChatGPT-subscription row named by gemini.defaultModel', async () => {
    config({
      modelConfig: [SUBSCRIPTION, GEMINI],
      geminiDefault: { id: 'chatgpt-subscription', useModel: 'gpt-5-codex' },
    });
    const model = await geminiDefault();
    expect(bridgeOf(model)).not.toBe('v2:chatgpt-subscription');
    expect(model.useModel).toBe('gemini-2.5-pro');
  });

  it('never falls back to the keyless subscription row when it is the only enabled provider', async () => {
    config({ modelConfig: [SUBSCRIPTION], geminiDefault: undefined });
    const model = await geminiDefault();
    expect(bridgeOf(model)).not.toBe('v2:chatgpt-subscription');
    expect(model.useModel).not.toBe('gpt-5-codex');
  });

  it('does not default to a model the user switched OFF (the reported kimi-k2.7-code)', async () => {
    config({
      modelConfig: [MOONSHOT, GEMINI],
      geminiDefault: { id: 'moonshot', useModel: 'kimi-k2.7-code' },
    });
    const model = await geminiDefault();
    expect(model.useModel).not.toBe('kimi-k2.7-code');
    expect(model.useModel).toBe('gemini-2.5-pro');
  });

  it('does not default to a switched-off model named in the legacy string form either', async () => {
    config({ modelConfig: [MOONSHOT, GEMINI], geminiDefault: 'kimi-k2.7-code' });
    const model = await geminiDefault();
    expect(model.useModel).not.toBe('kimi-k2.7-code');
    expect(model.useModel).toBe('gemini-2.5-pro');
  });

  it('does not let a switched-off model reach the last-resort fallback', async () => {
    config({
      modelConfig: [
        makeProvider({
          id: 'moonshot',
          platform: 'openai-compatible',
          model: ['kimi-k2.7-code'],
          modelEnabled: { 'kimi-k2.7-code': false },
        }),
      ],
      geminiDefault: undefined,
    });
    const model = await geminiDefault();
    expect(model.useModel).not.toBe('kimi-k2.7-code');
  });

  // Guard against over-narrowing: the Gemini picker DOES merge every ordinary
  // provider's enabled models, so a deliberately chosen foreign model must
  // still resolve. Narrowing the default to "gemini providers only" would break
  // every user who runs a Gemini teammate on an OpenAI-compatible endpoint.
  it('still honours a deliberately selected, enabled foreign model', async () => {
    config({ modelConfig: [MOONSHOT, GEMINI], geminiDefault: { id: 'moonshot', useModel: 'kimi-k3' } });
    const model = await geminiDefault();
    expect(model.id).toBe('moonshot');
    expect(model.useModel).toBe('kimi-k3');
  });

  it('still prefers a Google-Auth default when OAuth creds exist', async () => {
    mockHasOauth.mockResolvedValue(true);
    config({
      modelConfig: [MOONSHOT],
      geminiDefault: { id: 'google-auth-gemini', useModel: 'gemini-2.5-flash' },
    });
    const model = await geminiDefault();
    expect(model.id).toBe('google-auth-gemini');
    expect(model.useModel).toBe('gemini-2.5-flash');
  });
});
