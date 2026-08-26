/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { IMcpServer } from '@/common/config/storage';
import type { AcpMcpCapabilities } from '@/common/types/acpTypes';
import { BUILTIN_CONCIERGE_DIAG_ID } from '@process/resources/builtinMcp/constants';
import { resolveMcpStdioSpawn } from '@process/services/mcpServices/mcpStdioSpawn';
import {
  hasExplicitToolSelection,
  mergeMcpSpawnEnv,
  resolveSessionMcpStdioSpawn,
  wrapSpawnWithToolFilter,
} from '@process/services/mcpServices/builtinMcpRuntime';
import { sanitizeMcpServerName } from '@process/services/mcpServices/validateMcpServer';

export interface AcpSessionMcpNameValue {
  name: string;
  value: string;
}

export interface AcpSessionMcpServerStdio {
  type?: 'stdio';
  name: string;
  command: string;
  args: string[];
  env: AcpSessionMcpNameValue[];
}

export interface AcpSessionMcpServerHttpLike {
  type: 'http' | 'sse';
  name: string;
  url: string;
  headers?: AcpSessionMcpNameValue[];
}

export type AcpSessionMcpServer = AcpSessionMcpServerStdio | AcpSessionMcpServerHttpLike;

function toNameValueEntries(source?: Record<string, string>): AcpSessionMcpNameValue[] | undefined {
  if (!source) return undefined;
  const entries = Object.entries(source)
    .filter(([name, value]) => typeof name === 'string' && typeof value === 'string')
    .map(([name, value]) => ({ name, value }));
  return entries.length > 0 ? entries : undefined;
}

/**
 * Whether an MCP server should be injected into an agent session, shared by
 * every backend: the fork Gemini runtime (@office-ai/aioncli-core via
 * GeminiAgentManager) and the ACP backends (Claude, Codex, Wayland Core).
 *
 * Builtin servers (image generation, skill search) are seeded into mcp.config
 * with `status: undefined` and are never connection-tested, so they must be
 * accepted on `undefined`; otherwise a backend silently drops them.
 *
 * User-added (non-builtin) servers are accepted on `undefined` OR `connected`,
 * and only excluded on an explicit failure status (`disconnected`/`error`). An
 * enabled connector the user has not yet connection-probed (`status: undefined`)
 * must still reach the session - the live ACP path (McpConfig.fromStorageConfig,
 * used by AcpAgentV2/AcpRuntime for Claude/Codex) already accepts `undefined`,
 * so requiring `connected` here meant Gemini (and the wcore injector that shares
 * this predicate) silently dropped connectors that Claude/Codex kept - the exact
 * cross-backend divergence this predicate exists to prevent.
 *
 * Every backend must agree: previously the ACP path injected builtin servers
 * only, so a user's custom MCP server reached Gemini chats but never Codex or
 * Claude chats (GitHub #56). Using one predicate keeps them in lockstep.
 */
export function shouldInjectSessionMcpServer(server: IMcpServer): boolean {
  if (!server.enabled) {
    return false;
  }
  // Both builtin and user servers: accept not-yet-probed (undefined) or
  // connected; a known-broken (disconnected/error) server is not surfaced.
  return server.status === undefined || server.status === 'connected';
}

/**
 * #998 - "Disable all" is a SERVER-level statement, and the server-level channel
 * exists on every backend.
 *
 * A STRICT subset genuinely cannot be expressed to an ACP agent or to Wayland
 * Core: the `session/new` MCP descriptor carries name + transport, and Core's
 * `add_mcp_server` command carries name/transport/command/args/env/url/headers -
 * neither has a per-tool field, which is why `TOOL_ALLOWLIST_ENFORCING_BACKENDS`
 * names only codex and gemini and why the MCP Library says so.
 *
 * `allowedTools: []` is different in kind. It does not need a per-tool field: it
 * says the connector contributes nothing, and "do not register this connector"
 * is expressible everywhere. Gemini already reads it that way and drops the
 * server from the launch. These paths did not read it at all, so the ONE switch
 * setting that WAS enforceable here was the one setting nobody enforced - a user
 * who turned every tool off on a connector kept every one of its tools on
 * Claude, Codex-over-ACP and Wayland Core.
 *
 * Dropping the server (rather than declaring it with an empty tool list) is also
 * what keeps the session receipts honest: an expected publication that can never
 * arrive is a connector that waits for a registration nobody will send.
 */
