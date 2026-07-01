/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ProjectOperatorMcpServer,
  runProjectOperatorHealthCheck,
} from '@process/services/projectOperator/ProjectOperatorMcpServer';

async function tcpRequest(port: number, data: unknown): Promise<{ result?: string; error?: string }> {
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
        resolve(JSON.parse(jsonStr) as { result?: string; error?: string });
      }
    });
    socket.on('error', reject);
    setTimeout(() => reject(new Error('TCP request timed out')), 3000);
  });
}

describe('ProjectOperatorMcpServer', () => {
  let workspace: string;
  let server: ProjectOperatorMcpServer | null = null;
  let authToken = '';

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-project-operator-'));
    await fs.writeFile(path.join(workspace, 'README.md'), '# Test Project\n', 'utf8');
    server = new ProjectOperatorMcpServer({
      projectId: 'project-1',
      projectName: 'Test Project',
      workspace,
    });
    await server.start();
    const cfg = server.getStdioConfig();
    authToken = cfg.env.find((entry) => entry.name === 'PROJECT_OPERATOR_MCP_TOKEN')?.value ?? '';
  });

  afterEach(async () => {
    await server?.stop();
    await fs.rm(workspace, { recursive: true, force: true });
  });

  it('passes the direct operator readiness check', async () => {
    const health = await runProjectOperatorHealthCheck({
      projectId: 'project-1',
      projectName: 'Test Project',
      workspace,
    });
    expect(health.callable).toBe(true);
    expect(health.checks.map((check) => check.name)).toEqual([
      'active_project',
      'workspace_cwd',
      'write_project_file',
      'read_project_file',
      'run_project_command',
    ]);
  });

  it('serves project file and command tools over the authenticated TCP bridge', async () => {
    const port = server!.getPort();
    const write = await tcpRequest(port, {
      tool: 'write_project_file',
      args: { path: 'test.txt', content: 'hello project' },
      auth_token: authToken,
    });
    expect(write.error).toBeUndefined();

    const read = await tcpRequest(port, {
      tool: 'read_project_file',
      args: { path: 'test.txt' },
      auth_token: authToken,
    });
    expect(read.result).toBe('hello project');

    const command = await tcpRequest(port, {
      tool: 'run_project_command',
      args: { command: process.platform === 'win32' ? 'cd' : 'pwd' },
      auth_token: authToken,
    });
    expect(command.error).toBeUndefined();
    expect(command.result).toContain(workspace);
  });

  it('rejects workspace escapes and secret-looking files', async () => {
    const port = server!.getPort();
    const escape = await tcpRequest(port, {
      tool: 'read_project_file',
      args: { path: '../outside.txt' },
      auth_token: authToken,
    });
    expect(escape.error).toMatch(/escapes workspace/);

    const secret = await tcpRequest(port, {
      tool: 'write_project_file',
      args: { path: '.env', content: 'TOKEN=nope' },
      auth_token: authToken,
    });
    expect(secret.error).toMatch(/secret-looking|Protected segment/);
  });
});
