/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { IMcpServer } from '../src/common/config/storage';
import { mcpServerCollisionKey } from '../src/common/mcp';
import { validateMcpServer } from '../src/process/services/mcpServices/validateMcpServer';

type Command = 'list' | 'validate' | 'probe' | 'doctor' | 'help';

interface CliOptions {
  command: Command;
  configPath?: string;
  serverName?: string;
}

interface ConfigDocument {
  'mcp.config'?: unknown;
}

const SECRET_KEY = /(?:authorization|api[-_]?key|token|secret|password|credential|cookie)/i;

function usage(): string {
  return [
    'Wayland MCP diagnostics',
    '',
    'Usage:',
    '  bun run debug:mcp:list [--config PATH]',
    '  bun run debug:mcp:validate [--config PATH]',
    '  bun run debug:mcp -- probe [SERVER_NAME] [--config PATH]',
    '  bun run debug:mcp:doctor -- [SERVER_NAME] [--config PATH]',
    '',
    'The tool never prints header/env values. Set WAYLAND_CONFIG_PATH or pass',
    '--config to inspect a non-default Desktop profile. A successful probe proves',
    'server reachability only; it does not prove publication into an active chat.',
  ].join('\n');
}

export function parseArgs(argv: string[]): CliOptions {
  const args = [...argv];
  const first = args[0];
  const command: Command =
    first === 'list' || first === 'validate' || first === 'probe' || first === 'doctor' || first === 'help'
      ? first
      : 'list';
  if (first === command) args.shift();

  let configPath: string | undefined;
  let serverName: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--config') {
      const value = args[index + 1];
      if (!value) throw new Error('--config requires a path');
      configPath = path.resolve(value);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      return { command: 'help' };
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!serverName) {
      serverName = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return { command, configPath, serverName };
}

export function defaultConfigCandidates(env: NodeJS.ProcessEnv = process.env): string[] {
  const home = os.homedir();
  const candidates = [
    env.WAYLAND_CONFIG_PATH,
    path.join(home, '.wayland-config', 'wayland-config.txt'),
    path.join(home, '.wayland-config-dev', 'wayland-config.txt'),
  ];

  if (process.platform === 'darwin') {
    candidates.push(
      path.join(home, 'Library', 'Application Support', 'Wayland', 'config', 'wayland-config.txt'),
      path.join(home, 'Library', 'Application Support', 'Wayland-Dev', 'config', 'wayland-config.txt')
    );
  } else if (process.platform === 'win32' && env.APPDATA) {
    candidates.push(
      path.join(env.APPDATA, 'Wayland', 'config', 'wayland-config.txt'),
      path.join(env.APPDATA, 'Wayland-Dev', 'config', 'wayland-config.txt')
    );
  } else {
    const configHome = env.XDG_CONFIG_HOME || path.join(home, '.config');
    candidates.push(
      path.join(configHome, 'Wayland', 'config', 'wayland-config.txt'),
      path.join(configHome, 'Wayland-Dev', 'config', 'wayland-config.txt')
    );
  }

  return [...new Set(candidates.filter((candidate): candidate is string => Boolean(candidate)))];
}

function decodeConfig(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    return decodeURIComponent(decoded);
  } catch {
    throw new Error('Config is neither JSON nor Wayland base64-encoded JSON');
  }
}

function isMcpServer(value: unknown): value is IMcpServer {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<IMcpServer>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.enabled === 'boolean' &&
    Boolean(candidate.transport) &&
    typeof candidate.transport === 'object' &&
    typeof candidate.transport.type === 'string'
  );
}

export function parseConfigServers(raw: string): IMcpServer[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeConfig(raw));
  } catch (error) {
    throw new Error(`Unable to parse config: ${error instanceof Error ? error.message : String(error)}`);
  }

  const values = Array.isArray(parsed) ? parsed : (parsed as ConfigDocument | null)?.['mcp.config'];
  if (!Array.isArray(values)) throw new Error('Config has no mcp.config array');

  const invalidIndex = values.findIndex((value) => !isMcpServer(value));
  if (invalidIndex >= 0) throw new Error(`mcp.config entry ${invalidIndex} is not a complete MCP server declaration`);
  return values;
}

function resolveConfigPath(explicitPath?: string): string {
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) throw new Error(`Config not found: ${explicitPath}`);
    return explicitPath;
  }

  const existing = defaultConfigCandidates().filter((candidate) => fs.existsSync(candidate));
  if (existing.length === 0) {
    throw new Error(
      `No Wayland config found. Set WAYLAND_CONFIG_PATH or pass --config. Checked:\n${defaultConfigCandidates()
        .map((candidate) => `  ${candidate}`)
        .join('\n')}`
    );
  }
  // Candidate order is intentional: explicit env, stable Desktop profile,
  // development profile, then platform-native fallbacks. A developer commonly
  // has both stable and dev profiles, so ambiguity must not make the documented
  // zero-argument command unusable. The selected path is always printed and an
  // alternate profile remains selectable with --config.
  return existing[0];
}