function contributesTools(server: IMcpServer): boolean {
  return server.allowedTools === undefined || server.allowedTools.length > 0;
}

/**
 * Per-conversation MCP scoping (#348): is this server active for the chat?
 * Builtins (image-gen, skill-search) always inject — they're infrastructure,
 * not user-scopable. A user server passes when the chat has no selection
 * (`activeServerIds === undefined` ⇒ all enabled servers) or the selection
 * includes it. `[]` scopes out every user server.
 *
 * Scoping here is SERVER-level only. The user's per-server `allowedTools` does
 * NOT trim tools on this path: neither the ACP `session/new` `mcpServers` array
 * nor Wayland Core's launch profile has a per-tool field, so a server that
 * survives with a STRICT subset reaches the engine with its FULL tool inventory
 * (#998). The MCP Library states that plainly rather than implying otherwise;
 * `TOOL_ALLOWLIST_ENFORCING_BACKENDS` in `@/common/mcp` is the single source of
 * truth for which backends really do enforce a subset (codex, gemini).
 *
 * The one setting that IS enforced everywhere is the empty one - see
 * `contributesTools` above.
 */
export function isServerActiveForSession(server: IMcpServer, activeServerIds?: readonly string[]): boolean {
  if (server.builtin === true) return true;
  if (activeServerIds === undefined) return true;
  return activeServerIds.includes(server.id);
}

/**
 * Build the `session/new` `mcpServers` array for an ACP backend.
 *
 * #998 — SERVER-level selection only. The ACP protocol's MCP server descriptor
 * carries name + transport and has no per-tool field, so a server that reaches
 * here is registered with every tool it publishes; a STRICT per-tool subset is
 * not enforced on this path. `allowedTools: []` is, by withholding the server -
 * see `contributesTools`. Codex is the exception and does NOT rely on this array
 * for scoping - its `enabled_tools` are written into the generated `config.toml`
 * by `buildCodexMcpServerTable`.
 */
