/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1015 — the ONE runtime tuple shared by the Library probe and every
 * live-session serializer.
 *
 * Two defects are pinned here:
 *
 *  F1: the probe was fixed to spawn Wayland's own bundled MCP servers under a
 *      resolved JS runtime while the live-session serializers still emitted bare
 *      `node`. That combination is worse than the original bug: the probe returns
 *      tools, the health check clears its "0 tools" flag, and the chat silently
 *      has no builtin tools with nothing left to report it. The runtime ENV is
 *      half the tuple — in dev the command is the app binary and is only a Node
 *      runtime while ELECTRON_RUN_AS_NODE=1 rides along.
 *
 *  F2: matching our scripts by BASENAME re-pointed a user's own server that
 *      merely shares one of our filenames onto our runtime. For the core builtins
 *      (stored as an absolute path) the match must be an exact comparison against
 *      the path this install would actually spawn.
 *
 *  F2b: the four sibling @wayland servers are stored as a BARE FILENAME and the
 *      branch that handles them REPLACES args[0] with our own script — so a
 *      filename-only match runs a DIFFERENT FILE than the user configured, which
 *      is worse than F2's wrong-runtime-on-the-right-file. That branch is gated on
 *      catalog PROVENANCE (`libraryEntryId`), never on the filename.
 */

import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  applyBuiltinMcpRuntime,
  isOwnBuiltinCoreMcpScript,
  mergeMcpSpawnEnv,
  resolveBuiltinMcpRuntimeSpawn,
  resolveSessionMcpStdioSpawn,
} from '@process/services/mcpServices/builtinMcpRuntime';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';

const PACKAGED_BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
const DEV_ELECTRON = '/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';
const OUT_MAIN = '/Applications/Wayland.app/Contents/Resources/app.asar.unpacked/out/main';

/** Packaged resolution: bundled Bun, no extra env. */
const packagedRuntime = (): ResolvedJsRuntime => ({ command: PACKAGED_BUN, env: {}, kind: 'bundled-bun' });
/** Dev resolution: the app binary as Node — ONLY valid with ELECTRON_RUN_AS_NODE. */
const devRuntime = (): ResolvedJsRuntime => ({
  command: DEV_ELECTRON,
  env: { ELECTRON_RUN_AS_NODE: '1' },
  kind: 'electron-node',
});

const posixScriptPath = (name: string) => `${OUT_MAIN}/${name}`;
const OURS = posixScriptPath('builtin-mcp-search-skills.js');
/** Catalog entry ids of two of the four bundled @wayland siblings. */
const APPLE_ENTRY = 'com.wayland/apple-mcp';
const IMAP_ENTRY = 'com.wayland/imap-mcp';

const winPath = (name: string) => `C:\\Program Files\\Wayland\\out\\main\\${name}`;

const stdioServer = (command: string, args: string[], env?: Record<string, string>) => ({
  id: 'builtin-search-skills',
  name: 'wayland-search-skills',
  transport: { type: 'stdio' as const, command, args, ...(env ? { env } : {}) },
});

const deps = (over: Record<string, unknown> = {}) => ({
  resolveRuntime: packagedRuntime,
  scriptPath: posixScriptPath,
  platform: 'darwin' as NodeJS.Platform,
  ...over,
});

