/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #827 — a catalog MCP server stores a bare `npx` runtime hint. The connection
 * test resolved it to bundled Bun (green badge), but the SESSION-injection paths
 * forwarded raw `npx`, which either fails to spawn on Windows or depends on a
 * different GUI PATH on macOS/Linux → "green, but no tools".
 *
 * Every live-session path must use the same bundled-Bun runtime as the Library
 * connection probe. Persisted Core config uses a portable `bun x --bun` command
 * on POSIX so Linux AppImage remounts cannot leave a stale absolute path.
 *
 * These tests are platform-explicit (helper) / platform-mocked (consumers) so they
 * are deterministic on EVERY CI shard (windows-2022 and macos/ubuntu alike), and
 * assert resolution HAPPENED (command !== 'npx', argv begins `x --bun`) rather than
 * the platform-specific binary name (`bun` vs `bun.exe`).
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  resolveMcpStdioSpawn,
  resolvePersistedMcpStdioSpawn,
} from '@process/services/mcpServices/mcpStdioSpawn';
import { buildAcpSessionMcpServers, buildWCoreUserStdioMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { McpConfig } from '@process/acp/session/McpConfig';
import { toWCoreConfig } from '@process/services/mcpServices/agents/WCoreMcpAgent';
import { buildGeminiStdioMcpConfig } from '@process/task/GeminiAgentManager';
import { createMcpSessionDigestKey } from '@process/services/mcpServices/mcpSessionTruthGate';
import type { IMcpServer } from '@/common/config/storage';

const publication = () => ({
  generation: 'launch-stdio',
  conversationId: 'chat-stdio',
  backend: 'acp' as const,
  sessionKey: createMcpSessionDigestKey(),
});

const npxStdioTransport = { type: 'stdio', command: 'npx', args: ['-y', '@playwright/mcp@0.0.75'] } as Extract<
  IMcpServer['transport'],
  { type: 'stdio' }
>;

const npxServer = (over: Partial<IMcpServer> = {}): IMcpServer =>
  ({
    id: 'pw',
    name: 'playwright',
    enabled: true,
    status: 'connected',
    source: 'library',
    transport: { type: 'stdio', command: 'npx', args: ['-y', '@playwright/mcp@0.0.75'] },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

const caps = { stdio: true, http: true, sse: true };

// process.platform is read-only; redefine it so the win32-only branch is exercised
// deterministically on any host (the consumers call resolveMcpStdioSpawn with the
// default `process.platform`, so this is the only way to drive their win32 path).
const realPlatform = process.platform;
const setPlatform = (p: NodeJS.Platform) =>
  Object.defineProperty(process, 'platform', { value: p, configurable: true });
const restorePlatform = () => Object.defineProperty(process, 'platform', { value: realPlatform, configurable: true });

describe('#827 resolveMcpStdioSpawn', () => {
  it('win32: rewrites npx to the resolver command with `x --bun`, dropping npx-only flags', () => {
    const r = resolveMcpStdioSpawn(
      'npx',
      ['-y', '--prefer-offline', '@playwright/mcp@0.0.75'],
      () => '/bundled/bun',
      'win32'
    );
    expect(r).toEqual({ command: '/bundled/bun', args: ['x', '--bun', '@playwright/mcp@0.0.75'] });
  });

  it('win32: handles a missing args list', () => {
    expect(resolveMcpStdioSpawn('npx', undefined, () => '/bundled/bun', 'win32')).toEqual({
      command: '/bundled/bun',
      args: ['x', '--bun'],
    });
  });

  it('win32: passes a non-npx command through untouched', () => {
    expect(resolveMcpStdioSpawn('/usr/bin/mcp-server', ['--flag'], () => '/bundled/bun', 'win32')).toEqual({
      command: '/usr/bin/mcp-server',
      args: ['--flag'],
    });
  });

  it('macOS/Linux: resolves npx to the same bundled runtime as the connection probe', () => {
    for (const p of ['darwin', 'linux'] as NodeJS.Platform[]) {
      expect(resolveMcpStdioSpawn('npx', ['-y', '@playwright/mcp@0.0.75'], () => '/bundled/bun', p)).toEqual({
        command: '/bundled/bun',
        args: ['x', '--bun', '@playwright/mcp@0.0.75'],
      });
    }
  });

  it('POSIX persisted config uses portable bun while Windows keeps the stable absolute path', () => {
    expect(
      resolvePersistedMcpStdioSpawn('npx', ['-y', '@playwright/mcp@0.0.75'], () => '/bundled/bun', 'linux')
    ).toEqual({ command: 'bun', args: ['x', '--bun', '@playwright/mcp@0.0.75'] });
    expect(
      resolvePersistedMcpStdioSpawn('npx', ['-y', '@playwright/mcp@0.0.75'], () => '/bundled/bun', 'win32')
    ).toEqual({ command: '/bundled/bun', args: ['x', '--bun', '@playwright/mcp@0.0.75'] });
  });
});

// A resolved stdio server runs bun (`bun`/`bun.exe`/an abs path), never `npx`, and
// routes through `bun x --bun` with the npx-only `-y` stripped.
const assertResolved = (command: string, args: readonly string[]) => {
  expect(command).not.toBe('npx');
  expect(args.slice(0, 2)).toEqual(['x', '--bun']);
  expect(args).toContain('@playwright/mcp@0.0.75');
  expect(args).not.toContain('-y');
};

describe('#827 session-injection parity — win32 resolves npx at every path', () => {
  afterEach(restorePlatform);

  it('buildAcpSessionMcpServers (ACP session/new)', () => {
    setPlatform('win32');
    const [srv] = buildAcpSessionMcpServers([npxServer()], caps);
    expect(srv?.type).toBe('stdio');
    assertResolved((srv as { command: string }).command, (srv as { args: string[] }).args);
  });

  it('buildWCoreUserStdioMcpServers (wcore user servers)', () => {
    setPlatform('win32');
    const [srv] = buildWCoreUserStdioMcpServers([npxServer()]);
    assertResolved(srv.command, srv.args);
  });

  it('McpConfig.fromStorageConfig (live ACP path)', () => {
    setPlatform('win32');
    const [srv] = McpConfig.fromStorageConfig([npxServer()], { publication: publication(), capabilities: caps });
    assertResolved((srv as { command: string }).command, (srv as { args: string[] }).args);
  });

  it('toWCoreConfig (wcore config.toml)', () => {
    setPlatform('win32');
    const cfg = toWCoreConfig(npxServer());
    assertResolved(cfg.command ?? '', cfg.args ?? []);
  });

  it('buildGeminiStdioMcpConfig (in-process Gemini fork runtime)', () => {
    setPlatform('win32');
    const cfg = buildGeminiStdioMcpConfig(npxStdioTransport);
    assertResolved(cfg.command ?? '', cfg.args ?? []);
  });
});

describe('#827 session-injection parity — macOS/Linux match the probe', () => {
  afterEach(restorePlatform);

  it('buildAcpSessionMcpServers resolves npx on darwin', () => {
    setPlatform('darwin');
    const [srv] = buildAcpSessionMcpServers([npxServer()], caps);
    assertResolved((srv as { command: string }).command, (srv as { args: string[] }).args);
  });

  it('toWCoreConfig persists portable bun on linux (never an AppImage mount path)', () => {
    setPlatform('linux');
    const cfg = toWCoreConfig(npxServer());
    expect(cfg.command).toBe('bun');
    expect(cfg.args?.slice(0, 2)).toEqual(['x', '--bun']);
    expect(cfg.args).toContain('@playwright/mcp@0.0.75');
    expect(cfg.args).not.toContain('-y');
  });

  it('buildGeminiStdioMcpConfig resolves npx on darwin', () => {
    setPlatform('darwin');
    const cfg = buildGeminiStdioMcpConfig(npxStdioTransport);
    assertResolved(cfg.command ?? '', cfg.args ?? []);
  });
});
