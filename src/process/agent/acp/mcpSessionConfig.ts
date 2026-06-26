/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import type { AcpMcpCapabilities } from '@/common/types/acpTypes';

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
 * accepted on `undefined`; otherwise a backend silently drops them. User-added
 * (non-builtin) servers still require an active `connected` status.
 *
 * Both backends must agree: previously the ACP path injected builtin servers
 * only, so a user's custom MCP server reached Gemini chats but never Codex or
 * Claude chats (GitHub #56). Using one predicate keeps them in lockstep.
 */
export function shouldInjectSessionMcpServer(server: IMcpServer): boolean {
  if (!server.enabled) {
    return false;
  }
  if (server.builtin === true) {
    return server.status === undefined || server.status === 'connected';
  }
  return server.status === 'connected';
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
  activeServerIds?: readonly string[]
): AcpSessionMcpServer[] {
  if (!Array.isArray(mcpServers) || mcpServers.length === 0) {
    return [];
  }

  return mcpServers
    .filter(shouldInjectSessionMcpServer)
    .filter((server) => isServerActiveForSession(server, activeServerIds))
    .map((server): AcpSessionMcpServer | null => {
      switch (server.transport.type) {
        case 'stdio':
          if (!capabilities.stdio) return null;
          return {
            type: 'stdio',
            name: server.name,
            command: server.transport.command,
            args: server.transport.args || [],
            env: toNameValueEntries(server.transport.env) ?? [],
          };
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
    .filter((server): server is AcpSessionMcpServer => server !== null);
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