describe('F2 — our own script is matched by exact path, never by basename', () => {
  it('accepts the absolute path this install actually seeds', () => {
    expect(isOwnBuiltinCoreMcpScript(OURS, deps())).toBe(true);
  });

  it("REFUSES a user's own server that merely shares our basename", () => {
    // The hijack: same filename, the user's own directory, the user's own file.
    // Basename matching silently re-pointed this onto Wayland's runtime.
    expect(isOwnBuiltinCoreMcpScript('/Users/me/tools/builtin-mcp-search-skills.js', deps())).toBe(false);
    expect(resolveBuiltinMcpRuntimeSpawn('node', ['/Users/me/tools/builtin-mcp-search-skills.js'], deps())).toBeNull();
  });

  it('leaves a hijack candidate spawning exactly what the user configured', () => {
    const spawn = resolveSessionMcpStdioSpawn('node', ['/Users/me/tools/builtin-mcp-search-skills.js'], deps());
    expect(spawn).toEqual({
      command: 'node',
      args: ['/Users/me/tools/builtin-mcp-search-skills.js'],
      env: {},
    });
  });

  it('refuses an unrelated filename in our own directory', () => {
    expect(isOwnBuiltinCoreMcpScript(posixScriptPath('not-ours.js'), deps())).toBe(false);
  });

  it('normalizes traversal rather than string-comparing raw input', () => {
    expect(isOwnBuiltinCoreMcpScript(`${OUT_MAIN}/sub/../builtin-mcp-search-skills.js`, deps())).toBe(true);
  });

  it('win32: matches case-insensitively (NTFS is case-preserving, not case-sensitive)', () => {
    const stored = 'c:\\program files\\wayland\\out\\main\\builtin-mcp-search-skills.js';
    expect(isOwnBuiltinCoreMcpScript(stored, deps({ scriptPath: winPath, platform: 'win32' }))).toBe(true);
    // Still an EQUALITY test, not a prefix/containment test: a sibling directory
    // that merely starts with ours must not match (the win32 containment trap).
    expect(
      isOwnBuiltinCoreMcpScript(
        'C:\\Program Files\\Wayland\\out\\main-evil\\builtin-mcp-search-skills.js',
        deps({ scriptPath: winPath, platform: 'win32' })
      )
    ).toBe(false);
  });

  it('posix: does NOT fold case (two different files on a case-sensitive volume)', () => {
    // NOTE the fixture: only the DIRECTORY is uppercased. Uppercasing the whole
    // path also uppercases the basename, which `isBuiltinCoreMcpArg`'s
    // case-sensitive allowlist rejects first — so `isSamePath` is never reached
    // and a mutant that case-folds on posix too would survive unseen.
    const dirUpperOnly = path.join(path.dirname(OURS).toUpperCase(), 'builtin-mcp-search-skills.js');
    expect(isOwnBuiltinCoreMcpScript(dirUpperOnly, deps())).toBe(false);
    // KNOWN POSITIVE, same run: the correctly-cased path IS ours, so the false
    // above is a real refusal and not a fixture that can never match anything.
    expect(isOwnBuiltinCoreMcpScript(OURS, deps())).toBe(true);
    // The whole-path form is also refused, for the earlier allowlist reason.
    expect(isOwnBuiltinCoreMcpScript(OURS.toUpperCase(), deps())).toBe(false);
  });
});

describe('mergeMcpSpawnEnv — the runtime env must WIN on a collision', () => {
  // The module's own contract: the dev runtime is only a Node runtime while
  // ELECTRON_RUN_AS_NODE=1 rides along, so a server env that shadowed it would
  // boot a second Electron app instead of the MCP server. Both existing merge
  // tests use NON-COLLIDING keys, so flipping the spread order survives them.
  it('overrides a colliding key from the server env', () => {
    expect(mergeMcpSpawnEnv({ ELECTRON_RUN_AS_NODE: '0', KEEP: 'me' }, { ELECTRON_RUN_AS_NODE: '1' })).toEqual({
      ELECTRON_RUN_AS_NODE: '1',
      KEEP: 'me',
    });
  });

  it('applies the same precedence through applyBuiltinMcpRuntime', () => {
    const out = applyBuiltinMcpRuntime(
      stdioServer('node', [OURS], { ELECTRON_RUN_AS_NODE: '0' }),
      deps({ resolveRuntime: devRuntime })
    );
    expect((out.transport as { env?: Record<string, string> }).env).toEqual({ ELECTRON_RUN_AS_NODE: '1' });
  });
});

