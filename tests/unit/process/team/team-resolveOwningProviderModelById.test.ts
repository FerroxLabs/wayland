/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Issue #87 - a spawned wcore teammate pinned to a specific model must hydrate
// the provider that OWNS that model (its key/baseUrl), not providers[0]. The
// reported failure: providers[0] is the Flux entry, so the spawn sent an
// sk-flux key to an OpenAI surface -> 401 invalid_api_key.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockIpcBridge = vi.hoisted(() => ({
  team: {
    agentStatusChanged: { emit: vi.fn() },
    agentSpawned: { emit: vi.fn() },
    agentRemoved: { emit: vi.fn() },
    agentRenamed: { emit: vi.fn() },
    listChanged: { emit: vi.fn() },
    mcpStatus: { emit: vi.fn() },
  },
}));

const mockProcessConfig = vi.hoisted(() => ({ get: vi.fn(async () => null as unknown) }));

vi.mock('@/common', () => ({ ipcBridge: mockIpcBridge }));
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '/tmp') } }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: mockProcessConfig,
  getAssistantsDir: () => '/assistants',
}));

import { TeamSessionService } from '@process/team/TeamSessionService';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { IConversationService } from '@process/services/IConversationService';

// Each TeamSessionService starts a 60s Watchdog sweep setInterval in its
// constructor; left un-stopped, those ref'd timers keep the vitest fork
// worker's event loop alive and hang the unit shard under CI load (#353).
const services: TeamSessionService[] = [];
function makeService(): TeamSessionService {
  const repo = {} as ITeamRepository;
  const conversationService = {} as IConversationService;
  const workerTaskManager = { getOrBuildTask: vi.fn(), kill: vi.fn() };
  const svc = new TeamSessionService(repo, workerTaskManager as never, conversationService);
  services.push(svc);
  return svc;
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
});

// Two enabled providers, openai FIRST (reproduces the providers[0] bug):
// the pinned model 'claude-sonnet-4' lives on the flux provider only.
const TWO_PROVIDERS = [
  { id: 'openai', enabled: true, apiKey: 'sk-openai', model: ['gpt-4o'], modelEnabled: {} },
  { id: 'flux', enabled: true, apiKey: 'sk-flux', model: ['claude-sonnet-4'], modelEnabled: {} },
];

describe('TeamSessionService.resolveOwningProviderModelById (#87)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessConfig.get.mockImplementation(async (key: string) => (key === 'model.config' ? TWO_PROVIDERS : null));
  });

  it('selects the provider that OWNS the pinned model, not providers[0]', async () => {
    const svc = makeService() as unknown as {
      resolveOwningProviderModelById: (id: string) => Promise<{ id: string; apiKey: string; useModel: string } | null>;
    };
    const resolved = await svc.resolveOwningProviderModelById('claude-sonnet-4');
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe('flux'); // before the fix this resolved to 'openai'
    expect(resolved?.apiKey).toBe('sk-flux');
    expect(resolved?.useModel).toBe('claude-sonnet-4');
  });

  it('returns null when no enabled provider owns the model (caller falls back)', async () => {
    const svc = makeService() as unknown as {
      resolveOwningProviderModelById: (id: string) => Promise<unknown>;
    };
    expect(await svc.resolveOwningProviderModelById('unknown-model')).toBeNull();
  });

  it('#555 teams: prefers the ChatGPT-subscription provider over a metered look-alike that lists the same id first', async () => {
    // A subscription model id (gpt-5.4) is offered by BOTH the direct OpenAI API
    // provider (metered, tagged v2:openai, listed FIRST) and the ChatGPT
    // subscription (OAuth, tagged v2:chatgpt-subscription). team_list_models hands
    // the leader only the bare id, so first-match would bind the teammate to the
    // metered provider and silently bill the API instead of the subscription.
    mockProcessConfig.get.mockImplementation(async (key: string) =>
      key === 'model.config'
        ? [
            {
              id: '19cea7a9',
              enabled: true,
              apiKey: 'sk-proj-metered',
              model: ['gpt-5.4', 'gpt-5.5'],
              modelEnabled: {},
              __waylandModelRegistryBridge: 'v2:openai',
            },
            {
              id: '5d2e7ed9',
              enabled: true,
              apiKey: '',
              model: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5'],
              modelEnabled: {},
              __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
            },
          ]
        : null
    );
    const svc = makeService() as unknown as {
      resolveOwningProviderModelById: (
        id: string,
        type?: string
      ) => Promise<{ id: string; __waylandModelRegistryBridge?: string; useModel: string } | null>;
    };
    const resolved = await svc.resolveOwningProviderModelById('gpt-5.4', 'wcore');
    expect(resolved?.id).toBe('5d2e7ed9'); // subscription, NOT the metered 19cea7a9 listed first
    expect(resolved?.__waylandModelRegistryBridge).toBe('v2:chatgpt-subscription');
    expect(resolved?.useModel).toBe('gpt-5.4');
  });

  it('still resolves the metered provider when NO subscription provider owns the model', async () => {
    mockProcessConfig.get.mockImplementation(async (key: string) =>
      key === 'model.config'
        ? [
            {
              id: '19cea7a9',
              enabled: true,
              apiKey: 'sk-proj-metered',
              model: ['gpt-5.4'],
              modelEnabled: {},
              __waylandModelRegistryBridge: 'v2:openai',
            },
          ]
        : null
    );
    const svc = makeService() as unknown as {
      resolveOwningProviderModelById: (id: string, type?: string) => Promise<{ id: string } | null>;
    };
    const resolved = await svc.resolveOwningProviderModelById('gpt-5.4', 'wcore');
    expect(resolved?.id).toBe('19cea7a9'); // no subscription owner -> first (only) owner
  });

  it('skips a provider that has the model disabled', async () => {
    mockProcessConfig.get.mockImplementation(async (key: string) =>
      key === 'model.config'
        ? [
            {
              id: 'flux',
              enabled: true,
              apiKey: 'sk-flux',
              model: ['claude-sonnet-4'],
              modelEnabled: { 'claude-sonnet-4': false },
            },
          ]
        : null
    );
    const svc = makeService() as unknown as {
      resolveOwningProviderModelById: (id: string) => Promise<unknown>;
    };
    expect(await svc.resolveOwningProviderModelById('claude-sonnet-4')).toBeNull();
  });
});

