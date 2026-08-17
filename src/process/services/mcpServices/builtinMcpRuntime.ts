/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * ONE runtime tuple for Wayland's own bundled MCP stdio servers (#1008).
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * Our first-party MCP servers are stored as `{ command: 'node', args: [<script>] }`.
 * macOS ships no `/usr/bin/node`, so on an end-user Mac that spawn dies with
 * ENOENT and the servers report "Enabled but exposes 0 tools" forever. The fix is
 * to run them through a resolved JS runtime (`resolveJsRuntime`): the bundled Bun
 * in packaged builds, the app binary as Node in dev.
 *
 * The dangerous half is WHERE that resolution happens. The Library probe
 * (`McpProtocol.testStdioConnection`) and every live-session serializer must emit
 * the SAME tuple. When only the probe was fixed, the probe went green, the health
 * check saw a non-empty tool list and cleared its flag, and the chat still spawned
 * bare `node` — a silent, unreportable failure strictly worse than the loud one.
 * So the resolution lives here, in one function both sides call.
 *
 * The tuple is command + args + ENV: the dev runtime is `process.execPath` and is
 * only a Node runtime while `ELECTRON_RUN_AS_NODE=1` rides along. Dropping the env
 * half silently boots a second Electron app instead of the MCP server.
 *
 * IDENTIFYING OUR OWN SCRIPTS
 * ---------------------------
 * Matching on the basename alone would re-point a USER's own server that merely
 * shares one of our filenames (e.g. `~/tools/builtin-mcp-search-skills.js`) onto
 * our runtime — a silent substitution on a file the user owns. The core builtins
 * are seeded with the absolute path `getMcpScriptPath()` produces, so the match is
 * an EXACT path comparison against that same resolved path. The four sibling
 * @wayland servers are stored as a bare filename by design (the spawn layer is
 * what expands them), so those keep the allowlisted-filename match.
 */

import path from 'node:path';
import type { IMcpServer } from '@/common/config/storage';
import { isBuiltinCoreMcpArg, isBuiltinWaylandMcpArg } from '@process/resources/builtinMcp/constants';
import { getMcpScriptPath } from '@process/utils/mcpScriptDir';
import { resolveJsRuntime, type ResolvedJsRuntime } from '@process/utils/jsRuntime';
import { resolveMcpStdioSpawn } from './mcpStdioSpawn';

/** A spawnable stdio tuple. `env` is ADDITIVE runtime env, not the server's own. */
export interface McpStdioSpawnTuple {
  command: string;
  args: string[];
  /** Extra env the resolved runtime requires. Merge OVER the server's own env. */
  env: Record<string, string>;
}

export interface BuiltinMcpRuntimeDeps {
  resolveRuntime?: () => ResolvedJsRuntime;
  scriptPath?: (name: string) => string;
  platform?: NodeJS.Platform;
}

/**
 * Exact path equality for "is this our own script?".
 *
 * Deliberately equality, never containment: a `startsWith`/prefix test on a
 * directory is the win32 trap that a sibling PR shipped and had to revert.
 * `path.normalize` collapses `..`/duplicate separators; Windows paths are
 * additionally compared case-insensitively because NTFS is case-preserving but
 * case-insensitive, so the same file legitimately reaches us differently cased.
 */
