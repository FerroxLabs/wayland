/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// W3a - TeamSessionService.restartAgent unit tests. Covers:
//   - success path: status reset to 'pending', IPC emitted, wake event logged
//   - cannot-restart-during-wake: throws when session reports wake active
//   - residual process is killed via session.killAgentProcess when a session
//     is live (no-op when session is absent - repo update is the only mutation)

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

vi.mock('@/common', () => ({ ipcBridge: mockIpcBridge }));
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '/tmp') } }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
  getAssistantsDir: () => '/assistants',
}));

import { TeamSessionService } from '@process/team/TeamSessionService';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { IConversationService } from '@process/services/IConversationService';
import type { TeamAgent, TTeam } from '@/common/types/teamTypes';

function makeAgent(overrides: Partial<TeamAgent> = {}): TeamAgent {
  return {
    slotId: 'slot-1',
    conversationId: 'conv-1',
    role: 'teammate',
    agentType: 'gemini',
    agentName: 'Copy',
    conversationType: 'gemini',
    status: 'failed',
    ...overrides,
  };
}

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-1',
    userId: 'user-1',
    name: 'Team',
    workspace: '',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    agents: [
      makeAgent({ slotId: 'slot-leader', role: 'leader', conversationId: 'conv-leader' }),
      makeAgent({ slotId: 'slot-1', role: 'teammate', conversationId: 'conv-1', status: 'failed' }),
    ],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ITeamRepository> = {}): ITeamRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
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
    appendEvent: vi.fn().mockResolvedValue(undefined),
    listEvents: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as ITeamRepository;
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
  } as IConversationService;
}

function makeWorkerTaskManager() {
  return {
    getOrBuildTask: vi.fn(),
    kill: vi.fn(),
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

describe('TeamSessionService.restartAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when the team does not exist', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const svc = newService(repo, makeWorkerTaskManager(), makeConversationService());
    await expect(svc.restartAgent('missing', 'slot-1')).rejects.toThrow(/not found/i);
  });

  it('throws when the slot does not exist on the team', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = newService(repo, makeWorkerTaskManager(), makeConversationService());
    await expect(svc.restartAgent('team-1', 'slot-ghost')).rejects.toThrow(/not found/i);
  });

  it('resets agent status to pending + emits IPC + appends wake event on success', async () => {
    const team = makeTeam();
    const update = vi.fn().mockResolvedValue(undefined);
    const appendEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(team),
      update,
      appendEvent,
    });
    const svc = newService(repo, makeWorkerTaskManager(), makeConversationService());

    await svc.restartAgent('team-1', 'slot-1');

    // Status reset + persisted
    expect(update).toHaveBeenCalledTimes(1);
    const updateArgs = update.mock.calls[0];
    expect(updateArgs[0]).toBe('team-1');
    const persistedAgents = (updateArgs[1] as { agents: TeamAgent[] }).agents;
    const restarted = persistedAgents.find((a) => a.slotId === 'slot-1');
    expect(restarted?.status).toBe('pending');

    // IPC notification so the rail flips the status dot
    expect(mockIpcBridge.team.agentStatusChanged.emit).toHaveBeenCalledWith({
      teamId: 'team-1',
      slotId: 'slot-1',
      status: 'pending',
    });

    // Wake event with restart provenance
    expect(appendEvent).toHaveBeenCalledTimes(1);
    const event = appendEvent.mock.calls[0][0];
    expect(event.eventType).toBe('wake');
    expect(event.teamId).toBe('team-1');
    expect(event.actorSlotId).toBe('slot-1');
    expect(event.payload).toMatchObject({ outcome: 'restarted_by_user', actor: 'user' });
  });

  it('refuses to restart while a wake is in flight', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = newService(repo, makeWorkerTaskManager(), makeConversationService());

    // Force a live session whose wake-active check returns true
    const fakeSession = {
      isWakeActive: vi.fn().mockReturnValue(true),
      killAgentProcess: vi.fn(),
    };
    (svc as unknown as { sessions: Map<string, unknown> }).sessions.set('team-1', fakeSession);

    await expect(svc.restartAgent('team-1', 'slot-1')).rejects.toThrow(/wake in progress/i);
    expect(fakeSession.killAgentProcess).not.toHaveBeenCalled();
    // No repo update on the refused path
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('kills residual process via the live session before resetting status', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = newService(repo, makeWorkerTaskManager(), makeConversationService());

    const killAgentProcess = vi.fn();
    const fakeSession = {
      isWakeActive: vi.fn().mockReturnValue(false),
      killAgentProcess,
    };
    (svc as unknown as { sessions: Map<string, unknown> }).sessions.set('team-1', fakeSession);

    await svc.restartAgent('team-1', 'slot-1');

    expect(killAgentProcess).toHaveBeenCalledWith('slot-1');
    expect(repo.update).toHaveBeenCalledTimes(1);
  });
});
