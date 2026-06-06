/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4b - TeamMcpServer sandbox-gate tests.
 *
 * Exercises the two capability-gated branches in `handleToolCall`:
 *   - `team_send_message` cross-team destination requires `canCrossTeamMessage`.
 *   - `team_spawn_agent` requires `canSpawnAgents`.
 *
 * Same-team `team_send_message`, `team_task_create`, and `team_task_update`
 * are exercised as the always-allow carve-outs from the matrix. Tests use
 * the real TeamMcpServer + a TCP loopback round-trip so the gate is
 * verified at the dispatch boundary.
 */

import * as net from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/app' },
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => {
      if (key === 'acp.cachedInitializeResult') {
        return {
          claude: {
            protocolVersion: 1,
            capabilities: {
              loadSession: false,
              promptCapabilities: { image: false, audio: false, embeddedContext: false },
              mcpCapabilities: { stdio: true, http: false, sse: false },
              sessionCapabilities: { fork: null, resume: null, list: null, close: null },
              _meta: {},
            },
            agentInfo: null,
            authMethods: [],
          },
        };
      }
      return null;
    }),
  },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: {
    getDetectedAgents: vi.fn(() => [{ backend: 'claude', name: 'Claude' }]),
  },
}));

import { TeamMcpServer } from '@process/team/mcp/team/TeamMcpServer';
import type { Mailbox } from '@process/team/Mailbox';
import type { TaskManager } from '@process/team/TaskManager';
import type { TeamAgent, TTeam } from '@process/team/types';

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

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-own',
    userId: 'user-1',
    name: 'Crew',
    workspace: '/tmp',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-lead',
    agents: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeMailbox(): Mailbox {
  return {
    write: vi.fn().mockResolvedValue({ id: 'msg-1', type: 'message', read: false, createdAt: 1000 }),
    readUnread: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
  } as unknown as Mailbox;
}

function makeTaskManager() {
  return {
    create: vi.fn().mockResolvedValue({ id: 'task-1', subject: 'Test', status: 'pending', owner: undefined }),
    update: vi.fn().mockResolvedValue({ id: 'task-1', status: 'completed' }),
    list: vi.fn().mockResolvedValue([]),
    getByOwner: vi.fn().mockResolvedValue([]),
    checkUnblocks: vi.fn().mockResolvedValue([]),
  } as unknown as TaskManager;
}

async function tcpRequest(port: number, data: unknown): Promise<{ result?: unknown; error?: string }> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect(port, '127.0.0.1', () => {
      const json = JSON.stringify(data);
      const body = Buffer.from(json, 'utf-8');
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
        try {
          resolve(JSON.parse(jsonStr));
        } catch (e) {
          reject(e);
        }
      }
    });
    socket.on('error', reject);
    setTimeout(() => reject(new Error('TCP request timed out')), 3000);
  });
}

type ServerHandle = {
  server: TeamMcpServer;
  authToken: string;
};

async function startServer(team: TTeam, mailbox: Mailbox, taskManager: TaskManager): Promise<ServerHandle> {
  const agents: TeamAgent[] = [
    makeAgent({ slotId: 'slot-lead', role: 'leader', agentName: 'Leader' }),
    makeAgent({ slotId: 'slot-mate', role: 'teammate', agentName: 'Alice' }),
  ];
  const server = new TeamMcpServer({
    teamId: team.id,
    getAgents: () => agents,
    getTeam: () => team,
    mailbox,
    taskManager,
    spawnAgent: vi.fn().mockResolvedValue(
      makeAgent({ slotId: 'slot-new', agentName: 'NewBot', role: 'teammate' })
    ),
    renameAgent: vi.fn(),
    removeAgent: vi.fn(),
    wakeAgent: vi.fn().mockResolvedValue(undefined),
  });
  await server.start();
  const cfg = server.getStdioConfig();
  const authToken = cfg.env.find((e) => e.name === 'TEAM_MCP_TOKEN')?.value ?? '';
  return { server, authToken };
}

