/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #999 second half - a Team had no project to inherit knowledge from.
 *
 * v0.12.4 stopped project knowledge being frozen at chat creation:
 * `refreshProjectKnowledge` re-reads `.wayland/` and re-injects it at every
 * agent spawn, keyed on the conversation's `extra.projectId`
 * (`WorkerTaskManager.getOrBuildTask`). That mechanism is complete and shipped -
 * and a Team could never reach it, because `TTeam` carried only `workspace` and
 * `workspaceMode`. No teammate conversation was ever stamped with a projectId,
 * so every member of every team ran with no project knowledge at all, and no
 * amount of editing CONTEXT.md changed that.
 *
 * The fix is the missing FIELD, not a second injection path: a team records the
 * project it belongs to, every member conversation is stamped with it, and the
 * spawn-time refresh that already works then works for teammates too.
 *
 * A team created outside any project stamps nothing - `refreshProjectKnowledge`
 * returns immediately on a conversation with no projectId, and inventing one
 * would give a teammate knowledge its leader never had.
 */

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

import { ALL_MIGRATIONS } from '@process/services/database/migrations';
import { CURRENT_DB_VERSION } from '@process/services/database/schema';
import { TeamSessionService } from '@process/team/TeamSessionService';
import type { IConversationService } from '@process/services/IConversationService';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { TeamAgent, TTeam } from '@process/team/types';

const PROJECT = 'proj-7';

/**
 * An in-memory stand-in for the persistence layer.
 *
 * NOT `SqliteTeamRepository`: the native better-sqlite3 addon is compiled for
 * ONE ABI, and on a machine where that is the Electron ABI `describeNativeSqlite`
 * SKIPS the suite - a skipped test proves nothing about the field this issue is
 * about. The COLUMN is pinned against a real database in
 * `src/process/services/database/migration_v57.bun.test.ts`; what belongs here
 * is the service behaviour, which needs only a repository that stores what it
 * is given.
 */
function makeRepo(): ITeamRepository {
  const teams = new Map<string, TTeam>();
  return {
    create: async (team: TTeam) => {
      teams.set(team.id, { ...team });
      return team;
    },
    findById: async (id: string) => (teams.has(id) ? { ...(teams.get(id) as TTeam) } : null),
    findAll: async () => [...teams.values()],
    update: async (id: string, updates: Partial<TTeam>) => {
      const merged = { ...(teams.get(id) as TTeam), ...updates };
      teams.set(id, merged);
      return merged;
    },
    updateAgentStatuses: async (id: string) => teams.get(id) ?? null,
    delete: async (id: string) => {
      teams.delete(id);
    },
    deleteMailboxByTeam: async () => {},
    deleteTasksByTeam: async () => {},
    findTasksByTeam: async () => [],
    findTasksByOwner: async () => [],
    appendEvent: async () => undefined,
    findEventsByTeam: async () => [],
  } as unknown as ITeamRepository;
}

const agents = (): TeamAgent[] => [
  {
    slotId: 'slot-leader',
    conversationId: '',
    role: 'leader',
    agentType: 'gemini',
    agentName: 'Lead',
    conversationType: 'gemini',
    status: 'pending',
  },
  {
    slotId: 'slot-1',
    conversationId: '',
    role: 'teammate',
    agentType: 'gemini',
    agentName: 'Copy',
    conversationType: 'gemini',
    status: 'pending',
  },
];

