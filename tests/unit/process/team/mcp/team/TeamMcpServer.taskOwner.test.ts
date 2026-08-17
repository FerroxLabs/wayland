/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #981 - `team_task_create` / `team_task_update` owner resolution.
 *
 * These tests deliberately do NOT mock TaskManager: the pre-existing MCP suites
 * all stub it, so `validateOwner` never ran and the name-vs-slotId mismatch
 * passed in CI while hard-failing in the field. Here the real TaskManager runs
 * against an in-memory repository, so a bad owner really is refused.
 */

import * as net from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/app' },
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async () => null),
  },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: {
    getDetectedAgents: vi.fn(() => [{ backend: 'claude', name: 'Claude' }]),
  },
}));

import { TeamMcpServer } from '@process/team/mcp/team/TeamMcpServer';
import { TaskManager } from '@process/team/TaskManager';
import type { Mailbox } from '@process/team/Mailbox';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { TeamAgent, TeamTask } from '@process/team/types';

const TEAM_ID = 'team-981';

function makeAgent(overrides: Partial<TeamAgent> = {}): TeamAgent {
  return {
    slotId: 'slot-lead',
    conversationId: 'conv-1',
    role: 'leader',
    agentType: 'claude',
    agentName: 'Leader',
    conversationType: 'acp',
    status: 'idle',
    ...overrides,
  };
}

/** In-memory task repository - only the methods TaskManager exercises here. */
function makeRepo(tasks: Map<string, TeamTask>): ITeamRepository {
  const repo: Partial<ITeamRepository> = {
    async createTask(task: TeamTask) {
      tasks.set(task.id, task);
      return task;
    },
    async findTaskById(id: string) {
      return tasks.get(id) ?? [...tasks.values()].find((t) => t.id.startsWith(id)) ?? null;
    },
    async updateTask(id: string, updates: Partial<TeamTask>) {
      const current = tasks.get(id);
      if (!current) throw new Error(`Task "${id}" not found`);
      const merged = { ...current, ...updates } as TeamTask;
      tasks.set(id, merged);
      return merged;
    },
    async findTasksByTeam(teamId: string) {
      return [...tasks.values()].filter((t) => t.teamId === teamId);
    },
    async appendToBlocks() {},
  };
  return repo as ITeamRepository;
}

function makeMailbox(): Mailbox {
  return {
    write: vi.fn().mockResolvedValue({ id: 'msg-1', type: 'message', read: false, createdAt: 1000 }),
    readUnread: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
  } as unknown as Mailbox;
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

describe('TeamMcpServer task owner resolution (#981)', () => {
  let server: TeamMcpServer;
  let authToken: string;
  let tasks: Map<string, TeamTask>;
  const agents = [
    makeAgent({ slotId: 'slot-lead', agentName: 'Leader', role: 'leader' }),
    makeAgent({ slotId: 'slot-alice', agentName: 'Alice', role: 'teammate' }),
  ];

  beforeEach(async () => {
    tasks = new Map<string, TeamTask>();
    const taskManager = new TaskManager(makeRepo(tasks), () => agents);
    server = new TeamMcpServer({
      teamId: TEAM_ID,
      getAgents: () => agents,
      mailbox: makeMailbox(),
      taskManager,
      wakeAgent: vi.fn().mockResolvedValue(undefined),
    });
    await server.start();
    authToken = server.getStdioConfig().env.find((e) => e.name === 'TEAM_MCP_TOKEN')!.value;
  });

  afterEach(async () => {
    await server.stop();
  });

  it('accepts a teammate NAME as owner on team_task_create and persists the slotId', async () => {
    const res = await tcpRequest(server.getPort(), {
      tool: 'team_task_create',
      args: { subject: 'Write the docs', owner: 'Alice' },
      auth_token: authToken,
    });

    expect(res.error).toBeUndefined();
    expect(res.result).toContain('Task created');
    expect(res.result).toContain('Alice');

    const created = [...tasks.values()];
    expect(created).toHaveLength(1);
    expect(created[0].owner).toBe('slot-alice');
  });

  it('still accepts a raw slotId as owner', async () => {
    const res = await tcpRequest(server.getPort(), {
      tool: 'team_task_create',
      args: { subject: 'Ship it', owner: 'slot-alice' },
      auth_token: authToken,
    });

    expect(res.error).toBeUndefined();
    expect([...tasks.values()][0].owner).toBe('slot-alice');
  });

  it('matches a name case-insensitively and ignoring surrounding whitespace', async () => {
    const res = await tcpRequest(server.getPort(), {
      tool: 'team_task_create',
      args: { subject: 'Fuzzy match', owner: '  alice ' },
      auth_token: authToken,
    });

    expect(res.error).toBeUndefined();
    expect([...tasks.values()][0].owner).toBe('slot-alice');
  });

  it('reassigns by NAME on team_task_update', async () => {
    await tcpRequest(server.getPort(), {
      tool: 'team_task_create',
      args: { subject: 'Reassign me' },
      auth_token: authToken,
    });
    const taskId = [...tasks.values()][0].id;

    const res = await tcpRequest(server.getPort(), {
      tool: 'team_task_update',
      args: { task_id: taskId, owner: 'Alice' },
      auth_token: authToken,
    });

    expect(res.error).toBeUndefined();
    expect(res.result).toContain('Alice');
    expect(tasks.get(taskId)!.owner).toBe('slot-alice');
  });

  it('rejects an owner that matches no teammate, listing the names the caller has seen', async () => {
    const res = await tcpRequest(server.getPort(), {
      tool: 'team_task_create',
      args: { subject: 'Ghost work', owner: 'Nobody' },
      auth_token: authToken,
    });

    expect(res.error).toContain('Nobody');
    expect(res.error).toContain('Leader');
    expect(res.error).toContain('Alice');
    expect(tasks.size).toBe(0);
  });
});
