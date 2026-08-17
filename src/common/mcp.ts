/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentBackend } from '@/common/types/acpTypes';

/**
 * Shared MCP server-name helpers usable from BOTH the main process and the
 * renderer (the renderer cannot import `src/process/...`).
 *
 * A server's catalog id (e.g. `com.notion/notion-mcp`) is rewritten before it
 * is written into an agent CLI's config, and DIFFERENT agents apply DIFFERENT
 * transforms:
 *   - `sanitizeMcpServerName`  (slash -> dash, dots kept) -> `com.notion-notion-mcp`
 *     (Gemini/Qwen/OpenCode/Wayland/WCore configs)
 *   - `cliSafeMcpServerName`   (slash AND dot -> dash)    -> `com-notion-notion-mcp`
 *     (Claude/Codex CLIs reject dots in names)
 *
 * So the SAME logical server can appear under three different names across the
 * stored Wayland record and the various agent configs. To answer "is Wayland's
 * server X installed in agent Y" we must collapse every form to one canonical
 * key. `canonicalMcpServerName` applies the most aggressive transform (the
 * cli-safe one), which every other form also collapses to, giving a single
 * stable identity.
 */

/** Collapse any stored / sanitized / cli-safe MCP server name to one canonical key. */
export function canonicalMcpServerName(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]/g, '-');
}

/** Case-insensitive product identity used to prevent ambiguous duplicate declarations. */
export function mcpServerCollisionKey(name: string): string {
  return canonicalMcpServerName(name).toLocaleLowerCase('en-US');
}

/**
 * Environment variable used by Codex for one hosted MCP server's bearer.
 * Kept in the shared layer so both the config materializer and the spawned
 * process derive the identical name without importing process-only services.
 */
export function codexMcpBearerEnvVar(serverName: string): string {
  return `WAYLAND_MCP_BEARER_${canonicalMcpServerName(serverName)
    .replace(/[^A-Za-z0-9]/g, '_')
    .toUpperCase()}`;
}

/** Environment variable used for a non-bearer Codex MCP HTTP header value. */
export function codexMcpHeaderEnvVar(serverName: string, headerName: string): string {
  const server = canonicalMcpServerName(serverName)
    .replace(/[^A-Za-z0-9]/g, '_')
    .toUpperCase();
  const header = headerName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
  return `WAYLAND_MCP_HEADER_${server}_${header}`;
}

/** Config-safe identity used by Gemini/Qwen/OpenCode/Wayland/Core (dots retained). */
export function configSafeMcpServerName(name: string): string {
  return name.replace(/[^A-Za-z0-9_.-]/g, '-');
}

/** True when two MCP server names refer to the same logical server, ignoring per-agent name rewrites. */
export function mcpNamesEquivalent(a: string, b: string): boolean {
  return mcpServerCollisionKey(a) === mcpServerCollisionKey(b);
}

