/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #980 remaining half, at the seam where the leader's belief is actually formed.
 *
 * `team_send_message` is the only channel a teammate has for reporting work, and
 * whatever it says is what the leader takes as fact - the mailbox carries no
 * artifact record and the task board has no deliverable field. So the message is
 * reconciled against the team workspace before it is written, and an
 * unsupported claim is annotated onto the text the leader will read.
 *
 * Annotated, not refused: the message still gets through, because a teammate
 * whose file is one directory off has still done the work, and losing the report
 * would be worse than the wrong path.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as net from 'node:net';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

vi.mock('electron', () => ({ app: { isPackaged: false, getAppPath: () => '/app' } }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
}));
vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { getDetectedAgents: vi.fn(() => []) },
}));
vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: { getInstance: () => ({ getAssistants: () => [] }) },
}));

import { TeamMcpServer } from '@process/team/mcp/team/TeamMcpServer';
import type { Mailbox } from '@process/team/Mailbox';
import type { TaskManager } from '@process/team/TaskManager';
import type { TeamAgent, TTeam } from '@process/team/types';

const agent = (over: Partial<TeamAgent>): TeamAgent => ({
  slotId: 'slot-1',
  conversationId: 'conv-1',
  role: 'teammate',
  agentType: 'acp',
  agentName: 'Alice',
  conversationType: 'acp',
  status: 'idle',
  ...over,
});

async function tcpRequest(port: number, data: unknown): Promise<unknown> {
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
        try {
          resolve(JSON.parse(jsonStr));
        } catch (e) {
          reject(e);
        }
      }
    });
    socket.on('error', reject);
    setTimeout(() => reject(new Error('TCP request timed out')), 5000);
  });
}

describe('#980 team_send_message reconciles a deliverable claim before the leader believes it', () => {
  let server: TeamMcpServer;
  let workspace: string;
  let write: ReturnType<typeof vi.fn>;
  let token: string;

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-team-send-'));
    write = vi.fn().mockResolvedValue({ id: 'msg-1', type: 'message', read: false, createdAt: 1 });
    const agents = [agent({ slotId: 'slot-lead', agentName: 'Leader', role: 'leader' }), agent({})];
    server = new TeamMcpServer({
      teamId: 'team-1',
      getAgents: () => agents,
      getTeam: () => ({ id: 'team-1', workspace, agents }) as unknown as TTeam,
      mailbox: { write, readUnread: vi.fn(), getHistory: vi.fn() } as unknown as Mailbox,
      taskManager: {
        create: vi.fn(),
        createOrReuse: vi.fn(),
        update: vi.fn(),
        list: vi.fn().mockResolvedValue([]),
        getByOwner: vi.fn().mockResolvedValue([]),
        checkUnblocks: vi.fn().mockResolvedValue([]),
      } as unknown as TaskManager,
      spawnAgent: vi.fn(),
      renameAgent: vi.fn(),
      removeAgent: vi.fn(),
      wakeAgent: vi.fn().mockResolvedValue(undefined),
    });
    await server.start();
    token = server.getStdioConfig().env.find((e) => e.name === 'TEAM_MCP_TOKEN')?.value ?? '';
  });

  afterEach(async () => {
    await server.stop();
    await fs.rm(workspace, { recursive: true, force: true });
  });

  const send = (message: string) =>
    tcpRequest(server.getPort(), {
      token,
      tool: 'team_send_message',
      args: { to: 'Leader', message },
      fromSlotId: 'slot-1',
    });

  it('annotates a claim the workspace does not support', async () => {
    await send('Done - I wrote chart-brief.md with the analysis.');

    expect(write).toHaveBeenCalledTimes(1);
    const delivered = write.mock.calls[0][0].content as string;
    // The teammate's own words survive; the correction rides alongside them.
    expect(delivered).toContain('I wrote chart-brief.md');
    expect(delivered).toContain('chart-brief.md');
    expect(delivered).not.toBe('Done - I wrote chart-brief.md with the analysis.');
  });

  it('leaves a truthful message byte-identical', async () => {
    await fs.writeFile(path.join(workspace, 'chart-brief.md'), '# brief');
    const message = 'Done - I wrote chart-brief.md with the analysis.';

    await send(message);

    expect(write.mock.calls[0][0].content).toBe(message);
  });

  it('leaves an ordinary message with no claim byte-identical', async () => {
    const message = 'Starting on the research now, will report back.';

    await send(message);

    expect(write.mock.calls[0][0].content).toBe(message);
  });
});
