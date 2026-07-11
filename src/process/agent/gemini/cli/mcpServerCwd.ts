/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #755: stdio MCP servers spawned by aioncli-core inherit THIS process's cwd
 * when their config carries none - and in packaged builds the forked agent
 * worker runs with cwd = app.asar.unpacked (required for WASM resolution).
 * A server that treats a writable cwd as its project root (ijfw's
 * safeProjectDir() did exactly this) then writes inside the signed bundle,
 * breaking the macOS codesign seal, after which the OS blocks every child
 * process the app spawns (#738).
 *
 * Extracted from loadCliConfig so the defaulting rule is unit-testable
 * without dragging in the full aioncli-core Config graph.
 */

import { resolveSafeSpawnCwd } from '@process/utils/safeSpawnCwd';

/**
 * Default the `cwd` of every stdio MCP server config (identified by a string
 * `command`) that has none to the conversation workspace - the same directory
 * the shell tool already runs in - falling back to a guaranteed
 * bundle-external dir when no workspace is available. URL-based (sse/http)
 * server configs have no `command` and are left untouched; configs with an
 * explicit `cwd` are respected.
 *
 * Mutates the entries in place (they are handed to aioncli-core as-is) and
 * returns the same record for convenience.
 */
export function defaultStdioMcpCwds<T extends Record<string, unknown>>(
  mcpServers: T,
  workspace: string | undefined
): T {
  for (const server of Object.values(mcpServers)) {
    if (server && typeof server === 'object' && typeof (server as { command?: unknown }).command === 'string') {
      const stdioServer = server as { cwd?: string };
      if (!stdioServer.cwd) stdioServer.cwd = workspace || resolveSafeSpawnCwd();
    }
  }
  return mcpServers;
}
