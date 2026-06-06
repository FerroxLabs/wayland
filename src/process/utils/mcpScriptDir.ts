/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Resolve the directory containing the bundled MCP stdio scripts.
 *
 * Background
 * ----------
 * Four stdio scripts are spawned as external `node` child processes:
 *   - team-mcp-stdio.js          (team coordination tools)
 *   - team-guide-mcp-stdio.js    (solo aion_* tools)
 *   - builtin-mcp-image-gen.js   (image generation)
 *   - builtin-mcp-search-skills.js (skills library)
 *
 * `scripts/build-mcp-servers.js` emits them next to the main bundle:
 *   - dev:      <project>/app/out/main/
 *   - packaged: <resources>/app.asar.unpacked/out/main/
 *
 * Reliable resolution
 * -------------------
 * The previous resolvers (`resolveMcpScriptDir` in tcpHelpers.ts and
 * `getBuiltinMcpBaseDir` in initStorage.ts) trusted runtime hints that proved
 * unreliable in dev:
 *   - `app.getAppPath()` returned `.../app/out/main` in dev with electron-vite,
 *     so `path.join(appPath, 'out', 'main')` produced a doubled path
 *     `.../app/out/main/out/main/` that didn't exist. Every `team_*` tool
 *     silently failed to register because the stdio child died with
 *     MODULE_NOT_FOUND.
 *   - `require.main?.filename` can be a launcher script, not the main bundle,
 *     so its dirname is not the bundle dir.
 *
 * The one hint that is *guaranteed* correct after bundling is `__dirname` of
 * the bundle file. esbuild/electron-vite preserve it literally so the value at
 * runtime is the directory the file is loaded from - i.e. `out/main/` for
 * `index.js`, or `out/main/chunks/` for code-split chunks. This module is
 * itself bundled into `out/main/index.js` so its `__dirname` is the answer we
 * want (with the chunks carve-out).
 *
 * Packaged mode
 * -------------
 * In packaged builds the bundle is loaded from inside `app.asar`. External
 * `node` processes cannot read from ASAR, so we redirect the dir to
 * `app.asar.unpacked` (which `electron-builder` configures via `asarUnpack`).
 */

import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Names of every stdio script that must exist next to the main bundle.
 * Used by both the resolver (no validation cost) and the startup canary
 * (`assertMcpScriptsExist`), so adding a script in one place doesn't drift
 * out of sync with the other.
 */
export const MCP_STDIO_SCRIPT_NAMES = [
  'team-mcp-stdio.js',
  'team-guide-mcp-stdio.js',
  'builtin-mcp-image-gen.js',
  'builtin-mcp-search-skills.js',
] as const;

/**
 * Bundled @wayland MCP servers - ship with the installer, no npm publish.
 *
 * Listed separately from MCP_STDIO_SCRIPT_NAMES because they may be absent on
 * machines that don't have the sibling waylandmcp repo (CI, contributor forks
 * without it). `assertMcpScriptsExist` must NOT fail when these are missing -
 * the corresponding catalog entries simply won't be installable.
 */
export const BUILTIN_WAYLAND_MCP_FILENAMES = [
  'builtin-mcp-apple.mjs',
  'builtin-mcp-imap.mjs',
  'builtin-mcp-news.mjs',
  'builtin-mcp-cal-com.mjs',
] as const;

export type BuiltinWaylandMcpFilename = (typeof BUILTIN_WAYLAND_MCP_FILENAMES)[number];

/** True if `arg` is a bare filename matching a bundled @wayland MCP. */
export function isBuiltinWaylandMcpFilename(arg: string | undefined | null): arg is BuiltinWaylandMcpFilename {
  if (!arg) return false;
  return (BUILTIN_WAYLAND_MCP_FILENAMES as readonly string[]).includes(arg);
}

export type McpStdioScriptName = (typeof MCP_STDIO_SCRIPT_NAMES)[number];