describe('TeamMcpServer - sandbox gates', () => {
  let handle: ServerHandle;
  let mailbox: Mailbox;
  let taskManager: TaskManager;

  afterEach(async () => {
    if (handle?.server) await handle.server.stop();
  });

  describe('sandboxed team without canCrossTeamMessage', () => {
    beforeEach(async () => {
      mailbox = makeMailbox();
      taskManager = makeTaskManager();
      // W4 audit CRIT-2 fix (2026-05-19): imported teams gate via the
      // per-cap grant map; non-imported teams bypass. Set `importedFrom`
      // so the sandbox gate engages even though `isSandboxed: true`.
      const team = makeTeam({
        importedFrom: 'pack.json',
        isSandboxed: true,
        importCapabilityGrants: {},
      });
      handle = await startServer(team, mailbox, taskManager);
    });

    it('blocks team_send_message addressed to a DIFFERENT team', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_send_message',
        args: { to: 'Alice', team_id: 'team-other', message: 'hi' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeDefined();
      expect(String(res.error)).toMatch(/canCrossTeamMessage/);
    });

    it('allows team_send_message addressed to the SAME team (no team_id arg)', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_send_message',
        args: { to: 'Alice', message: 'hi' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeUndefined();
      expect(res.result).toMatch(/Message sent/);
    });

    it('allows team_send_message addressed with team_id equal to own', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_send_message',
        args: { to: 'Alice', team_id: 'team-own', message: 'hi' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeUndefined();
      expect(res.result).toMatch(/Message sent/);
    });
  });

  describe('sandboxed team without canSpawnAgents', () => {
    beforeEach(async () => {
      mailbox = makeMailbox();
      taskManager = makeTaskManager();
      // W4 audit CRIT-2 fix (2026-05-19): imported teams gate via the
      // per-cap grant map; non-imported teams bypass. Set `importedFrom`
      // so the sandbox gate engages even though `isSandboxed: true`.
      const team = makeTeam({
        importedFrom: 'pack.json',
        isSandboxed: true,
        importCapabilityGrants: {},
      });
      handle = await startServer(team, mailbox, taskManager);
    });

    it('blocks team_spawn_agent even when caller is the leader', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_spawn_agent',
        args: { name: 'NewBot', agent_type: 'claude' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeDefined();
      expect(String(res.error)).toMatch(/canSpawnAgents/);
    });
  });

  describe('sandboxed team - task carve-outs always allow', () => {
    beforeEach(async () => {
      mailbox = makeMailbox();
      taskManager = makeTaskManager();
      // W4 audit CRIT-2 fix (2026-05-19): imported teams gate via the
      // per-cap grant map; non-imported teams bypass. Set `importedFrom`
      // so the sandbox gate engages even though `isSandboxed: true`.
      const team = makeTeam({
        importedFrom: 'pack.json',
        isSandboxed: true,
        importCapabilityGrants: {},
      });
      handle = await startServer(team, mailbox, taskManager);
    });

    it('allows team_task_create even in sandbox mode', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_task_create',
        args: { subject: 'Do thing' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeUndefined();
      expect(res.result).toMatch(/Task created/);
    });

    it('allows team_task_update even in sandbox mode', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_task_update',
        args: { task_id: 'task-1', status: 'completed' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeUndefined();
      expect(res.result).toMatch(/updated/);
    });
  });

  describe('non-sandboxed team - gates are bypassed', () => {
    beforeEach(async () => {
      mailbox = makeMailbox();
      taskManager = makeTaskManager();
      const team = makeTeam({ isSandboxed: false });
      handle = await startServer(team, mailbox, taskManager);
    });

    it('allows cross-team team_send_message', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_send_message',
        args: { to: 'Alice', team_id: 'team-other', message: 'hi' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      // Cross-team routing is not implemented for delivery yet, but the
      // sandbox gate is bypassed, so this hits the same-team resolver and
      // succeeds (Alice is in the local roster).
      expect(res.error).toBeUndefined();
    });

    it('allows team_spawn_agent', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_spawn_agent',
        args: { name: 'NewBot', agent_type: 'claude' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeUndefined();
      expect(res.result).toMatch(/Teammate "NewBot"/);
    });
  });

  describe('sandboxed team with canSpawnAgents granted', () => {
    beforeEach(async () => {
      mailbox = makeMailbox();
      taskManager = makeTaskManager();
      const team = makeTeam({
        importedFrom: 'pack.json',
        isSandboxed: true,
        importCapabilityGrants: {
          canSpawnAgents: { granted_at: 1, by_user: true },
        },
      });
      handle = await startServer(team, mailbox, taskManager);
    });

    it('allows team_spawn_agent when the capability is granted', async () => {
      const res = await tcpRequest(handle.server.getPort(), {
        tool: 'team_spawn_agent',
        args: { name: 'NewBot', agent_type: 'claude' },
        from_slot_id: 'slot-lead',
        auth_token: handle.authToken,
      });
      expect(res.error).toBeUndefined();
      expect(res.result).toMatch(/Teammate "NewBot"/);
    });
  });
});
