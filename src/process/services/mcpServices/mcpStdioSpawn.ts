/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveNpxPath, normalizeNpxArgsForBundledBun } from '@process/utils/shellEnv';
import { isBundledBuiltinMcpScriptArg } from '@process/utils/mcpScriptDir';
import { resolveJsRuntime, type ResolvedJsRuntime } from '@process/utils/jsRuntime';

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
 * Our own bundled built-in `.js` MCP servers (image-gen, search-skills,
 * concierge-diag) are likewise persisted as `{ command: 'node', args: [<abs
 * path>] }`. End-user machines frequently have no system `node` on PATH, so a
 * bare `node` spawn dies on launch and surfaces only as `-32000 Connection
 * closed`. Reroute them onto the resolved JS runtime (bundled Bun in packaged
 * builds, else system node) — the same treatment `McpProtocol` already gives the
 * `.mjs` @wayland builtins on the connection-test path.
 *
 * NOT on Linux: unlike Windows (stable perMachine Program Files) and macOS
 * (stable app bundle), a Linux AppImage remounts `resources` at a fresh temp
 * path every launch, so persisting the resolved absolute runtime path into the
 * wcore `config.toml` (rewritten only on settings-change, not per boot) would
 * leave a stale, ENOENT-ing path. Linux therefore keeps the bare `node`, exactly
 * as before — no regression. This gate is broader than the `npx` one above (which
 * is Windows-only because a bare `npx` already resolves on macOS) because a bare
 * `node` fails on macOS too when none is installed.
 *
 * Only rewritten when the resolved runtime needs no extra env — i.e. packaged
 * builds (bundled-bun / system-node). Unpackaged dev resolves to `electron-node`,
 * which requires `ELECTRON_RUN_AS_NODE=1`; since this return shape carries no env,
 * dev is left untouched (dev hosts have a real runtime on PATH, and the
 * connection-test path resolves env correctly there).
 *
 * `resolveNpx`/`platform`/`resolveRuntime` are injectable so the decision is
 * unit-testable without a bundled Bun on disk or a real Windows host.
 */
export function resolveMcpStdioSpawn(
  command: string,
  args: readonly string[] = [],
  resolveNpx: () => string = () => resolveNpxPath({}),
  platform: NodeJS.Platform = process.platform,
  resolveRuntime: () => ResolvedJsRuntime = resolveJsRuntime
): { command: string; args: string[] } {
  if (command === 'npx' && platform === 'win32') {
    return { command: resolveNpx(), args: ['x', '--bun', ...normalizeNpxArgsForBundledBun([...args])] };
  }
  if ((command === 'node' || command === 'node.exe') && platform !== 'linux' && isBundledBuiltinMcpScriptArg(args[0])) {
    const runtime = resolveRuntime();
    // Only safe without env plumbing: packaged runtimes (bundled-bun/system-node)
    // carry no env; the dev electron-node runtime needs ELECTRON_RUN_AS_NODE.
    if (Object.keys(runtime.env).length === 0) {
      return { command: runtime.command, args: [...args] };
    }
  }
  return { command, args: [...args] };
}
