/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'node:crypto';
import * as net from 'node:net';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import type { StdioMcpConfig } from '@process/team/mcp/team/TeamMcpServer';
import { withOpenInsideWorkspace } from '@process/team/sandbox/workspaceFs';
import { writeTcpMessage, createTcpMessageReader, resolveMcpScriptDir } from '@process/team/mcp/tcpHelpers';

const exec = promisify(execCallback);

const PROJECT_OPERATOR_MCP_NAME = 'wayland-project-operator';
const PROJECT_OPERATOR_SCRIPT = 'project-operator-mcp-stdio.js';
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_COMMAND_OUTPUT_BYTES = 256 * 1024;
const COMMAND_TIMEOUT_MS = 120_000;

export const PROJECT_OPERATOR_TOOLS = [
  'project_operator_health',
  'read_project_file',
  'write_project_file',
  'run_project_command',
  'append_project_log',
] as const;

export type ProjectOperatorTool = (typeof PROJECT_OPERATOR_TOOLS)[number];

export type ProjectOperatorIdentity = {
  projectId: string;
  projectName: string;
  workspace: string;
};

export type ProjectOperatorHealth = {
  manifestKnown: boolean;
  bridgeAttached: boolean;
  callable: boolean;
  projectId: string;
  projectName: string;
  workspace: string;
  cwd: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function normalizedPathSegments(relPath: string): string[] {
  return relPath
    .split(/[\\/]/)
    .filter(Boolean)
    .map((segment) => segment.normalize('NFKC').toLowerCase());
}

function assertNonSecretProjectPath(relPath: string): void {
  const segments = normalizedPathSegments(relPath);
  const basename = segments.at(-1) ?? '';
  const forbiddenExact = new Set(['.env', '.npmrc', '.netrc', '.pypirc', 'id_rsa', 'id_ed25519', 'known_hosts']);
  if (segments.some((segment) => segment === '.ssh' || segment === '.gnupg' || segment === '.aws')) {
    throw new Error(`Refusing to access credential path: ${relPath}`);
  }
  if (forbiddenExact.has(basename) || basename.endsWith('.pem') || basename.endsWith('.key')) {
    throw new Error(`Refusing to access secret-looking file: ${relPath}`);
  }
}

function resolveInsideWorkspace(workspace: string, requested = '.'): string {
  const absWorkspace = path.resolve(workspace);
  const absRequested = path.resolve(absWorkspace, requested);
  const rel = path.relative(absWorkspace, absRequested);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path escapes workspace: ${requested}`);
  }
  return absRequested;
}

async function ensureOperatorScratch(workspace: string): Promise<string> {
  const scratchDir = resolveInsideWorkspace(workspace, path.join('.wayland', 'operator-ready'));
  await fs.mkdir(scratchDir, { recursive: true });
  return scratchDir;
}

async function runProjectCommand(workspace: string, command: string, cwdArg?: string): Promise<string> {
  const trimmed = command.trim();
  if (!trimmed) throw new Error('command is required');
  if (trimmed.length > 4000) throw new Error('command is too long');

  const cwd = resolveInsideWorkspace(workspace, cwdArg || '.');
  const stat = await fs.stat(cwd);
  if (!stat.isDirectory()) throw new Error(`cwd is not a directory: ${cwdArg || '.'}`);

  const { stdout, stderr } = await exec(trimmed, {
    cwd,
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: MAX_COMMAND_OUTPUT_BYTES,
    env: process.env,
  });
  return [
    `cwd: ${cwd}`,
    stdout ? `stdout:\n${stdout}` : 'stdout: <empty>',
    stderr ? `stderr:\n${stderr}` : 'stderr: <empty>',
  ].join('\n');
}

export async function runProjectOperatorHealthCheck(identity: ProjectOperatorIdentity): Promise<ProjectOperatorHealth> {
  const checks: ProjectOperatorHealth['checks'] = [];
  const workspace = path.resolve(identity.workspace);
  const scratch = await ensureOperatorScratch(workspace);
  const probeRel = path.join('.wayland', 'operator-ready', `probe-${crypto.randomUUID()}.txt`);
  const probeText = `operator-ready ${new Date().toISOString()}`;

  const record = async (name: string, fn: () => Promise<string>): Promise<void> => {
    try {
      const detail = await fn();
      checks.push({ name, ok: true, detail });
    } catch (err) {
      checks.push({ name, ok: false, detail: err instanceof Error ? err.message : String(err) });
    }
  };

  await record('active_project', async () => {
    if (!identity.projectId) throw new Error('missing project id');
    if (!identity.projectName) throw new Error('missing project name');
    return `${identity.projectName} (${identity.projectId})`;
  });

  await record('workspace_cwd', async () => {
    const stat = await fs.stat(workspace);
    if (!stat.isDirectory()) throw new Error('workspace is not a directory');
    return workspace;
  });

  await record('write_project_file', async () => {
    await withOpenInsideWorkspace(workspace, probeRel, 'write', async (fh) => {
      await fh.writeFile(probeText, 'utf8');
    });
    return probeRel;
  });

  await record('read_project_file', async () => {
    const readBack = await withOpenInsideWorkspace(workspace, probeRel, 'read', async (fh) => fh.readFile('utf8'));
    if (readBack !== probeText) throw new Error('probe readback mismatch');
    return probeRel;
  });

  await record('run_project_command', async () => {
    const output = await runProjectCommand(workspace, process.platform === 'win32' ? 'cd' : 'pwd');
    return output.split('\n')[0] ?? 'command returned';
  });

  await fs.unlink(path.join(scratch, path.basename(probeRel))).catch((): undefined => undefined);

  const callable = checks.every((check) => check.ok);
  return {
    manifestKnown: true,
    bridgeAttached: true,
    callable,
    projectId: identity.projectId,
    projectName: identity.projectName,
    workspace,
    cwd: workspace,
    checks,
  };
}

export class ProjectOperatorMcpServer {
  private tcpServer: net.Server | null = null;
  private _port = 0;
  private readonly authToken = crypto.randomUUID();
  private readonly identity: ProjectOperatorIdentity;

  constructor(identity: ProjectOperatorIdentity) {
    this.identity = { ...identity, workspace: path.resolve(identity.workspace) };
  }

  async start(): Promise<StdioMcpConfig> {
    await runProjectOperatorHealthCheck(this.identity).then((health) => {
      if (!health.callable) {
        const failed = health.checks.filter((check) => !check.ok).map((check) => `${check.name}: ${check.detail}`);
        throw new Error(`Project operator readiness failed: ${failed.join('; ')}`);
      }
    });

    this.tcpServer = net.createServer((socket) => this.handleTcpConnection(socket));

    await new Promise<void>((resolve, reject) => {
      this.tcpServer!.listen(0, '127.0.0.1', () => {
        const addr = this.tcpServer!.address();
        if (addr && typeof addr === 'object') this._port = addr.port;
        resolve();
      });
      this.tcpServer!.once('error', reject);
    });

    console.log(`[ProjectOperatorMcpServer] ${this.identity.projectId} TCP server started on port ${this._port}`);
    return this.getStdioConfig();
  }

  async stop(): Promise<void> {
    if (!this.tcpServer) return;
    await new Promise<void>((resolve) => {
      this.tcpServer!.close(() => {
        console.log(`[ProjectOperatorMcpServer] ${this.identity.projectId} TCP server stopped`);
        this.tcpServer = null;
        resolve();
      });
    });
    this._port = 0;
  }

  getPort(): number {
    return this._port;
  }

  getStdioConfig(): StdioMcpConfig {
    return {
      name: PROJECT_OPERATOR_MCP_NAME,
      command: 'node',
      args: [path.join(resolveMcpScriptDir(), PROJECT_OPERATOR_SCRIPT)],
      env: [
        { name: 'PROJECT_OPERATOR_MCP_PORT', value: String(this._port) },
        { name: 'PROJECT_OPERATOR_MCP_TOKEN', value: this.authToken },
        { name: 'PROJECT_OPERATOR_PROJECT_ID', value: this.identity.projectId },
        { name: 'PROJECT_OPERATOR_PROJECT_NAME', value: this.identity.projectName },
        { name: 'PROJECT_OPERATOR_WORKSPACE', value: this.identity.workspace },
      ],
    };
  }

  private handleTcpConnection(socket: net.Socket): void {
    const reader = createTcpMessageReader(
      async (msg) => {
        const request = msg as {
          tool?: string;
          args?: Record<string, unknown>;
          auth_token?: string;
        };

        if (request.auth_token !== this.authToken) {
          writeTcpMessage(socket, { error: 'Unauthorized' });
          socket.end();
          return;
        }

        try {
          const result = await this.handleToolCall(request.tool ?? '', request.args ?? {});
          writeTcpMessage(socket, { result });
        } catch (err) {
          writeTcpMessage(socket, { error: err instanceof Error ? err.message : String(err) });
        }
        socket.end();
      },
      {
        onError: (err) => {
          console.warn(`[ProjectOperatorMcpServer] TCP framing error: ${err.message}`);
          socket.destroy();
        },
      }
    );

    socket.on('data', reader);
    socket.on('error', () => socket.destroy());
    socket.setTimeout(600_000);
    socket.on('timeout', () => socket.destroy());
  }

  private async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
    switch (toolName) {
      case 'project_operator_health':
        return stringify(await runProjectOperatorHealthCheck(this.identity));
      case 'read_project_file':
        return this.readProjectFile(args);
      case 'write_project_file':
        return this.writeProjectFile(args);
      case 'run_project_command':
        return this.runProjectCommand(args);
      case 'append_project_log':
        return this.appendProjectLog(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async readProjectFile(args: Record<string, unknown>): Promise<string> {
    const relPath = String(args.path ?? '').trim();
    if (!relPath) throw new Error('path is required');
    assertNonSecretProjectPath(relPath);
    const content = await withOpenInsideWorkspace(this.identity.workspace, relPath, 'read', async (fh) =>
      fh.readFile({ encoding: 'utf8' })
    );
    if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) {
      throw new Error(`File exceeds ${MAX_FILE_BYTES} bytes: ${relPath}`);
    }
    return content;
  }

  private async writeProjectFile(args: Record<string, unknown>): Promise<string> {
    const relPath = String(args.path ?? '').trim();
    const content = String(args.content ?? '');
    if (!relPath) throw new Error('path is required');
    assertNonSecretProjectPath(relPath);
    if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) {
      throw new Error(`Content exceeds ${MAX_FILE_BYTES} bytes`);
    }
    await withOpenInsideWorkspace(this.identity.workspace, relPath, 'write', async (fh) => {
      await fh.writeFile(content, 'utf8');
    });
    return `Wrote ${Buffer.byteLength(content, 'utf8')} bytes to ${relPath}`;
  }

  private async runProjectCommand(args: Record<string, unknown>): Promise<string> {
    const command = String(args.command ?? '');
    const cwd = typeof args.cwd === 'string' ? args.cwd : undefined;
    return runProjectCommand(this.identity.workspace, command, cwd);
  }

  private async appendProjectLog(args: Record<string, unknown>): Promise<string> {
    const message = String(args.message ?? '').trim();
    if (!message) throw new Error('message is required');
    const logRel = path.join('.wayland', 'operator-log.md');
    await ensureOperatorScratch(this.identity.workspace);
    const existing = await withOpenInsideWorkspace(this.identity.workspace, logRel, 'read', async (fh) =>
      fh.readFile('utf8')
    ).catch(() => '');
    const entry = `\n## ${new Date().toISOString()}\n${message}\n`;
    await withOpenInsideWorkspace(this.identity.workspace, logRel, 'write', async (fh) => {
      await fh.writeFile(existing + entry, 'utf8');
    });
    return `Appended ${message.length} chars to ${logRel}`;
  }
}