export function buildAcpSessionMcpServers(
  mcpServers: IMcpServer[] | undefined | null,
  capabilities: AcpMcpCapabilities,
  activeServerIds?: readonly string[],
  allowConciergeDiag: boolean = false
): AcpSessionMcpServer[] {
  if (!Array.isArray(mcpServers) || mcpServers.length === 0) {
    return [];
  }

  return (
    mcpServers
      .filter(shouldInjectSessionMcpServer)
      .filter((server) => isServerActiveForSession(server, activeServerIds))
      // #998: a connector with every tool switched off contributes nothing.
      // Applied AFTER server scoping and to builtins as well, exactly as the
      // Gemini launch path does - builtins bypass `isServerActiveForSession`, so
      // without this the switch would be inert on precisely the servers a user
      // cannot scope out any other way.
      .filter(contributesTools)
      // The read-only concierge diagnostics server is a builtin (so it bypasses
      // user scoping) and is Concierge-only: exposing it to every assistant would
      // bloat unrelated tool lists and surface a diagnostics tool where it doesn't
      // belong. Gate it to the Concierge assistant (allowConciergeDiag); all other
      // servers pass through unchanged. Fail-closed by default. Mirrors the Gemini
      // path in GeminiAgentManager.getMcpServers.
      .filter((server) => server.id !== BUILTIN_CONCIERGE_DIAG_ID || allowConciergeDiag)
      .map((server): AcpSessionMcpServer | null => {
        switch (server.transport.type) {
          case 'stdio': {
            if (!capabilities.stdio) return null;
            // Use the same runtime tuple as the Library probe so a green
            // connection test cannot depend on a different PATH/runtime. That
            // covers BOTH halves: `npx`→bundled Bun (#827) and Wayland's own
            // bundled MCP servers→resolved JS runtime (#1008). The runtime env
            // (`ELECTRON_RUN_AS_NODE` in dev) is load-bearing — without it the
            // child boots a second Electron app instead of the MCP server.
            const resolved = resolveSessionMcpStdioSpawn(server.transport.command, server.transport.args ?? [], {
              libraryEntryId: server.libraryEntryId,
            });
            // #998: an explicit per-tool selection cannot be expressed on this
            // wire, so the engine is pointed at our filtering shim instead of at
            // the server. The shim spawns the RESOLVED tuple, so it inherits the
            // npx and bundled-runtime fixes rather than re-deriving them. The
            // subset stops being state the engine is asked to respect and
            // becomes a boundary it cannot cross: it never holds the real
            // server's descriptor.
            const spawn = hasExplicitToolSelection(server)
              ? wrapSpawnWithToolFilter(resolved, server.allowedTools ?? [])
              : resolved;
            return {
              type: 'stdio',
              name: server.name,
              command: spawn.command,
              args: spawn.args,
              env: toNameValueEntries(mergeMcpSpawnEnv(server.transport.env, spawn.env)) ?? [],
            };
          }
          case 'http':
          case 'streamable_http':
            if (!capabilities.http) return null;
            return {
              type: 'http',
              name: server.name,
              url: server.transport.url,
              headers: toNameValueEntries(server.transport.headers),
            };
          case 'sse':
            if (!capabilities.sse) return null;
            return {
              type: 'sse',
              name: server.name,
              url: server.transport.url,
              headers: toNameValueEntries(server.transport.headers),
            };
          default:
            return null;
        }
      })
      .filter((server): server is AcpSessionMcpServer => server !== null)
  );
}

/**
 * Build the stdio MCP servers for a Wayland Core spawn from the user's
 * `mcp.config` connector list. wcore receives MCP servers at spawn via the
 * engine's `add_mcp_server` runtime command (stdio only), so this mirrors the
 * ACP session-injection path: same `shouldInjectSessionMcpServer` predicate and
 * `isServerActiveForSession` per-conversation scoping (#348). Builtins
 * (image-gen, skill-search, concierge-diag) are excluded - wcore surfaces those
 * through its own mechanisms (system-prompt skills index / team guide), and
 * injecting them here would double them up or leak the Concierge-only diag
 * server. Non-stdio (hosted http/sse) connectors are skipped because the engine
 * runtime command only adds stdio servers; those still reach wcore via the
 * [mcp.servers] table written by WCoreMcpAgent.
 *
 * `excludeNames` (#478): names already present in the active config.toml
 * [mcp.servers] table. The engine loads those at startup, so re-injecting the
 * same name via the runtime `add_mcp_server` command would register it twice.
 * Callers pass the config.toml server names so those are skipped here - the
 * engine keeps the config.toml copy, this path only adds what config.toml lacks.
 *
 * Names are sanitized with `sanitizeMcpServerName` (the SAME transform
 * `McpService.syncMcpToAgents` applies before `WCoreMcpAgent` writes the
 * config.toml key), so both the emitted `add_mcp_server` name AND the exclude
 * comparison key the server identically to its config.toml copy. Without this a
 * connector whose raw name needs sanitizing (e.g. `com.slack/slack-mcp`) would
 * be injected under the raw name while config.toml holds `com.slack-slack-mcp` -
 * the dedup would miss and the engine would register it twice (#478).
 *
 * #998 - no per-tool allowlist is emitted, because the engine has nowhere to
 * put one: `add_mcp_server` carries name/transport/command/args/env only, and
 * Core's `[mcp.servers.*]` table and profile `mcp_servers = [...]` are both
 * server-level. A STRICT per-tool subset is therefore NOT enforced on the
 * Wayland Core backend; see `TOOL_ALLOWLIST_ENFORCING_BACKENDS` in
 * `@/common/mcp` and the notice the MCP Library shows because of it. The empty
 * allowlist IS enforced, by withholding the connector - see `contributesTools`.
 */
