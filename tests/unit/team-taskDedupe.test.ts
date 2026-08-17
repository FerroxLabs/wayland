/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #981 - duplicate task_create on the team board.
 *
 * Everything here runs against the REAL SQLite schema, the REAL repository and
 * the REAL TaskManager behind the REAL MCP TCP transport. The pre-existing MCP
 * suites all stub TaskManager, so neither the owner validation nor the dedupe
 * constraint ever executed in them.
 */

import * as net from 'node:net';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/app' },
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: { getDetectedAgents: vi.fn(() => [{ backend: 'claude', name: 'Claude' }]) },
}));

import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { SqliteTeamRepository } from '@process/team/repository/SqliteTeamRepository';
import { TeamTaskDuplicateError } from '@process/team/repository/ITeamRepository';
import { TaskManager } from '@process/team/TaskManager';
import { TeamMcpServer } from '@process/team/mcp/team/TeamMcpServer';
import type { Mailbox } from '@process/team/Mailbox';
import type { TeamAgent, TTeam } from '@process/team/types';
import { describeNativeSqlite } from './helpers/nativeSqlite';

const TEAM_ID = 'team-981';

const AGENTS: TeamAgent[] = [
  {
    slotId: 'slot-lead',
    conversationId: 'conv-lead',
    role: 'leader',
    agentType: 'claude',
    agentName: 'Leader',
    conversationType: 'acp',
    status: 'idle',
  },
  {
    slotId: 'slot-alice',
    conversationId: 'conv-alice',
    role: 'teammate',
    agentType: 'claude',
    agentName: 'Alice',
    conversationType: 'acp',
    status: 'idle',
  },
];

function makeTeam(): TTeam {
  return {
    id: TEAM_ID,
    userId: 'user-1',
    name: 'Crew',
    workspace: '/tmp/workspace',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-lead',
    agents: AGENTS,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

async function tcpRequest(port: number, data: unknown): Promise<{ result?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect(port, '127.0.0.1', () => {
      const body = Buffer.from(JSON.stringify(data), 'utf-8');
      const header = Buffer.alloc(4);
      header.writeUInt32BE(body.length, 0);
      socket.write(Buffer.concat([header, body]));
    });
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4) {
        const bodyLen = buffer.readUInt32BE(0);
        if (buffer.length < 4 + bodyLen) break;
        const jsonStr = buffer.subarray(4, 4 + bodyLen).toString('utf-8');
        buffer = buffer.subarray(4 + bodyLen);
        socket.destroy();
        resolve(JSON.parse(jsonStr));
        return;
      }
    });
    socket.on('error', reject);
    setTimeout(() => reject(new Error('TCP request timed out')), 3000);
  });
}

