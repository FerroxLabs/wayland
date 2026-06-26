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
