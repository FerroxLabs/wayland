/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

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

/** True when two MCP server names refer to the same logical server, ignoring per-agent name rewrites. */
export function mcpNamesEquivalent(a: string, b: string): boolean {
  return canonicalMcpServerName(a) === canonicalMcpServerName(b);
}