describeNativeSqlite('team task dedupe (#981)', () => {
  let driver: BetterSqlite3Driver;
  let repo: SqliteTeamRepository;
  let taskManager: TaskManager;
  let server: TeamMcpServer;
  let authToken: string;

  beforeEach(async () => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    driver
      .prepare(`INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run('user-1', 'testuser', 'hash', 1000, 1000);
    repo = new SqliteTeamRepository(driver);
    await repo.create(makeTeam());
    taskManager = new TaskManager(repo, () => AGENTS);

    server = new TeamMcpServer({
      teamId: TEAM_ID,
      getAgents: () => AGENTS,
      mailbox: { write: vi.fn().mockResolvedValue({ id: 'msg-1' }) } as unknown as Mailbox,
      taskManager,
      wakeAgent: vi.fn().mockResolvedValue(undefined),
    });
    await server.start();
    authToken = server.getStdioConfig().env.find((e) => e.name === 'TEAM_MCP_TOKEN')!.value;
  });

  afterEach(async () => {
    await server.stop();
    driver.close();
  });

  const createTask = (args: Record<string, unknown>) =>
    tcpRequest(server.getPort(), { tool: 'team_task_create', args, auth_token: authToken });

  it('a repeated team_task_create yields ONE task and an ack that says it was reused', async () => {
    const first = await createTask({ subject: 'Draft the release notes', owner: 'Alice' });
    const second = await createTask({ subject: 'Draft the release notes', owner: 'Alice' });

    expect(first.error).toBeUndefined();
    expect(second.error).toBeUndefined();
    expect(first.result).toContain('Task created');
    expect(second.result).toMatch(/Reused the existing task/);
    expect(second.result).toContain('no duplicate was created');

    const tasks = await repo.findTasksByTeam(TEAM_ID);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].owner).toBe('slot-alice');
    // The ack points at the SAME task the first call opened.
    expect(second.result).toContain(tasks[0].id.slice(0, 8));
  });

  it('treats case, padding, tabs and collapsed whitespace as the same subject', async () => {
    await createTask({ subject: 'Draft the release notes', owner: 'Alice' });
    const variant = await createTask({ subject: '  DRAFT   the\trelease  notes ', owner: 'Alice' });

    expect(variant.result).toMatch(/Reused the existing task/);
    expect(await repo.findTasksByTeam(TEAM_ID)).toHaveLength(1);
  });

  it('does NOT let a terminal task block a later task with the same subject', async () => {
    const first = await createTask({ subject: 'Run the smoke suite', owner: 'Alice' });
    expect(first.error).toBeUndefined();
    const [original] = await repo.findTasksByTeam(TEAM_ID);

    await taskManager.update(original.id, { status: 'completed' });

    const again = await createTask({ subject: 'Run the smoke suite', owner: 'Alice' });
    expect(again.error).toBeUndefined();
    expect(again.result).toContain('Task created');

    const tasks = await repo.findTasksByTeam(TEAM_ID);
    expect(tasks).toHaveLength(2);
    expect(tasks.filter((t) => t.status === 'completed')).toHaveLength(1);
    expect(tasks.filter((t) => t.status === 'pending')).toHaveLength(1);
  });

  it('keeps the same subject separate per owner, and separate from unassigned', async () => {
    await createTask({ subject: 'Review the diff', owner: 'Alice' });
    await createTask({ subject: 'Review the diff', owner: 'Leader' });
    await createTask({ subject: 'Review the diff' });

    const tasks = await repo.findTasksByTeam(TEAM_ID);
    expect(tasks).toHaveLength(3);
    expect(new Set(tasks.map((t) => t.owner ?? null))).toEqual(new Set(['slot-alice', 'slot-lead', null]));
  });

  it('deduplicates an unassigned task against itself', async () => {
    await createTask({ subject: 'Tidy the board' });
    const second = await createTask({ subject: 'Tidy the board' });

    expect(second.result).toMatch(/Reused the existing task/);
    expect(await repo.findTasksByTeam(TEAM_ID)).toHaveLength(1);
  });

  it('does not create a second bidirectional link when a blocked task is retried', async () => {
    const upstream = await taskManager.create({ teamId: TEAM_ID, subject: 'Upstream' });
    const downstream = await taskManager.createOrReuse({
      teamId: TEAM_ID,
      subject: 'Downstream',
      blockedBy: [upstream.id],
    });
    expect(downstream.reused).toBe(false);

    const retry = await taskManager.createOrReuse({
      teamId: TEAM_ID,
      subject: 'Downstream',
      blockedBy: [upstream.id],
    });
    expect(retry.reused).toBe(true);
    expect(retry.task.id).toBe(downstream.task.id);
    expect((await repo.findTaskById(upstream.id))!.blocks).toEqual([downstream.task.id]);
  });

  it('surfaces the collision straight from the repository as TeamTaskDuplicateError', async () => {
    const now = Date.now();
    const base = {
      teamId: TEAM_ID,
      subject: 'Direct write',
      status: 'pending' as const,
      blockedBy: [],
      blocks: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    const first = await repo.createTask({ ...base, id: 'task-direct-1' });
    await expect(repo.createTask({ ...base, id: 'task-direct-2' })).rejects.toBeInstanceOf(TeamTaskDuplicateError);
    await expect(repo.createTask({ ...base, id: 'task-direct-2' })).rejects.toMatchObject({
      existing: expect.objectContaining({ id: first.id }),
    });
    expect(await repo.findTaskById('task-direct-2')).toBeNull();
  });
});