describe('#999 a Team carries the project its members inherit knowledge from', () => {
  let repo: ITeamRepository;
  const services: TeamSessionService[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    repo = makeRepo();
  });

  afterEach(async () => {
    await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
  });

  type Recorder = {
    conversations: Map<string, { id: string; extra: Record<string, unknown> }>;
  };

  function newService(): { svc: TeamSessionService; rec: Recorder } {
    const rec: Recorder = { conversations: new Map() };
    let next = 0;
    const conversationService = {
      createConversation: vi.fn(async (params: { extra?: Record<string, unknown> }) => {
        next += 1;
        const conversation = { id: `conv-${next}`, extra: { ...(params.extra ?? {}) } };
        rec.conversations.set(conversation.id, conversation);
        return conversation;
      }),
      deleteConversation: vi.fn(),
      updateConversation: vi.fn(async (id: string, patch: { extra?: Record<string, unknown> }) => {
        const existing = rec.conversations.get(id);
        if (existing) Object.assign(existing.extra, patch.extra ?? {});
      }),
      getConversation: vi.fn(async (id: string) => rec.conversations.get(id)),
      createWithMigration: vi.fn(),
      listAllConversations: vi.fn(async () => []),
    } as unknown as IConversationService;
    const svc = new TeamSessionService(repo, { getOrBuildTask: vi.fn(), kill: vi.fn() } as never, conversationService);
    services.push(svc);
    return { svc, rec };
  }

  const projectIdsOf = (rec: Recorder): unknown[] =>
    [...rec.conversations.values()].map((conversation) => conversation.extra.projectId);

  type CreateParams = Parameters<TeamSessionService['createTeam']>[0] & { projectId?: string };

  it('has a schema column to persist it in, at a version the app will actually migrate to', () => {
    // The service can only hand back what the row can hold, and a migration
    // that CURRENT_DB_VERSION never reaches is a column that exists on nobody's
    // machine.
    expect(ALL_MIGRATIONS.some((m) => m.version === 57)).toBe(true);
    expect(CURRENT_DB_VERSION).toBeGreaterThanOrEqual(57);
  });

  it('records the project on the team and hands it back on read', async () => {
    const { svc } = newService();

    const team = await svc.createTeam({
      userId: 'user-1',
      name: 'Team',
      workspace: '/tmp/ws',
      workspaceMode: 'shared',
      agents: agents(),
      projectId: PROJECT,
    } as CreateParams);

    expect(team.projectId).toBe(PROJECT);
    expect((await repo.findById(team.id))?.projectId).toBe(PROJECT);
  });

  it('stamps every member conversation with the project, so the spawn-time refresh has a key to read', async () => {
    const { svc, rec } = newService();

    await svc.createTeam({
      userId: 'user-1',
      name: 'Team',
      workspace: '/tmp/ws',
      workspaceMode: 'shared',
      agents: agents(),
      projectId: PROJECT,
    } as CreateParams);

    expect(rec.conversations.size).toBe(2);
    expect(projectIdsOf(rec)).toEqual([PROJECT, PROJECT]);
  });

  it('inherits the project from the conversation the leader was adopted from', async () => {
    const { svc, rec } = newService();
    rec.conversations.set('conv-existing', {
      id: 'conv-existing',
      extra: { projectId: PROJECT, workspace: '/tmp/ws' },
    });

    const roster = agents();
    roster[0].conversationId = 'conv-existing';

    const team = await svc.createTeam({
      userId: 'user-1',
      name: 'Team',
      workspace: '/tmp/ws',
      workspaceMode: 'shared',
      agents: roster,
    });

    // The team learns it, and the teammate spawned alongside the adopted leader
    // gets it too - a project chat that becomes a team must not leave its own
    // teammates outside the project.
    expect(team.projectId).toBe(PROJECT);
    expect(rec.conversations.get('conv-1')?.extra.projectId).toBe(PROJECT);
  });

  it('stamps a member added later, not only the founding roster', async () => {
    const { svc, rec } = newService();

    const team = await svc.createTeam({
      userId: 'user-1',
      name: 'Team',
      workspace: '/tmp/ws',
      workspaceMode: 'shared',
      agents: agents(),
      projectId: PROJECT,
    } as CreateParams);

    await svc.addAgent(team.id, {
      role: 'teammate',
      agentType: 'gemini',
      agentName: 'Late',
      conversationType: 'gemini',
      status: 'pending',
      conversationId: '',
    } as Omit<TeamAgent, 'slotId'>);

    expect(projectIdsOf(rec)).toEqual([PROJECT, PROJECT, PROJECT]);
  });

  it('stamps NOTHING when the team belongs to no project', async () => {
    // The positive control for every assertion above: the field appears because
    // a project was named, never because the code always writes one.
    const { svc, rec } = newService();

    const team = await svc.createTeam({
      userId: 'user-1',
      name: 'Team',
      workspace: '/tmp/ws',
      workspaceMode: 'shared',
      agents: agents(),
    });

    expect(team.projectId).toBeUndefined();
    expect(projectIdsOf(rec)).toEqual([undefined, undefined]);
  });
});
