/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServerTransport } from '@/common/config/storage';

/**
 * The upstream reference filesystem MCP server. It reads the directories it is
 * allowed to touch from POSITIONAL CLI arguments
 * (`mcp-server-filesystem <allowed-directory> [additional-directories...]`), NOT
 * from an environment variable. When launched with zero directories it prints
 * its usage string and exits, which surfaces to the user as the opaque
 * `MCP error -32000: Connection closed` (issue #448 / #438).
 *
 * The catalog entry historically modelled the allowed directories as an
 * `ALLOWED_DIRS` env var, which the server silently ignores, so every install
 * spawned it with no directory and it never connected. We translate that intent
 * into real positional args here, defaulting to the user's home folder (matching
 * the setup guide's documented promise) when the user hasn't narrowed the scope.
 *
 * Lives in `common` (no `node:path`) so the SAME transform runs at install-time
 * in the renderer (baking the dirs into the persisted record, which every spawn
 * consumer reads) AND as idempotent defense-in-depth in the main-process
 * connection-test / agent-sync paths.
 */
const FILESYSTEM_PACKAGE = '@modelcontextprotocol/server-filesystem';

/** Env var the catalog used to (ineffectually) carry the allowed directories. */
const ALLOWED_DIRS_ENV = 'ALLOWED_DIRS';

/** True when this element is the filesystem package id (bare or `@version`-pinned). */
function isFilesystemPackageArg(arg: string): boolean {
  return arg === FILESYSTEM_PACKAGE || arg.startsWith(`${FILESYSTEM_PACKAGE}@`);
}

/**
 * Portable join used only to expand a leading `~`. Avoids `node:path` so this
 * module is safe to import in the sandboxed renderer. Infers the separator from
 * the home directory itself (`C:\Users\me` -> `\`, `/Users/me` -> `/`).
 */
function joinUnderHome(homedir: string, rest: string): string {
  const sep = homedir.includes('\\') && !homedir.includes('/') ? '\\' : '/';
  return `${homedir.replace(/[/\\]+$/, '')}${sep}${rest.replace(/^[/\\]+/, '')}`;
}

/**
 * Reject a value containing a C0/C1 control char or DEL. Mirrors the guard in
 * validateMcpEnv (which no longer sees ALLOWED_DIRS once it moves to argv), so a
 * newline/NUL can't ride into a directory arg and break a downstream CLI config
 * serializer. Implemented via char codes so the source carries no control bytes.
 */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

/**
 * Expand a leading `~` to the home directory. Leaves an already-absolute or
 * relative path otherwise untouched (the server itself rejects non-absolute
 * paths; we don't second-guess it here).
 */
function expandHome(dir: string, homedir: string): string {
  const trimmed = dir.trim();
  if (trimmed === '~') return homedir;
  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    return joinUnderHome(homedir, trimmed.slice(2));
  }
  return trimmed;
}

/**
 * Resolve the effective list of allowed directories for the filesystem server
 * from (a) any directories already present as positional args and (b) the legacy
 * comma-separated `ALLOWED_DIRS` env value. Falls back to `[homedir]` when the
 * user hasn't specified any.
 *
 * A token that begins with `-` is dropped: moving values out of `env` (where
 * {@link validateMcpEnv} rejects a leading `-`) into argv would otherwise let a
 * crafted `ALLOWED_DIRS=--flag` ride into the child's argv as an option
 * (argument injection). Tokens with control characters are dropped for the same
 * defense-in-depth reason. Directories are always absolute paths, never flags.
 */
export function resolveFilesystemAllowedDirs(
  existingDirs: readonly string[],
  envValue: string | undefined,
  homedir: string
): string[] {
  const fromEnv = (envValue ?? '').split(',');
  const seen = new Set<string>();
  const dirs: string[] = [];
  for (const raw of [...existingDirs, ...fromEnv]) {
    const dir = expandHome(raw ?? '', homedir);
    if (dir.length === 0 || dir.startsWith('-') || hasControlChar(dir)) continue;
    if (seen.has(dir)) continue;
    seen.add(dir);
    dirs.push(dir);
  }
  return dirs.length > 0 ? dirs : [homedir];
}

/**
 * Rewrite an MCP server record into the transport that must actually be spawned.
 * Pure and side-effect-free (home directory is injected, never read from the
 * environment) so it can be unit-tested and run in the renderer; the input
 * record is never mutated. Generic over any transport-bearing object so it
 * accepts both a full {@link IMcpServer} and the `entryToServerData` result
 * (which has no id/timestamps yet).
 *
 * Currently this only fixes the reference filesystem server (issue #448): the
 * allowed directories are moved from the ineffective `ALLOWED_DIRS` env var to
 * the positional arguments the server actually reads, defaulting to the home
 * folder. Every other server is returned unchanged.
 *
 * Applied at install-persist time (so the stored record — which the connection
 * test, agent sync, ACP session injection, and fork-Gemini all read — carries
 * the directories) and again, idempotently, at test/sync time (defense in depth
 * for records persisted before this fix).
 */
export function normalizeMcpServerForSpawn<T extends { transport: IMcpServerTransport }>(
  server: T,
  homedir: string
): T {
  const { transport } = server;
  if (transport.type !== 'stdio' || !Array.isArray(transport.args)) {
    return server;
  }

  const pkgIndex = transport.args.findIndex((a) => typeof a === 'string' && isFilesystemPackageArg(a));
  if (pkgIndex < 0) {
    return server;
  }

  const existingDirs = transport.args.slice(pkgIndex + 1).filter((a): a is string => typeof a === 'string');
  const env = transport.env ?? {};
  const dirs = resolveFilesystemAllowedDirs(existingDirs, env[ALLOWED_DIRS_ENV], homedir);

  const nextArgs = [...transport.args.slice(0, pkgIndex + 1), ...dirs];

  // Drop the now-redundant ALLOWED_DIRS env so the child doesn't carry a dead
  // variable (and so validateMcpEnv never sees a value we deliberately moved to
  // argv).
  const nextEnv = { ...env };
  delete nextEnv[ALLOWED_DIRS_ENV];

  return {
    ...server,
    transport: { ...transport, args: nextArgs, env: nextEnv },
  };
}