function sortedStringRecord(source?: Record<string, string>): Array<[string, string]> {
  return Object.entries(source ?? {}).toSorted(([a], [b]) => a.localeCompare(b));
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Secret-safe, deterministic identity for the MCP authority an agent session
 * receives. Raw probe details/tool discovery timestamps are intentionally
 * excluded; only the probe state transition that changes session eligibility
 * participates.
 * Header/env VALUES participate in the hash so credential rotation does cause
 * a rebuild, but the returned fingerprint never contains the credentials.
 */
export function mcpRuntimeFingerprint(servers: readonly import('@/common/config/storage').IMcpServer[]): string {
  const authority = servers
    .toSorted((a, b) => `${a.id}\u0000${a.name}`.localeCompare(`${b.id}\u0000${b.name}`))
    .map((server) => {
      const transport = server.transport;
      const transportAuthority =
        transport.type === 'stdio'
          ? {
              type: transport.type,
              command: transport.command,
              args: transport.args ?? [],
              env: sortedStringRecord(transport.env),
            }
          : {
              type: transport.type,
              url: transport.url,
              headers: sortedStringRecord(transport.headers),
            };
      return {
        id: server.id,
        name: server.name,
        enabled: server.enabled === true,
        // Session builders currently admit enabled servers only when they are
        // unprobed or connected. Persist the resulting authority bit rather
        // than raw health text, so harmless connected <-> unprobed churn stays
        // stable while an explicit disconnected/error transition rebuilds the
        // session instead of leaving old and new chats with different tools.
        sessionEligible: server.enabled === true && (server.status === undefined || server.status === 'connected'),
        builtin: server.builtin === true,
        source: server.source ?? null,
        allowedTools: server.allowedTools?.toSorted() ?? null,
        transport: transportAuthority,
      };
    });
  const serialized = JSON.stringify(authority);
  // FNV-1a 32-bit is an invalidation token, not a cryptographic claim. It keeps
  // secrets out of persisted conversation metadata while reliably detecting
  // ordinary configuration changes.
  return `mcp-v1-${fnv1a(serialized)}`;
}

/** Runtime fingerprint plus the exact user-connector authority for one chat. */
export function mcpSessionFingerprint(
  runtimeFingerprint: string | undefined,
  activeServerIds: readonly string[] | undefined
): string | undefined {
  if (!runtimeFingerprint) return undefined;
  if (activeServerIds === undefined) return `${runtimeFingerprint}-all`;
  return `${runtimeFingerprint}-scope-${fnv1a(JSON.stringify(activeServerIds.toSorted()))}`;
}

/**
 * Per-provider/model hard cap on the tool array a single request may carry
 * (OpenAI's limit is 128). Used ONLY to show the user a count-vs-cap nudge
 * (#348) — Wayland never truncates client-side; Wayland Core owns the smart
 * BM25 curation that actually fits the array, and Flux humanizes the 400.
 *
 * Entries here are documented VENDOR caps. A provider that is absent is not
 * uncapped — it falls back to {@link DEFAULT_TOOL_ARRAY_CAP}; see
 * {@link resolveModelToolCap}.
 */
export const PROVIDER_TOOL_LIMITS: Record<string, number> = {
  openai: 128,
  'gpt-5': 128,
};

/**
 * Advisory ceiling used when the target provider/model publishes no cap of its
 * own (#998). Previously `resolveModelToolCap` returned `undefined` for
 * everything that was not OpenAI, so an Anthropic or Flux chat carrying 122
 * tools got NO nudge while the identical inventory warned on `gpt-5` — the
 * warning was hardcoded to one vendor rather than being backend-aware.
 *
 * 128 is the tightest published ceiling across the providers Wayland routes to,
 * and a router (Flux) can land a turn on any of them, so it is the honest floor
 * to warn against. It is advisory only: nothing is ever truncated client-side.
 */
export const DEFAULT_TOOL_ARRAY_CAP = 128;

/**
 * The tool-array cap to warn a chat's target model against. Checks the model id
 * first (e.g. `gpt-5`) then the provider id (e.g. `openai`) so a capped model
 * under any provider still resolves, and falls back to
 * {@link DEFAULT_TOOL_ARRAY_CAP} so every backend gets a nudge rather than only
 * the vendors listed in {@link PROVIDER_TOOL_LIMITS}. Informational only.
 */
export function resolveModelToolCap(providerId?: string, modelId?: string): number {
  if (modelId && modelId in PROVIDER_TOOL_LIMITS) return PROVIDER_TOOL_LIMITS[modelId];
  if (providerId && providerId in PROVIDER_TOOL_LIMITS) return PROVIDER_TOOL_LIMITS[providerId];
  return DEFAULT_TOOL_ARRAY_CAP;
}

/**
 * Backends whose LAUNCH CONFIGURATION actually carries the per-server
 * `allowedTools` list to the engine, so a tool switched off in the MCP Library
 * is genuinely not callable (#998):
 *
 *   - `codex`  — `enabled_tools` in the generated Codex config.toml
 *                (`buildCodexMcpServerTable`).
 *   - `gemini` — `includeTools` on the aioncli-core `MCPServerConfig`
 *                (`buildGeminiStdioMcpConfig`); the runtime drops every
 *                unlisted tool at discovery time.
 *
 * Every OTHER backend receives a SERVER-level allowlist only, and no amount of
 * desktop-side filtering changes that: Wayland Core's launch profile carries
 * `mcp_servers = [...]` with no tool dimension (`appendDesktopMcpProfile`, and
 * Core's `ProfileConfig` / `McpServerConfig` have no per-tool field), and the
 * ACP `session/new` `mcpServers` array has no per-tool field in the protocol.
 * On those the switch is UI state plus a desktop candidate-pool filter, NOT an
 * engine constraint — so the MCP Library says exactly that instead of implying
 * a restriction that is not there.
 *
 * Adding a backend to this list without ALSO emitting its tool list re-creates
 * the #998 lying control; `tests/unit/process/mcpToolAllowlistEnforcement.test.ts`
 * cross-checks this list against what each launch builder really emits.
 */
export const TOOL_ALLOWLIST_ENFORCING_BACKENDS: readonly AgentBackend[] = ['codex', 'gemini'];

/** Does `backend` carry per-server `allowedTools` through to its engine? */
export function backendEnforcesToolAllowlist(backend: string | undefined): boolean {
  return backend !== undefined && (TOOL_ALLOWLIST_ENFORCING_BACKENDS as readonly string[]).includes(backend);
}
