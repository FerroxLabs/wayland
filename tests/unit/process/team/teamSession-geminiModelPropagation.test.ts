/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TProviderWithModel } from '@/common/config/storage';
import type { IConversationService } from '@process/services/IConversationService';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { MailboxMessage, TeamAgent, TeamTask, TTeam } from '@process/team/types';

const { configGet, hasOauth, ipc } = vi.hoisted(() => ({
  configGet: vi.fn(),
  hasOauth: vi.fn(),
  ipc: {
    team: {
      agentStatusChanged: { emit: vi.fn() },
      agentSpawned: { emit: vi.fn() },
      agentRemoved: { emit: vi.fn() },
      agentRenamed: { emit: vi.fn() },
      listChanged: { emit: vi.fn() },
      mcpStatus: { emit: vi.fn() },
    },
  },
}));

vi.mock('@/common', () => ({ ipcBridge: ipc }));
vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: configGet },
  getAssistantsDir: () => '/assistants',
}));
vi.mock('@process/team/googleAuthCheck', () => ({ hasGeminiOauthCreds: hasOauth }));

import { TeamSessionService } from '@process/team/TeamSessionService';

function makeRepo(): ITeamRepository {
  const teams = new Map<string, TTeam>();
  const mailbox = new Map<string, MailboxMessage>();
  const tasks = new Map<string, TeamTask>();
  return {
    create: async (team: TTeam) => {
      teams.set(team.id, team);
      return team;
    },
    findById: async (id: string) => teams.get(id) ?? null,
    findAll: async () => [...teams.values()],
    update: async (id: string, patch: Partial<TTeam>) => {
      const next = { ...teams.get(id)!, ...patch };
      teams.set(id, next);
      return next;
    },
    mutateAgents: async (id: string, mutate: (agents: TeamAgent[]) => TeamAgent[] | null) => {
      const team = teams.get(id);
      if (!team) return null;
      const nextAgents = mutate([...team.agents]);
      if (nextAgents) teams.set(id, { ...team, agents: nextAgents });
      return teams.get(id)!;
    },
    delete: async () => {},
    deleteMailboxByTeam: async () => {},
    deleteTasksByTeam: async () => {},
    writeMessage: async (message: MailboxMessage) => {
      mailbox.set(message.id, message);
      return message;
    },
    readUnread: async () => [...mailbox.values()].filter((message) => !message.read),
    readUnreadAndMark: async () => [],
    markRead: async () => {},
    getMailboxHistory: async () => [...mailbox.values()],
    createTask: async (task: TeamTask) => {
      tasks.set(task.id, task);
      return task;
    },
    findTaskById: async (id: string) => tasks.get(id) ?? null,
    updateTask: async (id: string, patch: Partial<TeamTask>) => {
      const next = { ...tasks.get(id)!, ...patch };
      tasks.set(id, next);
      return next;
    },
    findTasksByTeam: async () => [...tasks.values()],
    findTasksByOwner: async () => [],
    deleteTask: async () => {},
    appendToBlocks: async () => {},
    removeFromBlockedBy: async () => undefined as never,
    appendEvent: async () => undefined,
    findEventsByTeam: async () => [],
  } as unknown as ITeamRepository;
}

const roster = (): TeamAgent[] =>
  ['Lead', 'Builder', 'Reviewer'].map((agentName, index) => ({
    slotId: '',
    conversationId: '',
    role: index === 0 ? ('leader' as const) : ('teammate' as const),
    agentType: 'gemini',
    agentName,
    conversationType: 'gemini' as const,
    status: 'pending' as const,
  }));

const services: TeamSessionService[] = [];

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.stopAllSessions()));
});

describe('Gemini Team default pair propagates from creation to worker construction (#983)', () => {
  it('keeps one supported OAuth pair for all three members after rejecting a disabled Kimi default', async () => {
    hasOauth.mockResolvedValue(true);
    configGet.mockImplementation((key: string) => {
      if (key === 'gemini.defaultModel') {
        return Promise.resolve({ id: 'moonshot', useModel: 'kimi-k2.7-code' });
      }
      if (key === 'model.config') {
        return Promise.resolve([
          {
            id: 'moonshot',
            name: 'Moonshot',
            platform: 'openai-compatible',
            baseUrl: 'https://rejected.invalid',
            apiKey: 'fake-rejected-key',
            enabled: true,
            model: ['kimi-k2.7-code'],
            modelEnabled: { 'kimi-k2.7-code': false },
          },
        ]);
      }
      return Promise.resolve(undefined);
    });

    const repo = makeRepo();
    const conversations = new Map<string, { id: string; model: TProviderWithModel; extra: Record<string, unknown> }>();
    let nextConversation = 0;
    const conversationService = {
      createConversation: vi.fn(async (params: { model: TProviderWithModel; extra?: Record<string, unknown> }) => {
        const conversation = {
          id: `conversation-${++nextConversation}`,
          model: params.model,
          extra: { ...params.extra },
        };
        conversations.set(conversation.id, conversation);
        return conversation;
      }),
      updateConversation: vi.fn(async (id: string, patch: { extra?: Record<string, unknown> }) => {
        Object.assign(conversations.get(id)?.extra ?? {}, patch.extra ?? {});
      }),
      getConversation: vi.fn(async (id: string) => conversations.get(id)),
      deleteConversation: vi.fn(),
      createWithMigration: vi.fn(),
      listAllConversations: vi.fn(async () => []),
    } as unknown as IConversationService;
    const workerPairs: TProviderWithModel[] = [];
    const workerTaskManager = {
      getOrBuildTask: vi.fn(async (conversationId: string) => {
        workerPairs.push(conversations.get(conversationId)!.model);
        return { sendMessage: vi.fn() };
      }),
      kill: vi.fn(),
    };
    const service = new TeamSessionService(repo, workerTaskManager as never, conversationService);
    services.push(service);

    const team = await service.createTeam({
      userId: 'user-1',
      name: 'OAuth provenance',
      workspace: '/tmp/team-oauth-provenance',
      workspaceMode: 'shared',
      agents: roster(),
    });
    await service.getOrStartSession(team.id);

    const createdPairs = [...conversations.values()].map(({ model }) => model);
    expect(createdPairs).toHaveLength(3);
    expect(workerPairs).toHaveLength(3);
    for (const pair of [...createdPairs, ...workerPairs]) {
      expect(pair.id).toBe('google-auth-gemini');
      expect(pair.platform).toBe('gemini-with-google-auth');
      expect(pair.useModel).toBe('auto');
      expect(pair.baseUrl).toBe('');
      expect(pair.apiKey).toBe('');
    }
  });
});