export function buildWCoreUserStdioMcpServers(
  mcpServers: IMcpServer[] | undefined | null,
  activeServerIds?: readonly string[],
  excludeNames?: ReadonlySet<string>
): AcpSessionMcpServerStdio[] {
  if (!Array.isArray(mcpServers) || mcpServers.length === 0) {
    return [];
  }
  return mcpServers
    .filter(shouldInjectSessionMcpServer)
    .filter((server) => server.builtin !== true)
    .filter((server) => isServerActiveForSession(server, activeServerIds))
    // #998: "Disable all" withholds the connector - see `contributesTools`.
    .filter(contributesTools)
    .filter((server) => server.transport.type === 'stdio')
    .map((server): AcpSessionMcpServerStdio => {
      const transport = server.transport as Extract<IMcpServer['transport'], { type: 'stdio' }>;
      // #827: resolve `npx`→bundled Bun so the engine spawns a real command.
      const resolved = resolveMcpStdioSpawn(transport.command, transport.args ?? []);
      // #998: same interposition as the ACP path - Core's `add_mcp_server`
      // carries no per-tool field, so a strict subset reaches the engine only by
      // the engine talking to our shim instead of to the server.
      const spawn = hasExplicitToolSelection(server)
        ? wrapSpawnWithToolFilter({ ...resolved, env: {} }, server.allowedTools ?? [])
        : { ...resolved, env: {} as Record<string, string> };
      return {
        type: 'stdio',
        name: sanitizeMcpServerName(server.name),
        command: spawn.command,
        args: spawn.args,
        env: toNameValueEntries(mergeMcpSpawnEnv(transport.env, spawn.env)) ?? [],
      };
    })
    .filter((server) => !excludeNames?.has(server.name));
}

/**
 * Select and normalize the user connectors that belong to one Desktop-managed
 * Core launch. Core loads these from trusted startup config; the companion
 * per-session profile allowlist prevents globally-published connectors that are
 * off for this chat from leaking into the session.
 *
 * That profile allowlist is SERVER-level (`mcp_servers = [...]`). A strict
 * per-tool subset is not enforced on this path, though an empty one is - see the
 * note on {@link buildWCoreUserStdioMcpServers} (#998).
 */
export function buildWCoreSessionMcpServers(
  mcpServers: IMcpServer[] | undefined | null,
  activeServerIds?: readonly string[]
): IMcpServer[] {
  if (!Array.isArray(mcpServers)) return [];
  return mcpServers
    .filter(shouldInjectSessionMcpServer)
    .filter((server) => server.builtin !== true)
    .filter((server) => isServerActiveForSession(server, activeServerIds))
    // #998: "Disable all" withholds the connector - see `contributesTools`.
    .filter(contributesTools)
    .map((server) => ({ ...server, name: sanitizeMcpServerName(server.name) }));
}

/** Config shape passed from TeamSessionService to AgentManagers */
export type TeamMcpStdioConfig = {
  name: string;
  command: string;
  args: string[];
  env: AcpSessionMcpNameValue[];
};

/**
 * Build the AcpSessionMcpServer entry for a team MCP stdio server.
 * Returns null if the config is missing or has no command - callers should
 * simply skip injection in that case.
 */
export function buildTeamMcpServer(config: TeamMcpStdioConfig | undefined | null): AcpSessionMcpServerStdio | null {
  if (!config || !config.command) return null;
  return {
    name: config.name,
    command: config.command,
    args: config.args,
    env: config.env,
  };
}
