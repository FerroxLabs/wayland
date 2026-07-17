/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import type { AcpMcpCapabilities } from '@/common/types/acpTypes';
import { BUILTIN_CONCIERGE_DIAG_ID } from '@process/resources/builtinMcp/constants';
import { resolveMcpStdioSpawn } from '@process/services/mcpServices/mcpStdioSpawn';
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
 * Per-conversation MCP scoping (#348): is this server active for the chat?
 * Builtins (image-gen, skill-search) always inject — they're infrastructure,
 * not user-scopable. A user server passes when the chat has no selection
 * (`activeServerIds === undefined` ⇒ all enabled servers) or the selection
 * includes it. `[]` scopes out every user server. The user's per-server
 * `allowedTools` still trims tools within whatever servers stay active.
 */
export function isServerActiveForSession(server: IMcpServer, activeServerIds?: readonly string[]): boolean {
  if (server.builtin === true) return true;
  if (activeServerIds === undefined) return true;
  return activeServerIds.includes(server.id);
}

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
            // #827: resolve `npx`→bundled Bun so the injected session command is
            // actually spawnable (green-but-no-tools on Windows otherwise).
            const spawn = resolveMcpStdioSpawn(server.transport.command, server.transport.args ?? []);
            return {
              type: 'stdio',
              name: server.name,
              command: spawn.command,
              args: spawn.args,
              env: toNameValueEntries(server.transport.env) ?? [],
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
    .filter((server) => server.transport.type === 'stdio')
    .map((server): AcpSessionMcpServerStdio => {
      const transport = server.transport as Extract<IMcpServer['transport'], { type: 'stdio' }>;
      // #827: resolve `npx`→bundled Bun so the engine spawns a real command.
      const spawn = resolveMcpStdioSpawn(transport.command, transport.args ?? []);
      return {
        type: 'stdio',
        name: sanitizeMcpServerName(server.name),
        command: spawn.command,
        args: spawn.args,
        env: toNameValueEntries(transport.env) ?? [],
      };
    })
    .filter((server) => !excludeNames?.has(server.name));
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
