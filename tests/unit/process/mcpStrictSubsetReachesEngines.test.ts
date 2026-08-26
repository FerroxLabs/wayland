/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 - a STRICT SUBSET now reaches ACP and Wayland Core, via interposition.
 *
 * The sibling suite `mcpEmptyToolAllowlistWithholdsServer` covers the all-off
 * case, which is a SERVER-level statement and so expressible everywhere. This
 * one covers the case that previously had no expression at all: the user leaves
 * 3 of a server's 40 tools on.
 *
 * The wire still has no per-tool field and is unchanged. What changed is who the
 * engine talks to: it is handed a descriptor pointing at Wayland's filtering
 * shim, and the shim holds the real server's descriptor. The subset stops being
 * UI state the engine is asked to respect and becomes a process boundary.
 *
 * KNOWN GAP, asserted here so it cannot be mistaken for coverage: connectors
 * serialized into Core's startup `config.toml` by `toWCoreConfig` are NOT
 * wrapped. That path rewrites the command for restart-safety
 * (`toRestartSafeBundledRuntimeCommand`), and interposing there without
 * accounting for it risks persisting a stale runtime path. Per-chat connectors
 * reach Core through the runtime `add_mcp_server` path, which IS wrapped.
 */

import { describe, expect, it } from 'vitest';

import type { IMcpServer } from '@/common/config/storage';
import { buildAcpSessionMcpServers, buildWCoreUserStdioMcpServers } from '@process/agent/acp/mcpSessionConfig';

const ACP_CAPS = { stdio: true, http: true, sse: true };

const server = (over: Partial<IMcpServer> = {}): IMcpServer =>
  ({
    id: 'srv-1',
    name: 'files',
    enabled: true,
    transport: { type: 'stdio', command: 'some-server', args: ['--flag'], env: { TOKEN: 'abc' } },
    ...over,
  }) as IMcpServer;

/** The shim is always argv[0] of the wrapped command. */
const isShim = (args: string[] | undefined): boolean =>
  Array.isArray(args) && typeof args[0] === 'string' && args[0].includes('builtin-mcp-tool-filter');

describe('#998 strict subset reaches the engines through the filtering shim', () => {
  it('ACP: a strict subset is routed through the shim, not the raw server', () => {
    const [descriptor] = buildAcpSessionMcpServers([server({ allowedTools: ['read', 'search'] })], ACP_CAPS);
    const args = (descriptor as { args: string[] }).args;

    expect(isShim(args)).toBe(true);
    expect(args).toContain('--allow');
    expect(args[args.indexOf('--allow') + 1]).toBe('read,search');
    // Everything after `--` is the real server, untouched.
    const sep = args.indexOf('--');
    expect(sep).toBeGreaterThan(-1);
    expect(args.slice(sep + 1)).toContain('--flag');
  });

  it('Wayland Core: a strict subset is routed through the shim too', () => {
    const [descriptor] = buildWCoreUserStdioMcpServers([server({ allowedTools: ['read'] })]);
    const args = (descriptor as { args: string[] }).args;

    expect(isShim(args)).toBe(true);
    expect(args[args.indexOf('--allow') + 1]).toBe('read');
  });

  it('no selection means no shim - an unscoped connector is spawned directly', () => {
    const [acp] = buildAcpSessionMcpServers([server()], ACP_CAPS);
    const [wcore] = buildWCoreUserStdioMcpServers([server()]);

    expect(isShim((acp as { args: string[] }).args)).toBe(false);
    expect(isShim((wcore as { args: string[] }).args)).toBe(false);
  });

  it('the server env still reaches the real server through the shim', () => {
    const [descriptor] = buildAcpSessionMcpServers([server({ allowedTools: ['read'] })], ACP_CAPS);
    const env = (descriptor as { env: { name: string; value: string }[] }).env;
    // The shim spawns its child with inherited environment, so the variables the
    // real server needs must be present on the shim's own process.
    expect(env.find((e) => e.name === 'TOKEN')?.value).toBe('abc');
  });

  it('an all-off connector is still withheld entirely rather than shimmed', () => {
    // Withholding is strictly better than an empty shim: it keeps the session
    // receipts honest, and the shim refuses to start on an empty allowlist.
    expect(buildAcpSessionMcpServers([server({ allowedTools: [] })], ACP_CAPS)).toEqual([]);
    expect(buildWCoreUserStdioMcpServers([server({ allowedTools: [] })])).toEqual([]);
  });
});
