/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Uniform MCP propagation: an enabled user connector must reach EVERY backend.
 *
 * Covers:
 *  - shouldInjectSessionMcpServer now accepts a non-builtin connector with
 *    `status: undefined` (enabled-but-not-yet-probed), matching the live ACP
 *    path (McpConfig.fromStorageConfig). Previously it required `connected`, so
 *    Gemini + the wcore injector silently dropped connectors Claude/Codex kept.
 *  - buildWCoreUserStdioMcpServers: the wcore spawn-time injector. Same predicate
 *    + #348 scoping, excludes builtins, stdio-only.
 */

import { describe, it, expect } from 'vitest';
import { shouldInjectSessionMcpServer, buildWCoreUserStdioMcpServers } from '@process/agent/acp/mcpSessionConfig';
import type { IMcpServer } from '@/common/config/storage';

const server = (over: Partial<IMcpServer>): IMcpServer =>
  ({
    id: 'srv',
    name: 'srv',
    enabled: true,
    status: 'connected',
    source: 'library',
    transport: { type: 'stdio', command: 'uvx', args: ['google-workspace-mcp'], env: { KEY: 'v' } },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

describe('shouldInjectSessionMcpServer (uniform acceptance)', () => {
  it('accepts an enabled user connector that has not been probed (status undefined)', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: undefined, status: undefined }))).toBe(true);
  });

  it('accepts an enabled connected user connector', () => {
    expect(shouldInjectSessionMcpServer(server({ status: 'connected' }))).toBe(true);
  });

  it('rejects a disabled connector', () => {
    expect(shouldInjectSessionMcpServer(server({ enabled: false }))).toBe(false);
  });

  it('rejects a known-broken connector (disconnected/error)', () => {
    expect(shouldInjectSessionMcpServer(server({ status: 'disconnected' }))).toBe(false);
    expect(shouldInjectSessionMcpServer(server({ status: 'error' as IMcpServer['status'] }))).toBe(false);
  });

  it('accepts a builtin on undefined/connected', () => {
    expect(shouldInjectSessionMcpServer(server({ builtin: true, status: undefined }))).toBe(true);
    expect(shouldInjectSessionMcpServer(server({ builtin: true, status: 'connected' }))).toBe(true);
  });
});

describe('buildWCoreUserStdioMcpServers', () => {
  const googleWorkspace = server({
    id: 'gw',
    name: 'io.github.taylorwilsdon-google-workspace-mcp',
    status: undefined,
    transport: { type: 'stdio', command: 'uvx', args: ['workspace-mcp'], env: { TOKEN: 't' } },
  });
  const builtinImageGen = server({ id: 'img', name: 'wayland-image-generation', builtin: true, status: undefined });
  const hostedGithub = server({
    id: 'gh',
    name: 'com.github-github-mcp-server',
    status: 'connected',
    transport: { type: 'streamable_http', url: 'https://example/mcp', headers: {} },
  });
  const disabled = server({ id: 'off', name: 'filesystem', enabled: false });

  it('returns [] for empty/missing config', () => {
    expect(buildWCoreUserStdioMcpServers(undefined)).toEqual([]);
    expect(buildWCoreUserStdioMcpServers([])).toEqual([]);
  });

  it('injects an enabled stdio user connector (status undefined) with command/args/env mapped', () => {
    const out = buildWCoreUserStdioMcpServers([googleWorkspace]);
    expect(out).toEqual([
      {
        type: 'stdio',
        name: 'io.github.taylorwilsdon-google-workspace-mcp',
        command: 'uvx',
        args: ['workspace-mcp'],
        env: [{ name: 'TOKEN', value: 't' }],
      },
    ]);
  });

  it('excludes builtins (handled by wcore via its own mechanisms)', () => {
    const out = buildWCoreUserStdioMcpServers([builtinImageGen, googleWorkspace]);
    expect(out.map((s) => s.name)).toEqual(['io.github.taylorwilsdon-google-workspace-mcp']);
  });

  it('excludes hosted (http/sse) connectors - engine add_mcp_server is stdio-only', () => {
    const out = buildWCoreUserStdioMcpServers([hostedGithub, googleWorkspace]);
    expect(out.map((s) => s.name)).toEqual(['io.github.taylorwilsdon-google-workspace-mcp']);
  });

  it('excludes disabled connectors', () => {
    const out = buildWCoreUserStdioMcpServers([disabled, googleWorkspace]);
    expect(out.map((s) => s.name)).toEqual(['io.github.taylorwilsdon-google-workspace-mcp']);
  });

  it('honors #348 per-conversation scoping', () => {
    const a = server({ id: 'a', name: 'alpha' });
    const b = server({ id: 'b', name: 'beta' });
    expect(
      buildWCoreUserStdioMcpServers([a, b], undefined)
        .map((s) => s.name)
        .toSorted()
    ).toEqual(['alpha', 'beta']);
    expect(buildWCoreUserStdioMcpServers([a, b], ['a']).map((s) => s.name)).toEqual(['alpha']);
    expect(buildWCoreUserStdioMcpServers([a, b], [])).toEqual([]);
  });

  it('#478 dedup: skips names already in config.toml [mcp.servers] (no double registration)', () => {
    const a = server({ id: 'a', name: 'alpha' });
    const b = server({ id: 'b', name: 'beta' });
    // alpha is already in the engine config.toml -> engine loads it at startup;
    // only beta should be injected at runtime.
    const out = buildWCoreUserStdioMcpServers([a, b], undefined, new Set(['alpha']));
    expect(out.map((s) => s.name)).toEqual(['beta']);
  });

  it('#478 dedup: an empty exclude set injects everything (fallback keeps connectors visible)', () => {
    const a = server({ id: 'a', name: 'alpha' });
    const b = server({ id: 'b', name: 'beta' });
    expect(
      buildWCoreUserStdioMcpServers([a, b], undefined, new Set())
        .map((s) => s.name)
        .toSorted()
    ).toEqual(['alpha', 'beta']);
  });

  it('#478 dedup: sanitizes the name so a raw-slash connector matches its config.toml key', () => {
    // syncMcpToAgents sanitizes com.slack/slack-mcp -> com.slack-slack-mcp before
    // WCoreMcpAgent writes the config.toml key. The injected name + exclude must
    // use that same sanitized form, or the dedup misses and the engine doubles.
    const slack = server({
      id: 'slack',
      name: 'com.slack/slack-mcp',
      transport: { type: 'stdio', command: 'uvx', args: ['slack'], env: {} },
    });
    // Not in config.toml yet -> injected under the SANITIZED name.
    expect(buildWCoreUserStdioMcpServers([slack]).map((s) => s.name)).toEqual(['com.slack-slack-mcp']);
    // Already in config.toml (sanitized key) -> excluded, no double registration.
    expect(buildWCoreUserStdioMcpServers([slack], undefined, new Set(['com.slack-slack-mcp']))).toEqual([]);
  });
});
