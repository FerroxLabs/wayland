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

import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { TeamSessionService } from '@process/team/TeamSessionService';
import type { IConversationService } from '@process/services/IConversationService';
import type { TeamAgent, TTeam } from '@process/team/types';
import { describeNativeSqlite } from '../../helpers/nativeSqlite';

const PROJECT = 'proj-7';

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

describeNativeSqlite('#999 a Team carries the project its members inherit knowledge from', () => {
  let driver: BetterSqlite3Driver;
  let repo: SqliteTeamRepository;
  const services: TeamSessionService[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    driver
      .prepare(`INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run('user-1', 'testuser', 'hash', 1000, 1000);
    repo = new SqliteTeamRepository(driver);
  });

  afterEach(async () => {
    await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
    driver.close();
  });

  type Recorder = {
    created: Array<{ extra: Record<string, unknown> }>;
    updated: Array<[string, { extra?: Record<string, unknown> }]>;
    conversations: Map<string, { id: string; extra: Record<string, unknown> }>;
  };

  function newService(): { svc: TeamSessionService; rec: Recorder } {
    const rec: Recorder = { created: [], updated: [], conversations: new Map() };
    let next = 0;
    const conversationService = {
      createConversation: vi.fn(async (params: { extra?: Record<string, unknown> }) => {
        next += 1;
        const id = `conv-${next}`;
        rec.created.push({ extra: { ...(params.extra ?? {}) } });
        const conversation = { id, extra: { ...(params.extra ?? {}) } };
        rec.conversations.set(id, conversation);
        return conversation;
      }),
      deleteConversation: vi.fn(),
      updateConversation: vi.fn(async (id: string, patch: { extra?: Record<string, unknown> }) => {
        rec.updated.push([id, patch]);
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

  it('persists the project on the team row and hands it back on read', async () => {
    const { svc } = newService();

    const team = await svc.createTeam({
      userId: 'user-1',
      name: 'Team',
      workspace: '/tmp/ws',
      workspaceMode: 'shared',
      agents: agents(),
      projectId: PROJECT,
    } as Parameters<TeamSessionService['createTeam']>[0]);

    expect(team.projectId).toBe(PROJECT);
    const reloaded = (await repo.findById(team.id)) as TTeam;
    expect(reloaded.projectId).toBe(PROJECT);
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
    } as Parameters<TeamSessionService['createTeam']>[0]);

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
    } as Parameters<TeamSessionService['createTeam']>[0]);

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
    // The positive control for every assertion above: the field only appears
    // because a project was named, never because the code always writes one.
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
