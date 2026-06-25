/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Live-smoke fix #4b (2026-05-19) - TeamSessionService.changeAgentBackend
// unit tests. Mirrors the team-restartAgent test layout so the mock
// scaffolding stays consistent across team-session service tests.
//
// Covers:
//   - success path: status reset to pending + new agentType persisted +
//     decision event logged with from/to backends + agentStatusChanged emitted
//   - same-backend no-op: idempotent, no kill, no event, no emit
//   - cross-conversationType swap rejected (gemini → claude)
//   - wake-in-progress refusal: no kill, no persist
//   - missing team / missing slot errors
//   - newModel updates the conversation extra when supplied

import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    agentType: 'claude',
    agentName: 'Lead',
    conversationType: 'acp',
    status: 'idle',
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
      makeAgent({ slotId: 'slot-1', role: 'teammate', conversationId: 'conv-1' }),
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
    updateConversation: vi.fn().mockResolvedValue(undefined),
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

describe('TeamSessionService.changeAgentBackend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when the team does not exist', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());
    await expect(
      svc.changeAgentBackend({ teamId: 'missing', slotId: 'slot-1', newBackend: 'codex' })
    ).rejects.toThrow(/not found/i);
  });

  it('throws when the slot does not exist on the team', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());
    await expect(
      svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-ghost', newBackend: 'codex' })
    ).rejects.toThrow(/not found/i);
  });

  it('is a no-op when the backend is unchanged (no persist, no event, no emit)', async () => {
    const team = makeTeam();
    const update = vi.fn().mockResolvedValue(undefined);
    const appendEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team), update, appendEvent });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());

    await svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'claude' });

    expect(update).not.toHaveBeenCalled();
    expect(appendEvent).not.toHaveBeenCalled();
    expect(mockIpcBridge.team.agentStatusChanged.emit).not.toHaveBeenCalled();
  });

  it('refuses cross-conversationType swaps (gemini → claude) so chat history is not destroyed', async () => {
    const team = makeTeam({
      agents: [
        makeAgent({ slotId: 'slot-leader', role: 'leader', conversationId: 'conv-leader' }),
        makeAgent({
          slotId: 'slot-gem',
          conversationId: 'conv-gem',
          agentType: 'gemini',
          conversationType: 'gemini',
        }),
      ],
    });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());

    await expect(
      svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-gem', newBackend: 'claude' })
    ).rejects.toThrow(/not supported in place/i);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('refuses an in-place swap to "wayland-core" (the WCore engine alias) instead of corrupting an acp conversation (#204)', async () => {
    // The picker offers "wayland-core" as the WCore engine id. Before the fix,
    // resolveConversationType('wayland-core') wrongly returned 'acp' (missing
    // alias), so this swap passed the same-type guard, kept the member's 'acp'
    // conversation, and then spawned via the ACP connector -> "No CLI path for
    // backend wayland-core". It must be rejected exactly like a swap to 'wcore'.
    const team = makeTeam(); // slot-1 is claude / conversationType 'acp'
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());

    await expect(
      svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'wayland-core' })
    ).rejects.toThrow(/not supported in place/i);
    expect(repo.update).not.toHaveBeenCalled();

    // Parity: the canonical id 'wcore' was already rejected; 'wayland-core' must
    // behave identically now that both resolve to the 'wcore' conversation type.
    await expect(
      svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'wcore' })
    ).rejects.toThrow(/not supported in place/i);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('refuses to swap while a wake is in progress', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());

    const killAgentProcess = vi.fn();
    const fakeSession = {
      isWakeActive: vi.fn().mockReturnValue(true),
      killAgentProcess,
    };
    (svc as unknown as { sessions: Map<string, unknown> }).sessions.set('team-1', fakeSession);

    await expect(
      svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'codex' })
    ).rejects.toThrow(/wake in progress/i);
    expect(killAgentProcess).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('on success: persists new backend + pending status, kills worker, emits IPC, logs decision', async () => {
    const team = makeTeam();
    const update = vi.fn().mockResolvedValue(undefined);
    const appendEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team), update, appendEvent });
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), makeConversationService());

    const killAgentProcess = vi.fn();
    const fakeSession = {
      isWakeActive: vi.fn().mockReturnValue(false),
      killAgentProcess,
    };
    (svc as unknown as { sessions: Map<string, unknown> }).sessions.set('team-1', fakeSession);

    await svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'codex' });

    // Worker tear-down
    expect(killAgentProcess).toHaveBeenCalledWith('slot-1');

    // Persisted agent record swapped backend + flipped to pending
    expect(update).toHaveBeenCalledTimes(1);
    const updateArgs = update.mock.calls[0];
    expect(updateArgs[0]).toBe('team-1');
    const persistedAgents = (updateArgs[1] as { agents: TeamAgent[] }).agents;
    const swapped = persistedAgents.find((a) => a.slotId === 'slot-1');
    expect(swapped?.agentType).toBe('codex');
    expect(swapped?.status).toBe('pending');
    // conversationType must be preserved (codex is also 'acp')
    expect(swapped?.conversationType).toBe('acp');

    // Renderer gets the status-flip event
    expect(mockIpcBridge.team.agentStatusChanged.emit).toHaveBeenCalledWith({
      teamId: 'team-1',
      slotId: 'slot-1',
      status: 'pending',
    });

    // Activity tab gets the provenance breadcrumb with from/to backends
    expect(appendEvent).toHaveBeenCalledTimes(1);
    const event = appendEvent.mock.calls[0][0];
    expect(event.eventType).toBe('decision');
    expect(event.teamId).toBe('team-1');
    expect(event.actorSlotId).toBe('slot-1');
    expect(event.payload).toMatchObject({
      outcome: 'backend_changed',
      actor: 'user',
      from_backend: 'claude',
      to_backend: 'codex',
      slot_id: 'slot-1',
    });
  });

  it('persists newModel onto the agent conversation when supplied', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const conversationService = makeConversationService();
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), conversationService);

    await svc.changeAgentBackend({
      teamId: 'team-1',
      slotId: 'slot-1',
      newBackend: 'codex',
      newModel: 'gpt-5.1-preview',
    });

    expect(conversationService.updateConversation).toHaveBeenCalledTimes(1);
    const [convId, payload] = (conversationService.updateConversation as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(convId).toBe('conv-1');
    expect((payload as { extra?: { backend?: string; currentModelId?: string } }).extra).toMatchObject({
      backend: 'codex',
      currentModelId: 'gpt-5.1-preview',
    });
  });

  it('skips the conversation update when newModel is omitted', async () => {
    const team = makeTeam();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(team) });
    const conversationService = makeConversationService();
    const svc = new TeamSessionService(repo, makeWorkerTaskManager(), conversationService);

    await svc.changeAgentBackend({ teamId: 'team-1', slotId: 'slot-1', newBackend: 'codex' });

    expect(conversationService.updateConversation).not.toHaveBeenCalled();
  });
});
