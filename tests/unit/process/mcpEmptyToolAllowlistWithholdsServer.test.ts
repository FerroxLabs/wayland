/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #998 - "Disable all" is expressible on EVERY backend, so every backend must
 * honour it.
 *
 * v0.12.4 closed the disclosure half: the MCP Library now names which engines
 * enforce the per-tool switches (`TOOL_ALLOWLIST_ENFORCING_BACKENDS`), because
 * neither the ACP `session/new` MCP descriptor nor Wayland Core's
 * `add_mcp_server` / `[mcp.servers.*]` / profile `mcp_servers = [...]` has a
 * per-tool field. Verified against the pinned producer schema: `add_mcp_server`
 * carries name/transport/command/args/env/url/headers and nothing else.
 *
 * A STRICT SUBSET therefore genuinely cannot be expressed to those engines.
 * `allowedTools: []` can: it is a SERVER-level statement - "this connector
 * contributes no tools" - and the server-level channel exists on every path.
 * Gemini already reads it that way and drops the connector from the launch
 * (`GeminiAgentManager`, #998). The ACP and Wayland Core builders did not, so a
 * user who switched every tool off on a connector still had every one of its
 * tools live on Claude, Codex-over-ACP and Wayland Core - the switch was not
 * "unenforceable" there, it was unread.
 *
 * `undefined` (never scoped) and a strict subset both still INJECT the connector:
 * the first because it means "all tools", the second because withholding it
 * outright would take away tools the user deliberately left ON.
 *
 * UPDATE: a strict subset is no longer unenforced. The wire still has no
 * per-tool field, but the descriptor now points at Wayland's filtering shim,
 * which holds the real server and re-exports only the allowed tools. These
 * assertions are unchanged and still correct - the connector IS injected - and
 * the routing is covered by `mcpStrictSubsetReachesEngines`.
 */

import { describe, expect, it } from 'vitest';

import type { IMcpServer } from '@/common/config/storage';
import {
  buildAcpSessionMcpServers,
  buildWCoreSessionMcpServers,
  buildWCoreUserStdioMcpServers,
} from '@process/agent/acp/mcpSessionConfig';

const KEPT = 'search_files';
const DISABLED = 'delete_everything';

const stdioTransport = {
  type: 'stdio',
  command: 'uvx',
  args: ['google-workspace-mcp'],
} as Extract<IMcpServer['transport'], { type: 'stdio' }>;

const server = (over: Partial<IMcpServer> = {}): IMcpServer =>
  ({
    id: 'srv-1',
    name: 'workspace',
    enabled: true,
    status: 'connected',
    source: 'library',
    transport: stdioTransport,
    tools: [{ name: KEPT }, { name: DISABLED }],
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

const ACP_CAPS = { stdio: true, http: true, sse: true } as const;

describe('#998 an empty tool allowlist withholds the connector on every backend', () => {
  it('the ACP session/new array omits a connector with every tool switched off', () => {
    expect(buildAcpSessionMcpServers([server({ allowedTools: [] })], ACP_CAPS)).toEqual([]);
  });

  it('the wcore stdio injection omits a connector with every tool switched off', () => {
    expect(buildWCoreUserStdioMcpServers([server({ allowedTools: [] })])).toEqual([]);
  });

  it('the wcore session selection omits a connector with every tool switched off', () => {
    expect(buildWCoreSessionMcpServers([server({ allowedTools: [] })])).toEqual([]);
  });

  it('withholds it on the hosted transports too, not just stdio', () => {
    const hosted = server({
      transport: { type: 'http', url: 'https://example.test/mcp' } as IMcpServer['transport'],
      allowedTools: [],
    });

    expect(buildAcpSessionMcpServers([hosted], ACP_CAPS)).toEqual([]);
    expect(buildWCoreSessionMcpServers([hosted])).toEqual([]);
  });

  it('withholds a BUILTIN with every tool switched off, exactly as gemini does', () => {
    // Builtins bypass per-conversation server scoping (`isServerActiveForSession`
    // returns true for them unconditionally), so without an explicit rule the
    // "Disable all" switch would be inert on precisely the servers the user
    // cannot scope out any other way. Gemini applies its filter after the
    // concierge gate and to builtins as well; these paths must match.
    const builtin = server({ id: 'builtin-1', builtin: true, allowedTools: [] });

    expect(buildAcpSessionMcpServers([builtin], ACP_CAPS)).toEqual([]);
  });

  // ---- positive controls: nothing else changes ----

  it('still injects a connector that was never scoped (undefined => all tools)', () => {
    expect(buildAcpSessionMcpServers([server()], ACP_CAPS)).toHaveLength(1);
    expect(buildWCoreUserStdioMcpServers([server()])).toHaveLength(1);
    expect(buildWCoreSessionMcpServers([server()])).toHaveLength(1);
  });

  it('still injects a connector with a strict subset - the engine cannot carry the list, but the kept tools are real', () => {
    const scoped = server({ allowedTools: [KEPT] });

    expect(buildAcpSessionMcpServers([scoped], ACP_CAPS)).toHaveLength(1);
    expect(buildWCoreUserStdioMcpServers([scoped])).toHaveLength(1);
    expect(buildWCoreSessionMcpServers([scoped])).toHaveLength(1);
  });

  it('withholds ONLY the emptied connector, never its neighbours', () => {
    const off = server({ id: 'srv-off', name: 'off', allowedTools: [] });
    const on = server({ id: 'srv-on', name: 'on' });

    expect(buildAcpSessionMcpServers([off, on], ACP_CAPS).map((s) => s.name)).toEqual(['on']);
    expect(buildWCoreUserStdioMcpServers([off, on]).map((s) => s.name)).toEqual(['on']);
    expect(buildWCoreSessionMcpServers([off, on]).map((s) => s.name)).toEqual(['on']);
  });
});