describe('F1 — the resolved runtime tuple carries command AND env', () => {
  it('packaged: our core builtin runs under the bundled Bun', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('node', [OURS], deps())).toEqual({
      command: PACKAGED_BUN,
      args: [OURS],
      env: {},
    });
  });

  it('dev: our core builtin runs the app binary as Node, WITH ELECTRON_RUN_AS_NODE', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('node', [OURS], deps({ resolveRuntime: devRuntime }))).toEqual({
      command: DEV_ELECTRON,
      args: [OURS],
      env: { ELECTRON_RUN_AS_NODE: '1' },
    });
  });

  it('expands the sibling @wayland servers from their bare stored filename ON CATALOG PROVENANCE', () => {
    // The bare filename alone is NOT authority to substitute our script (see the
    // F2b block below) — the record's catalog entry id is. This is the shape the
    // Library install actually persists: bare filename + its entry id.
    expect(
      resolveBuiltinMcpRuntimeSpawn('node', ['builtin-mcp-apple.mjs', '--flag'], deps({ libraryEntryId: APPLE_ENTRY }))
    ).toEqual({
      command: PACKAGED_BUN,
      args: [posixScriptPath('builtin-mcp-apple.mjs'), '--flag'],
      env: {},
    });
  });

  it('returns null for anything that is not ours, so callers keep their own resolution', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('npx', ['-y', 'chrome-devtools-mcp@latest'], deps())).toBeNull();
    expect(resolveBuiltinMcpRuntimeSpawn('node', ['/opt/other/server.js'], deps())).toBeNull();
    expect(resolveBuiltinMcpRuntimeSpawn('/usr/bin/mcp-server', [], deps())).toBeNull();
  });

  it('refuses a non-`node` command even when args[0] IS one of our own scripts', () => {
    // Kills the mutant that drops the `command !== 'node'` gate. The other
    // negative-command case passes EMPTY args, so `first` is undefined and the
    // gate is never reached — that test cannot see this.
    expect(resolveBuiltinMcpRuntimeSpawn('/usr/bin/deno', [OURS], deps())).toBeNull();
    expect(resolveBuiltinMcpRuntimeSpawn('bun', [OURS], deps())).toBeNull();
    // KNOWN POSITIVE, same run: the identical args[0] under `node` IS ours.
    expect(resolveBuiltinMcpRuntimeSpawn('node', [OURS], deps())).not.toBeNull();
  });
});

