/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveNpxPath, normalizeNpxArgsForBundledBun } from '@process/utils/shellEnv';

/**
 * Resolve a stored MCP stdio transport's runtime hint into an actually-spawnable
 * command/args pair (#827).
 *
 * Catalog-installed MCP servers persist a bare runtime hint like `"npx"` as their
 * transport command. The connection-TEST path (McpProtocol) already rewrites that
 * to the bundled Bun runtime (`bun x --bun <pkg>`) before spawning — which is why
 * the Library shows a green/connected badge. But the real SESSION-injection paths
 * (ACP `session/new`, the wcore engine's config.toml, per-CLI configs) forwarded
 * the raw `"npx"` verbatim. On Windows a bare `npx` is `npx.cmd` and does not
 * resolve via `CreateProcess`/PATHEXT for a shell:false spawn (and the wcore Rust
 * engine's `std::process::Command` won't shim it either), so the server fails to
 * spawn in the live session and advertises zero tools — "green, but no tools."
 *
 * WINDOWS-ONLY on purpose. A bare `npx` resolves fine via `execvp`/PATH on macOS
 * and Linux — the failure is specific to Windows (`npx.cmd`/PATHEXT vs a
 * shell:false spawn, and the wcore Rust engine's `std::process::Command`). Only
 * rewriting on Windows means:
 *  - zero behaviour change on macOS/Linux (raw `npx`, exactly as before), and
 *  - crucially, we never write an absolute bundled-Bun path into the PERSISTED
 *    wcore config.toml on Linux, where AppImage remounts `resources` at a new
 *    temp path every launch — which would leave a stale, ENOENT-ing path there
 *    (config.toml is rewritten only on settings-change, not per boot).
 * On Windows the install path is stable (perMachine Program Files), so the
 * resolved path is durable there.
 *
 * `resolveNpx`/`platform` are injectable so the decision is unit-testable without
 * a bundled Bun on disk or a real Windows host.
 */
export function resolveMcpStdioSpawn(
  command: string,
  args: readonly string[] = [],
  resolveNpx: () => string = () => resolveNpxPath({}),
  platform: NodeJS.Platform = process.platform
): { command: string; args: string[] } {
  if (command === 'npx' && platform === 'win32') {
    return { command: resolveNpx(), args: ['x', '--bun', ...normalizeNpxArgsForBundledBun([...args])] };
  }
  return { command, args: [...args] };
}
