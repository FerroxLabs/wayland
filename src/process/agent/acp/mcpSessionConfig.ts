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
import {
  hasExplicitToolSelection,
  mergeMcpSpawnEnv,
  resolveSessionMcpStdioSpawn,
  wrapSpawnWithToolFilter,
} from '@process/services/mcpServices/builtinMcpRuntime';

export interface AcpSessionMcpNameValue {
  name: string;
  value: string;
}

/**
 * The user's per-server tool allow-list (#998).
 *
 * POLARITY: this is an ALLOW-list and the empty array is MEANINGFUL.
 *   undefined -> every tool enabled (the migration-free default)
 *   ['a']     -> only 'a' enabled
 *   []        -> NO tools enabled
 * Never normalise `[]` to `undefined`. Standard ACP has no per-tool field:
 * Desktop withholds an empty selection, wraps a stdio subset with its filter
 * shim, and refuses a hosted subset it cannot enforce.
 */
export type McpAllowedTools = string[];

export class UnsupportedHostedAcpToolSelectionError extends Error {
  constructor(serverName: string, transport: 'http' | 'sse') {
    super(
      `Standard ACP cannot enforce per-tool selection for hosted ${transport.toUpperCase()} MCP server ${serverName}`
    );
    this.name = 'UnsupportedHostedAcpToolSelectionError';
  }
}

export interface AcpSessionMcpServerStdio {
  type?: 'stdio';
  name: string;
  command: string;
  args: string[];
  env: AcpSessionMcpNameValue[];
  allowedTools?: McpAllowedTools;
}

export interface AcpSessionMcpServerHttpLike {
  type: 'http' | 'sse';
  name: string;
  url: string;
  headers?: AcpSessionMcpNameValue[];
  allowedTools?: McpAllowedTools;
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
 * so requiring `connected` here meant Gemini silently dropped connectors that
 * Claude/Codex kept - the exact
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
 * A STRICT subset genuinely cannot be expressed to an ACP agent: the
 * `session/new` MCP descriptor carries name + transport and has no per-tool
 * field, which is why `TOOL_ALLOWLIST_ENFORCING_BACKENDS` names only codex and
 * gemini and why the MCP Library says so.
 *
 * `allowedTools: []` is different in kind. It does not need a per-tool field: it
 * says the connector contributes nothing, and "do not register this connector"
 * is expressible everywhere. Gemini already reads it that way and drops the
 * server from the launch. These paths did not read it at all, so the ONE switch
 * setting that WAS enforceable here was the one setting nobody enforced - a user
 * who turned every tool off on a connector kept every one of its tools on
 * Claude and Codex-over-ACP.
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
 * Scoping here is SERVER-level only; a STRICT per-tool subset is enforced
 * elsewhere, and by three different mechanisms - do not assume one:
 *   - stdio: the filtering shim (`wrapSpawnWithToolFilter`). The engine talks to
 *     the shim, never to the real server, so the subset is a boundary rather
 *     than state the engine is asked to respect.
 *   - hosted http/sse: no standard selection field or spawn boundary exists, so
 *     a strict subset is refused rather than serialized as a private extension.
 *   - the empty list: enforced here by withholding the server - see
 *     `contributesTools` above.
 * `TOOL_ALLOWLIST_ENFORCING_BACKENDS` in `@/common/mcp` remains the source of
 * truth for which backends enforce a subset today.
 */
export function isServerActiveForSession(server: IMcpServer, activeServerIds?: readonly string[]): boolean {
  if (server.builtin === true) return true;
  if (activeServerIds === undefined) return true;
  return activeServerIds.includes(server.id);
}

/**
 * Build the `session/new` `mcpServers` array for an ACP backend.
 *
 * Standard ACP descriptors carry transport only. For stdio, the shim enforces a
 * strict subset. Hosted subsets throw an explicit unsupported-selection error.
 * `allowedTools: []` never reaches this array; `contributesTools` withholds it.
 * Codex's separate native config path uses `enabled_tools`.
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
            if (hasExplicitToolSelection(server)) {
              throw new UnsupportedHostedAcpToolSelectionError(server.name, 'http');
            }
            return {
              type: 'http',
              name: server.name,
              url: server.transport.url,
              headers: toNameValueEntries(server.transport.headers),
            };
          case 'sse':
            if (!capabilities.sse) return null;
            if (hasExplicitToolSelection(server)) {
              throw new UnsupportedHostedAcpToolSelectionError(server.name, 'sse');
            }
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