export function redactUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const key of url.searchParams.keys()) {
      url.searchParams.set(key, SECRET_KEY.test(key) ? '<redacted>' : '<present>');
    }
    return url.toString();
  } catch {
    return '<invalid-url>';
  }
}

function serverSummary(server: IMcpServer): string {
  const { transport } = server;
  let endpoint: string;
  if (transport.type === 'stdio') {
    // Arguments can carry inline API keys. Report their count, never values.
    endpoint = `${transport.command}; ${(transport.args ?? []).length} args`;
    const envKeys = Object.keys(transport.env ?? {});
    if (envKeys.length > 0) endpoint += `; env keys: ${envKeys.join(', ')}`;
  } else {
    endpoint = redactUrl(transport.url);
    const headerKeys = Object.keys(transport.headers ?? {});
    if (headerKeys.length > 0) endpoint += `; header keys: ${headerKeys.join(', ')}`;
  }
  return `${server.enabled ? 'enabled' : 'disabled'} ${server.name} [${transport.type}] ${endpoint}`;
}

function findServer(servers: IMcpServer[], requestedName?: string): IMcpServer[] {
  const enabled = servers.filter((server) => server.enabled);
  if (!requestedName) return enabled;
  const key = mcpServerCollisionKey(requestedName);
  return enabled.filter((server) => mcpServerCollisionKey(server.name) === key);
}

async function probeServers(servers: IMcpServer[]): Promise<boolean> {
  // Register Node paths before importing production MCP protocol code. This
  // command runs outside Electron but deliberately exercises the same transport
  // implementation used by the Library connection test.
  await import('../src/common/platform/register-node');
  const { AbstractMcpAgent } = await import('../src/process/services/mcpServices/McpProtocol');

  class DiagnosticAgent extends AbstractMcpAgent {
    constructor() {
      super('wayland');
    }
    detectMcpServers(): Promise<IMcpServer[]> {
      return Promise.resolve([]);
    }
    installMcpServers(): Promise<{ success: boolean }> {
      return Promise.resolve({ success: false });
    }
    removeMcpServer(): Promise<{ success: boolean }> {
      return Promise.resolve({ success: false });
    }
    getSupportedTransports(): string[] {
      return ['stdio', 'sse', 'http', 'streamable_http'];
    }
  }

  const agent = new DiagnosticAgent();
  let allPassed = true;
  for (const server of servers) {
    const result = await agent.testMcpConnection(server);
    if (result.success) {
      const names = (result.tools ?? []).map((tool) => tool.name);
      console.log(`PASS ${server.name}: ${names.length} tools${names.length ? ` (${names.join(', ')})` : ''}`);
    } else {
      allPassed = false;
      console.error(
        `FAIL ${server.name}: ${result.error ?? 'unknown error'}${result.needsAuth ? ' (auth required)' : ''}`
      );
    }
  }
  return allPassed;
}

function validateServers(servers: IMcpServer[]): boolean {
  const seen = new Map<string, string>();
  let valid = true;
  for (const server of servers) {
    try {
      validateMcpServer(server);
      const key = mcpServerCollisionKey(server.name);
      const previous = seen.get(key);
      if (previous) throw new Error(`case-insensitive identity collision with "${previous}"`);
      seen.set(key, server.name);
      console.log(`PASS ${server.name}`);
    } catch (error) {
      valid = false;
      console.error(`FAIL ${server.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return valid;
}

export async function run(argv: string[]): Promise<number> {
  const options = parseArgs(argv);
  if (options.command === 'help') {
    console.log(usage());
    return 0;
  }

  const configPath = resolveConfigPath(options.configPath);
  const servers = parseConfigServers(fs.readFileSync(configPath, 'utf8'));
  console.log(`Config: ${configPath}`);

  if (options.command === 'list') {
    if (servers.length === 0) console.log('No MCP servers configured.');
    for (const server of servers) console.log(serverSummary(server));
    return 0;
  }

  if (options.command === 'validate') {
    return validateServers(servers) ? 0 : 1;
  }

  const selected = findServer(servers, options.serverName);
  if (selected.length === 0) {
    throw new Error(
      options.serverName ? `No enabled MCP server matches "${options.serverName}"` : 'No enabled MCP servers'
    );
  }

  if (options.command === 'doctor') {
    console.log('\n1. Saved declaration');
    const declarationsValid = validateServers(selected);
    console.log('\n2. Standalone server probe');
    const probesPassed = await probeServers(selected);
    console.log('\n3. Active-chat publication');
    console.log('NOT VERIFIED: this support command cannot inspect an active agent session.');
    console.log('Open a fresh chat with the connector selected and use “Test in this chat” when available.');
    return declarationsValid && probesPassed ? 0 : 1;
  }

  return (await probeServers(selected)) ? 0 : 1;
}

if (require.main === module) {
  void run(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(`MCP diagnostics failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
