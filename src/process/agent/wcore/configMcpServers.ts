/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #478 - read the MCP server names already declared in the active-profile
 * wayland-core `config.toml` `[mcp.servers]` table.
 *
 * The engine loads those servers at startup, so the spawn-time runtime injection
 * (WCoreManager -> `add_mcp_server`) must skip any name that is already there,
 * otherwise the same server is registered twice (once from config.toml, once at
 * runtime). This reads the SAME active-profile config.toml the engine reads
 * (WAYLAND_HOME = active profile dir) via `resolveActiveConfigPath`, so the two
 * views cannot disagree.
 */
import { readFile } from 'node:fs/promises';
import { parse } from 'smol-toml';
import { resolveActiveConfigPath } from '@process/agent/wcore/profilePaths';

type WCoreConfigShape = { mcp?: { servers?: Record<string, unknown> } };

/**
 * Best-effort set of server names in the active config.toml `[mcp.servers]`.
 * Returns an empty set when the file is missing (ENOENT = the engine loads
 * nothing, so injecting is correct) or unreadable/malformed - a lost dedup hint
 * must never drop a connector, only risk a benign duplicate at worst. Callers
 * pass the result to `buildWCoreUserStdioMcpServers(..., excludeNames)`.
 */
export async function readWCoreConfigMcpServerNames(): Promise<Set<string>> {
  try {
    const content = await readFile(await resolveActiveConfigPath(), 'utf-8');
    const parsed = parse(content) as WCoreConfigShape;
    const servers = parsed.mcp?.servers;
    if (!servers || typeof servers !== 'object') return new Set();
    return new Set(Object.keys(servers));
  } catch {
    return new Set();
  }
}