function isSamePath(left: string, right: string, platform: NodeJS.Platform): boolean {
  const a = path.normalize(left);
  const b = path.normalize(right);
  return platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/**
 * True only when `arg` is the absolute path of one of OUR first-party bundled
 * core MCP scripts — i.e. it matches an allowlisted filename AND resolves to the
 * exact path this install would spawn. A user's own server that happens to share
 * the filename is not ours and must be left alone.
 */
export function isOwnBuiltinCoreMcpScript(arg: string | undefined | null, deps: BuiltinMcpRuntimeDeps = {}): boolean {
  if (!arg || !isBuiltinCoreMcpArg(arg)) return false;
  const scriptPath = deps.scriptPath ?? getMcpScriptPath;
  const platform = deps.platform ?? process.platform;
  // Split on BOTH separators: a Windows-shaped stored path can reach a resolver
  // running with POSIX semantics under test.
  const base = arg.split(/[\\/]/).pop();
  if (!base) return false;
  return isSamePath(arg, scriptPath(base), platform);
}

/**
 * Resolve the runtime tuple for one of Wayland's own bundled MCP servers.
 * Returns `null` when the transport is NOT ours — callers then fall through to
 * their normal resolution and must not touch the command.
 */
export function resolveBuiltinMcpRuntimeSpawn(
  command: string,
  args: readonly string[] = [],
  deps: BuiltinMcpRuntimeDeps = {}
): McpStdioSpawnTuple | null {
  if (command !== 'node') return null;
  const rawArgs = [...args];
  const first = rawArgs[0];
  const scriptPath = deps.scriptPath ?? getMcpScriptPath;

  // Sibling @wayland servers: stored as a BARE filename, expanded here.
  if (isBuiltinWaylandMcpArg(first)) {
    const runtime = (deps.resolveRuntime ?? resolveJsRuntime)();
    return { command: runtime.command, args: [scriptPath(first), ...rawArgs.slice(1)], env: { ...runtime.env } };
  }

  // First-party core servers: stored as the ABSOLUTE path we seeded, kept as-is.
  if (isOwnBuiltinCoreMcpScript(first, deps)) {
    const runtime = (deps.resolveRuntime ?? resolveJsRuntime)();
    return { command: runtime.command, args: rawArgs, env: { ...runtime.env } };
  }

  return null;
}

/**
 * The single stdio resolution every session-injection serializer uses: our own
 * builtins get the resolved JS runtime, everything else keeps the existing
 * `npx`→bundled-Bun rewrite (#827) untouched.
 */
export function resolveSessionMcpStdioSpawn(
  command: string,
  args: readonly string[] = [],
  deps: BuiltinMcpRuntimeDeps & { resolveNpx?: () => string } = {}
): McpStdioSpawnTuple {
  const builtin = resolveBuiltinMcpRuntimeSpawn(command, args, deps);
  if (builtin) return builtin;
  const spawn = deps.resolveNpx
    ? resolveMcpStdioSpawn(command, args, deps.resolveNpx)
    : resolveMcpStdioSpawn(command, args);
  return { ...spawn, env: {} };
}

/** Merge a server's own env with the additive runtime env (runtime wins). */
export function mergeMcpSpawnEnv(
  own: Record<string, string> | undefined,
  runtime: Record<string, string>
): Record<string, string> {
  return { ...own, ...runtime };
}

/**
 * Rewrite a stored declaration's stdio transport into the one that must actually
 * be spawned, for the paths that hand a whole `IMcpServer` to a serializer they
 * do not own (the agent-CLI publication fan-out, the Codex session config.toml).
 *
 * Only OUR builtins are touched. `npx` is deliberately left alone here: the
 * downstream agents each choose between the absolute (`resolveMcpStdioSpawn`) and
 * the restart-safe portable (`resolvePersistedMcpStdioSpawn`) form, and
 * pre-resolving it here would silently take that choice away.
 */
export function applyBuiltinMcpRuntime<T extends { transport: IMcpServer['transport'] }>(
  server: T,
  deps: BuiltinMcpRuntimeDeps = {}
): T {
  const transport = server.transport;
  if (transport.type !== 'stdio') return server;
  const builtin = resolveBuiltinMcpRuntimeSpawn(transport.command, transport.args ?? [], deps);
  if (!builtin) return server;
  return {
    ...server,
    transport: {
      ...transport,
      command: builtin.command,
      args: builtin.args,
      env: mergeMcpSpawnEnv(transport.env, builtin.env),
    },
  };
}
