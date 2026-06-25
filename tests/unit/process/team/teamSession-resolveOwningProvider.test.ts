/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Regression for #207 (gemma -> OpenRouter half): a Gemini teammate pinned to a
// model id (e.g. "gemma") that an unrelated provider (OpenRouter) also lists was
// routed to that foreign provider's key/baseUrl, because the owner lookup
// returned the FIRST provider in config order that listed the id, with no
// awareness of the teammate's backend. The fix scopes the Gemini owner search to
// Gemini/Google-platform providers and returns null otherwise so the caller
// falls back to the default-resolved Gemini provider.

import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function makeProvider(overrides: Partial<IProvider> & { platform: string; model: string[] }): IProvider {
  return {
    id: overrides.platform,
    name: overrides.platform,
    baseUrl: '',
    apiKey: '',
    enabled: true,
    ...overrides,
  } as IProvider;
}

type OwnerProbe = {
  resolveOwningProviderModelById: (
    modelId: string,
    conversationType?: string
  ) => Promise<TProviderWithModel | null>;
};

function makeService(): OwnerProbe {
  const svc = new TeamSessionService(
    makeRepo(),
    { getOrBuildTask: vi.fn(), kill: vi.fn() } as never,
    makeConversationService()
  );
  return svc as unknown as OwnerProbe;
}

describe('TeamSessionService.resolveOwningProviderModelById - backend scoping (#207)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefers the Gemini provider over a foreign provider that also lists the id', async () => {
    // OpenRouter is listed FIRST and also owns "gemma" - the old code returned it.
    mockConfigGet.mockResolvedValue([
      makeProvider({ platform: 'openrouter', model: ['gemma', 'gpt-4o'] }),
      makeProvider({ platform: 'gemini', model: ['gemma', 'gemini-2.5-pro'] }),
    ]);

    const owned = await makeService().resolveOwningProviderModelById('gemma', 'gemini');

    expect(owned?.platform).toBe('gemini');
    expect(owned?.useModel).toBe('gemma');
  });

  it('returns null for a Gemini teammate when only a foreign provider owns the id', async () => {
    // No Gemini provider claims "gemma" - the caller must fall back to the
    // default-resolved Gemini provider, NOT hijack to OpenRouter.
    mockConfigGet.mockResolvedValue([makeProvider({ platform: 'openrouter', model: ['gemma'] })]);

    const owned = await makeService().resolveOwningProviderModelById('gemma', 'gemini');

    expect(owned).toBeNull();
  });

  it('keeps first-match behavior for non-Gemini (wcore) teammates', async () => {
    mockConfigGet.mockResolvedValue([
      makeProvider({ platform: 'openrouter', model: ['deepseek-chat'] }),
      makeProvider({ platform: 'deepseek', model: ['deepseek-chat'] }),
    ]);

    const owned = await makeService().resolveOwningProviderModelById('deepseek-chat', 'wcore');

    expect(owned?.platform).toBe('openrouter');
    expect(owned?.useModel).toBe('deepseek-chat');
  });
});