describe('F2b — a bare @wayland filename is expanded ONLY on catalog provenance', () => {
  // A bare filename with no separator is indistinguishable from a user's own
  // relative script by string alone, and the sibling branch REPLACES args[0]
  // with Wayland's script — so it executes a DIFFERENT FILE than the user
  // configured. That is worse than F2's original "same file, wrong runtime".
  // `libraryEntryId` is written only by the Library install that also writes the
  // bare filename, so the pair — never the filename — is the authority.
  const userOwned = (args: string[]) => stdioServer('node', args);

  it('refuses a user-owned relative script that shares one of our filenames', () => {
    expect(resolveBuiltinMcpRuntimeSpawn('node', ['builtin-mcp-apple.mjs'], deps())).toBeNull();
    // Reaches the live session spawning exactly what the user configured.
    expect(resolveSessionMcpStdioSpawn('node', ['builtin-mcp-apple.mjs'], deps())).toEqual({
      command: 'node',
      args: ['builtin-mcp-apple.mjs'],
      env: {},
    });
    const input = userOwned(['builtin-mcp-apple.mjs']);
    expect(applyBuiltinMcpRuntime(input, deps())).toBe(input);
  });

  it('refuses a @wayland record whose entry id does not ship that filename', () => {
    // Both halves must agree: the imap entry never installs the apple script.
    expect(
      resolveBuiltinMcpRuntimeSpawn('node', ['builtin-mcp-apple.mjs'], deps({ libraryEntryId: IMAP_ENTRY }))
    ).toBeNull();
    // KNOWN POSITIVE, same run: the imap entry DOES ship the imap script.
    expect(
      resolveBuiltinMcpRuntimeSpawn('node', ['builtin-mcp-imap.mjs'], deps({ libraryEntryId: IMAP_ENTRY }))
    ).toEqual({ command: PACKAGED_BUN, args: [posixScriptPath('builtin-mcp-imap.mjs')], env: {} });
  });

  it('refuses a foreign entry id, including prototype keys', () => {
    for (const id of ['com.evil/apple-mcp', '__proto__', 'constructor', 'toString']) {
      expect(resolveBuiltinMcpRuntimeSpawn('node', ['builtin-mcp-apple.mjs'], deps({ libraryEntryId: id }))).toBeNull();
    }
  });

  it('applyBuiltinMcpRuntime reads provenance off the record itself', () => {
    // The publication chokepoints (McpService, AcpAgentManager, WCoreManager)
    // hand over a whole IMcpServer and pass no deps, so the record must carry it.
    const installed = { ...stdioServer('node', ['builtin-mcp-apple.mjs']), libraryEntryId: APPLE_ENTRY };
    expect(applyBuiltinMcpRuntime(installed, deps()).transport).toEqual({
      type: 'stdio',
      command: PACKAGED_BUN,
      args: [posixScriptPath('builtin-mcp-apple.mjs')],
      env: {},
    });
    // KNOWN NEGATIVE, same run: strip the provenance and the record is untouched.
    const withoutProvenance = stdioServer('node', ['builtin-mcp-apple.mjs']);
    expect(applyBuiltinMcpRuntime(withoutProvenance, deps())).toBe(withoutProvenance);
  });
});

describe('applyBuiltinMcpRuntime — transport rewrite for serializers we do not own', () => {
  const server = stdioServer;

  it('dev: rewrites command and MERGES the runtime env over the server env', () => {
    const out = applyBuiltinMcpRuntime(
      server('node', [OURS], { WAYLAND_IMG_PLATFORM: 'openai' }),
      deps({ resolveRuntime: devRuntime })
    );
    expect(out.transport).toEqual({
      type: 'stdio',
      command: DEV_ELECTRON,
      args: [OURS],
      env: { WAYLAND_IMG_PLATFORM: 'openai', ELECTRON_RUN_AS_NODE: '1' },
    });
  });

  it('packaged: rewrites command and preserves the server env untouched', () => {
    const out = applyBuiltinMcpRuntime(server('node', [OURS], { WAYLAND_IMG_MODEL: 'gpt-image-1' }), deps());
    expect(out.transport).toEqual({
      type: 'stdio',
      command: PACKAGED_BUN,
      args: [OURS],
      env: { WAYLAND_IMG_MODEL: 'gpt-image-1' },
    });
  });

  it('returns the SAME object for a server that is not ours (no npx pre-resolution)', () => {
    const input = server('npx', ['-y', 'chrome-devtools-mcp@latest']);
    expect(applyBuiltinMcpRuntime(input, deps())).toBe(input);
    const userOwned = server('node', ['/Users/me/tools/builtin-mcp-search-skills.js']);
    expect(applyBuiltinMcpRuntime(userOwned, deps())).toBe(userOwned);
  });
});

describe('real resolution (no injected deps) still identifies our own scripts', () => {
  // Confirms the method finds a KNOWN POSITIVE against the live resolver, so the
  // negatives above cannot be passing merely because nothing ever matches.
  it('accepts the path getMcpScriptPath actually produces on this host', async () => {
    const { getMcpScriptPath } = await import('@process/utils/mcpScriptDir');
    const real = getMcpScriptPath('builtin-mcp-concierge-diag.js');
    expect(path.isAbsolute(real)).toBe(true);
    expect(isOwnBuiltinCoreMcpScript(real)).toBe(true);
    expect(isOwnBuiltinCoreMcpScript(path.join('/Users/me/tools', 'builtin-mcp-concierge-diag.js'))).toBe(false);
  });
});
