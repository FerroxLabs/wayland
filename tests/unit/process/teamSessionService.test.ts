/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TChatConversation } from '../../../src/common/config/storage';
import type { IConversationService } from '../../../src/process/services/IConversationService';
import type { ITeamRepository } from '../../../src/process/team/repository/ITeamRepository';
import type { TTeam, TeamAgent } from '../../../src/common/types/teamTypes';

const { mockConfigGet, mockReadFile, startMcpServerSpy, teamSessionInstances } = vi.hoisted(() => ({
  mockConfigGet: vi.fn(),
  mockReadFile: vi.fn(),
  startMcpServerSpy: vi.fn(),
  teamSessionInstances: [] as unknown[],
}));

// #2 (CRITICAL): stub TeamSession so getOrStartSession does not spin up a real
// TCP MCP server. The stub records every construction + startMcpServer call so
// the concurrency test can assert exactly ONE session/MCP server is built when
// two callers race. Existing tests never call getOrStartSession, so they are
// unaffected by this mock.
vi.mock('../../../src/process/team/TeamSession', () => ({
  TeamSession: class {
    constructor() {
      teamSessionInstances.push(this);
    }
    async startMcpServer() {
      startMcpServerSpy();
      return { name: 'stub', command: 'node', args: [], env: [] };
    }
    getStdioConfig() {
      return { name: 'stub', command: 'node', args: [], env: [] };
    }
    getAgents() {
      return [];
    }
    async dispose() {}
  },
}));

vi.mock('../../../src/process/utils/initStorage', () => ({
  ProcessConfig: {
    get: mockConfigGet,
  },
  getAssistantsDir: () => '/assistants',
}));

vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
    access: mockReadFile,
  },
  readFile: mockReadFile,
  access: mockReadFile,
}));

import { TeamSessionService } from '../../../src/process/team/TeamSessionService';

function makeRepo(overrides: Partial<ITeamRepository> = {}): ITeamRepository {
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
    markReadByIds: vi.fn(),
    getMailboxHistory: vi.fn(),
    createTask: vi.fn(),
    findTaskById: vi.fn(),
    updateTask: vi.fn(),
    findTasksByTeam: vi.fn(),
    findTasksByOwner: vi.fn(),
    deleteTask: vi.fn(),
    appendToBlocks: vi.fn(),
    removeFromBlockedBy: vi.fn(),
    ...overrides,
  };
}

function makeConversationService(overrides: Partial<IConversationService> = {}): IConversationService {
  return {
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversation: vi.fn(),
    getConversation: vi.fn(),
    createWithMigration: vi.fn(),
    listAllConversations: vi.fn(),
    ...overrides,
  };
}

function makeWorkerTaskManager() {
  return {
    getOrBuildTask: vi.fn(),
  };
}

// Each TeamSessionService starts a 60s Watchdog sweep setInterval in its
// constructor; left un-stopped, those ref'd timers keep the vitest fork
// worker's event loop alive and hang the unit shard under CI load (#353).
const services: TeamSessionService[] = [];
function newService(...args: ConstructorParameters<typeof TeamSessionService>): TeamSessionService {
  const svc = new TeamSessionService(...args);
  services.push(svc);
  return svc;
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
});

function makeAgent(overrides: Partial<TeamAgent> = {}): TeamAgent {
  return {
    slotId: '',
    conversationId: '',
    role: 'leader',
    agentType: 'gemini',
    agentName: 'Gemini',
    conversationType: 'gemini',
    status: 'pending',
    ...overrides,
  };
}