// The choke point that covers the WCORE default path (resolveDefaultAionrsModel
// providers[0]) which stamps a subscription model id onto the metered v2:openai
// provider; it re-binds to the subscription so envBuilder bills --provider
// openai-chatgpt. NB: buildConversationParams only INVOKES this for
// conversationType === 'wcore' (the wcore engine is the only backend that can
// auth the keyless subscription provider); these tests exercise the method's
// resolution logic directly.
describe('TeamSessionService.preferSubscriptionForOwnedModel (#555 teams choke point, wcore-only)', () => {
  const SUB_AND_METERED = [
    {
      id: '19cea7a9',
      enabled: true,
      apiKey: 'sk-proj-metered',
      platform: 'openai',
      model: ['gpt-5.5', 'gpt-5.4'],
      modelEnabled: {},
      __waylandModelRegistryBridge: 'v2:openai',
    },
    {
      id: '5d2e7ed9',
      enabled: true,
      apiKey: '',
      platform: 'openai-compatible',
      model: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5'],
      modelEnabled: {},
      __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessConfig.get.mockImplementation(async (key: string) => (key === 'model.config' ? SUB_AND_METERED : null));
  });

  it('re-binds a subscription model resolved onto the metered provider back to the subscription', async () => {
    const svc = makeService() as unknown as {
      preferSubscriptionForOwnedModel: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    // Simulates the default/gemini-fallback outcome: metered provider + gpt-5.5.
    const metered = { id: '19cea7a9', __waylandModelRegistryBridge: 'v2:openai', useModel: 'gpt-5.5' };
    const fixed = await svc.preferSubscriptionForOwnedModel(metered);
    expect(fixed.id).toBe('5d2e7ed9');
    expect(fixed.__waylandModelRegistryBridge).toBe('v2:chatgpt-subscription');
    expect(fixed.useModel).toBe('gpt-5.5');
  });

  it('leaves a model the subscription does NOT own untouched', async () => {
    const svc = makeService() as unknown as {
      preferSubscriptionForOwnedModel: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    const metered = { id: '19cea7a9', __waylandModelRegistryBridge: 'v2:openai', useModel: 'text-embedding-3' };
    const out = await svc.preferSubscriptionForOwnedModel(metered);
    expect(out.id).toBe('19cea7a9'); // subscription doesn't list it -> unchanged
  });

  it('is a no-op when the model is already the subscription', async () => {
    const svc = makeService() as unknown as {
      preferSubscriptionForOwnedModel: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    const sub = { id: '5d2e7ed9', __waylandModelRegistryBridge: 'v2:chatgpt-subscription', useModel: 'gpt-5.5' };
    const out = await svc.preferSubscriptionForOwnedModel(sub);
    expect(out.id).toBe('5d2e7ed9');
  });

  it('skips a subscription that has the model disabled', async () => {
    mockProcessConfig.get.mockImplementation(async (key: string) =>
      key === 'model.config'
        ? [SUB_AND_METERED[0], { ...SUB_AND_METERED[1], modelEnabled: { 'gpt-5.5': false } }]
        : null
    );
    const svc = makeService() as unknown as {
      preferSubscriptionForOwnedModel: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    const metered = { id: '19cea7a9', __waylandModelRegistryBridge: 'v2:openai', useModel: 'gpt-5.5' };
    const out = await svc.preferSubscriptionForOwnedModel(metered);
    expect(out.id).toBe('19cea7a9'); // subscription has gpt-5.5 disabled -> unchanged
  });
});
