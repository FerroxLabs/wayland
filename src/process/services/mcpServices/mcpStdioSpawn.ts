/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { resolveNpxPath, normalizeNpxArgsForBundledBun } from '@process/utils/shellEnv';
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
 * resolve via `CreateProcess`/PATHEXT for a shell:false spawn. On macOS/Linux a
 * bare command also reintroduces a dependency on the GUI process's PATH that
 * the successful probe never exercised. Either split can yield "green, but no
 * tools" in the live session.
 *
 * Resolve on every platform. The Library probe already executes `npx` servers
 * through Wayland's bundled Bun; forwarding raw `npx` to the live session made
 * the probe and the real launch depend on different runtimes. On macOS that is
 * enough to produce a false green when Electron was opened from Finder and the
 * user's nvm/fnm PATH is unavailable to the agent that owns the MCP child.
 *
 * `resolveNpx`/`platform` are injectable so the decision is unit-testable without
 * a bundled Bun on disk or a real Windows host.
 */
export function resolveMcpStdioSpawn(
  command: string,
  args: readonly string[] = [],
  resolveNpx: () => string = () => resolveNpxPath({}),
  _platform: NodeJS.Platform = process.platform
): { command: string; args: string[] } {
  if (command === 'npx') {
    return { command: resolveNpx(), args: ['x', '--bun', ...normalizeNpxArgsForBundledBun([...args])] };
  }
  return { command, args: [...args] };
}

/**
 * Resolve a stdio command for a configuration that survives app restarts.
 *
 * Linux AppImage resource paths are mounted under a different temporary path
 * on each launch, so an absolute bundled-Bun path must never be persisted into
 * Core's config.toml. Core itself is launched with the current bundled Bun
 * directory at the front of PATH, therefore the portable `bun x --bun` form is
 * both spawnable and restart-safe. Windows install paths are stable and retain
 * the absolute resolution used by the session path.
 */
export function resolvePersistedMcpStdioSpawn(
  command: string,
  args: readonly string[] = [],
  resolveNpx: () => string = () => resolveNpxPath({}),
  platform: NodeJS.Platform = process.platform
): { command: string; args: string[] } {
  const resolved = resolveMcpStdioSpawn(command, args, resolveNpx, platform);
  if (command === 'npx' && platform !== 'win32') {
    return { command: 'bun', args: resolved.args };
  }
  return resolved;
}

/**
 * Collapse an already-resolved BUNDLED-BUN command back to the portable `bun`
 * that Core finds on PATH, for the config files that outlive the launch which
 * wrote them (#1056).
 *
 * WHY: `applyBuiltinMcpRuntime` rewrites our own builtins onto the absolute
 * bundled-Bun binary so the Library probe and every live session spawn the SAME
 * tuple. That absolute path resolves under `process.resourcesPath`, which on a
 * Linux AppImage is a per-launch squashfs mount point — so persisting it into
 * the GLOBAL `config.toml` records a command that only exists for the launch
 * that wrote it, and nothing resyncs that file (every `syncMcpToAgents` caller
 * is user-action driven). Core is launched with the bundled Bun directory at the
 * front of PATH, which is exactly why the `npx` case above already persists the
 * portable form; this gives the bundled-runtime command the same treatment.
 *
 * Only the command this install would ITSELF resolve is collapsed, compared by
 * exact normalized path — a user's own absolute `bun` elsewhere on disk is not
 * ours to rewrite. Non-bundled runtimes are left alone: the dev runtime is
 * `process.execPath` (stable, and only a Node runtime while its ENV half rides
 * along), and `system-node` is already a PATH lookup. Windows retains the
 * absolute resolution for the same reason the `npx` carve-out does: install
 * paths there are stable.
 *
 * `resolveRuntime` is injectable so the decision is unit-testable without a
 * bundled Bun on disk.
 */
export function toRestartSafeBundledRuntimeCommand(
  command: string,
  platform: NodeJS.Platform = process.platform,
  resolveRuntime: () => ResolvedJsRuntime = resolveJsRuntime
): string {
  if (platform === 'win32') return command;
  // Only an absolute command can be the bundled binary. Cheap pre-filter that
  // also keeps every bare-hint path (`npx`, `node`, `uvx`) off the resolver.
  if (!path.isAbsolute(command)) return command;
  const runtime = resolveRuntime();
  if (runtime.kind !== 'bundled-bun') return command;
  return path.normalize(command) === path.normalize(runtime.command) ? 'bun' : command;
}