describe('TeamSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves a real gemini model instead of an empty placeholder', async () => {
    mockConfigGet.mockImplementation(async () => undefined);

    const repo = makeRepo();
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-gemini', extra: {} }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    await service.createTeam({
      userId: 'user-1',
      name: 'Team Gemini',
      workspace: '/workspace',
      workspaceMode: 'shared',
      agents: [makeAgent()],
    });

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'gemini',
        model: expect.objectContaining({
          platform: 'gemini-with-google-auth',
        }),
      })
    );
    // Must have a concrete useModel, not the bare 'default' placeholder
    const callArgs = (conversationService.createConversation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.model.useModel).not.toBe('default');
  });

  it('uses configured gemini provider model when available', async () => {
    mockConfigGet.mockImplementation(async (key: string) => {
      if (key === 'model.config') {
        return [
          {
            id: 'provider-gemini',
            platform: 'gemini',
            name: 'Gemini API',
            apiKey: 'test-key',
            baseUrl: 'https://generativelanguage.googleapis.com',
            model: ['gemini-2.5-pro'],
            enabled: true,
          },
        ];
      }
      return undefined;
    });
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    const repo = makeRepo();
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-gemini-api', extra: {} }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    await service.createTeam({
      userId: 'user-1',
      name: 'Team Gemini API',
      workspace: '/workspace',
      workspaceMode: 'shared',
      agents: [makeAgent()],
    });

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'gemini',
        model: expect.objectContaining({
          id: 'provider-gemini',
          platform: 'gemini',
          apiKey: 'test-key',
          useModel: 'gemini-2.5-pro',
        }),
      })
    );
  });

  it('uses preferred ACP model when creating qwen team conversations', async () => {
    mockConfigGet.mockImplementation(async (key: string) => {
      if (key === 'gemini.defaultModel') {
        return undefined;
      }
      if (key === 'model.config') {
        return [
          {
            id: 'provider-1',
            platform: 'gemini',
            name: 'Gemini API',
            apiKey: 'key',
            baseUrl: 'https://example.com',
            model: ['gemini-2.0-flash'],
            enabled: true,
          },
        ];
      }
      if (key === 'acp.config') {
        return {
          qwen: {
            preferredModelId: 'qwen3-coder-plus',
          },
        };
      }
      if (key === 'acp.cachedModels') {
        return undefined;
      }
      return undefined;
    });

    const repo = makeRepo();
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-qwen', extra: {} }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    await service.createTeam({
      userId: 'user-1',
      name: 'Team Qwen',
      workspace: '/workspace',
      workspaceMode: 'shared',
      agents: [makeAgent({ agentType: 'qwen', agentName: 'Qwen', conversationType: 'acp' })],
    });

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'acp',
        extra: expect.objectContaining({
          backend: 'qwen',
          currentModelId: 'qwen3-coder-plus',
        }),
      })
    );
  });

  it('creates remote team conversations with the remote agent id', async () => {
    mockConfigGet.mockResolvedValue(undefined);

    const repo = makeRepo();
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-remote', extra: {} }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    await service.createTeam({
      userId: 'user-1',
      name: 'Team Remote',
      workspace: '/workspace',
      workspaceMode: 'shared',
      agents: [
        makeAgent({
          agentType: 'remote',
          agentName: 'Remote Agent',
          conversationType: 'remote',
          customAgentId: 'remote-agent-id',
        }),
      ],
    });

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'remote',
        extra: expect.objectContaining({
          remoteAgentId: 'remote-agent-id',
          teamId: expect.any(String),
        }),
      })
    );
  });

  it('creates preset gemini team conversations with preset rules and enabled skills', async () => {
    mockConfigGet.mockImplementation(async (key: string) => {
      if (key === 'language') {
        return 'en-US';
      }
      if (key === 'model.config') {
        return [
          {
            id: 'provider-1',
            platform: 'gemini',
            name: 'Gemini API',
            apiKey: 'key',
            baseUrl: 'https://example.com',
            model: ['gemini-2.0-flash'],
            enabled: true,
          },
        ];
      }
      if (key === 'assistants') {
        return [{ id: 'assistant-1', enabledSkills: ['skill-a'] }];
      }
      return undefined;
    });
    mockReadFile.mockImplementation(async (targetPath: string) => {
      if (targetPath.includes('assistant-1.en-US.md')) {
        return 'PRESET RULES';
      }
      if (targetPath.includes('assistant-1-skills.en-US.md')) {
        return 'PRESET SKILLS';
      }
      throw new Error('not found');
    });

    const repo = makeRepo();
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-preset-gemini', extra: {} }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    await service.createTeam({
      userId: 'user-1',
      name: 'Team Preset Gemini',
      workspace: '/workspace',
      workspaceMode: 'shared',
      agents: [
        makeAgent({
          agentType: 'gemini',
          agentName: 'Preset Gemini',
          conversationType: 'gemini',
          customAgentId: 'assistant-1',
        }),
      ],
    });

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'gemini',
        model: expect.objectContaining({
          id: 'provider-1',
          useModel: 'gemini-2.0-flash',
        }),
        extra: expect.objectContaining({
          presetAssistantId: 'assistant-1',
          presetRules: 'PRESET RULES',
          enabledSkills: ['skill-a'],
        }),
      })
    );
  });

  // #9: launching the same standing launcher twice must NOT stack a second set
  // of ritual crons. The backend guard skips the ritual install when a persisted
  // team already sources from the same launcher.
  it('#9: a second standing launch does not double-install rituals', async () => {
    mockConfigGet.mockResolvedValue(undefined);

    const installRituals = vi.fn().mockResolvedValue(undefined);
    const uninstallRituals = vi.fn().mockResolvedValue(undefined);
    const ritualScheduler = { installRituals, uninstallRituals };

    const repo = makeRepo({
      // First launch: no sibling team yet. Second launch: a persisted team with
      // the same sourceLauncherId already exists.
      findAll: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'team-existing', sourceLauncherId: 'launcher-x' }]),
    });
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-1', extra: {} }),
      getConversation: vi.fn().mockResolvedValue({ id: 'conv-1', extra: {} }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService, ritualScheduler as any);

    await service.createTeam({
      userId: 'user-1',
      name: 'Standing A',
      workspace: '/ws',
      workspaceMode: 'shared',
      agents: [makeAgent()],
      sourceLauncherId: 'launcher-x',
    });
    await service.createTeam({
      userId: 'user-1',
      name: 'Standing B',
      workspace: '/ws',
      workspaceMode: 'shared',
      agents: [makeAgent()],
      sourceLauncherId: 'launcher-x',
    });

    // Installed once (first launch), skipped on the duplicate second launch.
    expect(installRituals).toHaveBeenCalledTimes(1);
  });

  it('preserves preset assistant identity and only inherits session mode when adding teammates', async () => {
    mockConfigGet.mockImplementation(async (key: string) => {
      if (key === 'gemini.defaultModel') {
        return undefined;
      }
      if (key === 'model.config') {
        return [
          {
            id: 'provider-1',
            platform: 'gemini',
            name: 'Gemini API',
            apiKey: 'key',
            baseUrl: 'https://example.com',
            model: ['gemini-2.0-flash'],
            enabled: true,
          },
        ];
      }
      if (key === 'acp.config') {
        return {
          qwen: {
            preferredModelId: 'qwen3-coder-next',
          },
        };
      }
      if (key === 'acp.cachedModels') {
        return undefined;
      }
      return undefined;
    });

    const team: TTeam = {
      id: 'team-1',
      userId: 'user-1',
      name: 'Preset Team',
      workspace: '/workspace',
      workspaceMode: 'shared',
      leaderAgentId: 'slot-lead',
      agents: [
        {
          slotId: 'slot-lead',
          conversationId: 'conv-lead',
          role: 'leader',
          agentType: 'qwen',
          agentName: 'Lead Qwen',
          conversationType: 'acp',
          status: 'idle',
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    };
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(team),
      update: vi.fn().mockImplementation(async (_id, updates) => ({ ...team, ...updates })),
    });
    const conversationService = makeConversationService({
      createConversation: vi.fn().mockResolvedValue({ id: 'conv-new', extra: {} }),
      getConversation: vi.fn().mockResolvedValue({
        id: 'conv-lead',
        extra: {
          backend: 'qwen',
          sessionMode: 'yolo',
          currentModelId: 'qwen3-coder-pro',
        },
      }),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    await service.addAgent('team-1', {
      conversationId: '',
      role: 'teammate',
      agentType: 'qwen',
      agentName: 'Preset Qwen',
      conversationType: 'acp',
      status: 'pending',
      customAgentId: 'builtin-preset-qwen',
    });

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        extra: expect.objectContaining({
          backend: 'qwen',
          presetAssistantId: 'builtin-preset-qwen',
          sessionMode: 'yolo',
          currentModelId: 'qwen3-coder-next',
        }),
      })
    );
  });

  it('repairs legacy teams whose agents array was lost but conversations still exist', async () => {
    const legacyTeam: TTeam = {
      id: 'team-legacy',
      userId: 'user-1',
      name: 'Legacy Team',
      workspace: '',
      workspaceMode: 'shared',
      leaderAgentId: 'slot-lead',
      agents: [],
      createdAt: 1,
      updatedAt: 1,
    };
    const legacyConversation: TChatConversation = {
      id: 'conv-legacy',
      name: 'Legacy Team - Leader',
      type: 'acp',
      status: 'pending',
      createTime: 1,
      modifyTime: 2,
      extra: {
        backend: 'codex',
        cliPath: 'codex',
        agentName: 'Leader',
        teamId: 'team-legacy',
        teamMcpStdioConfig: {
          env: [{ name: 'TEAM_AGENT_SLOT_ID', value: 'slot-lead' }],
        },
      },
    };

    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(legacyTeam),
    });
    const conversationService = makeConversationService({
      listAllConversations: vi.fn().mockResolvedValue([legacyConversation]),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, conversationService);

    const repairedTeam = await service.getTeam('team-legacy');

    expect(repairedTeam).toEqual(
      expect.objectContaining({
        leaderAgentId: 'slot-lead',
        agents: [
          expect.objectContaining({
            slotId: 'slot-lead',
            conversationId: 'conv-legacy',
            role: 'leader',
            agentType: 'codex',
            agentName: 'Leader',
            conversationType: 'acp',
            cliPath: 'codex',
          }),
        ],
      })
    );
    expect(repo.update).toHaveBeenCalledWith(
      'team-legacy',
      expect.objectContaining({
        leaderAgentId: 'slot-lead',
        agents: [
          expect.objectContaining({
            slotId: 'slot-lead',
            conversationId: 'conv-legacy',
          }),
        ],
        updatedAt: expect.any(Number),
      })
    );
  });

  it('#2: concurrent getOrStartSession calls share ONE session and start the MCP server once', async () => {
    mockConfigGet.mockResolvedValue(undefined);

    const team: TTeam = {
      id: 'team-race',
      userId: 'user-1',
      name: 'Race Team',
      workspace: '/workspace',
      workspaceMode: 'shared',
      leaderAgentId: 'slot-lead',
      agents: [makeAgent({ slotId: 'slot-lead', conversationId: 'conv-lead', role: 'leader', status: 'idle' })],
      createdAt: 1,
      updatedAt: 1,
    };
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(team),
      // getOrStartSession fires a best-effort sessionCount bump: `void repo.update(...).catch(...)`,
      // so update MUST return a promise.
      update: vi.fn().mockResolvedValue(team),
    });
    const conversationService = makeConversationService({
      updateConversation: vi.fn().mockResolvedValue(undefined),
    });
    const workerTaskManager = { getOrBuildTask: vi.fn().mockResolvedValue(undefined) };
    const service = newService(repo, workerTaskManager as any, conversationService);

    // Two callers race before either has populated the sessions map.
    const [a, b] = await Promise.all([service.getOrStartSession('team-race'), service.getOrStartSession('team-race')]);

    // Both resolve to the SAME session instance, only one was constructed, and
    // the MCP server was started exactly once (no duplicate TCP server / listeners).
    expect(a).toBe(b);
    expect(teamSessionInstances).toHaveLength(1);
    expect(startMcpServerSpy).toHaveBeenCalledOnce();

    // A subsequent call reuses the cached session without rebuilding.
    const c = await service.getOrStartSession('team-race');
    expect(c).toBe(a);
    expect(teamSessionInstances).toHaveLength(1);
    expect(startMcpServerSpy).toHaveBeenCalledOnce();
  });

  it('reconciles stale "active" agents to "pending" on boot (#665)', async () => {
    const teamWithStaleAgent: TTeam = {
      id: 'team-1',
      userId: 'user-1',
      name: 'Crashed Team',
      workspace: '/workspace',
      workspaceMode: 'shared',
      leaderAgentId: 'slot-lead',
      agents: [
        makeAgent({ slotId: 'slot-lead', role: 'leader', status: 'active' }),
        makeAgent({ slotId: 'slot-2', role: 'teammate', status: 'idle' }),
      ],
      createdAt: 1,
      updatedAt: 1,
    };
    const otherTeam: TTeam = {
      id: 'team-2',
      userId: 'user-1',
      name: 'Healthy Team',
      workspace: '/workspace',
      workspaceMode: 'shared',
      leaderAgentId: 'slot-lead-2',
      agents: [makeAgent({ slotId: 'slot-lead-2', role: 'leader', status: 'idle' })],
      createdAt: 1,
      updatedAt: 1,
    };

    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([teamWithStaleAgent, otherTeam]),
      update: vi.fn().mockResolvedValue(teamWithStaleAgent),
    });
    const service = newService(repo, makeWorkerTaskManager() as any, makeConversationService());

    await service.reconcileStaleActiveAgents('user-1');

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith(
      'team-1',
      expect.objectContaining({
        agents: [
          expect.objectContaining({ slotId: 'slot-lead', status: 'pending' }),
          expect.objectContaining({ slotId: 'slot-2', status: 'idle' }),
        ],
        updatedAt: expect.any(Number),
      })
    );
  });
});
