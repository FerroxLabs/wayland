/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * W1c (TRIAGE C1, B5 fixes #1 + #6) - TaskManager owner validation + filter-by-owner.
 */
import { describe, expect, it } from 'vitest';
import { TaskManager, TeamTaskOwnerNotFoundError } from '@process/team/TaskManager';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { TeamAgent, TeamTask } from '@process/team/types';

/** Minimal in-memory repository - only the methods TaskManager actually uses. */
function makeRepo(): ITeamRepository {
  const tasks = new Map<string, TeamTask>();
  const repo: Partial<ITeamRepository> = {
    async createTask(task: TeamTask) {
      tasks.set(task.id, task);
      return task;
    },
    async updateTask(taskId: string, updates: Partial<TeamTask>) {
      const existing = tasks.get(taskId);
      if (!existing) throw new Error(`Task ${taskId} not found`);
      const merged = { ...existing, ...updates } as TeamTask;
      tasks.set(taskId, merged);
      return merged;
    },
    async findTasksByTeam(teamId: string) {
      return Array.from(tasks.values()).filter((t) => t.teamId === teamId);
    },
    async findTasksByOwner(teamId: string, ownerId: string) {
      return Array.from(tasks.values()).filter((t) => t.teamId === teamId && t.owner === ownerId);
    },
    async findTaskById(taskId: string) {
      return tasks.get(taskId) ?? null;
    },
    async appendToBlocks(_upstreamId: string, _taskId: string) {
      // not exercised by W1c tests
    },
    async removeFromBlockedBy(taskId: string, _blockerId: string) {
      return tasks.get(taskId)!;
    },
  };
  return repo as ITeamRepository;
}

function makeAgent(slotId: string, name = slotId): TeamAgent {
  return {
    slotId,
    agentId: `agent-${slotId}`,
    agentName: name,
    agentType: 'gemini',
    role: 'teammate',
    status: 'idle',
    model: 'gemini-2.5-pro',
  } as TeamAgent;
}

const TEAM_ID = 'team-abc';
const ALICE = makeAgent('slot-alice', 'Alice');
const BOB = makeAgent('slot-bob', 'Bob');

describe('TaskManager - owner validation (W1c T1c.1)', () => {
  it('creates a task with a valid owner (slotId on roster)', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE, BOB]);
    const t = await tm.create({ teamId: TEAM_ID, subject: 'design hero', owner: ALICE.slotId });
    expect(t.owner).toBe(ALICE.slotId);
    expect(t.subject).toBe('design hero');
  });

  it('rejects create with an unknown owner via TeamTaskOwnerNotFoundError', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE, BOB]);
    await expect(
      tm.create({ teamId: TEAM_ID, subject: 'ghost task', owner: 'slot-nobody' })
    ).rejects.toBeInstanceOf(TeamTaskOwnerNotFoundError);
  });

  it('allows create with omitted owner (unassigned)', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE]);
    const t = await tm.create({ teamId: TEAM_ID, subject: 'tbd' });
    expect(t.owner).toBeUndefined();
  });

  it('rejects update that reassigns to an unknown owner', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE, BOB]);
    const t = await tm.create({ teamId: TEAM_ID, subject: 'x', owner: ALICE.slotId });
    await expect(tm.update(t.id, { owner: 'slot-ghost' })).rejects.toBeInstanceOf(TeamTaskOwnerNotFoundError);
  });

  it('allows update that reassigns to a valid roster member', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE, BOB]);
    const t = await tm.create({ teamId: TEAM_ID, subject: 'x', owner: ALICE.slotId });
    const updated = await tm.update(t.id, { owner: BOB.slotId });
    expect(updated.owner).toBe(BOB.slotId);
  });

  it('reflects current roster - agent added after construction passes validation', async () => {
    let roster: TeamAgent[] = [ALICE];
    const tm = new TaskManager(makeRepo(), () => roster);
    await expect(
      tm.create({ teamId: TEAM_ID, subject: 'pre-add', owner: BOB.slotId })
    ).rejects.toBeInstanceOf(TeamTaskOwnerNotFoundError);
    roster = [ALICE, BOB];
    const t = await tm.create({ teamId: TEAM_ID, subject: 'post-add', owner: BOB.slotId });
    expect(t.owner).toBe(BOB.slotId);
  });
});

describe('TaskManager - filter-by-owner (W1c T1c.2)', () => {
  it('list() returns all tasks for the team', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE, BOB]);
    await tm.create({ teamId: TEAM_ID, subject: 'a', owner: ALICE.slotId });
    await tm.create({ teamId: TEAM_ID, subject: 'b', owner: BOB.slotId });
    await tm.create({ teamId: TEAM_ID, subject: 'c' });
    const all = await tm.list(TEAM_ID);
    expect(all.length).toBe(3);
  });

  it('getByOwner() returns only tasks for that owner', async () => {
    const tm = new TaskManager(makeRepo(), () => [ALICE, BOB]);
    await tm.create({ teamId: TEAM_ID, subject: 'alice-1', owner: ALICE.slotId });
    await tm.create({ teamId: TEAM_ID, subject: 'alice-2', owner: ALICE.slotId });
    await tm.create({ teamId: TEAM_ID, subject: 'bob-1', owner: BOB.slotId });
    const aliceTasks = await tm.getByOwner(TEAM_ID, ALICE.slotId);
    expect(aliceTasks.length).toBe(2);
    expect(aliceTasks.every((t) => t.owner === ALICE.slotId)).toBe(true);
    const bobTasks = await tm.getByOwner(TEAM_ID, BOB.slotId);
    expect(bobTasks.length).toBe(1);
  });
});