/**
 * Resolve the directory containing the bundled MCP stdio scripts.
 *
 * Returns:
 *   - dev:      `<project>/app/out/main`
 *   - packaged: `<resources>/app.asar.unpacked/out/main`
 *
 * Never throws - pure path computation. Use `assertMcpScriptsExist()` at
 * startup if you want a fail-loud check that the resolved dir actually
 * contains the expected scripts.
 */
export function resolveMcpScriptDir(): string {
  // __dirname after bundling = the directory the bundle file is loaded from.
  // For the main bundle this is `out/main/`; for code-split chunks it's
  // `out/main/chunks/`. The carve-out drops back to `out/main/`.
  const dir = path.basename(__dirname) === 'chunks' ? path.dirname(__dirname) : __dirname;
  // In packaged builds the bundle lives inside `app.asar` (read-only, no
  // child-process spawn possible). Scripts are unpacked to a sibling
  // `app.asar.unpacked/` directory by `asarUnpack` in electron-builder.
  // The substring is unambiguous because `app.asar` always appears with
  // surrounding directory separators when present.
  return dir.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);
}

/**
 * Build an absolute path to a specific MCP stdio script.
 * Convenience wrapper around `resolveMcpScriptDir()`.
 */
export function getMcpScriptPath(scriptName: McpStdioScriptName | string): string {
  return path.join(resolveMcpScriptDir(), scriptName);
}

export type McpScriptCanaryResult = {
  ok: boolean;
  dir: string;
  presentScripts: readonly string[];
  missingScripts: readonly string[];
  dirContents: readonly string[];
  message: string;
};

/**
 * Inspect the resolved MCP script dir and report which expected scripts are
 * present vs. missing. Pure data - does not throw. Use as the foundation for
 * a startup check (`assertMcpScriptsExist`).
 */
export function inspectMcpScripts(): McpScriptCanaryResult {
  const dir = resolveMcpScriptDir();
  const missing: string[] = [];
  const present: string[] = [];
  for (const name of MCP_STDIO_SCRIPT_NAMES) {
    if (fs.existsSync(path.join(dir, name))) {
      present.push(name);
    } else {
      missing.push(name);
    }
  }
  let dirContents: string[] = [];
  try {
    dirContents = fs.readdirSync(dir).sort();
  } catch {
    dirContents = ['<unreadable>'];
  }
  if (missing.length === 0) {
    return {
      ok: true,
      dir,
      presentScripts: present,
      missingScripts: missing,
      dirContents,
      message: `All ${present.length} MCP stdio scripts present at ${dir}`,
    };
  }
  const message =
    `MCP stdio scripts missing at resolved dir.\n` +
    `  Resolved dir: ${dir}\n` +
    `  Missing:      ${missing.join(', ')}\n` +
    `  Present:      ${present.length > 0 ? present.join(', ') : '(none)'}\n` +
    `  Dir contents: ${dirContents.length > 0 ? dirContents.join(', ') : '(empty)'}\n` +
    `Run 'node scripts/build-mcp-servers.js' to rebuild them.`;
  return {
    ok: false,
    dir,
    missingScripts: missing,
    presentScripts: present,
    dirContents,
    message,
  };
}

/**
 * Startup canary: throws if any expected MCP stdio script is missing.
 *
 * Why throw vs warn: silent absence of these scripts produces the worst
 * possible UX - the leader's role prompt advertises `team_*` tools, the
 * Gemini worker logs `injected team MCP server`, but the spawned MCP child
 * crashes immediately with MODULE_NOT_FOUND and registers zero tools. The
 * leader then truthfully reports "team_* tools missing" and zero specialist
 * dispatch occurs. Failing loud at startup beats failing mute at first send.
 */
export function assertMcpScriptsExist(): void {
  const result = inspectMcpScripts();
  if (!result.ok) {
    throw new Error(result.message);
  }
}
